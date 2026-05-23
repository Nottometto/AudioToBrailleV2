from collections import deque

#try import GPIO
G = None
try:
    import RPi.GPIO as G
    G.setmode(G.BCM)
    G.setwarnings(False)
    G.setup(27, G.IN, pull_up_down= G.PUD_UP)
    G.setup(9, G.IN, pull_up_down=G.PUD_UP)
    G.setup(22, G.IN, pull_up_down=G.PUD_UP)
    G.setup(14, G.IN, pull_up_down=G.PUD_UP)

except ImportError as e:
    print("Import Error!", e)
    G = None

text_queue = deque()

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
        
mute_flag = False
clear_flag = False
letter_counter = 0