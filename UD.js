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
            displayMap(sheetData); // Display full map initially
        })
        .catch(error => {
            console.error('Error loading map data:', error);
            alert('Failed to load map data. Please try again later.');
        });
}

// Display the map as a table
function displayMap(data) {
    console.log("Data passed to displayMap:", data); // Log the data
    const container = document.getElementById('mapContainer');
    container.innerHTML = ''; // Clear previous content
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

// Re-center the map
function reCenterMap() {
    const centerInput = document.getElementById('centerInput').value; // Get user input
    if (!centerInput) {
        alert('Please enter a valid center point (e.g., 164,348)');
        return;
    }

    const [centerRowHeader, centerColHeader] = centerInput.split(',').map(Number); // Parse input
    const headers = sheetData[0]; // Column headers
    const dataRows = sheetData.slice(1); // Rows of data

    // Find indexes for center row and column
    const colIndex = headers.indexOf(centerColHeader);
    const rowIndex = dataRows.findIndex(row => row[0] === centerRowHeader);

    if (colIndex === -1 || rowIndex === -1) {
        alert('Center point not found in map data.');
        return;
    }

    // Define range (adjust as needed for desired size)
    const range = 5; // Number of rows/columns around center point
    const startRow = Math.max(0, rowIndex - range);
    const endRow = Math.min(dataRows.length, rowIndex + range + 1);
    const startCol = Math.max(0, colIndex - range);
    const endCol = Math.min(headers.length, colIndex + range + 1);

    // Extract visible data
    const visibleData = [
        headers.slice(startCol, endCol), // Column headers
        ...dataRows.slice(startRow, endRow).map(row => row.slice(startCol, endCol))
    ];

    console.log("Visible data:", visibleData); // Log visible data for debugging
    displayMap(visibleData); // Redisplay map
}

// Add event listener for the "Update Map" button
document.getElementById('updateButton').addEventListener('click', reCenterMap);
