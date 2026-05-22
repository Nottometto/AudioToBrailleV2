import time
hardware_detect = False
try:
    from adafruit_servokit import ServoKit
    kit = ServoKit(channels=16)

    for i in range(8):
        kit.servo[i].set_pulse_width_range(500, 2400)
    
    hardware = True
except NotImplementedError as e:
    print("Hardware not detected, playing simulation")

CHANNEL_OFFSETS = {
    0: 0,
    1: -10,
    2: 0,
    3: -10,
    4: 0,
    5: -10,
    6: 0,
    7: -10
}

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