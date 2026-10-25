import os
from dotenv import load_dotenv
from elevenlabs import ElevenLabs

load_dotenv()

client = ElevenLabs(
    api_key=os.environ.get("ELEVEN_API_KEY"))

audio_bytes = client.text_to_speech.stream(
    voice_id="JBFqnCBsd6RMkjVDRZzb",
    output_format="mp3_44100_128",
    text="WE LOVE CO PILOT",
    model_id="eleven_multilingual_v2",
)

with open("output.mp3", "wb") as f:
    
    for chunk in audio_bytes:
        f.write(chunk)

print("Audio saved")

