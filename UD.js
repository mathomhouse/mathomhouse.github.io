document.addEventListener('DOMContentLoaded', loadMap);

let sheetData = []; // To store the map data

// Load the JSON map data
function loadMap() {
    fetch('UD_MAP.json')
        .then(response => response.json())
        .then(data => {
            console.log("Fetched data (raw):", data); // Log raw data
            // Transform JSON into an array of arrays
            const headers = Object.keys(data[0]); // Extract headers
            const tableData = [headers]; // Start with headers

            // Add rows of data
            data.forEach(row => {
                const rowArray = headers.map(key => row[key]); // Extract values in header order
                tableData.push(rowArray);
            });

            sheetData = tableData;
            displayMap(sheetData); // Display the full map initially
        })
        .catch(error => {
            console.error('Error loading map data:', error);
            alert('Failed to load map data. Please try again later.');
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

// Center and highlight a specific cell
function reCenterMap() {
    const centerInput = document.getElementById('centerInput').value.trim();
    if (!centerInput) {
        alert('Please enter a valid cell value.');
        return;
    }

    const headers = sheetData[0];
    const dataRows = sheetData.slice(1);

    // Find the cell containing the input value
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
        alert('Cell value not found in map data.');
        return;
    }

    console.log(`Centering on value: ${centerInput} at Row: ${centerRowIndex}, Column: ${centerColIndex}`);

    // Wrap the map
    const wrappedData = wrapMap(dataRows, centerRowIndex, centerColIndex, headers);

    // Render the map with the centered and highlighted cell
    displayMapWithHighlight(wrappedData);
}

// Wrap the map like a globe
function wrapMap(dataRows, centerRow, centerCol, headers) {
    const totalRows = dataRows.length;
    const totalCols = headers.length;

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

    // Return the full wrapped map including headers
    return [headers, ...wrappedRows];
}

// Display the map with highlighting
function displayMapWithHighlight(data) {
    const container = document.getElementById('mapContainer');
    container.innerHTML = '';

    const table = document.createElement('table');
    data.forEach((row, rowIndex) => {
        const tr = document.createElement('tr');
        row.forEach((cell, colIndex) => {
            const td = document.createElement('td');
            td.textContent = cell || '';

            // Highlight the center cell
            if (rowIndex === Math.floor(data.length / 2) && colIndex === Math.floor(row.length / 2)) {
                td.classList.add('highlighted');
            }
            tr.appendChild(td);
        });
        table.appendChild(tr);
    });

    container.appendChild(table);
}

// Add event listener for the "Update Map" button
document.getElementById('updateButton').addEventListener('click', reCenterMap);
