# DocQ&A Lite

A document question-answering system that allows you to upload PDF or text files, ask questions, and get the most relevant excerpts using AI-powered semantic search with sentence embeddings and FAISS.

## 🌟 Features

- **Document Upload**: Support for PDF and text files
- **Semantic Search**: AI-powered question answering using sentence embeddings
- **Fast Similarity Search**: FAISS index for efficient vector similarity search
- **Modern UI**: Clean, responsive interface built with Next.js and Tailwind CSS
- **RESTful API**: FastAPI backend with comprehensive endpoints
- **Containerized**: Docker and Kubernetes support for easy deployment

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 16 (App Router) + React 19 + Tailwind CSS 4 + TypeScript
- **Backend**: FastAPI (Python 3.11) + Uvicorn
- **AI/ML**: sentence-transformers (all-MiniLM-L6-v2) + FAISS (CPU)
- **Document Processing**: pypdf for PDF parsing
- **Infrastructure**: Docker Compose, Kubernetes manifests

### How It Works

1. **Upload**: Documents (PDF/TXT) are uploaded and processed
2. **Chunking**: Text is split into overlapping chunks (140 words with 20-word overlap)
3. **Embedding**: Each chunk is converted to a vector using sentence-transformers
4. **Indexing**: Vectors are indexed using FAISS for fast similarity search
5. **Query**: User questions are embedded and matched against the index
6. **Results**: Top-k most relevant chunks are returned with similarity scores

## 🚀 Quick Start

### Prerequisites

- **For Local Development**:
  - Python 3.11+
  - Node.js 20+
  - npm or yarn

- **For Docker Deployment**:
  - Docker 20+
  - Docker Compose 2+

- **For Kubernetes Deployment**:
  - kubectl
  - A Kubernetes cluster (minikube, kind, or cloud provider)

### Local Development

#### Backend (FastAPI)

```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Start the API server
uvicorn app:app --reload --port 8000
```

The API will be available at http://localhost:8000
API docs available at http://localhost:8000/docs

#### Frontend (Next.js)

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The web interface will be available at http://localhost:3000

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

Services:
- **Web UI**: http://localhost:3000
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

To stop the services:
```bash
docker-compose down
```

### Building Individual Images

```bash
# Build backend image
docker build -t docqa-api:latest ./backend

# Build frontend image
docker build -t docqa-web:latest ./frontend
```

## ☸️ Kubernetes Deployment

```bash
# Apply all manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods
kubectl get services

# Access the application
kubectl port-forward service/docqa-web 3000:3000
```

Then visit http://localhost:3000

To remove the deployment:
```bash
kubectl delete -f k8s/
```

## 📚 API Endpoints

### Health Check
```http
GET /health
```
Returns the health status and number of indexed chunks.

### Upload Document
```http
POST /upload
Content-Type: multipart/form-data

file: [PDF or TXT file]
```
Uploads and indexes a document.

### Ask Question
```http
POST /ask
Content-Type: application/json

{
  "query": "your question here",
  "k": 3  // optional, number of results (default: 3)
}
```
Returns top-k most relevant chunks for the query.

### Reset Index
```http
POST /reset
```
Clears all indexed documents.

## 💡 Usage Example

1. Start the application (using any method above)
2. Open http://localhost:3000 in your browser
3. Upload a PDF or text file
4. Type your question in the search box
5. View the most relevant excerpts with similarity scores

## 🛠️ Project Structure

```
DocQ-A/
├── backend/              # FastAPI backend
│   ├── app.py           # Main application file
│   ├── requirements.txt # Python dependencies
│   └── Dockerfile       # Backend Docker image
├── frontend/            # Next.js frontend
│   ├── src/            # Source code
│   ├── public/         # Static assets
│   ├── package.json    # Node dependencies
│   └── Dockerfile      # Frontend Docker image
├── k8s/                # Kubernetes manifests
│   ├── api.yml        # API deployment & service
│   └── web.yaml       # Web deployment & service
├── docker-compose.yaml # Docker Compose configuration
└── README.md          # This file
```

## 🔧 Configuration

### Environment Variables

**Frontend**:
- `NEXT_PUBLIC_API_BASE`: API base URL (default: http://localhost:8000)

**Backend**:
- `PYTHONUNBUFFERED`: Set to 1 for unbuffered Python output

### Customization

**Chunk Settings** (in `backend/app.py`):
- `chunk_size`: Number of words per chunk (default: 140)
- `overlap`: Word overlap between chunks (default: 20)

**Model Settings**:
- Embedding model: `sentence-transformers/all-MiniLM-L6-v2`
- Can be changed in `backend/app.py` (line 40)

## 🐛 Troubleshooting

### Port Already in Use
If ports 3000 or 8000 are already in use, you can modify them:
- For local dev: Change ports in the `uvicorn` and `npm run dev` commands
- For Docker: Modify port mappings in `docker-compose.yaml`

### Model Download Issues
The first run will download the sentence-transformers model (~80MB). Ensure you have:
- Stable internet connection
- Sufficient disk space
- No firewall blocking HuggingFace model hub

### Memory Issues
FAISS indexing requires RAM. For large documents:
- Increase Docker memory limits
- Reduce `chunk_size` to create fewer chunks
- Consider using `faiss-gpu` for better performance

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is open source and available under the MIT License.

## 👤 Author

Designed and built by ReebanAustrive
- Complete full-stack implementation
- API design and implementation
- Document chunking and embedding pipeline
- FAISS indexing
- Next.js UI
- Docker and Kubernetes configurations