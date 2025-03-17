const dropdown = document.getElementById('colorDropdown');
const checkboxSection = document.getElementById('checkbox-section');

// Ensure the background color is set when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", function () {
    updateBackgroundColor(); // Set initial color when the page loads

    // Add event listener to change background color on selection change
    document.getElementById("colorDropdown").addEventListener("change", updateBackgroundColor);
});

dropdown.addEventListener('change', function () {
    // Update the background color of the dropdown to match the selected color
    updateBackgroundColor();

    if (dropdown.value === 'gold') {
        checkboxSection.style.display = 'inline';  // Show checkbox
    } else {
        checkboxSection.style.display = 'none';  // Hide checkbox
    }
});

function updateBackgroundColor() {
    const selectedOption = dropdown.options[dropdown.selectedIndex];
    const selectedBackgroundColor = window.getComputedStyle(selectedOption).backgroundColor;
    const selectedTextColor = window.getComputedStyle(selectedOption).color;
    dropdown.style.backgroundColor = selectedBackgroundColor;
    dropdown.style.color = selectedTextColor;
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

    // Adjust g based on the desired rarity
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

    // Check if the extra grey materials checkbox is selected
    let includeExtraGrey = document.getElementById('extraGreyCheckbox').checked;
    let extraGreyPerDay = 25;
    let craftingRate = 96; // Example: crafting 10 materials every day
    let days = 0;
    let hours = 0;
    let minutes = 0;

    // Check if there are any grey materials left to craft
    if (g > 0) {
        let remainingMaterials = g;

        if (includeExtraGrey) {
            // Loop through each day, subtracting both the crafted materials and the extra grey materials per day
            while (remainingMaterials > craftingRate) {  //change "remaining > 0" to " > craftingRate"
                days++; //add a full day to the variable
                remainingMaterials -= craftingRate;
                if (remainingMaterials > extraGreyPerDay) {
                    remainingMaterials -= extraGreyPerDay; // Subtract extra grey materials
                }
            }
            //calculate the time needed for the remainder of the mats. Assume Sandtable would be done so subtact extraGreyPerDay
            days += Math.abs(remainingMaterials) / craftingRate;
        } 
        else {
            // If no extra materials are added, calculate crafting time based purely on crafting rate
            days = remainingMaterials / craftingRate;
        }

        let totalCraftingMinutes = days * (1440);

        let fullDays = Math.floor(days); // Full days
        let remainingMinutesAfterDays = totalCraftingMinutes % (1440);
        hours = Math.floor(remainingMinutesAfterDays / 60);
        minutes = Math.round(remainingMinutesAfterDays % 60);
        days = fullDays; // Set days to the whole number
    }

    // Final result display
    if (g <= 0) {
        result = `You don't need anymore materials!`;
    } else {
        result = `You need <b>${g}</b> more grey materials.<br>Total crafting time: `;
    }

    // Get the user's current date and time
    const now = new Date();

    // Add the calculated time to the current date
    now.setDate(now.getDate() + days);
    now.setHours(now.getHours() + hours);
    now.setMinutes(now.getMinutes() + minutes);
    var formattedDateTime = formatDate(now);

    // Return the time as a formatted string
    if (days > 0) result += `<b>${days}</b> days`;
    if (hours > 0) result += ` <b>${hours}</b> hours`;
    if (minutes > 0 || result === '') result += ` <b>${minutes}</b> minutes`;

    result += `. <br>The crafting will finish on: ${formattedDateTime}`;

    document.getElementById('result').innerHTML = result;
}


function resetmats() {
    document.getElementById('greymats').value = "";
    document.getElementById('greenmats').value = "";
    document.getElementById('bluemats').value = "";
    document.getElementById('purplemats').value = "";
    document.getElementById('goldmats').value = "";

    // Clear the result
    document.getElementById('result').innerHTML = '';
}

function formatDate(date) {
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