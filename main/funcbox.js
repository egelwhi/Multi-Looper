// UI script: handles popup UI and communicates with content script (video logic)

function collectTimeQueueFromUI() {
    const timeQueue = [];
    const timeSections = document.getElementsByClassName('time');
    for (let i = 0; i < timeSections.length; i++) {
        const startInput = timeSections[i].getElementsByClassName('start_time')[0];
        const endInput = timeSections[i].getElementsByClassName('end_time')[0];
        const startTime = startInput ? startInput.value : '';
        const endTime = endInput ? endInput.value : '';
        timeQueue.push({ startTime, endTime });
    }
    return timeQueue;
}

function resetTimeSectionsUI() {
    const timeSections = document.getElementsByClassName('time');
    for (let i = 0; i < timeSections.length; i++) {
        const start = timeSections[i].getElementsByClassName('start_time')[0];
        const end = timeSections[i].getElementsByClassName('end_time')[0];
        if (start) start.value = '';
        if (end) end.value = '';
    }

    while (timeSections.length > 1) {
        timeSections[timeSections.length - 1].remove();
    }

    const remainingSection = timeSections[0];
    if (remainingSection) {
        const delBtn = remainingSection.getElementsByClassName('delete_time_section')[0];
        const addBtn = remainingSection.getElementsByClassName('add_time_section')[0];
        if (delBtn) delBtn.classList.add('hide');
        if (addBtn) addBtn.classList.remove('hide');
    }
}

function buttonState(buttonId, state) {
    const button = document.getElementById(buttonId);
    if (!button) return;

    if (state === 'enable') {
        if (button.classList.contains('disabled')) button.classList.remove('disabled');
        button.disabled = false;
        if (button.classList.contains('hide')) button.classList.remove('hide');
    } else if (state === 'disable') {
        if (!button.classList.contains('disabled')) button.classList.add('disabled');
        button.disabled = true;
        if (!button.classList.contains('hide')) button.classList.add('hide');
    }
}

function updateStatusDisplay(state, info) {
    const stateDisplay = document.querySelector('.status p');
    const light = document.querySelector('.statusLight');
    if (!stateDisplay || !light) return;

    switch (state) {
        case 'ready':
            stateDisplay.textContent = 'Status: Ready to Loop';
            light.className = 'statusLight';
            light.classList.add('loopReady');

            buttonState('startBtn', 'enable');
            buttonState('pauseBtn', 'disable');
            buttonState('resetBtn', 'enable');
            break;
        case 'playing':
            stateDisplay.textContent = 'Status: Playing';
            light.className = 'statusLight';
            light.classList.add('looping');

            buttonState('startBtn', 'disable');
            buttonState('pauseBtn', 'enable');
            buttonState('resetBtn', 'enable');
            break;
        case 'paused':
            stateDisplay.textContent = 'Status: Paused';
            light.className = 'statusLight';
            light.classList.add('paused');
            buttonState('startBtn', 'enable');
            buttonState('pauseBtn', 'disable');
            buttonState('resetBtn', 'enable');
            break;
        case 'no_video':
            stateDisplay.textContent = 'Status: No video found';
            light.className = 'statusLight';
            light.classList.add('warning');
            buttonState('startBtn', 'disable');
            buttonState('pauseBtn', 'disable');
            buttonState('resetBtn', 'enable');
            buttonState('reInit', 'enable');
            break;
        case 'reset':
            stateDisplay.textContent = 'Status: Reset & Ready to Loop';
            light.className = 'statusLight';
            light.classList.add('loopReady');
            buttonState('startBtn', 'enable');
            buttonState('pauseBtn', 'disable');
            buttonState('resetBtn', 'enable');
            break;
        case 'finished':
            stateDisplay.textContent = 'Status: Finished';
            light.className = 'statusLight';
            light.classList.add('loopReady');
            buttonState('startBtn', 'enable');
            buttonState('pauseBtn', 'disable');
            buttonState('resetBtn', 'enable');
            break;
        default:
            if (info && info.message) stateDisplay.textContent = 'Status: ' + info.message;
            break;
    }
}

function init_buttons() {
    const startBtnEl = document.getElementById('startBtn');
    const pauseBtnEl = document.getElementById('pauseBtn');
    const resetBtnEl = document.getElementById('resetBtn');
    const reInitBtnEl = document.getElementById('reInit');

    if (startBtnEl) {
        startBtnEl.addEventListener('click', () => {
            const timeQueue = collectTimeQueueFromUI();
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (!tabs || tabs.length === 0) return;
                chrome.tabs.sendMessage(tabs[0].id, { type: 'play', timeQueue });
            });
        });
    }

    if (pauseBtnEl) {
        pauseBtnEl.addEventListener('click', () => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (!tabs || tabs.length === 0) return;
                chrome.tabs.sendMessage(tabs[0].id, { type: 'pause' });
            });
        });
    }

    if (resetBtnEl) {
        resetBtnEl.addEventListener('click', () => {
            resetTimeSectionsUI();
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (!tabs || tabs.length === 0) return;
                chrome.tabs.sendMessage(tabs[0].id, { type: 'reset' });
            });
        });
    }

    if (reInitBtnEl) {
        reInitBtnEl.addEventListener('click', () => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (!tabs || tabs.length === 0) return;
                chrome.tabs.sendMessage(tabs[0].id, { type: 'init_video' });
            });
        });
    }
}

// Listen for status updates from the content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || !message.type) return;
    if (message.type === 'status') {
        updateStatusDisplay(message.state, message);
    }
});

// When popup loads, wire buttons and request initial status from active tab
if (document.readyState !== 'loading') {
    init_buttons();
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs || tabs.length === 0) return;
        chrome.tabs.sendMessage(tabs[0].id, { type: 'get_status' }, (response) => {
            if (response && response.isInitialized) updateStatusDisplay('ready');
            else if (response && response.queueLength === 0) updateStatusDisplay('no_video');
        });
    });
} else {
    document.addEventListener('DOMContentLoaded', () => {
        init_buttons();
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs || tabs.length === 0) return;
            chrome.tabs.sendMessage(tabs[0].id, { type: 'get_status' }, (response) => {
                if (response && response.isInitialized) updateStatusDisplay('ready');
                else if (response && response.queueLength === 0) updateStatusDisplay('no_video');
            });
        });
    });
}