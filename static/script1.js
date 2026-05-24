const SOCKET = io();

const STATUS_FLAG = document.getElementById("status-flag");
const MUTE_FLAG = document.getElementById("mute-flag");

const TEXT_DISPLAY = document.getElementById("text-display")
const DOT_DISPLAY = document.getElementById('dot-display')

const CLEAR_BUTTON = document.getElementById('clear-btn')
const REBOOT_BUTTON = document.getElementById('reboot-btn')

const REBOOT_MODAL = document.getElementById('reboot-modal');
const CANCEL_REBOOT_BUTTON = document.getElementById('cancel-reboot-btn');
const CONFIRM_REBOOT_BUTTON = document.getElementById('confirm-reboot-btn');

const TEXT_INPUT = document.getElementById('text-input')
const SUBMIT_BUTTON = document.getElementById('submit-btn')

const SPEED_DISPLAY = document.getElementById("speed-display");
const SPEED_SLIDER = document.getElementById("speed-slider");

let current_index = 0;
let current_queue = "";
let connection_flag = false;
let braille_cells = ["000000", "000000", "000000", "000000"];

window.addEventListener('DOMContentLoaded', () => {
    const savedText = localStorage.getItem('text_display')
    const savedBraille = localStorage.getItem("dot_display")
    const savedSpeed = localStorage.getItem("speed_display")
    const savedIndex = localStorage.getItem("highlight_index");

    if (savedText) {
        renderText(savedText)
    }
    
    if (savedBraille) {
        const parts = savedBraille.split(",");
        for (let i = 0; i < Math.min(parts.length, 4); i++) {
            braille_cells[i] = parts[i];
        }
        DOT_DISPLAY.innerHTML = renderBraille(braille_cells);
    }

    if (savedSpeed) {
        SPEED_SLIDER.value = savedSpeed;
        SPEED_DISPLAY.textContent = savedSpeed;
    }

    if (savedIndex !== null){
        applyHighlight(savedIndex);
    } 
});

//connection
SOCKET.on('connect', () => {
    console.log('Connected to server!');
    STATUS_FLAG.textContent = "Connected"
    if (connection_flag) {
        window.location.reload()
    }
});

SOCKET.on('disconnect', () => {
    console.log('Disconected from server!');
    STATUS_FLAG.textContent = "Disconnected"
    connection_flag = true
});

// From websocket
SOCKET.on('queue_update', (data) => {
    current_queue = data.queue;
    if (current_queue == ""){
        // Only clear the text, leave the braille dots exactly as they were
        TEXT_DISPLAY.innerHTML = 'No text to display currently';
        localStorage.removeItem('text_display');
    }
    else {
        renderText(current_queue);
        localStorage.setItem('text_display', current_queue);
    }
});

SOCKET.on('braille_update', (data) => {
    current_index = data.index;

    let cellString = data.braille[0] + data.braille[1];
    braille_cells[data.cell] = cellString;

    DOT_DISPLAY.innerHTML = renderBraille(braille_cells);
    
    applyHighlight(current_index);

    localStorage.setItem('dot_display', braille_cells.join(","));
    localStorage.setItem('highlight_index', current_index);
});

SOCKET.on('speed_update', (data) => {
    SPEED_SLIDER.value = data.speed
    SPEED_DISPLAY.textContent = data.speed
})

SOCKET.on('mic_update', (data) => {
    MUTE_FLAG.textContent = data.mic;
});

// To websocket
CLEAR_BUTTON.addEventListener("click", ()=>{
    SOCKET.emit('clear_queue');
    clear_display()
})
//confirmation for reboot
REBOOT_BUTTON.addEventListener("click", () => {
    REBOOT_MODAL.classList.remove('hidden');
});
CANCEL_REBOOT_BUTTON.addEventListener("click", () => {
    REBOOT_MODAL.classList.add('hidden');
});


CONFIRM_REBOOT_BUTTON.addEventListener("click", () => {
    REBOOT_MODAL.classList.add('hidden');
    clear_display();
    SOCKET.emit("reboot_device");
});

SUBMIT_BUTTON.addEventListener('click', () => {
    const rawText = TEXT_INPUT.value;

    if (rawText.trim() !== "") {
        SOCKET.emit('add_text', { text: rawText.trim() });
        TEXT_INPUT.value = "";
    }
});

TEXT_INPUT.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault(); 
        SUBMIT_BUTTON.click(); 
    }
});


SPEED_SLIDER.addEventListener("input", function() {
    SPEED_DISPLAY.textContent = this.value; 
});

SPEED_SLIDER.addEventListener("change", function() {
    SOCKET.emit('set_speed', { speed: this.value });
    localStorage.setItem('speed_display', this.value);
});


