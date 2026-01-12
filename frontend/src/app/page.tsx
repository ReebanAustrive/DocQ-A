"use client";
import { useState } from "react";
import axios from "axios";
import dynamic from "next/dynamic";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

type Result = { score:number; text:string; highlighted?:string };

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [indexed, setIndexed] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onUpload = async () => {
    if (!file) return;
    setBusy(true); setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      await axios.post(`${API_BASE}/upload`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setIndexed(true);
    } catch (e:any) {
      setError(e?.message || "Upload failed");
    } finally { setBusy(false); }
  };

  const onAsk = async () => {
    if (!indexed || !query.trim()) return;
    setBusy(true); setError(null);
    try {
      const { data } = await axios.post(`${API_BASE}/ask`, { query, k: 3 });
      setResults(data.results || []);
    } catch (e:any) {
      setError(e?.message || "Query failed");
    } finally { setBusy(false); }
  };

  const onReset = async () => {
    setBusy(true);
    try { await axios.post(`${API_BASE}/reset`); setIndexed(false); setResults([]); }
    finally { setBusy(false); }
  };

  const highlight = (s?: string) => {
    if (!s) return null;
    // backend wraps matches with [[...]]; render with <mark>
    const parts = s.split(/(\[\[.*?\]\])/g);
    return parts.map((p, i) => {
      const m = p.match(/^\[\[(.*)\]\]$/);
      if (m) return <mark key={i}>{m[1]}</mark>;
      return <span key={i}>{p}</span>;
    });
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">DocQ&amp;A Lite</h1>
        <p className="text-gray-400">Upload a PDF or .txt, then ask questions. Embeddings + FAISS.</p>

        <div className="p-4 bg-slate-800/50 rounded-2xl shadow space-y-3 border border-slate-700">
          <label className="block text-sm font-medium">Upload document</label>
          <input type="file" accept=".pdf,.txt" onChange={(e)=>setFile(e.target.files?.[0]||null)} />
          <div className="flex gap-2">
            <button
              onClick={onUpload}
              disabled={!file || busy}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              {busy ? "Indexing..." : "Index"}
            </button>
            <button
              onClick={onReset}
              disabled={busy}
              className="px-4 py-2 rounded-xl border border-slate-600 hover:bg-slate-700"
            >
              Reset
            </button>
          </div>
          {indexed && <p className="text-sm text-green-400">Indexed ✔</p>}
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>

        <div className="p-4 bg-slate-800/50 rounded-2xl shadow space-y-3 border border-slate-700">
          <label className="block text-sm font-medium">Ask a question</label>
          <input
            className="w-full border border-slate-600 rounded-xl p-2 bg-slate-900 text-white placeholder-gray-500"
            placeholder="e.g., What is the main idea?"
            value={query}
            onChange={(e)=>setQuery(e.target.value)}
          />
          <button
            onClick={onAsk}
            disabled={!indexed || busy}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
          >
            {busy ? "Searching..." : "Ask"}
          </button>
        </div>

        {results.length > 0 && (
          <div className="p-4 bg-slate-800/50 rounded-2xl shadow border border-slate-700">
            <h2 className="font-semibold mb-2">Top matches</h2>
            <ul className="space-y-3">
              {results.map((r, i)=>(
                <li key={i} className="border border-slate-700 rounded-xl p-3">
                  <div className="text-xs text-gray-400">score: {r.score}</div>
                  <div className="prose whitespace-pre-wrap">{highlight(r.highlighted) ?? r.text}</div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <footer className="text-xs text-gray-500 pt-4">
          Stack: Next.js • FastAPI • sentence-transformers • FAISS • Docker
        </footer>
      </div>
    </main>
  );
}

