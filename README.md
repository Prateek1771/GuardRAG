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

An enterprise-grade Retrieval-Augmented Generation chatbot with built-in compliance guardrails, multi-tenant support, and audit logging.

## Features
- Upload documents and chat with them via AI (RAG pipeline)
- Guardrails: block, alert, redact, or require approval for sensitive content
- Role-based access: superadmin, admin, member, guest
- Audit logs, analytics, and multi-company support

## Demo Login
- **Username:** `admin` | **Password:** `demo123`

## Tech Stack
- **Backend:** FastAPI + SQLAlchemy + SQLite
- **Frontend:** React 19 + Tailwind CSS + Vite
- **AI:** OpenAI (GPT-4o + text-embedding-3-small)
- **Vector DB:** Pinecone