function clear_display(){
    TEXT_DISPLAY.innerHTML = 'No text to display currently';
    DOT_DISPLAY.innerHTML = renderBraille(["000", "000"]);

    localStorage.removeItem('text_display');
    localStorage.removeItem('dot_display');
}

function renderText(text){
    const letters = text.split("")
    const mapping = letters.map((char, i) => `<span id="char-${i}">${char}</span>`);
    const word = mapping.join("");
    TEXT_DISPLAY.innerHTML = word;
}

function applyHighlight(index){
    const prev = TEXT_DISPLAY.querySelector('.active-char');
    if (prev) {
        prev.classList.remove('active-char');
        prev.style.textDecoration = 'none';
        prev.style.fontWeight = 'normal';
    }

    const span = document.getElementById(`char-${index}`);
    if (span) {
        span.classList.add('active-char');
        span.style.textDecoration = 'underline';
        span.style.textUnderlineOffset = '4px';
        span.style.fontWeight = 'bold';
    }
}

// FIXED RENDER BRAILLE FUNCTION
function renderBraille(brailleData) {
    let cells = ["000000", "000000", "000000", "000000"];

    if (Array.isArray(brailleData)) {
        for (let i = 0; i < Math.min(brailleData.length, 4); i++) {
            cells[i] = String(brailleData[i]);
        }
    } else if (typeof brailleData === "string" && brailleData.includes(",")) {
        const parts = brailleData.split(",");
        for (let i = 0; i < Math.min(parts.length, 4); i++) {
            cells[i] = parts[i];
        }
    }

    let html = '';
    
    for (let c = 0; c < 4; c++) {
        let cellData = cells[c] || "000000";
        // Ensure it's 6 chars long
        cellData = cellData.padEnd(6, '0');
        
        let left = cellData.substring(0, 3);
        let right = cellData.substring(3, 6);

        html += '<div class="braille-container">';
        
        html += '<div class="braille-col">';
        for (let i = 0; i < 3; i++) {
            html += `<div class="braille-dot ${left[i] === '1' ? 'active' : ''}"></div>`;
        }
        html += '</div>';

        html += '<div class="braille-col">';
        for (let i = 0; i < 3; i++) {
            html += `<div class="braille-dot ${right[i] === '1' ? 'active' : ''}"></div>`;
        }
        html += '</div>';

        html += '</div>';
    }
    
    return html;
}

