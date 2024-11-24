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
        const colIndex = dataRows[i].findIndex(cell => String(cell) === centerInput); // Convert cell to string for comparison
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
    const visibleRows = sheetData.slice(); // Copy all rows
    const headersRow = visibleRows[0]; // Header row remains unchanged
    const dataOnly = visibleRows.slice(1); // Data rows only

    // Adjust rows and columns to center the input
    const centerRow = Math.floor(dataOnly.length / 2);
    const centerCol = Math.floor(headersRow.length / 2);

    // Swap rows to bring the desired row to the center
    const rowDiff = centerRow - centerRowIndex;
    const adjustedRows = [...dataOnly.slice(rowDiff), ...dataOnly.slice(0, rowDiff)];

    // Swap columns to bring the desired column to the center
    const colDiff = centerCol - centerColIndex;
    const adjustedHeaders = [...headersRow.slice(colDiff), ...headersRow.slice(0, colDiff)];
    const adjustedData = adjustedRows.map(row => [...row.slice(colDiff), ...row.slice(0, colDiff)]);

    // Combine headers and adjusted data
    const finalData = [adjustedHeaders, ...adjustedData];

    console.log("Adjusted map data:", finalData); // Debug
    displayMapWithHighlight(finalData, centerRow, centerCol); // Center cell is now visually centered
}

// Add event listener for the "Update Map" button
document.getElementById('updateButton').addEventListener('click', reCenterMap);
