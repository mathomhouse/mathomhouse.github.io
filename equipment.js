const dropdown = document.getElementById('colorDropdown');
const checkboxSection = document.getElementById('checkbox-section');

// Ensure the background color is set when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", function() {
    updateBackgroundColor(); // Set initial color when the page loads

    // Add event listener to change background color on selection change
    document.getElementById("colorDropdown").addEventListener("change", updateBackgroundColor);
});

dropdown.addEventListener('change', function () {
    // Update the background color of the dropdown to match the selected color
    updateBackgroundColor();

    if (dropdown.value === 'gold') {
        checkboxSection.style.display = 'block';  // Show checkbox
    } else {
        checkboxSection.style.display = 'none';  // Hide checkbox
    }
});

function updateBackgroundColor(){
    dropdown.style.backgroundColor = dropdown.value;
}
function calculatemats() {
    const opengreymats = parseFloat(document.getElementById('greymats').value) || 0;
    const opengreenmats = parseFloat(document.getElementById('greenmats').value) || 0;
    const openbluemats = parseFloat(document.getElementById('bluemats').value) || 0;
    const openpurplemats = parseFloat(document.getElementById('purplemats').value) || 0;
    const opengoldmats = parseFloat(document.getElementById('goldmats').value) || 0;

    var totalopengreymats = opengreymats + (opengreenmats * 4) + (openbluemats * 16)
        + (openpurplemats * 64) + (opengoldmats * 256);

    var result = '';
    var g = 0;

    if (dropdown.value === 'grey') {
        g = 70 - totalopengreymats;
    }
    else if (dropdown.value === 'green') {
        g = 280 - totalopengreymats;
    }
    else if (dropdown.value === 'blue') {
        g = 1120 - totalopengreymats;
    }
    else if (dropdown.value === 'purple') {
        g = 4480 - totalopengreymats;
    }
    else {
        g = 17920 - totalopengreymats;
        if (document.getElementById('dismantlingCheckbox').checked) {
            g = g - 4480;
        }
    }

    if (g <= 0) {
        result = `You don't need anymore materials!`;
    }
    else { 
        var craftingTime = calculateCraftingTime(g);
        result = `You need <b>${g}</b> more grey materials. <br>Amount of time needed: ${craftingTime}`; 
    }

    document.getElementById('result').innerHTML = result;
}

function resetmats() {
    document.getElementById('greymats').value = 0;
    document.getElementById('greenmats').value = 0;
    document.getElementById('bluemats').value = 0;
    document.getElementById('purplemats').value = 0;
    document.getElementById('goldmats').value = 0;

    // Clear the result
    document.getElementById('result').innerHTML = '';
}

function calculateCraftingTime(materials) {
    // Define the crafting time for 10 materials in minutes (2 hours 30 minutes = 150 minutes)
    const timeFor10Materials = 2 * 60 + 30; // 150 minutes

    // Calculate the time per material
    const timePerMaterial = timeFor10Materials / 10;

    // Calculate total crafting time for the input number of materials
    const totalMinutes = materials * timePerMaterial;

    // Convert the total minutes into days, hours, and minutes
    const days = Math.floor(totalMinutes / (24 * 60));
    const remainingMinutesAfterDays = totalMinutes % (24 * 60);
    const hours = Math.floor(remainingMinutesAfterDays / 60);
    const minutes = Math.round(remainingMinutesAfterDays % 60);

     // Get the user's current date and time
    const now = new Date();

    // Add the calculated time to the current date
    now.setDate(now.getDate() + days);
    now.setHours(now.getHours() + hours);
    now.setMinutes(now.getMinutes() + minutes);
    var formattedDateTime = formatDate(now);

    // Return the time as a formatted string
    let result = '';
    if (days > 0) result += `${days} days `;
    if (hours > 0) result += `${hours} hours `;
    if (minutes > 0 || result === '') result += `${minutes} minutes`;

    return result.trim() + `. <br>The crafting will finish on: ${formattedDateTime}`;
}

function formatDate(date){
    // Use Intl.DateTimeFormat to format the date and time as mm/dd/yyyy HH:mm
    const options = {
                    year: 'numeric',
                    month: 'long',  //this will use the name of the month
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                };
                
    const formattedDateTime = new Intl.DateTimeFormat('en-US', options).format(date);
    return formattedDateTime;
}