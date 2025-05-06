from groq import Groq
from app.config import GROQ_API_KEY, LLAMA_MODEL
from app.models import ChatMessage, ChatRequest


class LLMService:
    def __init__(self):
        self.client = Groq(api_key=GROQ_API_KEY)
        self.model = LLAMA_MODEL

    async def generate_response(self, chat_request: ChatRequest) -> str:
        """Generate a response using Groq's LLaMA 3.1 model"""
        
        # Format messages for Groq API
        messages = [{"role": msg.role, "content": msg.content} for msg in chat_request.messages]
        
        # Add system message for medical context if not already present
        if not any(msg.get("role") == "system" for msg in messages):
            system_message = {
                "role": "system", 
                "content": """You are an AI medical assistant that provides helpful information on health topics. 
                You are not a replacement for professional medical advice, diagnosis, or treatment. 
                Always advise users to consult with a healthcare professional for serious medical concerns."""
            }
            messages.insert(0, system_message)
        
        # Call Groq API - updated to use max_tokens
        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=chat_request.temperature,
            max_tokens=chat_request.max_tokens,  # Changed back to max_tokens
            top_p=1,
            stream=False
        )
        
        # Extract the assistant's response
        return response.choices[0].message.content