import time
import text_queue as tq
import web_server as ws

def hardware_control():
    if not tq.G:
        return

    #defining lookups
    read_pin = tq.G.input
    LOW = tq.G.LOW
    HIGH = tq.G.HIGH

    PIN_CLOCK = 7
    PIN_BUTTON = 14
    PIN_DATA = 8
    PIN_ENCODER_BUTTON = 25
    PIN_SWITCH = 27

    last_clock_state = read_pin(PIN_CLOCK)
    last_button_state = read_pin(PIN_BUTTON)
    last_encoder_button_state = read_pin(PIN_ENCODER_BUTTON)
    
    last_encoder_time = 0.0
    last_button_time = 0.0
    last_encoder_button_time = 0.0
    last_rotation_time = 0.0
    try:
        while True:
            current_time = time.time()
            current_button_state = read_pin(PIN_BUTTON)
            current_clock_state = read_pin(PIN_CLOCK)
            current_encoder_button_state = read_pin(PIN_ENCODER_BUTTON)
            current_switch_state = (read_pin(PIN_SWITCH) == LOW)

            #button
            if current_button_state == LOW and last_button_state == HIGH:
                if (current_time - last_button_time) > 0.2: 
                    ws.handle_clear()
                    print("text queue cleared")
                    last_button_time = current_time
            
            last_button_state = current_button_state

            #encoder
            if not tq.pause_flag:
                if current_clock_state != last_clock_state and current_clock_state == LOW:
                    if (current_time - last_encoder_time) > 0.1:
                        if read_pin(PIN_DATA) != current_clock_state:
                            tq.speed_counter += 0.2
                        else:
                            tq.speed_counter -= 0.2

                        tq.speed_counter = max(0.1, min(round(tq.speed_counter, 1), 10.0))

                        # Webapp update
                        print(tq.speed_counter)
                        ws.send_speed_update(tq.speed_counter)

                        last_encoder_time = current_time
                        last_rotation_time = current_time
                last_clock_state = current_clock_state

            #encoder button
            if (current_time - last_rotation_time) > 0.5:
                if current_encoder_button_state == LOW and last_encoder_button_state == HIGH:
                    if (current_time - last_encoder_button_time) > 0.2:
                        if not tq.pause_flag:
                            tq.pause_flag = True
                            tq.speed_holder = tq.speed_counter
                            tq.speed_counter = tq.pause
                            print("Pause enabled", tq.speed_counter)
                            ws.send_pause_update(tq.pause_flag)
                            
                        else:
                            tq.pause_flag = False
                            tq.speed_counter = tq.speed_holder
                            tq.speed_holder = 0
                            print("Pause disabled", tq.speed_counter)
                            ws.send_pause_update(tq.pause_flag)
                            

                        last_encoder_button_time = current_time

            last_encoder_button_state = current_encoder_button_state

            #mute switch
            if current_switch_state != tq.mute_flag:
                tq.mute_flag = current_switch_state
                if tq.mute_flag:
                    print("Microphone Muted")
                else:
                    print("Microphone Unmuted")
                ws.send_mic_update(tq.mute_flag)
            
            time.sleep(0.001)
    except RuntimeError:
        pass