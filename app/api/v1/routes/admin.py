from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any
from app.core.config import get_settings
from app.api.v1.routes.auth import get_current_user

router = APIRouter()
settings = get_settings()

# Admin username (replace with proper admin check in production)
ADMIN_USERNAME = "admin"

async def get_admin_user(current_user: str = Depends(get_current_user)):
    """Check if the current user is an admin."""
    if current_user != ADMIN_USERNAME:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access admin endpoints"
        )
    return current_user

@router.get("/admin/status")
async def get_system_status(
    current_user: str = Depends(get_admin_user)
):
    """Get system status and configuration."""
    return {
        "status": "operational",
        "version": "1.0.0",
        "config": {
            "rate_limit": settings.RATE_LIMIT_PER_MINUTE,
            "providers": {
                "openai": bool(settings.OPENAI_API_KEY),
                "anthropic": bool(settings.ANTHROPIC_API_KEY),
                "gemini": bool(settings.GOOGLE_API_KEY)
            }
        }
    }

@router.get("/admin/metrics")
async def get_system_metrics(
    current_user: str = Depends(get_admin_user)
):
    """Get system metrics."""
    # TODO: Implement actual metrics collection
    return {
        "active_users": 0,
        "total_conversations": 0,
        "total_messages": 0,
        "api_calls": {
            "openai": 0,
            "anthropic": 0,
            "gemini": 0
        }
    }

@router.post("/admin/config")
async def update_system_config(
    config: Dict[str, Any],
    current_user: str = Depends(get_admin_user)
):
    """Update system configuration."""
    # TODO: Implement configuration update logic
    return {
        "status": "success",
        "message": "Configuration updated successfully"
    } 