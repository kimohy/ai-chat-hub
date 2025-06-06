from fastapi import Request, HTTPException, status
from redis import Redis
from app.core.config import get_settings
import time

settings = get_settings()

class RateLimiter:
    """Rate limiter using Redis."""
    
    def __init__(self):
        """Initialize Redis connection."""
        self.redis = Redis.from_url(settings.REDIS_URL)
        self.rate_limit = settings.RATE_LIMIT_PER_MINUTE
    
    def is_rate_limited(self, key: str) -> bool:
        """Check if the request is rate limited."""
        current = int(time.time())
        window = 60  # 1 minute window
        
        # Get the current count for the key
        count = self.redis.get(key)
        if count is None:
            # First request in the window
            self.redis.setex(key, window, 1)
            return False
        
        count = int(count)
        if count >= self.rate_limit:
            return True
        
        # Increment the counter
        self.redis.incr(key)
        return False
    
    def get_remaining(self, key: str) -> int:
        """Get remaining requests for the key."""
        count = self.redis.get(key)
        if count is None:
            return self.rate_limit
        return max(0, self.rate_limit - int(count))

rate_limiter = RateLimiter()

async def rate_limit_middleware(request: Request, call_next):
    """Rate limiting middleware."""
    client_ip = request.client.host
    key = f"rate_limit:{client_ip}"
    
    if rate_limiter.is_rate_limited(key):
        remaining = rate_limiter.get_remaining(key)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests",
            headers={"X-RateLimit-Remaining": str(remaining)}
        )
    
    response = await call_next(request)
    remaining = rate_limiter.get_remaining(key)
    response.headers["X-RateLimit-Remaining"] = str(remaining)
    return response 