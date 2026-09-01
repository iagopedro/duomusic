import logging
import logging.config
import time
from collections import defaultdict
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import get_settings
from .database import close_db, init_db
from .routers import achievements, exercises, modules
from .routers.auth import router as auth_router
from .routers.user_progress import router as user_progress_router

settings = get_settings()

logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

logging.config.dictConfig({
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {"format": "%(asctime)s [%(levelname)s] %(name)s: %(message)s"}
    },
    "handlers": {
        "console": {"class": "logging.StreamHandler", "formatter": "default"}
    },
    "root": {"level": "INFO", "handlers": ["console"]},
})


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gerencia o ciclo de vida da aplicação."""
    # Startup: inicializa o banco de dados
    await init_db()
    logging.info("Database initialized")
    yield
    # Shutdown: fecha conexões
    await close_db()
    logging.info("Database connections closed")


app = FastAPI(
    title="DuoMusic API",
    version="1.0.0",
    docs_url="/docs" if settings.debug else None,
    redoc_url=None,
    lifespan=lifespan,
)

# ── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

# ── Rate limiter em memória ──────────────────────────────────────────────────
_requests: dict[str, list[float]] = defaultdict(list)


@app.middleware("http")
async def rate_limit(request: Request, call_next):
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    window = settings.rate_limit_window
    _requests[client_ip] = [t for t in _requests[client_ip] if now - t < window]

    if len(_requests[client_ip]) >= settings.rate_limit_max:
        return JSONResponse(
            status_code=429,
            content={"detail": "Limite de requisições excedido. Tente novamente em breve."},
        )

    _requests[client_ip].append(now)
    response = await call_next(request)
    return response


# ── Headers de segurança ─────────────────────────────────────────────────────
@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return response


# ── Routers ──────────────────────────────────────────────────────────────────
app.include_router(auth_router, prefix="/api")
app.include_router(user_progress_router, prefix="/api")
app.include_router(exercises.router, prefix="/api")
app.include_router(modules.router, prefix="/api")
app.include_router(achievements.router, prefix="/api")


@app.get("/api/health")
def health():
    """Health check endpoint para provedores de cloud."""
    return {"status": "ok"}
