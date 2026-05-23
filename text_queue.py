import time
import re

from collections import deque
text_queue = deque()
word_clean = re.compile(r'[^a-z\s]')

speed_counter = 2.0
channel = 0
audio_word_count = 0

mute_flag = False
clear_flag = False

#import G
G = None
try:
    import RPi.GPIO as G
    G.setmode(G.BCM)
    G.setwarnings(False)

    G.setup(9, G.IN, pull_up_down=G.PUD_UP)
    G.setup(14, G.IN, pull_up_down=G.PUD_UP)
    G.setup(22, G.IN, pull_up_down=G.PUD_UP)
    G.setup(27, G.IN, pull_up_down= G.PUD_UP)

except ImportError as e:
    print("Import Error!", e)
    G = None

def clean_word():
    if not text_queue:
        time.sleep(0.1)
        return
            
    raw_word = text_queue.popleft()
    clean_word = word_clean.sub('', raw_word.lower())
    process_word = f"{clean_word} "

    return process_word
    
#type word in cmd prompt
def user_text_input():
    while True:
        try:
            user_input = input("--Text Added-- \n")
            word = user_input.split(" ")
            for i in word:
                text_queue.append(i)
            print(list(text_queue))
        except EOFError as e:
            break


        
