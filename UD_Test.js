document.addEventListener("DOMContentLoaded", loadMap);
let mapData = [];

// Load the JSON map data
function loadMap() {
    // Parse Excel and Initialize Map
    fetch("UD_Test.xlsx")
    .then((response) => response.arrayBuffer())
    .then((data) => {
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const range = XLSX.utils.decode_range(sheet['!ref']); // Get sheet dimensions

        // Iterate through cells in the range
        for (let row = range.s.r; row <= range.e.r; row++) {
            for (let col = range.s.c; col <= range.e.c; col++) {
                const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
                const cell = sheet[cellAddress];

                if (cell) {
                    const parts = String(cell.v).split(/\r?\n/); // Split by line break
                    const sid = parseInt(parts[0], 10) || null;
                    const msid = parts.length > 1 ? parseInt(parts[1], 10) : null;

                    // Extract background color
                    const style = sheet['!cols'] || {};
                    const color = cell.s && cell.s.fgColor
                        ? `#${cell.s.fgColor.rgb}` // Get RGB color
                        : "#FFFFFF"; // Default to white

                    mapData.push({
                        sid: sid,
                        msid: msid,
                        pos: { x: row, y: col },
                        color: color,
                        name: "",
                    });
                }
            }
        }

        //exportJson(mapData);
        displayMap(mapData);
    })
    .catch(error => {
        console.error('Error loading map data: ', error);
        alert('Failed to load map data. Please try again later. If this issue persists please reach out to artu.');
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
            td.style.backgroundColor = cell.color || '#FFFFFF';
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
        alert('Please enter a valid server number.');
        return;
    }

    const dataRows = mapData;

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
    const wrappedData = wrapMap(dataRows, centerRowIndex, centerColIndex);

    // Render the map with the centered and highlighted cell
    displayMapWithHighlight(wrappedData);
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
