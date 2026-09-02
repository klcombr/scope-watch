import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from .config import get_settings
from .database import init_db
from .ratelimit import RateLimitMiddleware, get_limiter
from .routers import auth, change_orders, projects, requests, share

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("scopewise")

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    docs_url="/api/docs" if settings.app_env == "development" else None,
    redoc_url=None,
    openapi_url="/api/openapi.json" if settings.app_env == "development" else None,
)

# CORS — restrict to known frontend origins in production.
_allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
# Add production origins from CORS_ORIGINS env var (comma-separated).
_extra_origins = settings.cors_origins
if _extra_origins:
    _allowed_origins.extend([o.strip() for o in _extra_origins.split(",") if o.strip()])
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
    max_age=600,
)

# Rate limiting — sliding window in-process, keyed by client IP.
if settings.rate_limit_enabled:
    limiter = get_limiter(max_requests=settings.rate_limit_per_minute, window_seconds=60)
    app.add_middleware(RateLimitMiddleware, limiter=limiter)


# Security headers (applied to every response).
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["X-XSS-Protection"] = "0"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; script-src 'self'; "
            "style-src 'self' 'unsafe-inline'; img-src 'self' data:; "
            "font-src 'self'; connect-src 'self'; frame-ancestors 'none'"
        )
        return response


app.add_middleware(SecurityHeadersMiddleware)


@app.on_event("startup")
def on_startup():
    logger.info("Starting %s (env=%s)", settings.app_name, settings.app_env)
    init_db()
    logger.info("Database initialized")


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled error on %s %s: %s", request.method, request.url.path, exc)
    from fastapi.responses import JSONResponse
    return JSONResponse(status_code=500, content={"detail": "Erro interno do servidor"})


@app.get("/api/health")
def health():
    return {"status": "ok", "app": settings.app_name}


app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(requests.router)
app.include_router(change_orders.router)
app.include_router(share.router)
