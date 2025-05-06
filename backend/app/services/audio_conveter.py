import io
import base64
import logging
from pydub import AudioSegment

logger = logging.getLogger(__name__)

def convert_mp3_to_wav_base64(mp3_base64):
    """Convert MP3 base64 content to WAV base64 content"""
    try:
        # Decode base64 string to binary data
        mp3_data = base64.b64decode(mp3_base64)
        logger.info(f"Decoded MP3 data: {len(mp3_data)} bytes")
        
        # Load MP3 data using pydub
        audio = AudioSegment.from_file(io.BytesIO(mp3_data), format="mp3")
        logger.info(f"Loaded MP3 audio: {audio.duration_seconds} seconds, {audio.channels} channels, {audio.frame_rate} Hz")
        
        # Convert to WAV format with correct specifications for Google STT
        audio = audio.set_channels(1)  # Convert to mono
        audio = audio.set_frame_rate(16000)  # Set to 16kHz
        
        # Export as WAV
        wav_buffer = io.BytesIO()
        audio.export(wav_buffer, format="wav")
        wav_data = wav_buffer.getvalue()
        logger.info(f"Converted to WAV: {len(wav_data)} bytes")
        
        # Convert back to base64
        wav_base64 = base64.b64encode(wav_data).decode("utf-8")
        return wav_base64
    
    except Exception as e:
        logger.error(f"Error converting MP3 to WAV: {str(e)}")
        raise