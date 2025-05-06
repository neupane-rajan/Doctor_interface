from pydantic import BaseModel
from typing import List, Optional


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 1024


class ChatResponse(BaseModel):
    message: str
    audio_url: Optional[str] = None


class TTSRequest(BaseModel):
    text: str
    voice_name: Optional[str] = "en-US-Chirp-HD-F"  # Default to female English voice
    speaking_rate: Optional[float] = 1.0
    pitch: Optional[float] = 0.0


class STTRequest(BaseModel):
    audio_content: str  # Base64 encoded audio content
    language_code: Optional[str] = "en-US"