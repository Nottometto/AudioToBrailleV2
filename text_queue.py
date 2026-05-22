from collections import deque
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