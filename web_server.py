from flask import Flask, render_template
from flask_socketio import SocketIO

import os
import time

import motors as m
import text_queue as tq
import encoder as e

#set dir
HTML_BASE_ROUTE = "templates"
HTML_FILE = "index1.html"
BASEDIR = os.path.dirname(__file__)
TEMPLATEDIR = os.path.join(BASEDIR, HTML_BASE_ROUTE)

text=""

app = Flask(__name__, template_folder = TEMPLATEDIR)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

@app.route('/')
def index():
    return render_template(HTML_FILE)

#Sending
def send_queue_update(queue):
    global text
    if text == "":
        text = queue
    else:
        text += " " + queue
    socketio.emit('queue_update', {'queue': text})

def remove_processed_word():
    global text
    if text:
        words = text.split()
        if words:
            words.pop(0) 
            text = " ".join(words)
            socketio.emit('queue_update', {'queue': text})
        else:
            text = ""

def send_queue_clear():
    global text
    text = ""
    socketio.emit('queue_update', {'queue': text})

def send_braille_update(letter, braille, index, cell = 0):
    socketio.emit('braille_update', {'letter': letter, 'braille': braille, 'index': index, 'cell': cell})

def send_speed_update(speed):
    socketio.emit('speed_update', {'speed': speed})

def send_mic_update(mic):
    if mic:
        socketio.emit('mic_update', {'mic': "Muted"})
    else:
        socketio.emit('mic_update', {'mic': "Unmuted"})



#Receiving
@socketio.on('connect')
def handle_connect():
    print("A user has opened the page")
    send_mic_update(tq.mute_flag)

#input
@socketio.on('add_text')
def handle_text(data):
    global text
    new_text = data.get("text", "")
    if new_text:
        word = new_text.split(" ")
        for i in word:
            tq.text_queue.append(i)
            send_queue_update(i)
        print(list(tq.text_queue))

#button
@socketio.on('clear_queue')
def handle_clear():
    tq.text_queue.clear()
    tq.clear_flag = True
    time.sleep(0.05) 
    tq.channel = 0

    send_queue_clear()
    m.clear_all()

    print("Web cleared the queue!")

@socketio.on('reboot_device')
def handle_reboot():
    print("Web system reboot")
    handle_clear()
    os.system("sudo reboot")

#dial
@socketio.on('set_speed')
def handle_speed(data):
    try:
        new_speed = float(data.get("speed"))

        tq.speed_counter = max(0.1, min(10.0, new_speed))
        print(f"Web set speed to: {e.counter}")
    except (ValueError, TypeError):
        pass

def start_server():
    socketio.run(app, host='0.0.0.0', port=5000, allow_unsafe_werkzeug=True)