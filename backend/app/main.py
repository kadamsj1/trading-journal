from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import init_db
from app.routers import auth, users, portfolios, trades, analytics, alerts, charges
from app.middleware.csrf import CSRFProtectMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize database
    await init_db()
    yield
    # Shutdown: Cleanup (if needed)


app = FastAPI(
    title="Smart Journal API",
    description="API for managing trading portfolios and journals",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware - Configure for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3002",
        "https://vibe.marketcalls.in",
        "http://vibe.marketcalls.in"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-CSRF-Token"],  # Expose CSRF token header
)

# CSRF Protection Middleware
app.add_middleware(CSRFProtectMiddleware)

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(portfolios.router, prefix="/api")
app.include_router(trades.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(alerts.router, prefix="/api")
app.include_router(charges.router, prefix="/api")


@app.get("/")
async def root():
    return {
        "message": "Smart Journal API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
