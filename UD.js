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

// Display the map as a table with optional highlighting
function displayMapWithHighlight(data, centerRow = null, centerCol = null) {
    console.log("Data passed to displayMapWithHighlight:", data); // Log the data
    const container = document.getElementById('mapContainer');
    container.innerHTML = ''; // Clear previous content
    const table = document.createElement('table');

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
            centerRowIndex = i; // Found row index
            centerColIndex = colIndex; // Found column index
            break;
        }
    }

    if (centerRowIndex === -1 || centerColIndex === -1) {
        alert('Cell value not found in map data.');
        return;
    }

    console.log(`Center found at: Row ${centerRowIndex + 1}, Column ${centerColIndex + 1}`); // Debug

    // Rebuild the map to ensure the input cell is centered visually
    const range = 5; // Number of rows/columns around the center
    const totalRows = dataRows.length;
    const totalCols = headers.length;

    const startRow = Math.max(0, centerRowIndex - range);
    const endRow = Math.min(totalRows, centerRowIndex + range + 1);
    const startCol = Math.max(0, centerColIndex - range);
    const endCol = Math.min(totalCols, centerColIndex + range + 1);

    const centeredData = [
        headers.slice(startCol, endCol), // Adjusted headers
        ...dataRows.slice(startRow, endRow).map(row => row.slice(startCol, endCol))
    ];

    console.log("Centered data:", centeredData); // Debug
    displayMapWithHighlight(centeredData, centerRowIndex - startRow + 1, centerColIndex - startCol); // Correctly highlight center
}

// Add event listener for the "Update Map" button
document.getElementById('updateButton').addEventListener('click', reCenterMap);
