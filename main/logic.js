const timeQueue = [];
const videoStartTime = 0;
var videoLength = 0;
var video;
var isPaused = false;
var isPlaying = false;
var currentTimeIndex = 0;

// Play multi-looper logic
function play() {
    // place holder for the logic to play the multi-looper
    console.log('[multi-looper] Playing...');
    isPlaying = true;
    isPaused = false;
    while (1) {
        if (isPaused) {
            break;
        }

        for (let i = 0; i < timeQueue.length; i++) {
            const { startTime, endTime } = timeQueue[i];
            console.log(`[multi-looper] Playing section ${i + 1}: ${startTime} - ${endTime}`);
            video.currentTime = startTime;
            video.play();
            while (video.currentTime < endTime) {
                if (isPaused) {
                    video.pause();
                    break;
                }
            }
        }
    }
}

// Pause multi-looper logic
function pause() {
    // place holder for the logic to pause the multi-looper
    console.log('[multi-looper] Pausing...');
    isPlaying = false;
    isPaused = true;
    video.pause();
}

function init_video() {
    console.log("[multi-looper] Starting to initialize...");

    // Initialize video length
    video = document.getElementsByTagName('video')[0];
    if (video) {
        videoLength = video.duration;
        console.log('[multi-looper] Ready: Video length: ' + videoLength + ' seconds');
    } else {
        console.log('[multi-looper] Error: No video element found');
        while (!video) {
            console.log('[multi-looper] Waiting for video element...');
            video = document.getElementsByTagName('video')[0];
        }
    }

    // Update the state display
    const stateDisplay = document.querySelector('.status p');
    stateDisplay.textContent = 'Status: Ready to Loop';
    document.querySelector('.statusLight').classList.remove('notReady');
    document.querySelector('.statusLight').classList.add('loopReady');
}

function init_buttons() {
    // Start multi-looper logic
    document.getElementById('startBtn').addEventListener('click', () => {
        //get all time sections and store them in a queue
        const timeSections = document.getElementsByClassName('time');


        //put all the time sections into a queue
        for (let i = 0; i < timeSections.length; i++) {
            const startTime = timeSections[i].getElementsByClassName('start_time')[0].value;
            const endTime = timeSections[i].getElementsByClassName('end_time')[0].value;
            timeQueue.push({ startTime, endTime });
        }

        // place holder for the logic to start the multi-looper with the timeQueue
        console.log('[multi-looper] Time queue initialized:');
        console.log(timeQueue);
        console.log('[multi-looper] Number of time sections: ' + timeQueue.length);
    });

    document.getElementById('pauseBtn').addEventListener('click', function () {
        pause();
    });

    // Reset multi-looper logic
    document.getElementById('resetBtn').addEventListener('click', function () {
        const timeSections = document.getElementsByClassName('time');
        pause();
        timeQueue.length = 0; // Clear the time queue

        // Reset all UI time sections
        for (let i = 0; i < timeSections.length; i++) {
            timeSections[i].getElementsByClassName('start_time')[0].value = '';
            timeSections[i].getElementsByClassName('end_time')[0].value = '';
        }

        // Reset to only one time section
        while (timeSections.length > 1) {
            timeSections[timeSections.length - 1].remove();
        }

        // Hide the delete button on the remaining section and show its add button
        const remainingSection = timeSections[0];
        remainingSection.getElementsByClassName('delete_time_section')[0].classList.add('hide');
        remainingSection.getElementsByClassName('add_time_section')[0].classList.remove('hide');
    });
}

console.log('[multi-looper] Logic.js loaded');

// Initialize when the WebPage is ready
if (document.readyState !== 'loading') {
    init_video();
    init_buttons();
} else {
    document.addEventListener('DOMContentLoaded', () => {
        init_video();
        init_buttons();
    });
}