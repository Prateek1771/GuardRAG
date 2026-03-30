# GuardRAG — Frontend

React + TypeScript frontend for the GuardRAG enterprise RAG chatbot. Built with Vite, Tailwind CSS, and TanStack React Query.

## Tech Stack

| | |
|---|---|
| Framework | React 19 + TypeScript 5.9 |
| Build Tool | Vite 8 |
| Styling | Tailwind CSS 4 |
| Routing | React Router DOM 7 |
| Server State | TanStack React Query 5 |
| HTTP Client | Axios (with JWT interceptor) |
| Charts | Recharts |
| Icons | Lucide React |
| Markdown | React Markdown |
| PDF Export | jsPDF + html2canvas |

## Setup

```bash
npm install
npm run dev       # Dev server on port 5173 (proxies API to :7860)
npm run build     # Production build → dist/
npm run preview   # Preview production build
```

## Structure

```
src/
├── pages/
│   ├── LoginPage.tsx
│   ├── GuestPage.tsx              # Anonymous RAG chat
│   └── dashboard/
│       ├── ChatPage.tsx           # Main authenticated chat
│       ├── DocumentsPage.tsx      # Upload & manage documents
│       ├── ProjectsPage.tsx       # Project list
│       ├── ProjectDetailPage.tsx  # Project docs + chat
│       ├── RulesPage.tsx          # Guardrail rule management
│       ├── AlertsPage.tsx         # Alert inbox
│       ├── ApprovalsPage.tsx      # Approval queue
│       ├── AnalyticsPage.tsx      # Usage charts
│       ├── AuditPage.tsx          # Compliance audit log
│       └── CompaniesPage.tsx      # Multi-tenant management
├── components/
│   ├── ChatWindow.tsx             # Message streaming + guardrail cards
│   ├── ChatHistoryPanel.tsx       # Session list + new chat
│   ├── CitationsPanel.tsx         # RAG source citations
│   ├── DocumentUpload.tsx         # Drag-drop file upload
│   ├── GuardrailCard.tsx          # Visual feedback for guardrail actions
│   ├── DashboardLayout.tsx        # Sidebar nav + dark mode
│   ├── PageHeader.tsx
│   ├── EmptyState.tsx
│   └── FeedbackRow.tsx
├── context/
│   ├── AuthContext.tsx            # JWT login state + token management
│   └── DarkModeContext.tsx        # Light/dark theme
├── lib/
│   └── api.ts                     # Axios instance, auth interceptor, all API calls
├── App.tsx                        # Routes + protected route guards
└── main.tsx
```

## Pages & Routes

| Route | Page | Access |
|-------|------|--------|
| `/` | Login | All |
| `/guest` | Anonymous chat | All |
| `/dashboard/chat` | Main chat | Member+ |
| `/dashboard/documents` | Document management | Member+ |
| `/dashboard/projects` | Project list | Member+ |
| `/dashboard/projects/:id` | Project detail | Member+ |
| `/dashboard/rules` | Guardrail rules | Admin+ |
| `/dashboard/alerts` | Alert inbox | Admin+ |
| `/dashboard/approvals` | Approval queue | Admin+ |
| `/dashboard/analytics` | Analytics charts | Admin+ |
| `/dashboard/audit` | Audit log | Admin+ |
| `/dashboard/companies` | Company management | Superadmin |

## Key Behaviors

- **JWT Auth** — token stored in memory via `AuthContext`; axios interceptor attaches it to every request
- **Streaming** — chat responses use SSE (`EventSource`) for real-time token streaming
- **Guardrail Cards** — `GuardrailCard` renders inline visual feedback for BLOCKED, ALERT, APPROVAL, and REDACT actions
- **Dark Mode** — system preference detected on load; toggled via `DarkModeContext`
- **React Query** — all server state (documents, rules, alerts, etc.) managed with automatic caching and invalidation
