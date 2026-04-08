import time
from collections import defaultdict

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import get_settings
from .routers import achievements, exercises, modules

settings = get_settings()

app = FastAPI(
    title="DuoMusic API",
    version="1.0.0",
    docs_url="/docs" if settings.debug else None,
    redoc_url=None,
)

# ── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
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
app.include_router(exercises.router, prefix="/api")
app.include_router(modules.router, prefix="/api")
app.include_router(achievements.router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok"}
