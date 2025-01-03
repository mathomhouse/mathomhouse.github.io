document.addEventListener('DOMContentLoaded', loadMap);

let sheetData = []; // To store the map data

// Load the JSON map data
function loadMap() {
    fetch('UD_Practice_Map.json')
        .then(response => response.json())
        .then(data => {
            // Convert JSON objects into arrays of values
            const tableData = data.map(row => Object.values(row));

            sheetData = tableData; // Store the entire map
            displayMap(sheetData); // Display the full map initially
        })
        .catch(error => {
            console.error('Error loading map data:', error);
            alert('Failed to load map data. Please try again later. If this issue persists, please reach out to artu.');
        });
}

// Display the full map
function displayMap(data) {
    const container = document.getElementById('mapContainer');
    container.innerHTML = ''; // Clear existing content

    const table = document.createElement('table');

    data.forEach(row => {
        const tr = document.createElement('tr');
        row.forEach(cell => {
            const td = document.createElement('td');
            td.textContent = cell || ''; // Handle empty cells
            tr.appendChild(td);
        });
        table.appendChild(tr);
    });

    container.appendChild(table);
}

// Center and highlight specific cells
function reCenterMap() {
    const centerInput = document.getElementById('centerInput').value.trim();
    const highlightInput = document.getElementById('highlightInput').value.trim();

    if (!centerInput) {
        alert('Please enter a valid server number in the first box.');
        return;
    }

    const dataRows = sheetData;

    // Find the cell containing the center input value
    let centerRowIndex = -1;
    let centerColIndex = -1;

    for (let rowIndex = 0; rowIndex < dataRows.length; rowIndex++) {
        const colIndex = dataRows[rowIndex].findIndex(cell => String(cell).trim() === centerInput);
        if (colIndex !== -1) {
            centerRowIndex = rowIndex;
            centerColIndex = colIndex;
            break;
        }
    }

    if (centerRowIndex === -1 || centerColIndex === -1) {
        alert('Center value not found in map data.');
        return;
    }

    console.log(`Centering on value: ${centerInput} at Row: ${centerRowIndex}, Column: ${centerColIndex}`);

    // Wrap the map
    const wrappedData = wrapMap(dataRows, centerRowIndex, centerColIndex);

    // Render the map with the centered and highlighted cells
    displayMapWithHighlight(wrappedData, centerInput, highlightInput);
}

// Wrap the map like a globe
function wrapMap(dataRows, centerRow, centerCol) {
    const totalRows = dataRows.length;
    const totalCols = dataRows[0].length;

    // Create a wrapped version of the map
    const wrappedRows = [];

    for (let rowOffset = -Math.floor(totalRows / 2); rowOffset <= Math.floor(totalRows / 2); rowOffset++) {
        const rowIndex = (centerRow + rowOffset + totalRows) % totalRows; // Ensure wrap-around
        const wrappedRow = [];
        for (let colOffset = -Math.floor(totalCols / 2); colOffset <= Math.floor(totalCols / 2); colOffset++) {
            const colIndex = (centerCol + colOffset + totalCols) % totalCols; // Ensure wrap-around
            wrappedRow.push(dataRows[rowIndex][colIndex]);
        }
        wrappedRows.push(wrappedRow);
    }

    return wrappedRows;
}

// Display the map with multiple highlights
function displayMapWithHighlight(data, centerInput, highlightInput) {
    const container = document.getElementById('mapContainer');
    container.innerHTML = '';

    //additional servers
    let serverStrings = highlightInput.split(' ');
    let serverNumbers = [];
    serverStrings.forEach(num => {
        serverNumbers.push(parseInt(num.trim()));
    });

    const table = document.createElement('table');
    data.forEach((row, rowIndex) => {
        const tr = document.createElement('tr');
        row.forEach((cell, colIndex) => {
            const td = document.createElement('td');
            td.textContent = cell || '';
            let sid = String(cell).trim();

            // Highlight cells matching the second input (light blue and bold)
            if (serverNumbers.includes(parseInt(sid))){
                td.style.backgroundColor = 'lightblue';
                td.style.fontWeight = 'bold'; 
            }

            // Highlight the center cell (yellow and bold)
            //do this afterwards in case user put the center server number in both inputs
            if (sid === centerInput && rowIndex === Math.floor(data.length / 2) && colIndex === Math.floor(row.length / 2)) {
                td.style.backgroundColor = 'yellow';
                td.style.fontWeight = 'bold';
            }

            // if (String(cell).trim() === highlightInput) {
            //     td.style.backgroundColor = 'lightblue';
            //     td.style.fontWeight = 'bold';
            // }

            tr.appendChild(td);
        });
        table.appendChild(tr);
    });

    container.appendChild(table);
}

// Add event listener for the "Update Map" button
document.getElementById('updateButton').addEventListener('click', reCenterMap);
