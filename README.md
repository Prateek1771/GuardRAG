---
title: RagGuardrail
emoji: 🛡️
colorFrom: blue
colorTo: purple
sdk: docker
app_port: 7860
pinned: false
---

# GuardRAG — Enterprise RAG Chatbot with Guardrails

An enterprise-grade Retrieval-Augmented Generation (RAG) chatbot with built-in compliance guardrails, multi-tenant architecture, role-based access control, and complete audit logging.

**Live Demo:** [huggingface.co/spaces/prateek1771/RagGuardrail](https://huggingface.co/spaces/prateek1771/RagGuardrail)
**Promo Video:** [[huggingface.co/spaces/prateek1771/RagGuardrail](https://youtu.be/GpaCrQy-3Rg)]([https://huggingface.co/spaces/prateek1771/RagGuardrail](https://youtu.be/GpaCrQy-3Rg))
**Demo Login:** `admin` / `demo123`

---

## What is GuardRAG?

GuardRAG lets organizations deploy a secure AI chatbot over their own documents. Users upload PDFs, Word docs, or spreadsheets, and GuardRAG uses RAG to answer questions grounded in that content. Every message — in and out — passes through a configurable guardrail engine that can block, redact, alert, or hold for approval based on sensitive content rules.

Built for teams that need AI-assisted workflows with strict governance: legal, compliance, HR, finance, or any domain where what the AI says (and what users ask) must be controlled and audited.

---

## Features

### AI-Powered Document Chat
- Upload PDF, DOCX, and XLSX files
- Documents are chunked, embedded (OpenAI `text-embedding-3-small`), and stored in Pinecone
- Chat with your documents via RAG — answers are grounded in your content with source citations
- Switch between RAG mode (document-grounded) and direct LLM mode
- Real-time streaming responses via Server-Sent Events (SSE)

### Guardrails Engine
Four enforcement actions applied to both user inputs and AI outputs:

| Action | Behavior |
|--------|----------|
| **BLOCK** | Message stopped immediately; user notified |
| **ALERT** | Message passes; admin notified in real time |
| **APPROVAL** | Message held; admin must approve before response is generated |
| **REDACT** | Sensitive keywords replaced with `[REDACTED]` in the response |

Detection uses keyword matching combined with LLM-based intent analysis (GPT-4o-mini) for ambiguous cases. Rules are scoped to input, output, or both.

### Multi-Tenant & Role-Based Access
- **Superadmin** — full platform access across all companies
- **Admin** — manage rules, alerts, approvals, and analytics for their company
- **Member** — chat, upload documents, view own history
- **Guest** — anonymous session-scoped chat, no login required

### Projects
- Organize documents into named projects with isolated Pinecone namespaces
- Chat sessions scoped to a project's knowledge base
- Per-project document management

### Administration & Compliance
- **Alerts** — real-time inbox for guardrail triggers with unread counts
- **Approvals** — async queue to approve or reject held messages
- **Audit Logs** — full chat history with guardrail actions, rule names, timestamps, and user IDs
- **Analytics** — charts for messages per day, rule triggers by action type, top rules, and user distribution

---

## Tech Stack

### Backend
| Component | Technology |
|-----------|-----------|
| Framework | FastAPI 0.115 |
| Database | SQLite + SQLAlchemy 2.0 |
| Auth | JWT (python-jose) + bcrypt |
| Document Parsing | pdfplumber, python-docx, openpyxl |
| Server | Uvicorn (ASGI) |

### Frontend
| Component | Technology |
|-----------|-----------|
| Framework | React 19 + TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS 4 |
| Server State | TanStack React Query 5 |
| Routing | React Router DOM 7 |
| Charts | Recharts |
| HTTP Client | Axios |

### AI / ML
| Component | Technology |
|-----------|-----------|
| LLM | OpenAI GPT-4o (chat), GPT-4o-mini (guardrails) |
| Embeddings | OpenAI `text-embedding-3-small` (1024 dims) |
| Vector DB | Pinecone |
| RAG Framework | LangChain 0.3 + langchain-openai |
| Chunking | RecursiveCharacterTextSplitter (800 chars, 100 overlap) |

### Infrastructure
- Docker multi-stage build (Node 20 → Python 3.11-slim)
- Single container deployment on port 7860
- Hosted on Hugging Face Spaces

---

## Architecture

```
User / Guest
    │
    ▼
React SPA (Vite + Tailwind)
    │  JWT auth / SSE streaming
    ▼
FastAPI Backend
    ├── /api/auth        JWT login
    ├── /api/chat        Message streaming + audit
    ├── /api/documents   Upload + Pinecone ingestion
    ├── /api/rules       Guardrail rule CRUD
    ├── /api/alerts      Alert inbox
    ├── /api/analytics   Stats + charts
    ├── /api/projects    Project management
    └── /api/sessions    Chat session management
          │
          ├── SQLite (users, messages, rules, alerts, approvals)
          │
          ├── Pinecone (vector embeddings, namespace-isolated)
          │     ├── company-{id}-user-{id}   (personal KB)
          │     ├── project-{id}              (project KB)
          │     └── guest-{session_id}        (temp session)
          │
          └── OpenAI API (GPT-4o, text-embedding-3-small)
```

### Message Flow

```
User sends message
    ↓
Input guardrails (keyword match + LLM intent check)
    ↓ BLOCKED → stop, notify user
    ↓ APPROVAL → hold for admin
    ↓ ALERT → flag + continue
    ↓ REDACT → mask keywords + continue
    ↓
RAG retrieval from Pinecone
    ↓
GPT-4o generation with retrieved context
    ↓
Output guardrails (same pipeline)
    ↓
Stream response to client (SSE)
    ↓
Save to DB + create audit log + fire alerts
```

---

## Setup

### Prerequisites
- Python 3.12+
- Node.js 20+
- OpenAI API key
- Pinecone API key + index (dimension: 1024, metric: cosine)

### Environment Variables

Copy `example.env` to `.env` and fill in your keys:

```env
OPENAI_API_KEY=sk-...
PINECONE_API_KEY=pcsk_...
PINECONE_INDEX=your-index-name
```

### Local Development

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 7860 --reload
```

**Frontend** (separate terminal):
```bash
cd frontend
npm install
npm run dev        # Vite dev server on port 5173, proxies to backend
```

### Docker

```bash
docker build -t guardrag .
docker run -p 7860:7860 \
  -e OPENAI_API_KEY=your_key \
  -e PINECONE_API_KEY=your_key \
  -e PINECONE_INDEX=your_index \
  guardrag
```

The Dockerfile builds the React frontend first, then bundles everything into a Python image. The FastAPI server serves both the API and the React SPA from a single container.

---

## Database

SQLite is used with auto-seeding on first run. The seed creates:
- Demo companies (e.g., Acme Corp)
- Demo users with roles
- Sample guardrail rules

Database file: `backend/db/app.db` (auto-created, gitignored)

### Schema Overview

```
Companies
├── Users          (role, department, company_id)
├── Rules          (keywords, action, scope, is_global)
├── Documents      (filename, chunk_count, pinecone_namespace)
├── Projects       (name, created_by_user_id)
└── ChatSessions
    └── ChatMessages (content, guardrail_action, rule_triggered, is_redacted)

Alerts    (rule_name, action, message_snippet, is_read)
Approvals (original_message, rule_name, status, response, resolved_at)
```

---

## Project Structure

```
guardrag/
├── backend/
│   ├── main.py              # FastAPI app, routers, middleware
│   ├── requirements.txt
│   ├── db/
│   │   ├── database.py      # SQLAlchemy models
│   │   └── seed.py          # Demo data initialization
│   ├── routers/             # auth, chat, documents, rules, alerts, analytics, projects, sessions
│   └── services/            # rag.py, guardrails.py, docs.py, auth.py, analytics.py
├── frontend/
│   ├── src/
│   │   ├── pages/           # Login, Guest, Dashboard pages
│   │   ├── components/      # ChatWindow, GuardrailCard, DocumentUpload, etc.
│   │   ├── context/         # AuthContext, DarkModeContext
│   │   └── lib/api.ts       # Axios client with JWT interceptor
│   └── package.json
├── Dockerfile
├── example.env
└── pyproject.toml
```

---

## Dashboard Pages

| Route | Description | Access |
|-------|-------------|--------|
| `/` | Login | All |
| `/guest` | Anonymous chat | All |
| `/dashboard/chat` | Main chat interface | Member+ |
| `/dashboard/documents` | Document upload & management | Member+ |
| `/dashboard/projects` | Project list & creation | Member+ |
| `/dashboard/projects/:id` | Project detail with docs & chat | Member+ |
| `/dashboard/rules` | Guardrail rule management | Admin+ |
| `/dashboard/alerts` | Alert inbox | Admin+ |
| `/dashboard/approvals` | Approval queue | Admin+ |
| `/dashboard/analytics` | Usage charts & stats | Admin+ |
| `/dashboard/audit` | Full compliance audit log | Admin+ |
| `/dashboard/companies` | Multi-tenant management | Superadmin |
