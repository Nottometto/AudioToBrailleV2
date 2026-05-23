import time
import text_queue as tq
import web_server as ws

counter = 2.0

def speed_control():
    global counter

    if not tq.G:
        return
    last_clock_state = tq.G.input(9)
    last_button_state = tq.G.input(14)
    last_encoder_time = 0.0

    try:
        while True:
            current_button_state = tq.G.input(14)
            if current_button_state == tq.G.LOW and last_button_state == tq.G.HIGH:
                
                tq.clear_flag = True
                print("text queue cleared")

                time.sleep(0.001)

            last_button_state = current_button_state
            current_state = tq.G.input(9)

            if current_state != last_clock_state and current_state == tq.G.LOW:
                current_time = time.time()

                if (current_time - last_encoder_time) > 0.1:
                    if tq.G.input(22) != current_state:
                        counter += 0.3

                    else:
                        counter -= 0.3

                    counter = round(counter, 1)

                    if counter > 10.0:
                        counter = 10.0
                    elif counter < 0.1:
                        counter = 0.1

                    print(counter)
                    #webapp
                    ws.send_speed_update(counter)

                    last_encoder_time = current_time
            last_clock_state = current_state
            time.sleep(0.001)

    except RuntimeError:
        pass