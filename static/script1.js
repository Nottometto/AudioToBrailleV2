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

let current_queue = ""
let current_word = ""
let current_letter = ""
let connection_flag = false

window.addEventListener('DOMContentLoaded', () => {
    const savedText = localStorage.getItem('text_display')
    const savedLetter = localStorage.getItem("letter_display")
    const savedBraille = localStorage.getItem("dot_display")
    const savedSpeed = localStorage.getItem("speed_display")

    if (savedText) {
        TEXT_DISPLAY.textContent = savedText;
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
        TEXT_DISPLAY.textContent = "No text to display currently"
        LETTER_DISPLAY.textContent = "-"
        DOT_DISPLAY.textContent = "[0,0,0,0,0,0]"
    }
    else {
        TEXT_DISPLAY.textContent = current_queue;
    }
    localStorage.setItem('text_display', TEXT_DISPLAY.textContent)
});

SOCKET.on('braille_update', (data) => {
    current_word = data.word
    current_letter = data.letter

    LETTER_DISPLAY.textContent = data.letter;
    DOT_DISPLAY.textContent = data.braille;
    localStorage.setItem('letter_display', LETTER_DISPLAY.textContent)
    localStorage.setItem('dot_display', DOT_DISPLAY.textContent)
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
        SOCKET.emit('add_text', { text: rawText });
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
    // 1. Get the page containers
    const remotePage = document.getElementById('page-remote');
    const logPage = document.getElementById('page-log');
    
    // 2. Get the navigation buttons
    const navRemote = document.getElementById('nav-remote');
    const navLog = document.getElementById('nav-log');

    // 3. Hide both pages
    remotePage.style.display = 'none';
    logPage.style.display = 'none';

    // 4. Remove the "active" visual state from both buttons
    navRemote.classList.remove('active');
    navLog.classList.remove('active');

    // 5. Show the correct page and highlight the correct button
    if (tabName === 'remote') {
        remotePage.style.display = 'block';
        navRemote.classList.add('active');
    } else if (tabName === 'log') {
        logPage.style.display = 'block';
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