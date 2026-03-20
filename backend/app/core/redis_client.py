"""
Redis client + helpers:
  - Sliding-window rate limiter (replaces in-memory dict in webchat.py)
  - Reset token store (replaces in-memory dict in auth.py)
"""
import time
import redis
from app.core.config import settings

_client: redis.Redis | None = None


def get_redis() -> redis.Redis:
    global _client
    if _client is None:
        _client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    return _client


# ── Rate limiter (sliding window) ─────────────────────────────────────────────

def check_rate_limit(ip: str, limit: int = 20, window: int = 60) -> None:
    """
    Raises HTTPException 429 if ip has exceeded `limit` requests in `window` seconds.
    Falls back silently if Redis is unavailable.
    """
    from fastapi import HTTPException
    try:
        r = get_redis()
        key = f"rl:{ip}"
        now = time.time()
        pipe = r.pipeline()
        pipe.zremrangebyscore(key, 0, now - window)
        pipe.zadd(key, {str(now): now})
        pipe.zcard(key)
        pipe.expire(key, window)
        results = pipe.execute()
        count = results[2]
        if count > limit:
            raise HTTPException(status_code=429, detail="Too many requests — please slow down")
    except HTTPException:
        raise
    except Exception as e:
        print(f"[redis] Rate limiter unavailable, allowing request: {e}", flush=True)


# ── Reset token store ──────────────────────────────────────────────────────────

def store_reset_token(token: str, user_id: int, ttl: int = 3600) -> None:
    get_redis().setex(f"reset:{token}", ttl, str(user_id))


def get_reset_user_id(token: str) -> int | None:
    val = get_redis().get(f"reset:{token}")
    return int(val) if val else None


def delete_reset_token(token: str) -> None:
    get_redis().delete(f"reset:{token}")


def invalidate_user_reset_tokens(user_id: int) -> None:
    """Delete any existing reset tokens for this user before issuing a new one."""
    r = get_redis()
    uid_str = str(user_id)
    for key in r.scan_iter("reset:*"):
        if r.get(key) == uid_str:
            r.delete(key)
