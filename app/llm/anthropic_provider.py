from typing import List, Dict, Any, AsyncGenerator
import anthropic
from .adapter import LLMProvider

class AnthropicProvider(LLMProvider):
    """Anthropic Claude provider implementation."""
    
    def __init__(self, api_key: str):
        """Initialize Anthropic provider.
        
        Args:
            api_key: Anthropic API key
        """
        self.client = anthropic.AsyncAnthropic(api_key=api_key)
    
    async def generate_response(
        self, 
        messages: List[Dict[str, str]], 
        model_params: Dict[str, Any]
    ) -> str:
        """Generate a single response from Claude.
        
        Args:
            messages: List of message dictionaries with 'role' and 'content' keys
            model_params: Dictionary of model-specific parameters
            
        Returns:
            Generated response as a string
        """
        try:
            # Convert messages to Anthropic format
            anthropic_messages = []
            for msg in messages:
                if msg["role"] == "user":
                    anthropic_messages.append({"role": "user", "content": msg["content"]})
                elif msg["role"] == "assistant":
                    anthropic_messages.append({"role": "assistant", "content": msg["content"]})
                elif msg["role"] == "system":
                    # Handle system messages by prepending to the first user message
                    if anthropic_messages and anthropic_messages[0]["role"] == "user":
                        anthropic_messages[0]["content"] = f"{msg['content']}\n\n{anthropic_messages[0]['content']}"
                    else:
                        anthropic_messages.append({"role": "user", "content": msg["content"]})
            
            response = await self.client.messages.create(
                messages=anthropic_messages,
                **model_params
            )
            return response.content[0].text
        except Exception as e:
            raise Exception(f"Anthropic API error: {str(e)}")
    
    async def stream_response(
        self, 
        messages: List[Dict[str, str]], 
        model_params: Dict[str, Any]
    ) -> AsyncGenerator[str, None]:
        """Stream responses from Claude.
        
        Args:
            messages: List of message dictionaries with 'role' and 'content' keys
            model_params: Dictionary of model-specific parameters
            
        Yields:
            Generated response chunks as strings
        """
        try:
            # Convert messages to Anthropic format
            anthropic_messages = []
            for msg in messages:
                if msg["role"] == "user":
                    anthropic_messages.append({"role": "user", "content": msg["content"]})
                elif msg["role"] == "assistant":
                    anthropic_messages.append({"role": "assistant", "content": msg["content"]})
                elif msg["role"] == "system":
                    # Handle system messages by prepending to the first user message
                    if anthropic_messages and anthropic_messages[0]["role"] == "user":
                        anthropic_messages[0]["content"] = f"{msg['content']}\n\n{anthropic_messages[0]['content']}"
                    else:
                        anthropic_messages.append({"role": "user", "content": msg["content"]})
            
            stream = await self.client.messages.create(
                messages=anthropic_messages,
                stream=True,
                **model_params
            )
            async for chunk in stream:
                if chunk.type == "content_block_delta":
                    yield chunk.delta.text
        except Exception as e:
            raise Exception(f"Anthropic API error: {str(e)}")
    
    async def validate_credentials(self) -> bool:
        """Validate Anthropic credentials.
        
        Returns:
            True if credentials are valid, False otherwise
        """
        try:
            await self.client.messages.create(
                messages=[{"role": "user", "content": "Hello"}],
                model="claude-3-opus-20240229",
                max_tokens=1
            )
            return True
        except Exception:
            return False 