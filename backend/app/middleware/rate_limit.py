from typing import Dict, Optional
from datetime import datetime, timedelta
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
import asyncio
from collections import defaultdict

class RateLimiter:
    def __init__(self, requests_per_minute: int = 60):
        self.requests_per_minute = requests_per_minute
        self.requests: Dict[str, list] = defaultdict(list)
        self._cleanup_task = None

    async def cleanup(self) -> None:
        """Remove old request timestamps"""
        while True:
            now = datetime.utcnow()
            for ip in list(self.requests.keys()):
                self.requests[ip] = [
                    timestamp for timestamp in self.requests[ip]
                    if now - timestamp < timedelta(minutes=1)
                ]
                if not self.requests[ip]:
                    del self.requests[ip]
            await asyncio.sleep(60)  # Cleanup every minute

    async def start_cleanup(self) -> None:
        """Start the cleanup task"""
        if not self._cleanup_task:
            self._cleanup_task = asyncio.create_task(self.cleanup())

    def get_client_ip(self, request: Request) -> str:
        """Get client IP from request headers or direct IP"""
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0]
        return request.client.host if request.client else "unknown"

    async def __call__(self, request: Request) -> Optional[JSONResponse]:
        """Rate limit middleware implementation"""
        if not self._cleanup_task:
            await self.start_cleanup()

        client_ip = self.get_client_ip(request)
        now = datetime.utcnow()
        
        # Remove old timestamps
        self.requests[client_ip] = [
            timestamp for timestamp in self.requests[client_ip]
            if now - timestamp < timedelta(minutes=1)
        ]
        
        # Check rate limit
        if len(self.requests[client_ip]) >= self.requests_per_minute:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "message": "Too many requests",
                    "retry_after": "60 seconds"
                }
            )
        
        # Add current request timestamp
        self.requests[client_ip].append(now)
        return None

rate_limiter = RateLimiter()
