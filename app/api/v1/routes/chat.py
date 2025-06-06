import traceback
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from app.llm.adapter import LLMProvider
from app.llm.openai_provider import OpenAIProvider
from app.llm.anthropic_provider import AnthropicProvider
from app.llm.gemini_provider import GeminiProvider
from app.core.config import get_settings
import json
import logging

logger = logging.getLogger(__name__)

router = APIRouter()
settings = get_settings()

# Initialize LLM providers
providers: Dict[str, LLMProvider] = {}

class Message(BaseModel):
    role: str
    content: str
    timestamp: Optional[str] = None

class ChatRequest(BaseModel):
    messages: List[Message]
    model_params: Dict[str, Any] = Field(
        default_factory=lambda: {
            "model": "gpt-4o",
            "temperature": 0.7,
            "max_tokens": 1000
        }
    )

async def get_provider(provider_name: str) -> LLMProvider:
    """Get LLM provider instance."""
    try:
        if provider_name not in providers:
            if provider_name == "openai":
                if not settings.OPENAI_API_KEY:
                    raise HTTPException(status_code=400, detail="OpenAI API key not configured")
                providers[provider_name] = OpenAIProvider(
                    api_key=settings.OPENAI_API_KEY,
                    organization=settings.OPENAI_ORGANIZATION
                )
            elif provider_name == "anthropic":
                if not settings.ANTHROPIC_API_KEY:
                    raise HTTPException(status_code=400, detail="Anthropic API key not configured")
                providers[provider_name] = AnthropicProvider(
                    api_key=settings.ANTHROPIC_API_KEY
                )
            elif provider_name == "gemini":
                if not settings.GOOGLE_API_KEY:
                    raise HTTPException(status_code=400, detail="Google API key not configured")
                providers[provider_name] = GeminiProvider(
                    api_key=settings.GOOGLE_API_KEY
                )
            else:
                raise HTTPException(status_code=400, detail=f"Unknown provider: {provider_name}")
        
        return providers[provider_name]
    except Exception as e:
        logger.error(f"Error getting provider {provider_name}: {str(e)}")
        raise

@router.post("/chat/{provider}")
async def chat(
    provider: str,
    request: ChatRequest
):
    """Generate a chat response."""
    try:
        logger.debug(f"Received chat request for provider {provider}")
        logger.debug(f"Request messages: {request.messages}")
        logger.debug(f"Request model params: {request.model_params}")

        llm_provider = await get_provider(provider)
        
        # Convert messages to the format expected by the provider
        messages = [
            {
                "role": msg.role,
                "content": msg.content
            }
            for msg in request.messages
        ]
        
        # Ensure required parameters are present
        model_params = {
            "model": request.model_params.get("model", "gpt-4o"),
            "temperature": request.model_params.get("temperature", 0.7),
            "max_tokens": request.model_params.get("max_tokens", 1000),
            **request.model_params
        }
        
        response = await llm_provider.generate_response(messages, model_params)
        
        logger.debug(f"Generated response: {response}")
        return {"message": response}
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise

@router.post("/chat/{provider}/stream")
async def chat_stream(
    provider: str,
    request: ChatRequest
):
    """Stream a chat response."""
    try:
        logger.debug(f"Received stream request for provider {provider}")
        logger.debug(f"Request messages: {request.messages}")
        logger.debug(f"Request model params: {request.model_params}")

        llm_provider = await get_provider(provider)
        
        async def generate():
            try:
                async for chunk in llm_provider.stream_response(request.messages, request.model_params):
                    yield f"data: {json.dumps({'chunk': chunk})}\n\n"
            except Exception as e:
                logger.error(f"Error in stream generation: {str(e)}")
                logger.error(f"Traceback: {traceback.format_exc()}")
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
        
        return StreamingResponse(
            generate(),
            media_type="text/event-stream"
        )
    except Exception as e:
        logger.error(f"Error in chat_stream endpoint: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise

@router.get("/providers")
async def list_providers():
    """List available LLM providers and their status."""
    providers_status = {}
    
    for provider_name in ["openai", "anthropic", "gemini"]:
        try:
            provider = await get_provider(provider_name)
            is_valid = await provider.validate_credentials()
            providers_status[provider_name] = {
                "available": True,
                "valid_credentials": is_valid
            }
        except Exception:
            providers_status[provider_name] = {
                "available": False,
                "valid_credentials": False
            }
    
    return providers_status 