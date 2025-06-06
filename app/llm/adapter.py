from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional, AsyncGenerator

class LLMProvider(ABC):
    """Abstract base class for LLM providers."""
    
    @abstractmethod
    async def generate_response(
        self, 
        messages: List[Dict[str, str]], 
        model_params: Dict[str, Any]
    ) -> str:
        """Generate a single response from the LLM.
        
        Args:
            messages: List of message dictionaries with 'role' and 'content' keys
            model_params: Dictionary of model-specific parameters
            
        Returns:
            Generated response as a string
        """
        pass
        
    @abstractmethod
    async def stream_response(
        self, 
        messages: List[Dict[str, str]], 
        model_params: Dict[str, Any]
    ) -> AsyncGenerator[str, None]:
        """Stream responses from the LLM.
        
        Args:
            messages: List of message dictionaries with 'role' and 'content' keys
            model_params: Dictionary of model-specific parameters
            
        Yields:
            Generated response chunks as strings
        """
        pass

    @abstractmethod
    async def validate_credentials(self) -> bool:
        """Validate the provider's credentials.
        
        Returns:
            True if credentials are valid, False otherwise
        """
        pass 