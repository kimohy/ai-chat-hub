from typing import List, Dict, Any, AsyncGenerator
import google.generativeai as genai
from .adapter import LLMProvider

class GeminiProvider(LLMProvider):
    """Google Gemini provider implementation."""
    
    def __init__(self, api_key: str):
        """Initialize Gemini provider.
        
        Args:
            api_key: Google API key
        """
        genai.configure(api_key=api_key)
        self.client = genai.GenerativeModel('gemini-pro')
    
    async def generate_response(
        self, 
        messages: List[Dict[str, str]], 
        model_params: Dict[str, Any]
    ) -> str:
        """Generate a single response from Gemini.
        
        Args:
            messages: List of message dictionaries with 'role' and 'content' keys
            model_params: Dictionary of model-specific parameters
            
        Returns:
            Generated response as a string
        """
        try:
            # Convert messages to Gemini format
            chat = self.client.start_chat(history=[])
            for msg in messages:
                if msg["role"] == "user":
                    chat.send_message(msg["content"])
                elif msg["role"] == "assistant":
                    # Add assistant message to history
                    chat.history.append({
                        "role": "model",
                        "parts": [msg["content"]]
                    })
                elif msg["role"] == "system":
                    # Handle system message by prepending to the first user message
                    if not chat.history:
                        chat.send_message(f"{msg['content']}\n\n")
            
            response = await chat.send_message_async(
                messages[-1]["content"],
                **model_params
            )
            return response.text
        except Exception as e:
            raise Exception(f"Gemini API error: {str(e)}")
    
    async def stream_response(
        self, 
        messages: List[Dict[str, str]], 
        model_params: Dict[str, Any]
    ) -> AsyncGenerator[str, None]:
        """Stream responses from Gemini.
        
        Args:
            messages: List of message dictionaries with 'role' and 'content' keys
            model_params: Dictionary of model-specific parameters
            
        Yields:
            Generated response chunks as strings
        """
        try:
            # Convert messages to Gemini format
            chat = self.client.start_chat(history=[])
            for msg in messages:
                if msg["role"] == "user":
                    chat.send_message(msg["content"])
                elif msg["role"] == "assistant":
                    # Add assistant message to history
                    chat.history.append({
                        "role": "model",
                        "parts": [msg["content"]]
                    })
                elif msg["role"] == "system":
                    # Handle system message by prepending to the first user message
                    if not chat.history:
                        chat.send_message(f"{msg['content']}\n\n")
            
            response = await chat.send_message_async(
                messages[-1]["content"],
                stream=True,
                **model_params
            )
            async for chunk in response:
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            raise Exception(f"Gemini API error: {str(e)}")
    
    async def validate_credentials(self) -> bool:
        """Validate Gemini credentials.
        
        Returns:
            True if credentials are valid, False otherwise
        """
        try:
            model = genai.GenerativeModel('gemini-pro')
            response = await model.generate_content_async("Hello")
            return bool(response.text)
        except Exception:
            return False 