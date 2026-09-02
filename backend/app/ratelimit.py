import time
from collections import defaultdict, deque
from threading import Lock

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse


class SlidingWindowRateLimiter:
    """Deterministic in-process sliding-window rate limiter keyed by client IP.

    Suitable for a single-process deployment (MVP). For horizontal scaling,
    replace with a shared store (Redis).
    """

    def __init__(self, max_requests: int, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._hits: dict[str, deque[float]] = defaultdict(deque)
        self._lock = Lock()
        self._last_cleanup = time.monotonic()
        self._cleanup_interval = 300  # Evict empty keys every 5 minutes

    def _cleanup(self) -> None:
        """Remove empty deques to prevent memory leak."""
        now = time.monotonic()
        if now - self._last_cleanup < self._cleanup_interval:
            return
        self._last_cleanup = now
        empty_keys = [k for k, v in self._hits.items() if len(v) == 0]
        for k in empty_keys:
            del self._hits[k]

    def check(self, key: str) -> bool:
        now = time.monotonic()
        with self._lock:
            self._cleanup()
            bucket = self._hits[key]
            # Drop timestamps outside the window.
            cutoff = now - self.window_seconds
            while bucket and bucket[0] <= cutoff:
                bucket.popleft()
            if len(bucket) >= self.max_requests:
                return False
            bucket.append(now)
            return True


_limiter_instance: SlidingWindowRateLimiter | None = None
_rl_lock = Lock()


def get_limiter(max_requests: int, window_seconds: int = 60) -> SlidingWindowRateLimiter:
    global _limiter_instance
    with _rl_lock:
        if _limiter_instance is None:
            _limiter_instance = SlidingWindowRateLimiter(max_requests, window_seconds)
        return _limiter_instance


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rejects requests exceeding the limit with HTTP 429."""

    def __init__(self, app, limiter: SlidingWindowRateLimiter):
        super().__init__(app)
        self.limiter = limiter

    async def dispatch(self, request: Request, call_next):
        # Exempt health checks and preflight requests.
        if request.url.path == "/api/health" or request.method == "OPTIONS":
            return await call_next(request)

        # Use X-Forwarded-For if behind a reverse proxy, else client IP.
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            ip = forwarded.split(",")[0].strip()
        else:
            ip = request.client.host if request.client else "unknown"

        if not self.limiter.check(ip):
            return JSONResponse(
                status_code=429,
                content={"detail": "Muitas requisições. Tente novamente em instantes."},
                headers={"Retry-After": "60"},
            )
        return await call_next(request)
