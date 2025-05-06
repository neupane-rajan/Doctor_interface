from fastapi import APIRouter, HTTPException, status
from app.models import ChatRequest, ChatResponse, TTSRequest, STTRequest
from app.services.llm_service import LLMService
from app.services.tts_service import TTSService
from app.services.stt_service import STTService

router = APIRouter(prefix="/api")

# Initialize services
llm_service = LLMService()
tts_service = TTSService()
stt_service = STTService()


@router.post("/chat", response_model=ChatResponse, status_code=status.HTTP_200_OK)
async def chat_endpoint(request: ChatRequest):
    """
    Process a chat request and return AI response
    """
    try:
        # Generate text response
        response_text = await llm_service.generate_response(request)
        
        # Convert response to speech
        audio_base64 = await tts_service.text_to_speech(TTSRequest(text=response_text))
        
        return ChatResponse(
            message=response_text,
            audio_url=f"data:audio/mp3;base64,{audio_base64}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing chat request: {str(e)}"
        )


@router.post("/tts", status_code=status.HTTP_200_OK)
async def text_to_speech_endpoint(request: TTSRequest):
    """
    Convert text to speech
    """
    try:
        audio_base64 = await tts_service.text_to_speech(request)
        return {"audio_url": f"data:audio/mp3;base64,{audio_base64}"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error converting text to speech: {str(e)}"
        )


@router.post("/stt", status_code=status.HTTP_200_OK)
async def speech_to_text_endpoint(request: STTRequest):
    """
    Convert speech to text
    """
    try:
        text = await stt_service.speech_to_text(request)
        return {"text": text}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error converting speech to text: {str(e)}"
        )