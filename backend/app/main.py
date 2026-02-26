from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from app.database import init_db
from app.routers import auth, users, portfolios, trades, analytics, charges, brokers
from app.middleware.csrf import CSRFProtectMiddleware
from pathlib import Path
import os


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize database
    try:
        print("Starting database initialization...")
        await init_db()
        print("Database initialized successfully.")
    except Exception as e:
        print(f"CRITICAL: Database initialization failed: {e}")
    yield
    # Shutdown: Cleanup (if needed)


app = FastAPI(
    title="Smart Journal API",
    description="API for managing trading portfolios and journals",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware - Configure for production
# Support CORS_ORIGINS env variable (comma-separated) for Railway/cloud
_cors_env = os.getenv("CORS_ORIGINS", "")
_extra_origins = [o.strip() for o in _cors_env.split(",") if o.strip()]

allow_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3002",
    "https://vibe.marketcalls.in",
    "http://vibe.marketcalls.in",
    "https://trading-journal-3zgb.vercel.app", # User's Vercel Domain
] + _extra_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_origin_regex=r"https://.*\.railway\.app|https://.*\.vercel\.app",  # allow Railway and Vercel domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-CSRF-Token"],
)

# CSRF Protection Middleware
app.add_middleware(CSRFProtectMiddleware)

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(portfolios.router, prefix="/api")
app.include_router(trades.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")

app.include_router(charges.router, prefix="/api")
app.include_router(brokers.router, prefix="/api")

# Serve uploaded screenshots as static files
# URL: /api/uploads/screenshots/<filename>
from app.config import get_settings
_settings = get_settings()

uploads_dir = Path(_settings.UPLOAD_DIR)

# Vercel fix: Use /tmp for uploads if in Vercel environment
if os.getenv("VERCEL"):
    uploads_dir = Path("/tmp") / _settings.UPLOAD_DIR

# Only attempt to create directory if not in a read-only environment
# or if it's the /tmp directory
try:
    uploads_dir.mkdir(parents=True, exist_ok=True)
except Exception as e:
    print(f"Warning: Could not create upload directory {uploads_dir}: {e}")

app.mount("/api/uploads/screenshots", StaticFiles(directory=str(uploads_dir)), name="uploads")


@app.get("/")
async def root():
    return {
        "message": "Smart Journal API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
@app.get("/api/health")  # Railway healthcheck path
async def health_check():
    return {"status": "healthy", "service": "trading-journal-backend"}
