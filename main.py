import motors as m
import text_queue as tq
import web_server as ws
import audio as a
import encoder as e

import time
import threading

def hardware_loop():
    while True:
        try:
            process_word = tq.clean_word()
            if not process_word:
                continue
            
            for index, letter in enumerate(process_word):
                cell = tq.channel
                sleep_counter = 0

                while sleep_counter < tq.speed_counter:
                    if tq.clear_flag:
                        break

                    time.sleep(0.01)
                    sleep_counter += 0.01

                if tq.clear_flag:
                    tq.clear_flag = False   
                    break

                m.set_cell(cell, letter)
                tq.channel += 1
                
                braille_array = m.BRAILLE_MAP.get(letter, ('000', '000'))
                ws.send_braille_update(letter, braille_array, index, cell % 4)

                print(letter)
                print(braille_array)
            
            ws.remove_processed_word()

        except Exception as e:
            print(f"Hardware loop error: {e}")
            time.sleep(0.1)
                

def main():
    try:
        m.cell_config()
        threading.Thread(target=a.start_audio_streaming, daemon=True).start()
        threading.Thread(target=hardware_loop, daemon=True).start()
        threading.Thread(target=e.hardware_control, daemon=True).start()
        threading.Thread(target=tq.user_text_input, daemon=True).start()
        threading.Thread(target=ws.start_server, daemon=True).start()
        
        while True:
            time.sleep(0.5)

    except KeyboardInterrupt:
        print("Exiting...")
        m.clear_all()
        tq.G.cleanup()

if __name__ == "__main__":
    main()