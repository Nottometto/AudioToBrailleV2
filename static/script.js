// --- TAB SWITCHING LOGIC ---
function switchTab(tabName) {
    document.getElementById('nav-remote').classList.remove('active');
    document.getElementById('nav-log').classList.remove('active');
    document.getElementById(`nav-${tabName}`).classList.add('active');

    document.getElementById('view-remote').classList.add('hidden');
    document.getElementById('view-log').classList.add('hidden');
    document.getElementById(`view-${tabName}`).classList.remove('hidden');

    if(tabName === 'log') {
        const term = document.getElementById('terminal');
        term.scrollTop = term.scrollHeight;
    }
}

// --- CORE VARIABLES ---
const socket = io();
let currentLetterIndex = 0;
const terminal = document.getElementById('terminal');
const liveDisplay = document.getElementById('live-text-display');

// --- HELPER: LOG TO TERMINAL ---
function logToTerminal(htmlContent) {
    const div = document.createElement('div');
    div.className = 'log-entry';
    div.innerHTML = htmlContent;
    terminal.appendChild(div);
    terminal.scrollTop = terminal.scrollHeight;
}

// Helper to format logs cleanly
function formatLog(label, message) {
    return `<span style="color: var(--text-secondary);">${label}</span> <span style="color: var(--accent-white);">${message}</span>`;
}

// --- SOCKET CONNECTION & STATUS ---
function updateStatus(text, isConnected) {
    document.querySelectorAll('.status-text').forEach(el => {
        el.innerText = text;
        if (isConnected) el.classList.add("connected");
        else el.classList.remove("connected");
    });
}

socket.on('connect', () => {
    updateStatus("Connected", true);
    logToTerminal(formatLog("System:", "Connected to server"));
});
socket.on('word_log', (data) => {
    // Log the full word cleanly before the individual letters output
    logToTerminal(formatLog("Word:", data.word));
});
socket.on('disconnect', () => {
    updateStatus("Disconnected", false);
    logToTerminal(formatLog("System:", "Connection lost"));
});
socket.on('active_word', (data) => {
    // If the queue is empty, restore the waiting placeholder
    if (data.word === "_done_") {
        liveDisplay.innerHTML = '<span style="color: var(--text-secondary); font-size: 14px;">Waiting for mic input...</span>';
        return;
    }

    // Remove active state from previous words and safely destroy old spans
    document.querySelectorAll('.word-item.active').forEach(el => {
        el.classList.remove('active');
        el.innerHTML = el.textContent; 
    });

    const spans = Array.from(document.querySelectorAll('.word-item'));
    let foundIndex = -1;

    // Find the current word in the UI
    for (let i = 0; i < spans.length; i++) {
        let spanText = spans[i].textContent.replace(/[^a-zA-Z]/g, '').toLowerCase();
        if (spanText === data.word && !spans[i].dataset.processed) {
            foundIndex = i;
            break;
        }
    }

    if (foundIndex !== -1) {
        // Delete all words that came BEFORE this one to keep the screen clean
        for (let i = 0; i < foundIndex; i++) {
            spans[i].remove();
        }
        
        // Highlight the new current word
        const activeSpan = spans[foundIndex];
        activeSpan.classList.add('active');
        activeSpan.dataset.processed = "true"; 

        // Split the word into individual letter elements
        const rawText = activeSpan.textContent;
        activeSpan.innerHTML = rawText.split('').map(c => `<span class="char-item">${c}</span>`).join('');
        currentLetterIndex = 0; 
    }
});

socket.on('braille_log', (data) => {
    // Log physical hardware output cleanly
    const displayLetter = data.letter === ' ' ? 'Space' : data.letter;
    logToTerminal(formatLog("Output:", `${displayLetter} [${data.array.join(", ")}]`));

    const activeWord = document.querySelector('.word-item.active');
    if (!activeWord) return; // Failsafe

    const chars = activeWord.querySelectorAll('.char-item');
    
    // 1. Absolute wipe of all underlines in this word
    chars.forEach(c => c.style.textDecoration = 'none');

    // 2. Safe Fast-Forward Search
    let tempIndex = currentLetterIndex;
    let foundMatch = false;

    while (tempIndex < chars.length) {
        let charUI = chars[tempIndex].textContent.toLowerCase();
        if (charUI === data.letter) {
            foundMatch = true;
            break;
        }
        tempIndex++;
    }

    // 3. Only apply underline if we actually found the letter
    if (foundMatch) {
        currentLetterIndex = tempIndex;
        chars[currentLetterIndex].style.textDecoration = 'underline';
        chars[currentLetterIndex].style.textUnderlineOffset = '3px';
        
        // Advance by 1 so the next letter starts searching from the NEXT position
        currentLetterIndex++; 
    }
});
// --- WEBSOCKET EVENT LISTENERS ---
socket.on('speed_update', (data) => {
    // Only update via hardware if the user isn't currently dragging the web dial
    if (!isDragging) {
        let newSpeed = parseFloat(data.speed);
        if (!isNaN(newSpeed)) {
            currentSpeed = newSpeed;
            renderWheel(); // Redraws the arc slider
        }
    }
});
socket.on('queue_update', (data) => {
    // ONLY log raw queue array to Terminal Tab cleanly
    logToTerminal(formatLog("Queue:", `[${data.queue.join(", ")}]`));
});

