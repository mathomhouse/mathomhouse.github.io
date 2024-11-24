document.addEventListener('DOMContentLoaded', loadMap);

let sheetData = []; // To store the map data

// Load the JSON map data
function loadMap() {
    fetch('UD_MAP.json')
        .then(response => response.json())
        .then(data => {
            console.log("Fetched data (raw):", data); // Log raw data
            // Transform data into an array of arrays
            const headers = Object.keys(data[0]); // Extract headers (keys from the first object)
            const tableData = [headers]; // Start with the headers row

            // Add each row of data as an array
            data.forEach(row => {
                const rowArray = headers.map(key => row[key]); // Extract values in header order
                tableData.push(rowArray);
            });

            console.log("Transformed data:", tableData); // Log transformed data
            sheetData = tableData;
            displayMapWithHighlight(sheetData); // Display full map initially
        })
        .catch(error => {
            console.error('Error loading map data:', error);
            alert('Failed to load map data. Please try again later.');
        });
}

// Display the map as a table with optional highlighting and centering
function displayMapWithHighlight(data, centerRow = null, centerCol = null) {
    console.log("Data passed to displayMapWithHighlight:", data); // Log the data
    const container = document.getElementById('mapContainer');
    container.innerHTML = ''; // Clear previous content

    // Create the table
    const table = document.createElement('table');
    table.style.position = 'relative'; // Allow visual adjustments for centering

    data.forEach((row, rowIndex) => {
        const tr = document.createElement('tr');
        row.forEach((cell, colIndex) => {
            const td = document.createElement('td');
            td.textContent = cell || ''; // Handle empty cells

            // Highlight the center cell
            if (rowIndex === centerRow && colIndex === centerCol) {
                td.style.backgroundColor = 'yellow';
                td.style.fontWeight = 'bold';
            }
            tr.appendChild(td);
        });
        table.appendChild(tr);
    });

    container.appendChild(table);

    // Center the table visually if a center cell is provided
    if (centerRow !== null && centerCol !== null) {
        const tableRows = table.rows.length;
        const tableCols = table.rows[0]?.cells.length || 0;

        // Calculate offsets to position the center cell in the middle
        const rowOffset = Math.floor((container.offsetHeight / tableRows) * (centerRow - tableRows / 2));
        const colOffset = Math.floor((container.offsetWidth / tableCols) * (centerCol - tableCols / 2));

        table.style.transform = `translate(${colOffset}px, ${rowOffset}px)`; // Apply visual centering
    }
}

// Re-center the map based on user input
function reCenterMap() {
    const centerInput = document.getElementById('centerInput').value.trim(); // Get user input and trim whitespace
    if (!centerInput) {
        alert('Please enter a valid cell value.');
        return;
    }

    const headers = sheetData[0]; // Column headers
    const dataRows = sheetData.slice(1); // Rows of data

    // Search for the cell containing the input value
    let centerRowIndex = -1;
    let centerColIndex = -1;

    for (let i = 0; i < dataRows.length; i++) {
        const colIndex = dataRows[i].findIndex(cell => String(cell).trim() === centerInput); // Ensure both sides are strings
        if (colIndex !== -1) {
            centerRowIndex = i + 1; // Adjust for header row
            centerColIndex = colIndex;
            break;
        }
    }

    if (centerRowIndex === -1 || centerColIndex === -1) {
        alert('Cell value not found in map data.');
        return;
    }

    console.log(`Center found at: Row ${centerRowIndex}, Column ${centerColIndex}`); // Debug

    // Display the map with the highlighted cell
    displayMapWithHighlight(sheetData, centerRowIndex, centerColIndex);
}

// Add event listener for the "Update Map" button
document.getElementById('updateButton').addEventListener('click', reCenterMap);
