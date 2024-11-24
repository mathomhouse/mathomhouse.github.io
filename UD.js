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

// Display the map as a table
function displayMapWithHighlight(data) {
    console.log("Data passed to displayMapWithHighlight:", data); // Log the data
    const container = document.getElementById('mapContainer');
    container.innerHTML = ''; // Clear previous content
    const table = document.createElement('table');
    data.forEach(row => {
        const tr = document.createElement('tr');
        row.forEach(cell => {
            const td = document.createElement('td');
            if (typeof cell === 'object' && cell.isCenter) {
                td.textContent = cell.value || ''; // Handle empty cells
                td.style.backgroundColor = 'yellow'; // Highlight the center cell
                td.style.fontWeight = 'bold'; // Optional: Make the text bold
            } else {
                td.textContent = cell.value || ''; // Normal cell
            }
            tr.appendChild(td);
        });
        table.appendChild(tr);
    });
    container.appendChild(table);
}

// Re-center the map
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

    // Highlight the center point
    const highlightedData = sheetData.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
            if (rowIndex === centerRowIndex + 1 && colIndex === centerColIndex) {
                return { value: cell, isCenter: true }; // Mark as center
            }
            return { value: cell, isCenter: false }; // Normal cell
        })
    );

    console.log("Highlighted data:", highlightedData); // Debug
    displayMapWithHighlight(highlightedData); // Display full map with highlighted center
}

// Add event listener for the "Update Map" button
document.getElementById('updateButton').addEventListener('click', reCenterMap);
