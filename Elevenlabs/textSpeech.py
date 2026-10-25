import os
from dotenv import load_dotenv
from elevenlabs import ElevenLabs

load_dotenv()

client = ElevenLabs(
    api_key=os.environ.get("ELEVEN_API_KEY"))

#1

cosmic_radiation = client.text_to_speech.stream(
    voice_id="XB0fDUnXU5powFXDhCwa",
    output_format="mp3_44100_128",
    text="COSMIC RAY DETECTED",
    model_id="eleven_multilingual_v2",
)

with open("./Audio/cosmic_radiation.mp3", "wb") as f:
    
    for chunk in cosmic_radiation:
        f.write(chunk)

#2

dust_storm = client.text_to_speech.stream(
    voice_id="XB0fDUnXU5powFXDhCwa",
    output_format="mp3_44100_128",
    text="DUST STORM INCOMING",
    model_id="eleven_multilingual_v2",
)

with open("./Audio/dust_storm.mp3", "wb") as f:
    
    for chunk in dust_storm:
        f.write(chunk)

#3

heater_fail = client.text_to_speech.stream(
    voice_id="XB0fDUnXU5powFXDhCwa",
    output_format="mp3_44100_128",
    text="HEATERS HAVE FAILED",
    model_id="eleven_multilingual_v2",
)

with open("./Audio/heater_fail.mp3", "wb") as f:
    
    for chunk in heater_fail:
        f.write(chunk)

#4

hull_breach = client.text_to_speech.stream(
    voice_id="XB0fDUnXU5powFXDhCwa",
    output_format="mp3_44100_128",
    text="HULL HAS BEEN BREACHED",
    model_id="eleven_multilingual_v2",
)

with open("./Audio/hull_breach.mp3", "wb") as f:
    
    for chunk in hull_breach:
        f.write(chunk)

#5

overheat = client.text_to_speech.stream(
    voice_id="XB0fDUnXU5powFXDhCwa",
    output_format="mp3_44100_128",
    text="BATTERY IS OVERHEATING",
    model_id="eleven_multilingual_v2",
)

with open("./Audio/overheat.mp3", "wb") as f:
    
    for chunk in overheat:
        f.write(chunk)

#6

patch_suit = client.text_to_speech.stream(
    voice_id="XB0fDUnXU5powFXDhCwa",
    output_format="mp3_44100_128",
    text="TEAR HAS BEEN DETECTED",
    model_id="eleven_multilingual_v2",
)

with open("./Audio/patch_suit.mp3", "wb") as f:
    
    for chunk in patch_suit:
        f.write(chunk)

#7

rotate_pipe = client.text_to_speech.stream(
    voice_id="XB0fDUnXU5powFXDhCwa",
    output_format="mp3_44100_128",
    text="PIPES NEED TO BE CLEARED ",
    model_id="eleven_multilingual_v2",
)

with open("./Audio/rotate_pipe.mp3", "wb") as f:
    
    for chunk in rotate_pipe:
        f.write(chunk)

#8

scrubber_fail = client.text_to_speech.stream(
    voice_id="XB0fDUnXU5powFXDhCwa",
    output_format="mp3_44100_128",
    text="OXYGEN LEVELS ARE DROPPING",
    model_id="eleven_multilingual_v2",
)

with open("./Audio/scrubber_fail.mp3", "wb") as f:
    
    for chunk in scrubber_fail:
        f.write(chunk)

#9

solar_flare = client.text_to_speech.stream(
    voice_id="XB0fDUnXU5powFXDhCwa",
    output_format="mp3_44100_128",
    text="RADIATION LEVELS ARE RISING",
    model_id="eleven_multilingual_v2",
)

with open("./Audio/solar_flare.mp3", "wb") as f:
    
    for chunk in solar_flare:
        f.write(chunk)

#10

suit_leak = client.text_to_speech.stream(
    voice_id="XB0fDUnXU5powFXDhCwa",
    output_format="mp3_44100_128",
    text="OPEN VALVES DETECTED",
    model_id="eleven_multilingual_v2",
)

with open("./Audio/suit_leak.mp3", "wb") as f:
    
    for chunk in suit_leak:
        f.write(chunk)


print("Audio saved")

