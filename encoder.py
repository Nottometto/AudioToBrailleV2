import time
import text_queue as tq
import web_server as ws
try:
    import RPi.GPIO as G
    G.setmode(G.BCM)
    G.setwarnings(False)
    G.setup(9, G.IN, pull_up_down=G.PUD_UP)
    G.setup(22, G.IN, pull_up_down=G.PUD_UP)
    G.setup(14, G.IN, pull_up_down=G.PUD_UP)

except ImportError as e:
    print("Import Error!", e)
    G = None

counter = 2.0

def speed_control():
    global counter

    if not G:
        return
    last_clock_state = G.input(9)
    last_button_state = G.input(14)
    last_encoder_time = 0.0

    try:
        while True:
            current_button_state = G.input(14)
            if current_button_state == G.LOW and last_button_state == G.HIGH:
                
                tq.clear_flag = True
                print("text queue cleared")

                time.sleep(0.001)

            last_button_state = current_button_state
            current_state = G.input(9)

            if current_state != last_clock_state and current_state == G.LOW:
                current_time = time.time()

                if (current_time - last_encoder_time) > 0.1:
                    if G.input(22) != current_state:
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