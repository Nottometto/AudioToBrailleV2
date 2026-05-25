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

import text_queue as tq
import web_server as ws
import time

#load api key
import os
from dotenv import load_dotenv
load_dotenv()
api_key = os.getenv("api_key")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def on_turn(self: Type[StreamingClient], event: TurnEvent):
    if not event.transcript:
        return
    
    current_words = event.transcript.split()

    if len(current_words) > tq.audio_word_count:
        new_words = current_words[tq.audio_word_count:]
        
        for word in new_words:
            tq.audio_word_count += 1
            if not tq.mute_flag:
                tq.text_queue.append(word)
                ws.send_queue_update(word)
        if not tq.mute_flag:
            print(list(tq.text_queue))
    
    if event.end_of_turn:
        tq.audio_word_count = 0

def on_begin(self: Type[StreamingClient], event: BeginEvent):
    tq.audio_word_count = 0
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