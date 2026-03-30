# GuardRAG — Backend

FastAPI backend for the GuardRAG enterprise RAG chatbot. Handles authentication, document ingestion, RAG pipelines, guardrails enforcement, and audit logging.

## Tech Stack

| | |
|---|---|
| Framework | FastAPI 0.115 |
| Server | Uvicorn (ASGI) |
| Database | SQLite + SQLAlchemy 2.0 |
| Auth | JWT (python-jose) + bcrypt (passlib) |
| Vector DB | Pinecone |
| LLM | OpenAI GPT-4o / GPT-4o-mini |
| Embeddings | OpenAI text-embedding-3-small (1024 dims) |
| RAG | LangChain 0.3 + langchain-openai |
| Document Parsing | pdfplumber (PDF), python-docx (DOCX), openpyxl (XLSX) |

## Setup

```bash
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 7860 --reload
```

Requires a `.env` file at the project root:

```env
OPENAI_API_KEY=sk-...
PINECONE_API_KEY=pcsk_...
PINECONE_INDEX=your-index-name
```

The SQLite database (`db/app.db`) is created and seeded automatically on first run with demo users, companies, and guardrail rules.

**Demo login:** `admin` / `demo123`

## Structure

```
backend/
├── main.py              # FastAPI app setup, routers, CORS, static file serving
├── requirements.txt
├── db/
│   ├── database.py      # SQLAlchemy models + engine + session
│   └── seed.py          # Demo data (companies, users, rules)
├── models/              # Pydantic request/response schemas
├── routers/
│   ├── auth.py          # POST /api/auth/login, GET /api/auth/me
│   ├── chat.py          # POST /api/chat/message (SSE streaming)
│   ├── documents.py     # POST /api/documents/upload, GET, DELETE
│   ├── rules.py         # CRUD /api/rules
│   ├── alerts.py        # GET/PATCH /api/alerts, approvals
│   ├── analytics.py     # GET /api/analytics/summary, charts
│   ├── projects.py      # CRUD /api/projects
│   └── sessions.py      # CRUD /api/sessions
└── services/
    ├── rag.py           # Document ingestion, Pinecone retrieval, GPT-4o generation
    ├── guardrails.py    # Input/output guardrail evaluation engine
    ├── docs.py          # File parsing (PDF, DOCX, XLSX) + chunking
    ├── auth.py          # JWT creation, password hashing, user lookup
    └── analytics.py     # Query helpers for stats and chart data
```

## API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Username + password → JWT token |
| GET | `/api/auth/me` | Current user info |

### Chat
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/chat/message` | Send message — returns SSE stream |
| GET | `/api/chat/history` | Audit log of all messages |

### Documents
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/documents/upload` | Upload + ingest file into Pinecone |
| GET | `/api/documents` | List uploaded documents |
| DELETE | `/api/documents/{id}` | Delete document + remove from Pinecone |

### Rules (Guardrails)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/rules` | List rules for company |
| POST | `/api/rules` | Create rule |
| PUT | `/api/rules/{id}` | Update rule |
| DELETE | `/api/rules/{id}` | Delete rule |

### Alerts & Approvals
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/alerts` | List alerts |
| PATCH | `/api/alerts/{id}/read` | Mark alert as read |
| GET | `/api/alerts/approvals` | List pending approvals |
| POST | `/api/alerts/approvals/{id}/resolve` | Approve or reject |

### Analytics
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/analytics/summary` | Totals (messages, rules triggered) |
| GET | `/api/analytics/messages-per-day` | Time-series data |
| GET | `/api/analytics/rules-by-action` | Breakdown by action type |
| GET | `/api/analytics/top-rules` | Most triggered rules |
| GET | `/api/analytics/users` | User distribution by department |

### Projects & Sessions
| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/projects` | List / create projects |
| GET/DELETE | `/api/projects/{id}` | Get / delete project |
| GET/POST | `/api/sessions` | List / create chat sessions |
| DELETE | `/api/sessions/{id}` | Delete session |

## Database Schema

```
Companies
├── Users          (username, hashed_password, role, department, company_id)
├── Rules          (name, keywords, action, scope, is_global, company_id)
├── Documents      (filename, chunk_count, pinecone_namespace, user_id)
├── Projects       (name, description, created_by_user_id, company_id)
└── ChatSessions   (title, user_id, project_id)
    └── ChatMessages (role, content, guardrail_action, rule_triggered, is_redacted)

Alerts    (rule_name, action, message_snippet, user_id, is_read)
Approvals (original_message, rule_name, status, response, resolved_at, user_id)
```

## Guardrails Engine (`services/guardrails.py`)

Evaluated on every user message (input) and every AI response (output):

1. **Keyword scan** — case-insensitive match against rule keywords
2. **LLM intent check** — GPT-4o-mini for ambiguous or context-dependent cases
3. **Action dispatch:**
   - `BLOCK` — raises exception, message not stored, user receives block notice
   - `ALERT` — message proceeds, alert row created, admin notified
   - `APPROVAL` — message held in approvals table, response blocked until resolved
   - `REDACT` — keywords replaced with `[REDACTED]` in the final response

Rules are evaluated in company scope + global rules combined. Scope can be `INPUT`, `OUTPUT`, or `BOTH`.

## RAG Pipeline (`services/rag.py`)

1. Document uploaded → parsed by `services/docs.py`
2. Text split with `RecursiveCharacterTextSplitter` (800 chars, 100 overlap)
3. Chunks embedded with `text-embedding-3-small`
4. Vectors upserted to Pinecone with namespace isolation:
   - Personal: `company-{id}-user-{id}`
   - Project: `project-{id}`
   - Guest: `guest-{session_id}`
5. On chat query: top-k chunks retrieved → injected as context into GPT-4o prompt
6. Response streamed back via SSE with source metadata for citations
