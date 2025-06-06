from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.core.config import get_settings
from app.api.v1.routes.auth import get_current_user

router = APIRouter()
settings = get_settings()

# In-memory storage for conversations (replace with database in production)
conversations: Dict[str, List[Dict[str, Any]]] = {}

@router.post("/conversations")
async def create_conversation(
    title: str,
    current_user: str = Depends(get_current_user)
):
    """Create a new conversation."""
    conversation_id = f"{current_user}_{datetime.utcnow().timestamp()}"
    conversations[conversation_id] = {
        "id": conversation_id,
        "title": title,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "messages": []
    }
    return conversations[conversation_id]

@router.get("/conversations")
async def list_conversations(
    current_user: str = Depends(get_current_user)
):
    """List all conversations for the current user."""
    user_conversations = [
        conv for conv in conversations.values()
        if conv["id"].startswith(f"{current_user}_")
    ]
    return user_conversations

@router.get("/conversations/{conversation_id}")
async def get_conversation(
    conversation_id: str,
    current_user: str = Depends(get_current_user)
):
    """Get a specific conversation."""
    if conversation_id not in conversations:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    conversation = conversations[conversation_id]
    if not conversation["id"].startswith(f"{current_user}_"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this conversation"
        )
    
    return conversation

@router.post("/conversations/{conversation_id}/messages")
async def add_message(
    conversation_id: str,
    message: Dict,
    current_user: str = Depends(get_current_user)
):
    """Add a message to a conversation."""
    if conversation_id not in conversations:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found" 
        )
    
    conversation = conversations[conversation_id]
    if not conversation["id"].startswith(f"{current_user}_"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this conversation"
        )
    
    message_with_metadata = {
        **message,
        "timestamp": datetime.utcnow(),
        "id": f"msg_{datetime.utcnow().timestamp()}"
    }
    conversation["messages"].append(message_with_metadata)
    conversation["updated_at"] = datetime.utcnow()
    
    return message_with_metadata

@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    current_user: str = Depends(get_current_user)
):
    """Delete a conversation."""
    if conversation_id not in conversations:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    conversation = conversations[conversation_id]
    if not conversation["id"].startswith(f"{current_user}_"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this conversation"
        )
    
    del conversations[conversation_id]
    return {"status": "success"} 