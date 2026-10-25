import os
from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs

client = ElevenLabs(api_key=os.environ.get("ELEVEN_API_KEY"))

# Get raw response with headers
response = client.text_to_speech.with_raw_response.convert(
    text="Hello, world!",
    voice_id="voice_id"
)

# Access character cost from headers
char_cost = response.headers.get("character-cost")

# Optionally store these for debugging
request_id = response.headers.get("request-id")
trace_id = response.headers.get("x-trace-id")

audio_data = response.data
