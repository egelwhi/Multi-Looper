let timeQueue = [];

let video = null;
let videoLength = 0;

let isInitialized = false;
let isPlaying = false;
let isPaused = false;

let currentIndex = 0;
let timeUpdateHandler = null;
let targetEnd = 0;

function sendStatus(state, extra = {}) {
    console.log('[multi-looper] sendStatus', state, extra);
    chrome.runtime.sendMessage(Object.assign({ type: 'status', state, videoLength, currentIndex }, extra));
}

function initVideo() {
    video = document.getElementsByTagName('video')[0];
    if (video) {
        videoLength = video.duration || 0;
        isInitialized = true;
        sendStatus('ready', { message: 'Video ready', videoLength });
    } else {
        isInitialized = false;
        sendStatus('no_video', { message: 'No video element found' });
    }
}

function setTimeQueue(queue) {
    timeQueue = (queue || []).map(({ startTime, endTime }) => ({
        startTime: parseFloat(startTime) || 0,
        endTime: parseFloat(endTime) || 0,
    })).filter(s => !isNaN(s.startTime) && !isNaN(s.endTime) && s.endTime > s.startTime);
    currentIndex = 0;
    sendStatus('queue_set', { queueLength: timeQueue.length });
}

function startSection() {
    if (!video) return sendStatus('no_video');
    if (isPaused) {
        isPlaying = false;
        sendStatus('finished');
        return;
    }

    if (currentIndex < 0 || currentIndex >= timeQueue.length) {
        currentIndex = 0;
    }

    const { startTime, endTime } = timeQueue[currentIndex];
    targetEnd = endTime;
    try { video.currentTime = startTime; } catch (e) {}
    video.play();

    if (timeUpdateHandler) video.removeEventListener('timeupdate', timeUpdateHandler);
    timeUpdateHandler = () => {
        if (video.currentTime >= targetEnd - 0.05) {
            video.pause();
            video.removeEventListener('timeupdate', timeUpdateHandler);
            currentIndex++;
            if (!isPaused) setTimeout(() => startSection(currentIndex), 100);
            else sendStatus('paused');
        }
    };
    video.addEventListener('timeupdate', timeUpdateHandler);
    sendStatus('playing_section', { currentIndex: currentIndex, startTime, endTime });
}

function play() {
    if (!isInitialized) initVideo();
    if (!video) return sendStatus('no_video');
    if (!timeQueue || timeQueue.length === 0) return sendStatus('no_queue', { message: 'No time sections defined' });

    isPlaying = true;
    isPaused = false;
    startSection();
    sendStatus('playing');
}

function pause() {
    if (!video) return sendStatus('no_video');
    isPaused = true;
    isPlaying = false;
    if (timeUpdateHandler) video.removeEventListener('timeupdate', timeUpdateHandler);
    video.pause();
    sendStatus('paused');
}

function reset() {
    if (timeUpdateHandler && video) video.removeEventListener('timeupdate', timeUpdateHandler);
    timeQueue = [];
    currentIndex = 0;
    isPlaying = false;
    isPaused = false;
    sendStatus('reset');
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (!msg || !msg.type) return;
    switch (msg.type) {
        case 'init_video':
            initVideo();
            sendResponse({ status: 'ok' });
            break;
        case 'set_time_queue':
            setTimeQueue(msg.timeQueue || []);
            sendResponse({ status: 'ok' });
            break;
        case 'play':
            if (msg.timeQueue) setTimeQueue(msg.timeQueue);
            play();
            sendResponse({ status: 'ok' });
            break;
        case 'pause':
            pause();
            sendResponse({ status: 'ok' });
            break;
        case 'reset':
            reset();
            sendResponse({ status: 'ok' });
            break;
        case 'get_status':
            sendResponse({ status: 'ok', isInitialized, isPlaying, isPaused, videoLength, currentIndex, queueLength: timeQueue.length });
            break;
        default:
            break;
    }
    return true;
});

// Try to initialize eagerly when content script loads
if (document.readyState !== 'loading') {
    initVideo();
} else {
    document.addEventListener('DOMContentLoaded', initVideo);
}

console.log('[multi-looper] content/logic.js loaded');