document.addEventListener("DOMContentLoaded", () => {
    const wrapper = document.getElementById('morphing-control-wrapper');
    const presetsContainer = document.getElementById('presets');
    const track = document.getElementById('track');
    const hiddenSpeedInput = document.getElementById('speed-slider');
    const dialValueDisplay = document.getElementById('dial-value-display');

    // Dial Config
    const tickSpacing = 18; 
    const totalTicks = 100; // 0.0 to 10.0 (100 ticks, each is 0.1)
    const minSpeed = 0.1;
    const maxSpeed = 10.0;
    // Track moves left (negative), mapped directly to tick counts
    const minTranslate = -(minSpeed * 10 * tickSpacing); // -18 (0.1)
    const maxTranslateLeft = -(maxSpeed * 10 * tickSpacing); // -1800 (10.0)

    // State Management
    let mode = 'presets'; // 'presets' or 'dial'
    let isPointerDown = false;
    let startX = 0;
    let currentTranslate = 0;
    let prevTranslate = 0;
    let collapseTimeout = null;
    let currentSpeedVal = 2.0;

    // Initialize Wheel Ticks
    for (let i = 0; i <= totalTicks; i++) {
        const tick = document.createElement('div');
        tick.classList.add('tick', i % 10 === 0 ? 'major' : 'minor');
        tick.style.left = `${i * tickSpacing}px`;
        track.appendChild(tick);
    }

    function formatSpeed(val) {
        const formatted = parseFloat(val).toFixed(1);
        return formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted;
    }

// Render preset buttons dynamically (Hijacking the closest preset)
    function renderPresets(speed) {
        const basePresets = [0.1, 1.0, 2.0, 5.0, 10.0];
        const currentSpeed = parseFloat(speed);

        // Find the closest base preset
        let closestPreset = basePresets[0];
        let minDiff = Math.abs(currentSpeed - closestPreset);

        for (let i = 1; i < basePresets.length; i++) {
            let diff = Math.abs(currentSpeed - basePresets[i]);
            if (diff < minDiff) {
                minDiff = diff;
                closestPreset = basePresets[i];
            }
        }

        presetsContainer.innerHTML = '';

        basePresets.forEach(presetVal => {
            const btn = document.createElement('button');
            btn.className = 'speed-btn';

            let displaySpeed;
            
            // If this is the closest base preset, hijack it to show the current speed
            if (presetVal === closestPreset) {
                btn.classList.add('active');
                displaySpeed = currentSpeed;
            } else {
                // Otherwise, show its normal preset value
                displaySpeed = presetVal;
            }
            
            const displayStr = displaySpeed.toFixed(1);
            btn.setAttribute('data-speed', displayStr);

            // Keep the clean, short string formatting you originally had
            if (displayStr === '0.1') btn.textContent = '.1';
            else if (displayStr === '1.0') btn.textContent = '1';
            else if (displayStr === '2.0') btn.textContent = '2';
            else if (displayStr === '5.0') btn.textContent = '5';
            else if (displayStr === '10.0') btn.textContent = '10';
            else btn.textContent = formatSpeed(displaySpeed);

            presetsContainer.appendChild(btn);
        });
    }

    function setSpeed(val) {
        currentSpeedVal = parseFloat(val);
        const formatted = formatSpeed(val);
        dialValueDisplay.textContent = formatted + 'x';
        renderPresets(currentSpeedVal);
        
        hiddenSpeedInput.value = val;
        const event = new Event('change');
        hiddenSpeedInput.dispatchEvent(event);
    }

    function updateDialSpeed(x) {
        // x maps directly to ticks (x = -ticks * tickSpacing)
        let ticks = Math.abs(x) / tickSpacing;
        let speed = ticks * 0.1;
        speed = Math.max(minSpeed, Math.min(maxSpeed, speed));
        currentSpeedVal = speed;
        
        const formatted = formatSpeed(speed);
        dialValueDisplay.textContent = formatted + 'x';
        
        hiddenSpeedInput.value = speed.toFixed(1);
        const event = new Event('change');
        hiddenSpeedInput.dispatchEvent(event);
    }

    // Initialize to default value or saved value
    let initialSpeed = parseFloat(hiddenSpeedInput.value) || 2.0;
    const savedSpeedDial = localStorage.getItem('speed_display');
    if (savedSpeedDial !== null) {
        initialSpeed = parseFloat(savedSpeedDial);
    }
    setSpeed(initialSpeed);

    // Calculate initial translate based on linear tick mapping
    const initialTicks = initialSpeed * 10;
    currentTranslate = -(initialTicks * tickSpacing);
    prevTranslate = currentTranslate;
    track.style.transform = `translateX(${currentTranslate}px)`;

    // Drag / Click Logic
    wrapper.addEventListener('pointerdown', (e) => {
        isPointerDown = true;
        startX = e.clientX;
        clearTimeout(collapseTimeout);
        wrapper.setPointerCapture(e.pointerId);
    });

    wrapper.addEventListener('pointermove', (e) => {
        if (!isPointerDown) return;
        
        const deltaX = e.clientX - startX;

        if (mode === 'presets' && Math.abs(deltaX) > 10) {
            mode = 'dial';
            wrapper.classList.add('is-dial-mode');
            track.style.transition = 'none';
        }

        if (mode === 'dial') {
            let x = prevTranslate + deltaX;
            // constraints
            if (x > minTranslate) x = minTranslate;
            if (x < maxTranslateLeft) x = maxTranslateLeft;
            
            currentTranslate = x;
            track.style.transform = `translateX(${currentTranslate}px)`;
            updateDialSpeed(currentTranslate);
        }
    });

    wrapper.addEventListener('pointerup', (e) => {
        if (!isPointerDown) return;
        isPointerDown = false;
        const deltaX = e.clientX - startX;
        
        wrapper.releasePointerCapture(e.pointerId);

        // Handle Tap on buttons
        if (mode === 'presets' && Math.abs(deltaX) <= 10) {
            const target = document.elementFromPoint(e.clientX, e.clientY);
            const btn = target ? target.closest('.speed-btn') : null;
            if (btn) {
                const speedVal = parseFloat(btn.getAttribute('data-speed'));
                setSpeed(speedVal);
                
                const ticks = speedVal * 10;
                currentTranslate = -(ticks * tickSpacing);
                prevTranslate = currentTranslate;
                track.style.transform = `translateX(${currentTranslate}px)`;
            }
            return;
        }

        if (mode === 'dial') {
            // Snap to nearest tick
            currentTranslate = Math.round(currentTranslate / tickSpacing) * tickSpacing;
            currentTranslate = Math.max(maxTranslateLeft, Math.min(minTranslate, currentTranslate));
            prevTranslate = currentTranslate;
            
            track.style.transition = 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)';
            track.style.transform = `translateX(${currentTranslate}px)`;
            updateDialSpeed(currentTranslate);
            renderPresets(currentSpeedVal);

            collapseTimeout = setTimeout(() => {
                mode = 'presets';
                wrapper.classList.remove('is-dial-mode');
            }, 1500);
        }
    });
});