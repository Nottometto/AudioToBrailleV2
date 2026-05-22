import assemblyai as aai
from assemblyai.streaming.v3 import (
    BeginEvent,
    StreamingClient,
    StreamingClientOptions,
    StreamingError,
    StreamingEvents,
    StreamingParameters,
    TerminationEvent,
    TurnEvent,
)
import logging
from typing import Type
import threading

import text_queue as tq
import web_server as ws
import time

#try import GPIO
try:
    import RPi.GPIO as G
    G.setmode(G.BCM)
    G.setwarnings(False)
    G.setup(27, G.IN, pull_up_down= G.PUD_UP)
except ImportError as e:
    print("Import Error!", e)
    G = None

#load api key
import os
from dotenv import load_dotenv
load_dotenv()
api_key = os.getenv("api_key")

handled_word_count = 0

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
is_muted = False 

if G:
    def monitor_mute_button():
        global is_muted
        while True:
            current_state = (G.input(27) == G.LOW)
            
            if current_state != is_muted:
                is_muted = current_state
                tq.mute_flag = is_muted
                if is_muted:
                    print("Microphone Muted")

                else:
                    print("Microphone Unmuted")
                ws.send_mic_update(is_muted)
            time.sleep(0.1) 

    mute_thread = threading.Thread(target=monitor_mute_button, daemon=True)
    mute_thread.start()

def on_turn(self: Type[StreamingClient], event: TurnEvent):
    global handled_word_count, is_muted

    if is_muted:
        handled_word_count = 0 
        return

    if not event.transcript:
        return
    
    current_words = event.transcript.split()
    if len(current_words) > handled_word_count:
        new_words = current_words[handled_word_count:]
        
        for word in new_words:
            tq.text_queue.append(word)
            handled_word_count += 1

            ws.send_queue_update(word)
    
        print(list(tq.text_queue))
    
    if event.end_of_turn:
        handled_word_count = 0

def on_begin(self: Type[StreamingClient], event: BeginEvent):
    global handled_word_count
    handled_word_count = 0
    print(f"Session started: {event.id} \nSpeak into the microphone")

def on_terminated(self: Type[StreamingClient], event: TerminationEvent):
    print(
        f"Session terminated: {event.audio_duration_seconds} seconds of audio processed"
    )

def on_error(self: Type[StreamingClient], error: StreamingError):
    print(f"Error occurred: {error}")

def start_audio_streaming():
    try:
        while True:
            try:
                client = StreamingClient(
                    StreamingClientOptions(
                        api_key=api_key,
                        api_host="streaming.assemblyai.com",
                    )
                )

                client.on(StreamingEvents.Begin, on_begin)
                client.on(StreamingEvents.Turn, on_turn)
                client.on(StreamingEvents.Termination, on_terminated)
                client.on(StreamingEvents.Error, on_error)

                client.connect(
                    StreamingParameters(
                        sample_rate = 16000,
                        speech_model = "universal-streaming-english"
                    )
                )

                client.stream(aai.extras.MicrophoneStream(sample_rate=16000))
            except Exception as e:
                print(f"Connection dropped: {e}")
                print("Attempting to reconnect in 3 seconds...")
                #webapp
                
                time.sleep(3)
            finally:
                try:
                    client.disconnect(terminate=True)
                except:
                    pass
    except KeyboardInterrupt:
        pass