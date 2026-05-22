import time
try:
    import RPi.GPIO as G
    G.setmode(G.BCM)
    G.setwarnings(False)
except ImportError as e:
    print("Import Error!", e)
    G = None

SOLENOIDS = ["sol1", "sol2", "sol3", "sol4", "sol5", "sol6", "sol7", "sol8", "sol9", "sol10", "sol11", "sol12"]
    
SOL_MAP = {
    "sol1": 4,  "sol2": 15, "sol7": 7, "sol8": 5,
    "sol3": 23, "sol4": 24, "sol9": 6, "sol10": 13,
    "sol5": 25, "sol6": 8, "sol11": 16, "sol12": 26
    }

BRAILLE_MAP = {
    'a': [1, 0, 0, 0, 0, 0], 'b': [1, 0, 1, 0, 0, 0], 'c': [1, 1, 0, 0, 0, 0],
    'd': [1, 1, 0, 1, 0, 0], 'e': [1, 0, 0, 1, 0, 0], 'f': [1, 1, 1, 0, 0, 0],
    'g': [1, 1, 1, 1, 0, 0], 'h': [1, 0, 1, 1, 0, 0], 'i': [0, 1, 1, 0, 0, 0],
    'j': [0, 1, 1, 1, 0, 0], 'k': [1, 0, 0, 0, 1, 0], 'l': [1, 0, 1, 0, 1, 0],
    'm': [1, 1, 0, 0, 1, 0], 'n': [1, 1, 0, 1, 1, 0], 'o': [1, 0, 0, 1, 1, 0],
    'p': [1, 1, 1, 0, 1, 0], 'q': [1, 1, 1, 1, 1, 0], 'r': [1, 0, 1, 1, 1, 0],
    's': [0, 1, 1, 0, 1, 0], 't': [0, 1, 1, 1, 1, 0], 'u': [1, 0, 0, 0, 1, 1],
    'v': [1, 0, 1, 0, 1, 1], 'w': [0, 1, 1, 1, 0, 1], 'x': [1, 1, 0, 0, 1, 1],
    'y': [1, 1, 0, 1, 1, 1], 'z': [1, 0, 0, 1, 1, 1], ' ': [0, 0, 0, 0, 0, 0]
    }

PWM_INSTANCES = []

toggle = 0

def sol_setup():
    if not G:
        return None
    
    for i in SOLENOIDS:
        G.setup(SOL_MAP[i], G.OUT)
        pwm = G.PWM(SOL_MAP[i], 1000) 
        pwm.start(0)
        PWM_INSTANCES.append(pwm)
        
    print("finished setup")
    return G


def setup_solenoid(toggle, duty_cycle = 0, duration = 0, step_delay = 0):
    for index in range(toggle, toggle + 6):
        PWM_INSTANCES[index].ChangeDutyCycle(duty_cycle)
        if step_delay > 0:
            time.sleep(step_delay)
            
    time.sleep(duration)

def sol_seq(count = 2):
    switch = 0

    for i in range(count):
        setup_solenoid(switch, duty_cycle = 100, duration = 0.2, step_delay = 0.05)
        
        setup_solenoid(switch, duty_cycle = 40)
        time.sleep(1.7)
        
        setup_solenoid(switch, duration = 0.1)
        time.sleep(1)
    
        switch = 6 - switch


def setup_braille(toggle, letters, duty_cycle = 0, duration = 0, step_delay = 0):
    for index, dots in enumerate(letters):
        if dots == 1:
            PWM_INSTANCES[toggle + index].ChangeDutyCycle(duty_cycle)
            
            if step_delay > 0:
                time.sleep(step_delay)
                
    time.sleep(duration)

def braille_seq(letter, refresh_speed):
    global toggle

    if letter not in BRAILLE_MAP:
        return

    print(letter, BRAILLE_MAP[letter])

    setup_braille(toggle, BRAILLE_MAP[letter], duty_cycle = 100, duration = 0.01, step_delay = 0.02)
    
    setup_braille(toggle, BRAILLE_MAP[letter], duty_cycle = 40, duration = refresh_speed)
    
    setup_solenoid(toggle)
    time.sleep(0.01)
    
    toggle = 6 - toggle