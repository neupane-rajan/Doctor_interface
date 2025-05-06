from google.cloud import texttospeech
import base64
from app.models import TTSRequest


class TTSService:
    def __init__(self):
        self.client = texttospeech.TextToSpeechClient()
    
    async def text_to_speech(self, tts_request: TTSRequest) -> str:
        """Convert text to speech using Google TTS API and return base64 encoded audio"""
        
        # Set the text input to be synthesized
        synthesis_input = texttospeech.SynthesisInput(text=tts_request.text)
        
        # Build the voice request
        voice_parts = tts_request.voice_name.split("-")
        language_code = "-".join(voice_parts[:2])  # e.g., "en-US"
        
        # Determine voice gender
        gender_str = voice_parts[2][0]  # e.g., "N" from "Neural2-F"
        if "F" in tts_request.voice_name:
            gender = texttospeech.SsmlVoiceGender.FEMALE
        else:
            gender = texttospeech.SsmlVoiceGender.MALE
            
        voice = texttospeech.VoiceSelectionParams(
            language_code=language_code,
            name=tts_request.voice_name,
            ssml_gender=gender
        )
        
        # Select the type of audio file to return
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3,
            speaking_rate=tts_request.speaking_rate,
            pitch=tts_request.pitch
        )
        
        # Perform the text-to-speech request
        response = self.client.synthesize_speech(
            input=synthesis_input,
            voice=voice,
            audio_config=audio_config
        )
        
        # Return base64 encoded audio content
        return base64.b64encode(response.audio_content).decode("utf-8")