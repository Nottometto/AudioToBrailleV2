import time
hardware_detect = False
try:
    from adafruit_servokit import ServoKit
    kit = ServoKit(channels=16)

    for i in range(8):
        kit.servo[i].set_pulse_width_range(500, 2400)
    print("Hardware detected using motors")
    
    hardware_detect = True
except NotImplementedError as e:
    print("Hardware not detected, playing simulation")

CHANNEL_OFFSETS = {
    0: 6,
    1: -10,
    2: 0,
    3: -20,
    4: -6,
    5: -10,
    6: -8,
    7: -32
}

ANGLES_ARRAY = ['000', '001', '010','011','100','101','110','111']

ANGLES = {
    '000': 10, '001': 180, '010': 160, '011': 120,
    '100': 45, '101': 140, '110': 65, '111': 85
}

BRAILLE_MAP = {
    'a': ('100', '000'), 'b': ('110', '000'), 'c': ('100', '100'),
    'd': ('100', '110'), 'e': ('100', '010'), 'f': ('110', '100'),
    'g': ('110', '110'), 'h': ('110', '010'), 'i': ('010', '100'),
    'j': ('010', '110'), 'k': ('101', '000'), 'l': ('111', '000'),
    'm': ('101', '100'), 'n': ('101', '110'), 'o': ('101', '010'),
    'p': ('111', '100'), 'q': ('111', '110'), 'r': ('111', '010'),
    's': ('011', '100'), 't': ('011', '110'), 'u': ('101', '001'),
    'v': ('111', '001'), 'w': ('010', '111'), 'x': ('101', '101'),
    'y': ('101', '111'), 'z': ('101', '011'), ' ': ('000', '000')
}

def max_angles(angle):
    return max(0, min(180, angle))

def set_cell(cell, raw_letter):
    cell %= 4
    letter = raw_letter.lower().strip()
    left_bin, right_bin = BRAILLE_MAP.get(letter, ('000', '000'))

    left_base_angle = ANGLES[left_bin]
    right_base_angle = ANGLES[right_bin]

    left_channel = cell * 2
    right_channel = (cell * 2) + 1

    final_left_angle = max_angles(left_base_angle + CHANNEL_OFFSETS[left_channel])
    final_right_angle = max_angles(right_base_angle + CHANNEL_OFFSETS[right_channel])

    dot_string = ",".join(left_bin + right_bin)
    print(f"{left_channel} Left:", final_left_angle)
    print(f"{right_channel} Right:", final_right_angle)

    if hardware_detect:
        kit.servo[left_channel].angle = final_left_angle
        kit.servo[right_channel].angle = final_right_angle

def cell_config():
    for j in range(4):
        left_channel = j * 2
        right_channel = (j * 2) + 1
    
        for state in ANGLES_ARRAY:
            base_angle = ANGLES[state]
            final_left_angle = max_angles(base_angle + CHANNEL_OFFSETS[left_channel])
            final_right_angle = max_angles(base_angle + CHANNEL_OFFSETS[right_channel])

            if hardware_detect:
                kit.servo[left_channel].angle = final_left_angle
                time.sleep(0.05)
                kit.servo[right_channel].angle = final_right_angle
            time.sleep(0.01)

def clear_all():
    if hardware_detect:
        for j in range(4):
            left_channel = j * 2
            right_channel = (j * 2) + 1

            kit.servo[left_channel].angle = 0
            time.sleep(0.05)
            kit.servo[right_channel].angle = 0
        time.sleep(0.1)