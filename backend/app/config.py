import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# API Keys
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GOOGLE_APPLICATION_CREDENTIALS = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

# Check if required environment variables are set
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY environment variable is not set")

if not GOOGLE_APPLICATION_CREDENTIALS:
    raise ValueError("GOOGLE_APPLICATION_CREDENTIALS environment variable is not set")
    
# Model settings
LLAMA_MODEL = "llama3-70b-8192"  # Corrected model name

# Set Google credentials path for the application
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = GOOGLE_APPLICATION_CREDENTIALS