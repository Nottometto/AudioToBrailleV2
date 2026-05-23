import motors as m
import text_queue as tq
import web_server as ws
import audio as a
import encoder as e

import re
import time
import threading

word_clean = re.compile(r'[^a-z\s]')
def hardware_loop():
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
        threading.Thread(target=a.start_audio_streaming, daemon=True).start()
        threading.Thread(target=hardware_loop, daemon=True).start()
        threading.Thread(target=e.speed_control, daemon=True).start()
        threading.Thread(target=tq.user_text_input, daemon=True).start()
        threading.Thread(target=ws.start_server, daemon=True).start()
        
        m.cell_config()
        while True:
            time.sleep(0.5)

    except KeyboardInterrupt:
        print("Exiting...")
        m.clear_all()

if __name__ == "__main__":
    main()