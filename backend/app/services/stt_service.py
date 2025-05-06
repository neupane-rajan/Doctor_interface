import os
import base64
from google.cloud import speech
from app.models import STTRequest
import logging
from pathlib import Path

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class STTService:
    def __init__(self):
        # Set the credentials file path using a more flexible approach
        # First check environment variable
        credentials_path = os.getenv("GOOGLE_CREDENTIALS_PATH")
        
        # If not set in environment, use the default path
        if not credentials_path:
            # Calculate the path relative to the project root
            project_root = Path(__file__).parent.parent.parent  # Navigate up from app/services to project root
            credentials_path = str(project_root / "credentials" / "gcloud-key.json")
        
        # Check if the file exists
        if not os.path.exists(credentials_path):
            logger.error(f"Google Cloud credentials file not found at: {credentials_path}")
            raise FileNotFoundError(f"Google Cloud credentials file not found at: {credentials_path}")
        
        # Set the credentials environment variable
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = credentials_path
        logger.info(f"Using Google Cloud credentials from: {credentials_path}")
        
        try:
            # Create the client
            self.client = speech.SpeechClient()
            logger.info("Google Cloud Speech-to-Text client created successfully")
        except Exception as e:
            logger.error(f"Failed to create Google Cloud Speech-to-Text client: {str(e)}")
            raise
    
    async def speech_to_text(self, stt_request: STTRequest) -> str:
        """Convert speech to text using Google STT API"""
        try:
            logger.info(f"Processing STT request with language code: {stt_request.language_code}")
            logger.info(f"Audio encoding: {stt_request.encoding}, Sample rate: {stt_request.sample_rate_hertz}")
            
            # Validate input
            if not stt_request.audio_content:
                logger.error("Empty audio content received")
                return "Error: No audio content provided"
            
            # Decode the base64 audio content
            try:
                audio_content = base64.b64decode(stt_request.audio_content)
                logger.info(f"Decoded audio content length: {len(audio_content)} bytes")
                
                # Basic validation of audio content
                if len(audio_content) < 100:  # Arbitrary small size check
                    logger.warning(f"Audio content suspiciously small: {len(audio_content)} bytes")
                    return "Error: Audio content too small, possibly corrupted"
                
            except Exception as e:
                logger.error(f"Error decoding base64 content: {str(e)}")
                return "Error: Invalid base64 audio content"
            
            # Create the audio input object
            audio = speech.RecognitionAudio(content=audio_content)
            
            # Determine the encoding type
            encoding_map = {
                "LINEAR16": speech.RecognitionConfig.AudioEncoding.LINEAR16,
                "FLAC": speech.RecognitionConfig.AudioEncoding.FLAC,
                "MP3": speech.RecognitionConfig.AudioEncoding.MP3,
                "OGG_OPUS": speech.RecognitionConfig.AudioEncoding.OGG_OPUS,
                "WEBM_OPUS": speech.RecognitionConfig.AudioEncoding.WEBM_OPUS,
                "MULAW": speech.RecognitionConfig.AudioEncoding.MULAW,
                "AMR": speech.RecognitionConfig.AudioEncoding.AMR,
                "AMR_WB": speech.RecognitionConfig.AudioEncoding.AMR_WB,
                "SPEEX_WITH_HEADER_BYTE": speech.RecognitionConfig.AudioEncoding.SPEEX_WITH_HEADER_BYTE,
            }
            
            # Default to LINEAR16 if encoding not recognized
            encoding = encoding_map.get(
                stt_request.encoding, 
                speech.RecognitionConfig.AudioEncoding.LINEAR16
            )
            
            # Configure the request
            config = speech.RecognitionConfig(
                encoding=encoding,
                sample_rate_hertz=stt_request.sample_rate_hertz or 16000,
                language_code=stt_request.language_code or "en-US",
                enable_automatic_punctuation=True,
                audio_channel_count=1,
                model="default"
            )
            
            logger.info(f"Using encoding: {encoding}, sample rate: {stt_request.sample_rate_hertz or 16000}")
            logger.info("Sending recognition request to Google STT API")
            
            # Perform the speech-to-text conversion with timeout handling
            try:
                response = self.client.recognize(config=config, audio=audio)
                logger.info(f"Received response with {len(response.results)} results")
            except Exception as e:
                logger.error(f"Google STT API error: {str(e)}")
                return "Error: Failed to process speech. Please try again."
            
            # Extract the transcribed text
            transcript = ""
            if response.results:
                for result in response.results:
                    if result.alternatives:
                        best_alternative = result.alternatives[0]
                        logger.info(f"Transcript: '{best_alternative.transcript}' (confidence: {best_alternative.confidence})")
                        transcript += best_alternative.transcript + " "
                transcript = transcript.strip()
            
            # Handle empty transcription
            if not transcript:
                logger.warning("No transcript was generated from the audio")
                return "I couldn't understand what was said. Could you please speak more clearly or try again?"
            
            # Return the successful transcription
            logger.info(f"Successfully transcribed: '{transcript}'")
            return transcript
            
        except Exception as e:
            logger.error(f"STT processing error: {str(e)}", exc_info=True)
            return f"Error processing speech: {str(e)}"