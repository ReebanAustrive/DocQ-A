from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import io
from pypdf import PdfReader
from sentence_transformers import SentenceTransformer
import numpy as np
import faiss
import re

app = FastAPI(title="DocQ&A Lite API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- simple in-memory store
_model: SentenceTransformer | None = None
_index: faiss.Index | None = None
_chunks: List[str] = []
_embeddings: np.ndarray | None = None

def chunk_text(text: str, chunk_size: int = 140, overlap: int = 20) -> List[str]:
    words = text.split()
    out = []
    i = 0
    while i < len(words):
        out.append(" ".join(words[i:i+chunk_size]))
        i += max(1, chunk_size - overlap)
    return [c.strip() for c in out if c.strip()]

def ensure_model():
    global _model
    if _model is None:
        _model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

def rebuild_index():
    global _index, _embeddings
    if not _chunks:
        _index = None
        _embeddings = None
        return
    ensure_model()
    _embeddings = _model.encode(_chunks, convert_to_numpy=True, normalize_embeddings=True)
    dim = _embeddings.shape[1]
    idx = faiss.IndexFlatIP(dim)  # cosine with normalized vectors → inner product
    idx.add(_embeddings)
    _index = idx

def read_pdf(bytes_data: bytes) -> str:
    pdf = PdfReader(io.BytesIO(bytes_data))
    pages = []
    for i, p in enumerate(pdf.pages):
        try:
            text = p.extract_text()
            if text:
                pages.append(text.strip())
        except Exception as e:
            print(f"Warning: Could not extract text from page {i}: {e}")
    return "\n".join(pages)

def simple_highlight(text: str, query: str) -> str:
    # very lightweight keyword highlighter (frontend also highlights)
    q_terms = [re.escape(t) for t in query.lower().split() if len(t) > 2]
    if not q_terms:
        return text
    pattern = re.compile(r"(" + "|".join(q_terms) + r")", re.IGNORECASE)
    return pattern.sub(lambda m: f"[[{m.group(0)}]]", text)

class AskPayload(BaseModel):
    query: str
    k: Optional[int] = 3

@app.get("/health")
def health():
    return {"ok": True, "chunks": len(_chunks)}

@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    content = await file.read()
    if file.filename.lower().endswith(".pdf"):
        text = read_pdf(content)
    else:
        text = content.decode("utf-8", errors="ignore")
    global _chunks
    _chunks = chunk_text(text, 140, 20)
    rebuild_index()
    return {"message": "indexed", "chunks": len(_chunks)}

@app.post("/ask")
def ask(payload: AskPayload):
    if _index is None:
        return {"error": "No document indexed yet."}
    ensure_model()
    q = payload.query.strip()
    q_emb = _model.encode([q], convert_to_numpy=True, normalize_embeddings=True)
    D, I = _index.search(q_emb, payload.k or 3)
    results = []
    for score, idx in zip(D[0].tolist(), I[0].tolist()):
        if idx == -1:
            continue
        chunk = _chunks[idx]
        results.append({
            "score": round(float(score), 4),
            "text": chunk,
            "highlighted": simple_highlight(chunk, q)
        })
    return {"query": q, "results": results}

@app.post("/reset")
def reset():
    global _chunks, _index, _embeddings
    _chunks, _index, _embeddings = [], None, None
    return {"message": "reset"}
