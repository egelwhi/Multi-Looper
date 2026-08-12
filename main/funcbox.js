let videoLength = 0;

function getTabStateKeys(tabId) {
    return {
        statusKey: `multiLooper_status_${tabId}`,
        timeQueueKey: `multiLooper_timeQueue_${tabId}`,
    };
}

let activeTabId = null;
let saveQueueTimer = null;

function saveCurrentQueueForActiveTab() {
    if (typeof activeTabId !== 'number') return;

    const { timeQueueKey } = getTabStateKeys(activeTabId);
    chrome.storage.local.set({ [timeQueueKey]: collectTimeQueueFromUI() });
}

function scheduleQueueSave() {
    if (saveQueueTimer) clearTimeout(saveQueueTimer);
    saveQueueTimer = setTimeout(() => {
        saveQueueTimer = null;
        saveCurrentQueueForActiveTab();
    }, 50);
}

function restoreState(tabId){
    if (typeof tabId !== 'number') return;

    const { statusKey, timeQueueKey } = getTabStateKeys(tabId);
    chrome.storage.local.get([statusKey, timeQueueKey], (result) => {
        updateStatusDisplay(result[statusKey] || 'uninitialized');
        if (result[timeQueueKey]) {
            const timeQueue = result[timeQueueKey];
            resetTimeSectionsUI();
            const timeSections = document.getElementsByClassName('time');
            for (let i = 0; i < timeQueue.length; i++) {
                if (i >= timeSections.length) {
                    // If there are more timeQueue items than existing time sections, add new sections
                    const addBtn = document.getElementsByClassName('add_time_section')[0];
                    if (addBtn) addBtn.click();
                }

                const startInput = timeSections[i].getElementsByClassName('start_time');
                const endInput = timeSections[i].getElementsByClassName('end_time');
                if (startInput.length == 3 && endInput.length == 3) {
                    const startTime = timeQueue[i].startTime;
                    const endTime = timeQueue[i].endTime;

                    startInput[0].value = Math.floor(startTime / 3600) || '0';
                    startInput[1].value = Math.floor((startTime % 3600) / 60) || '0';
                    startInput[2].value = Math.floor(startTime % 60) || '0';

                    endInput[0].value = Math.floor(endTime / 3600) || '0';
                    endInput[1].value = Math.floor((endTime % 3600) / 60) || '0';
                    endInput[2].value = Math.floor(endTime % 60) || '0';
                }
            }
        }
    });

    document.getElementById('videoLength').textContent = Math.floor(videoLength/3600) + ' : ' + Math.floor((videoLength%3600)/60) + ' : ' + Math.floor(videoLength%60);
}

function loadActiveTabState() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs || tabs.length === 0) {
            restoreState();
            return;
        }

        activeTabId = tabs[0].id;
        const tabId = activeTabId;
        chrome.tabs.sendMessage(tabId, { type: 'get_status' }, (response) => {
            // Prefer explicit playing/paused flags from the content script so we
            // don't overwrite the stored status restored from chrome.storage.
            if (response) {
                if (typeof response.videoLength === 'number' && Number.isFinite(response.videoLength)) {
                    videoLength = response.videoLength;
                }
                if (response.isPlaying) updateStatusDisplay('playing');
                else if (response.isPaused) updateStatusDisplay('paused');
                else if (response.isInitialized) updateStatusDisplay('ready');
                else if (response.queueLength === 0) updateStatusDisplay('no_video');
            }
            restoreState(tabId);
        });
    });
}
function collectTimeQueueFromUI() {
    const timeQueue = [];
    const timeSections = document.getElementsByClassName('time');
    for (let i = 0; i < timeSections.length; i++) {
        const startInput = timeSections[i].getElementsByClassName('start_time');
        const endInput = timeSections[i].getElementsByClassName('end_time');

        if (startInput.length == 3 && endInput.length == 3) {
            const startTime = (parseInt(startInput[0].value) * 3600) + (parseInt(startInput[1].value) * 60) + parseInt(startInput[2].value);
            const endTime = (parseInt(endInput[0].value) * 3600) + (parseInt(endInput[1].value) * 60) + parseInt(endInput[2].value);

            if (endTime >= videoLength || startTime >= videoLength) {
                updateStatusDisplay('error', { message: 'Time exceeds video length' });
                return [];
            }

            if (startTime > endTime) {
                const start1 = startTime;
                const end1 = videoLength;
                const start2 = 0;
                const end2 = endTime;
                timeQueue.push({ startTime: start1, endTime: end1 });
                timeQueue.push({ startTime: start2, endTime: end2 });
            } else {
                timeQueue.push({ startTime, endTime });
            }
        }
    }

    return timeQueue;
}

function resetTimeSectionsUI() {
    const timeSections = document.getElementsByClassName('time');
    for (let i = 0; i < timeSections.length; i++) {
        const start = timeSections[i].getElementsByClassName('start_time');
        const end = timeSections[i].getElementsByClassName('end_time');
        if (start.length == 3) {
            start[0].value = '0';
            start[1].value = '0';
            start[2].value = '0';
        }
        if (end.length == 3) {
            end[0].value = '0';
            end[1].value = '0';
            end[2].value = '0';
        }
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
        case 'queue_set':
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
        case 'no_queue':
            stateDisplay.textContent = 'Status: No time sections defined';
            light.className = 'statusLight';
            light.classList.add('warning');
            buttonState('startBtn', 'disable');
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
        case 'error':
            if (info && info.message) stateDisplay.textContent = 'Status: ' + info.message;
            light.className = 'statusLight';
            light.classList.add('warning');
            buttonState('startBtn', 'disable');
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
    const timeContainer = document.getElementById('timeContainer');

    if (timeContainer) {
        timeContainer.addEventListener('input', (event) => {
            if (event.target.closest('.start_time, .end_time')) {
                scheduleQueueSave();
            }
        });

        timeContainer.addEventListener('click', (event) => {
            if (event.target.closest('.add_time_section, .delete_time_section, .reset_time')) {
                scheduleQueueSave();
            }
        });
    }

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
            scheduleQueueSave();
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
        if (typeof message.videoLength === 'number' && Number.isFinite(message.videoLength)) {
            videoLength = message.videoLength;
            document.getElementById('videoLength').textContent = Math.floor(videoLength/3600) + ' : ' + Math.floor((videoLength%3600)/60) + ' : ' + Math.floor(videoLength%60);
        }
        updateStatusDisplay(message.state, message);
    }
    
});

// When popup loads, wire buttons and request initial status from active tab
if (document.readyState !== 'loading') {
    init_buttons();
    loadActiveTabState();
} else {
    document.addEventListener('DOMContentLoaded', () => {
        init_buttons();
        loadActiveTabState();
    });
}