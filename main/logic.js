// Start multi-looper logic
document.getElementById('startBtn').addEventListener('click', function() {
    //get all time sections and store them in a queue
    const timeSections = document.getElementsByClassName('time');
    const timeQueue = [];

    //put all the time sections into a queue
    for (let i = 0; i < timeSections.length; i++) {
        const startTime = timeSections[i].getElementsByClassName('start_time')[0].value;
        const endTime = timeSections[i].getElementsByClassName('end_time')[0].value;
        timeQueue.push({ startTime, endTime });
    }

    // place holder for the logic to start the multi-looper with the timeQueue
    console.log(timeQueue);
});

// Pause multi-looper logic
function pause(){

}

document.getElementById('pauseBtn').addEventListener('click', function() {
    pause();
});

// Reset multi-looper logic
document.getElementById('resetBtn').addEventListener('click', function() {
    const timeSections = document.getElementsByClassName('time');
    pause();

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