socket.on('new_transcript', (data) => {
    // Append incoming words directly to the live transcription box
    if (liveDisplay.innerHTML.includes("Waiting for mic input")) {
        liveDisplay.innerHTML = '';
    }
    const span = document.createElement('span');
    span.className = 'word-item';
    span.innerText = data.word + ' '; // Add a space so words don't stick together
    liveDisplay.appendChild(span);
});

socket.on('system_log', (data) => {
    // Log system events (like Mute/Unmute) to the terminal
    logToTerminal(formatLog("System:", data.message));

    if (data.message === "Microphone Muted") {
        document.querySelectorAll('.mic-status').forEach(el => {
            el.innerText = "Mic: Muted";
            el.classList.add("muted");
        });
    } else if (data.message === "Microphone Unmuted") {
        document.querySelectorAll('.mic-status').forEach(el => {
            el.innerText = "Mic: Unmuted";
            el.classList.remove("muted");
        });
    }
});

socket.on('current_display', (data) => {
    // Clear the placeholder text if it's there
    if (liveDisplay.innerHTML.includes("Waiting for mic input")) {
        liveDisplay.innerHTML = '';
    }

    // Split the stored text string into individual words
    const words = data.text.split(' ');
    
    // Wrap each word in a span so it matches the live transcription styling
    words.forEach(word => {
        if (word.trim() !== "") {
            const span = document.createElement('span');
            span.className = 'word-item';
            span.innerText = word + ' ';
            liveDisplay.appendChild(span);
        }
    });
});
// --- UI ACTIONS ---
function sendText() {
    const input = document.getElementById("textInput");
    const text = input.value.trim();
    
    if (text) {
        // Send to backend
        socket.emit('add_text', {text: text});
        
        // --- Update Live Display ---
        // 1. Clear the "Waiting for mic input..." placeholder if it's there
        if (liveDisplay.innerHTML.includes("Waiting for mic input")) {
            liveDisplay.innerHTML = '';
        }

        // 2. Split the typed text into words and append them as word-items
        text.split(' ').forEach(word => {
            if (word.trim() !== "") {
                const span = document.createElement('span');
                span.className = 'word-item';
                span.innerText = word + ' ';
                liveDisplay.appendChild(span);
            }
        });
        
        // 3. Clear the input field
        input.value = "";
    }
}

function sendCommand(cmd) { 
    if (cmd === '_clear_') {
        socket.emit('clear_queue');
        logToTerminal(formatLog("Command:", "Queue Cleared"));
        
        // Instantly clear the Live Transcription box
        liveDisplay.innerHTML = '<span style="color: var(--text-secondary); font-size: 14px;">Waiting for mic input...</span>';
        
    } else if (cmd === '_seq_') {
        socket.emit('run_sequence');
        logToTerminal(formatLog("Command:", "Running Sequence"));
        
    } else if (cmd === '_reboot_') {
        document.getElementById('reboot-modal').classList.remove('hidden');
    }
}

// --- MODAL FUNCTIONS ---
function confirmReboot() {
    document.getElementById('reboot-modal').classList.add('hidden');
    socket.emit('reboot_device');
    logToTerminal(formatLog("Command:", "Rebooting Device"));
}

function cancelReboot() {
    document.getElementById('reboot-modal').classList.add('hidden');
}

// Allow pressing Enter to send text
document.getElementById("textInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendText();
});

// --- ARC SLIDER LOGIC ---
const arcContainer = document.getElementById("arcContainer");
const ticksGroup = document.getElementById("ticks");
const speedDisplay = document.getElementById("speedValue");
let currentSpeed = 2.0;
let isDragging = false, startY = 0, startSpeed = 0;

function renderWheel() {
    ticksGroup.innerHTML = "";
    const cx = 130, cy = 150, rOuter = 120;
    for (let s = 0.2; s <= 10; s += 0.2) {
        const cleanS = Math.round(s * 10) / 10;
        const angle = Math.PI + (cleanS - currentSpeed) * -0.25;
        const dist = Math.abs(angle - Math.PI);
        if (dist < 1.2) {
            const isMajor = cleanS % 1 === 0;
            const rInner = isMajor ? 104 : 112;
            ticksGroup.innerHTML += `<line x1="${cx + rOuter * Math.cos(angle)}" y1="${cy + rOuter * Math.sin(angle)}" x2="${cx + rInner * Math.cos(angle)}" y2="${cy + rInner * Math.sin(angle)}" stroke="rgba(255,255,255,${1 - dist/1.2})" stroke-width="${isMajor ? 3 : 2}" stroke-linecap="round" />`;
        }
    }
    speedDisplay.textContent = currentSpeed.toFixed(1);
}

arcContainer.addEventListener("pointerdown", e => {
    isDragging = true;
    startY = e.clientY;
    startSpeed = currentSpeed;
    arcContainer.setPointerCapture(e.pointerId);
});

window.addEventListener("pointermove", e => {
    if (!isDragging) return;
    let newSpeed = startSpeed + (e.clientY - startY) * 0.015;
    currentSpeed = Math.round(Math.max(0.1, Math.min(10, newSpeed)) * 10) / 10;
    renderWheel();
});

window.addEventListener("pointerup", () => {
    if (isDragging) {
        isDragging = false;
        socket.emit('set_speed', {speed: currentSpeed.toFixed(1)});
        
        logToTerminal(formatLog("Speed:", `${currentSpeed.toFixed(1)}s`));
    }
});

renderWheel();