from typing import List, Dict, Any, AsyncGenerator
import openai
from .adapter import LLMProvider

class OpenAIProvider(LLMProvider):
    """OpenAI provider implementation."""
    
    def __init__(self, api_key: str, organization: str = None):
        """Initialize OpenAI provider.
        
        Args:
            api_key: OpenAI API key
            organization: OpenAI organization ID (optional)
        """
        self.client = openai.AsyncOpenAI(
            api_key=api_key,
            organization=organization,
        )
    
    async def generate_response(
        self, 
        messages: List[Dict[str, str]], 
        model_params: Dict[str, Any]
    ) -> str:
        """Generate a single response from OpenAI.
        
        Args:
            messages: List of message dictionaries with 'role' and 'content' keys
            model_params: Dictionary of model-specific parameters
            
        Returns:
            Generated response as a string
        """
        try:
            response = await self.client.chat.completions.create(
                messages=messages,
                **model_params
            )
            return response.choices[0].message.content
        except Exception as e:
            raise Exception(f"OpenAI API error: {str(e)}")
    
    async def stream_response(
        self, 
        messages: List[Dict[str, str]], 
        model_params: Dict[str, Any]
    ) -> AsyncGenerator[str, None]:
        """Stream responses from OpenAI.
        
        Args:
            messages: List of message dictionaries with 'role' and 'content' keys
            model_params: Dictionary of model-specific parameters
            
        Yields:
            Generated response chunks as strings
        """
        try:
            stream = await self.client.chat.completions.create(
                messages=messages,
                stream=True,
                **model_params
            )
            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            raise Exception(f"OpenAI API error: {str(e)}")
    
    async def validate_credentials(self) -> bool:
        """Validate OpenAI credentials.
        
        Returns:
            True if credentials are valid, False otherwise
        """
        try:
            await self.client.models.list()
            return True
        except Exception:
            return False 