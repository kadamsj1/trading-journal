import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import get_settings
from app.database import init_db
from app.middleware.csrf import CSRFProtectMiddleware
from app.routers import analytics, auth, brokers, charges, portfolios, trades, users, vault

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

_settings = get_settings()
IS_PRODUCTION = os.getenv("ENVIRONMENT", "development") == "production"


# ── Rate Limiter (shared) ───────────────────────────────────
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])


# ── Lifespan ────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        logger.info("Starting database initialization...")
        await init_db()
        logger.info("Database initialized successfully.")
        from app.database import engine
        from sqlalchemy import text
        async with engine.begin() as conn:
            await conn.execute(text(
                "ALTER TABLE vault_transactions ADD COLUMN IF NOT EXISTS is_auto BOOLEAN DEFAULT FALSE"
            ))
            await conn.execute(text(
                "ALTER TABLE vault_transactions ADD COLUMN IF NOT EXISTS source VARCHAR DEFAULT 'manual'"
            ))
        logger.info("Vault migrations applied.")
    except Exception:
        logger.exception("CRITICAL: Database initialization failed")
    yield


# ── App ─────────────────────────────────────────────────────
app = FastAPI(
    title="Smart Journal API",
    description="API for managing trading portfolios and journals",
    version="1.0.0",
    lifespan=lifespan,
    # Disable Swagger/ReDoc in production to reduce attack surface
    docs_url=None if IS_PRODUCTION else "/docs",
    redoc_url=None if IS_PRODUCTION else "/redoc",
    openapi_url=None if IS_PRODUCTION else "/openapi.json",
)

# ── Rate Limit Error Handler ─────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# ── Security Headers Middleware ──────────────────────────────
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        if IS_PRODUCTION:
            response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
        # Basic CSP — adjust if you serve inline scripts
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "   # tighten if possible
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: blob:; "
            "font-src 'self' data:; "
            "connect-src 'self';"
        )
        return response


app.add_middleware(SecurityHeadersMiddleware)


# ── CORS ─────────────────────────────────────────────────────
# Explicit origins only — no wildcard regex
_cors_env = os.getenv("CORS_ORIGINS", "")
_extra_origins = [o.strip() for o in _cors_env.split(",") if o.strip()]

allow_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
] + _extra_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-CSRF-Token"],
    expose_headers=["X-CSRF-Token"],
)

# ── CSRF Middleware ───────────────────────────────────────────
app.add_middleware(CSRFProtectMiddleware)


# ── Routers ───────────────────────────────────────────────────
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(portfolios.router, prefix="/api")
app.include_router(trades.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(charges.router, prefix="/api")
app.include_router(brokers.router, prefix="/api")
app.include_router(vault.router, prefix="/api")


# ── Static Uploads ────────────────────────────────────────────
uploads_dir = Path(_settings.UPLOAD_DIR)
if os.getenv("VERCEL"):
    uploads_dir = Path("/tmp") / _settings.UPLOAD_DIR
try:
    uploads_dir.mkdir(parents=True, exist_ok=True)
except Exception:
    logger.warning("Could not create upload directory %s", uploads_dir)

app.mount("/api/uploads/screenshots", StaticFiles(directory=str(uploads_dir)), name="uploads")


# ── Health & Root ─────────────────────────────────────────────
@app.get("/")
async def root():
    return {"message": "Smart Journal API", "version": "1.0.0"}


@app.get("/health")
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "trading-journal-backend"}
