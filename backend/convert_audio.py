import sys
import os
import base64
from pydub import AudioSegment

def convert_mp3_to_wav(input_file, output_file):
    """Convert an MP3 file to WAV format suitable for Google STT"""
    print(f"Converting {input_file} to {output_file}...")
    
    # Load the MP3 file
    audio = AudioSegment.from_file(input_file, format="mp3")
    print(f"Loaded audio: {audio.duration_seconds:.2f} seconds, {audio.channels} channels, {audio.frame_rate} Hz")
    
    # Convert to mono and 16kHz
    audio = audio.set_channels(1)
    audio = audio.set_frame_rate(16000)
    
    # Export as WAV
    audio.export(output_file, format="wav")
    print(f"Converted file saved to {output_file}")
    
    # Create base64 version for API testing
    with open(output_file, "rb") as wav_file:
        wav_data = wav_file.read()
    
    wav_base64 = base64.b64encode(wav_data).decode("utf-8")
    base64_file = output_file + ".base64.txt"
    
    with open(base64_file, "w") as b64_file:
        b64_file.write(wav_base64)
    
    print(f"Base64 encoded version saved to {base64_file}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python convert_audio.py input.mp3 output.wav")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    
    convert_mp3_to_wav(input_file, output_file)