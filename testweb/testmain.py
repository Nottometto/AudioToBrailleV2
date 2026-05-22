import testtextqueue as tq
import testweb as ws
import testencoder as e
import testmotor as m

import re
import time
import threading

word_clean = re.compile(r'[^a-z\s]')

def hardware_loop():
    time.sleep(3)
    user_input = "Tigers and leopards are magnificent animals that hunt in China's northern forests. In the dense jungles further south, monkeys swing through the canopy and massive elephants walk through the brush. These are just a few of the many different kinds of diverse species that inhabit the country."
    word = user_input.split(" ")
    for i in word:
        tq.text_queue.append(i)
        ws.send_queue_update(i)
    print(list(tq.text_queue))

    while True:
        if not tq.text_queue:
            time.sleep(0.1)
            continue
        
        raw_word = tq.text_queue.popleft()
        clean_word = word_clean.sub('', raw_word.lower())
        
        process_word = f"{clean_word} "
        
        for index, letter in enumerate(process_word):
            cell = tq.letter_counter
            sleep_counter = 0
            while sleep_counter < e.counter:
                if tq.clear_flag:
                    break
                time.sleep(0.01)
                sleep_counter += 0.01
            if tq.clear_flag:
                tq.clear_flag = False   
                break
            m.set_cell(cell, letter)
            tq.letter_counter += 1
            braille_array = m.BRAILLE_MAP.get(letter, ('000', '000'))
            print(letter)
            print(braille_array)
            ws.send_braille_update(letter, braille_array, index)
        
        ws.remove_processed_word()      

def main():
    try:
        threading.Thread(target=hardware_loop, daemon=True).start()
        print(list(tq.text_queue))
        ws.start_server()

    except KeyboardInterrupt:
        print("Exiting...")

if __name__ == "__main__":
    main()