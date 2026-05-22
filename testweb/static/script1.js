const SOCKET = io();

const STATUS_FLAG = document.getElementById("status-flag");
const MUTE_FLAG = document.getElementById("mute-flag");

const TEXT_DISPLAY = document.getElementById("text-display")
const LETTER_DISPLAY = document.getElementById('letter-display')
const DOT_DISPLAY = document.getElementById('dot-display')

const CLEAR_BUTTON = document.getElementById('clear-btn')
const REBOOT_BUTTON = document.getElementById('reboot-btn')

const TEXT_INPUT = document.getElementById('text-input')
const SUBMIT_BUTTON = document.getElementById('submit-btn')

const SPEED_DISPLAY = document.getElementById("speed-display");
const SPEED_SLIDER = document.getElementById("speed-slider");

let current_index = 0;
let current_letter = "";
let current_queue = "";
let connection_flag = false

window.addEventListener('DOMContentLoaded', () => {
    const savedText = localStorage.getItem('text_display')
    const savedLetter = localStorage.getItem("letter_display")
    const savedBraille = localStorage.getItem("dot_display")
    const savedSpeed = localStorage.getItem("speed_display")
    const savedIndex = localStorage.getItem("highlight_index");

    if (savedText) {
        renderText(savedText)
    }
    
    if (savedLetter) {
        LETTER_DISPLAY.textContent = savedLetter;
    }

    if (savedBraille) {
        DOT_DISPLAY.textContent = savedBraille;
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
    current_queue = data.queue
    if (current_queue == ""){
        clear_display()
    }
    else {
        renderText(current_queue)
    }
    localStorage.setItem('text_display', TEXT_DISPLAY.textContent)
});

SOCKET.on('braille_update', (data) => {
    current_letter = data.letter
    current_index = data.index

    LETTER_DISPLAY.textContent = data.letter;
    DOT_DISPLAY.textContent = data.braille;
    
    applyHighlight(current_index);

    localStorage.setItem('letter_display', LETTER_DISPLAY.textContent)
    localStorage.setItem('dot_display', DOT_DISPLAY.textContent)
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

REBOOT_BUTTON.addEventListener("click", ()=>{
    SOCKET.emit("reboot_device")
})

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

//function
function switchTab(tabName) {

    const remotePage = document.getElementById('page-remote');
    const logPage = document.getElementById('page-log');
    
    const navRemote = document.getElementById('nav-remote');
    const navLog = document.getElementById('nav-log');

    remotePage.style.display = 'none';
    logPage.style.display = 'none';

    navRemote.classList.remove('active');
    navLog.classList.remove('active');

    if (tabName === 'remote') {
        remotePage.style.display = 'flex';
        navRemote.classList.add('active');
    } else if (tabName === 'log') {
        logPage.style.display = 'flex';
        navLog.classList.add('active');
    }
}

function clear_display(){
    TEXT_DISPLAY.textContent = "No text to display currently";
    LETTER_DISPLAY.textContent = "-";
    DOT_DISPLAY.textContent = "[0,0,0,0,0,0]";

    localStorage.removeItem('text_display');
    localStorage.removeItem('letter_display');
    localStorage.removeItem('dot_display');
}

function renderText(text){
    const letters = text.split("")
    const mapping = letters.map((char, i) => `<span id="char-${i}">${char}</span>`);
    const word = mapping.join("");
    TEXT_DISPLAY.innerHTML = word
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

document.addEventListener("DOMContentLoaded", () => {
    const dialContainer = document.getElementById('dial-container');
    const dialFill = document.getElementById('dial-fill');
    const dialKnob = document.getElementById('dial-knob');
    const dialTextValue = document.getElementById('dial-text-value');
    const speedDisplay = document.getElementById('speed-display');
    const hiddenSpeedInput = document.getElementById('speed-slider');
    const dialTicks = document.getElementById('dial-ticks');

    // Configuration
    const minVal = 0.1;
    const maxVal = 10.0;
    const radius = 80;
    const centerX = 100;
    const centerY = 100;
    const arcLength = Math.PI * radius; // Approx 251.2

    // Generate ticks from 0 to 10
    function createTicks() {
        for (let i = 0; i <= 10; i++) {
            // Angle from -180 deg (left) to 0 deg (right)
            const angleDeg = -180 + (i * 18); 
            const angleRad = angleDeg * (Math.PI / 180);
            
            // Major ticks for 0, 2, 4, 6, 8, 10
            const isMajor = i % 2 === 0;
            const tickLength = isMajor ? 10 : 5;
            
            const x1 = centerX + (radius - 15) * Math.cos(angleRad);
            const y1 = centerY + (radius - 15) * Math.sin(angleRad);
            const x2 = centerX + (radius - 15 + tickLength) * Math.cos(angleRad);
            const y2 = centerY + (radius - 15 + tickLength) * Math.sin(angleRad);

            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", x1);
            line.setAttribute("y1", y1);
            line.setAttribute("x2", x2);
            line.setAttribute("y2", y2);
            line.setAttribute("class", isMajor ? "dial-tick major" : "dial-tick");
            dialTicks.appendChild(line);
        }
    }

    createTicks();

    // Update Visuals
    function updateDialVisuals(value) {
        // Clamp value
        value = Math.max(minVal, Math.min(maxVal, value));
        
        // Calculate percentage (0 to 1)
        const percentage = value / maxVal;
        
        // Update SVG Stroke
        const dashOffset = arcLength - (percentage * arcLength);
        dialFill.style.strokeDashoffset = dashOffset;
        
        // Update Knob Rotation (0 to 180 degrees)
        const rotation = percentage * 180;
        dialKnob.style.transform = `rotate(${rotation}deg)`;
        
        // Update Texts
        const formattedVal = value.toFixed(1);
        dialTextValue.textContent = `${formattedVal}x`;
        speedDisplay.textContent = formattedVal;
        hiddenSpeedInput.value = formattedVal;
        
        // Optional: Dispatch change event for your existing socket.io code
        const event = new Event('change');
        hiddenSpeedInput.dispatchEvent(event);
    }

    // Drag Interaction Logic
    let isDragging = false;

    function calculateValueFromEvent(e) {
        const rect = dialContainer.getBoundingClientRect();
        
        // Determine touch or mouse position
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        // Calculate coordinates relative to SVG center
        // Note: SVG viewBox is 200x120, we need to map actual pixels to viewBox scale
        const scaleX = 200 / rect.width;
        const scaleY = 120 / rect.height;
        
        const x = (clientX - rect.left) * scaleX - centerX;
        const y = (clientY - rect.top) * scaleY - centerY;

        // Calculate angle
        let angle = Math.atan2(y, x) * (180 / Math.PI);

        // Clamp angle to the top semi-circle (-180 to 0)
        if (angle > 0) {
            angle = x > 0 ? 0 : -180; 
        }

        // Map angle (-180...0) to percentage (0...1)
        const percentage = (angle + 180) / 180;
        
        // Map percentage to our min/max values
        const value = percentage * maxVal;
        
        // Snap to nearest 0.1
        return Math.round(value * 10) / 10;
    }

    function onDragStart(e) {
        isDragging = true;
        updateDialVisuals(calculateValueFromEvent(e));
        e.preventDefault(); // Prevent text selection/scrolling
    }

    function onDragMove(e) {
        if (!isDragging) return;
        updateDialVisuals(calculateValueFromEvent(e));
    }

    function onDragEnd() {
        isDragging = false;
    }

    // Event Listeners
    dialContainer.addEventListener('mousedown', onDragStart);
    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragEnd);

    dialContainer.addEventListener('touchstart', onDragStart, { passive: false });
    document.addEventListener('touchmove', onDragMove, { passive: false });
    document.addEventListener('touchend', onDragEnd);

    // Initialize to default value (2.0)
    updateDialVisuals(parseFloat(hiddenSpeedInput.value));
});