import os
import sys
# Ensure backend dir is on path when run from project root
sys.path.insert(0, os.path.dirname(__file__))
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

from db.seed import seed
from routers import auth, documents, chat, rules, alerts, analytics, projects, sessions

app = FastAPI(title="Enterprise RAG Chatbot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Seed database on startup
@app.on_event("startup")
def on_startup():
    seed()

# API routers
app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(chat.router)
app.include_router(rules.router)
app.include_router(alerts.router)
app.include_router(analytics.router)
app.include_router(projects.router)
app.include_router(sessions.router)

# Serve React static build in production
STATIC_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.exists(STATIC_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(STATIC_DIR, "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_react(full_path: str):
        index = os.path.join(STATIC_DIR, "index.html")
        return FileResponse(index)
