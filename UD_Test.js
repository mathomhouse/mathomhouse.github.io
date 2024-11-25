document.addEventListener("DOMContentLoaded", loadMap);
let mapData = [];
let grid = {};

// Load the JSON map data
function loadMap() {
    //event.preventDefault();
    // Parse Excel and Initialize Map
    fetch("UD_Test.xlsx")
    //fetch("https://mathomhouse.github.io/UD_Test.xlsx")   //for local testing
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
        renderMap(mapData);
    })
    .catch(error => {
        console.error('Error loading map data: ', error);
        alert('Failed to load map data. Please try again later. If this issue persists please reach out to artu.');
    });
}

// Render Map
function renderMap(data) {
    let mapElement = document.getElementById("mapContainer");
    //set variables to find center of data for highlighting purposes
    const gridSize = Math.ceil(Math.sqrt(data.length));
    let centerIndex = Math.floor(gridSize / 2);

    mapElement.innerHTML = ""; // Clear existing table
    //const grid = {};
    data.forEach((cell) => {
        const { pos, sid, msid, color } = cell;
        if (!grid[pos.x]) grid[pos.x] = [];
        grid[pos.x][pos.y] = { sid, msid, color };
    });
    grid[centerIndex][centerIndex].color = 'highlighted';

    for (const rowKey in grid) {
        const rowElement = document.createElement("tr");
        const row = grid[rowKey];
        row.forEach((cell) => {
            const cellElement = document.createElement("td");
            //cellElement.style.backgroundColor = cell.color;
            cellElement.innerHTML = `${cell.sid}<br>${cell.msid}`; // Display sid and msid with a line break
            cellElement.classList.add(cell.color);
            rowElement.appendChild(cellElement);
        });
        mapElement.appendChild(rowElement);
    }
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
        let cell = dataRows[rowIndex];
        if (cell.sid === parseInt(centerInput)){
            centerRowIndex = cell.pos.x;
            centerColIndex = cell.pos.y;
            break;
        }
    }

    if (centerRowIndex === -1 || centerColIndex === -1) {
        alert('Server number not found in map data.');
        return;
    }

    console.log(`Centering on value: ${centerInput} at Row: ${centerRowIndex}, Column: ${centerColIndex}`);

    // Wrap the map
    const wrappedData = wrapMap(dataRows, centerRowIndex, centerColIndex);

    // Render the map with the centered and highlighted cell
    renderMap(wrappedData);
}

// Wrap the map like a globe
function wrapMap(dataRows, centerRow, centerCol) {
    //dataRows is a list of all cells, not an array of arrays
    //assuming the map is square, then the total number of rows and columns should each be the square root of the total number of cells
    const totalRows = Math.sqrt(dataRows.length);
    const totalCols = totalRows;

    // Create a wrapped version of the map
    const wrappedRows = [];

    for (let rowOffset = -Math.floor(totalRows / 2); rowOffset <= Math.floor(totalRows / 2); rowOffset++) {
        const rowIndex = (centerRow + rowOffset + totalRows) % totalRows; // Ensure wrap-around
        for (let colOffset = -Math.floor(totalCols / 2); colOffset <= Math.floor(totalCols / 2); colOffset++) {
            const colIndex = (centerCol + colOffset + totalCols) % totalCols; // Ensure wrap-around
            //find the correct cell in the original list
            dataRows.every(cell=> {
                if (cell.pos.x === rowIndex && cell.pos.y === colIndex){
                    wrappedRows.push(cell);
                    return false;
                }
                return true;
            });
        }
    }
    resetPosData(wrappedRows);
    mapData = wrappedRows;
    return wrappedRows;
}

function resetPosData(data){
    // Calculate the size of the square grid
    const gridSize = Math.ceil(Math.sqrt(data.length));
    let centerIndex = Math.floor(gridSize / 2);
    
    // Update the `pos.x` and `pos.y` properties
    data.forEach((item, index) => {
      item.pos.x = Math.floor(index / gridSize); // Row number
      item.pos.y = index % gridSize; // Column number
    });
}

function highlightCells(){
    let mapElement = document.getElementById("mapContainer");
    let serverNumberString = document.getElementById('highlightServers').value.trim();
    let serverStrings = serverNumberString.split(',');
    let serverNumbers = [];
    serverStrings.forEach(num => {
        serverNumbers.push(parseInt(num.trim()));
    });

     // Convert the innerHTML to a DOM structure for easier manipulation
     const rows = mapElement.querySelectorAll('tr'); // Get all rows in the table
    
     // Loop through each row and each cell to check and highlight
     rows.forEach(row => {
         const cells = row.querySelectorAll('td'); // Get all cells in the row
         cells.forEach(cell => {
             // Extract text1 value from the cell (value before <br>)
             const cellValue = cell.innerHTML.split('<br>')[0]; // Text1 is the value before <br>
             
             // Check if cellValue matches any value in serverNumbers array
             if (serverNumbers.includes(parseInt(cellValue))) {
                 // Add the "highlight" class
                 if (!cell.classList.contains('highlighted')){
                    cell.classList.add('additionalHighlight');
                 }
             } else {
                 // Remove "highlight" class in case it was previously applied
                 cell.classList.remove('additionalHighlight');
             }
         });
     });
}

// Add event listener for the "Update Map" button
document.getElementById('updateButton').addEventListener('click', reCenterMap);
document.getElementById('highlightServersButton').addEventListener('click', highlightCells);
