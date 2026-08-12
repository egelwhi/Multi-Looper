const timeContainer = document.getElementById('timeContainer');

// Add button
timeContainer.addEventListener('click', (event) => {
    const addButton = event.target.closest('.add_time_section');

    if (!addButton) {
        return;
    }

    const currentTimeSection = addButton.closest('.time');

    // Clone the current time section and clear its input values
    const newTimeSection = currentTimeSection.cloneNode(true);
    newTimeSection.getElementsByClassName('start_time')[0].value = '';
    newTimeSection.getElementsByClassName('start_time')[1].value = '';
    newTimeSection.getElementsByClassName('start_time')[2].value = '';
    newTimeSection.getElementsByClassName('end_time')[0].value = '';
    newTimeSection.getElementsByClassName('end_time')[1].value = '';
    newTimeSection.getElementsByClassName('end_time')[2].value = '';

    // Show the delete button on the current section and hide its add button
    currentTimeSection.getElementsByClassName('delete_time_section')[0].classList.remove('hide');
    addButton.classList.add('hide');

    // Add the new section to the container
    timeContainer.appendChild(newTimeSection);
});

// Delete button
timeContainer.addEventListener('click', (event) => {
    const deleteButton = event.target.closest('.delete_time_section');

    if (!deleteButton) {
        return;
    }

    const currentTimeSection = deleteButton.closest('.time');

    // Remove the current time section
    currentTimeSection.remove();
});

// Reset button
timeContainer.addEventListener('click', (event) => {
    const resetButton = event.target.closest('.reset_time');

    if (!resetButton) {
        return;
    }

    // Reset the time section
    const currentTimeSection = resetButton.closest('.time');
    currentTimeSection.getElementsByClassName('start_time')[0].value = '';
    currentTimeSection.getElementsByClassName('start_time')[1].value = '';
    currentTimeSection.getElementsByClassName('start_time')[2].value = '';
    currentTimeSection.getElementsByClassName('end_time')[0].value = '';
    currentTimeSection.getElementsByClassName('end_time')[1].value = '';
    currentTimeSection.getElementsByClassName('end_time')[2].value = '';
});
