document.addEventListener("DOMContentLoaded", loadMap);
let mapData = [];
let grid = {};
let colors = [
    '#FF5733', '#33FF57', '#3357FF', '#F39C12', '#9B59B6',
    '#1ABC9C', '#E74C3C', '#3498DB', '#2ECC71', '#D35400'
];

// Load the JSON map data
function loadMap(){
    loadAndConvertCSV(); 
}

async function loadAndConvertCSV() {
    fetch('https://mathomhouse.github.io/ED_Prep_FactionDataRound3.csv')
    .then((response) => response.text())
    .then((data) => {
        //const csvString = response.text();
        const csvData = csvToJson(data);
        mapData = mapToUDJson(csvData);

        console.log(JSON.stringify(mapData, null, 2));

        renderMap(mapData);
    })
    .catch(error =>{
        console.error('Error loading map data: ', error);
        alert('Failed to load map data. Please try again later. If this issue persists please reach out to artu.');
    });
}

function csvToJson(csvString) {
    const rows = csvString.split('\n')
        .map(row => row.trim())
        .filter(row => row.length > 0); // Split into rows
    const headers = rows.shift().split(','); // Extract headers

    const jsonArray = rows.map(row => {
        const values = row.split(',');
        return headers.reduce((acc, header, index) => {
            acc[header.trim()] = values[index] ? values[index].trim() : '';
            return acc;
        }, {});
    });

    return jsonArray;
}

function mapToUDJson(csvData) {
    //Servers 1-19 - those are empty spaces on the map 
    //Servers 4xaa - those are LV 1 Neutral Buildings (aa is the number of the neutral building)
    //Servers 5xaa - those are LV 2 Neutral Buildings (aa is the number of the neutral building)
    //Servers 6xaa - those are LV 3 Neutral Buildings (aa is the number of the neutral building)
    return csvData.map(row => {
        let sidValue = parseInt(row['Server'], 10) || row['Server'];
        let newSidValue = mapNCValues(row, sidValue, 'sid');

        let msidValue =  parseInt(row['Scan_ParsedFaction'], 10) || row['Scan_ParsedFaction'];
        let newMsidValue = msidValue;//mapNCValues(row, msidValue, 'msid');
        return {
            sid: newSidValue,
            pos: {
                x: (parseInt(row['Row'], 10) - 1) || 0, //subtract 1 to make this 0 based
                y: (parseInt(row['Column'], 10) - 1) || 0 //subtract 1 to make this 0 based
            },
            msid: newMsidValue,
            name: row['Name'] || '',
            color: row['Color'] ? parseInt(row['Color'], 10) : undefined
        };
    });

}

function mapNCValues(row, sidValue, sidOrMsid){
    if(typeof sidValue === 'number'){
        if (sidValue >= 0 && sidValue <= 19) {
            sidValue = ''; // Servers 1-19 are empty spaces. msid 0 is empty space.
        } 
        const match = sidValue.toString().match(/^([4-6])\d(\d{2})$/); // Match pattern like 4xaa
        if(match){
            const level = match[1] - 3; //first digit is 4, 5, 6. Corresponds to Lvl 1, 2, 3
            const lastTwoDigits = match[2];
            if (sidOrMsid === 'sid') {
                return `Lvl ${level} NC${lastTwoDigits}`;
            }

            if (sidOrMsid === 'msid') {
                return ''; // All msid cases result in an empty string
            }
        }
    }
   
    return sidValue;
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
    grid[centerIndex][centerIndex].color = 'highlighted';   //highlight the center element

    for (const rowKey in grid) {
        const rowElement = document.createElement("tr");
        const row = grid[rowKey];
        row.forEach((cell) => {
            const cellElement = document.createElement("td");

            cellElement.innerHTML = `
                <span class="sid">${cell.sid}</span><br>
                <span class="msid">${cell.msid}</span>
            `;
            cellElement.classList.add(cell.color);
            rowElement.appendChild(cellElement);
        });
        mapElement.appendChild(rowElement);
    }

    higlightLargestFactions();
}

// Center and highlight a specific cell
function reCenterMap() {
    const centerInput = document.getElementById('centerInput').value.trim();
    if (!centerInput) {
        highlightCells();
        return;
    }

    const dataRows = mapData;

    // Find the cell containing the input value
    let centerRowIndex = -1;
    let centerColIndex = -1;

    for (let rowIndex = 0; rowIndex < dataRows.length; rowIndex++) {
        let cell = dataRows[rowIndex];
        if (cell.sid === parseInt(centerInput)) {
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

    highlightCells();
}

// Wrap the map like a globe
function wrapMap(dataRows, centerRow, centerCol) {
    // Assuming the map is square
    const totalRows = Math.sqrt(dataRows.length);
    const totalCols = totalRows;

    // Create a grid for quick access
    const grid = Array.from({ length: totalRows }, () => Array(totalCols).fill(null));
    dataRows.forEach(cell => {
        grid[cell.pos.x][cell.pos.y] = cell;
    });

    // Create a wrapped version of the map
    const wrappedRows = [];

    for (let rowOffset = -Math.floor(totalRows / 2); rowOffset < Math.ceil(totalRows / 2); rowOffset++) {
        const rowIndex = (centerRow + rowOffset + totalRows) % totalRows; // Wrap vertically
        for (let colOffset = -Math.floor(totalCols / 2); colOffset < Math.ceil(totalCols / 2); colOffset++) {
            const colIndex = (centerCol + colOffset + totalCols) % totalCols; // Wrap horizontally
            wrappedRows.push(grid[rowIndex][colIndex]);
        }
    }

    resetPosData(wrappedRows);
    mapData = wrappedRows;
    return wrappedRows;
}

//reset the pos.x and pos.y data for each server
function resetPosData(data) {
    // Calculate the size of the square grid
    const gridSize = Math.ceil(Math.sqrt(data.length));
    //let centerIndex = Math.floor(gridSize / 2);

    // Update the `pos.x` and `pos.y` properties
    data.forEach((item, index) => {
        item.pos.x = Math.floor(index / gridSize); // Row number
        item.pos.y = index % gridSize; // Column number
    });
}

//highlight additional cells
function highlightCells() {
    let mapElement = document.getElementById("mapContainer");
    let serverNumberString = document.getElementById('highlightServers').value.trim();
    let serverStrings = serverNumberString.split(' ');
    if (serverStrings === undefined || serverStrings.length == 0 || 
        (serverStrings.length == 1 && serverStrings[0] == '')){
        return;
    }
    
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
            // Extract sid value from the cell (value before <br>)
            const cellValue = cell.querySelector('.sid').textContent.trim(); // Extract the content of the span with class "sid"

            // Check if cellValue matches any value in serverNumbers array
            if (serverNumbers.includes(parseInt(cellValue))) {
                // Add the "highlight" class
                if (!cell.classList.contains('highlighted')) {
                    cell.classList.add('additionalHighlight');
                }
            } else {
                // Remove "highlight" class in case it was previously applied
                cell.classList.remove('additionalHighlight');
            }
        });
    });
}

//highlight the 10 largest factions
function higlightLargestFactions() {
    let mapElement = document.getElementById("mapContainer");

    //faction data is the msid of each server. Need to create a list of msid, and group by at the same time to get a count
    // Create a map to count the occurrences of each msid
    const msidCounts = mapData.reduce((acc, item) => {
        acc[item.msid] = (acc[item.msid] || 0) + 1;
        return acc;
    }, {});

    // Convert the counts object into a sorted array of [msid, count] pairs
    const sortedMsids = Object.entries(msidCounts)
        .sort((a, b) => b[1] - a[1]) // Sort by count descending
        .map(([msid, count]) => ({ msid: parseInt(msid), count })); // Format the output

    //console.log(sortedMsids);
    let topFactions = sortedMsids.slice(0, 10);   //currently top 3
    1
    //create our list of the top msid's
    let topmsids = [];
    topFactions.forEach(f =>{
        if (f.count > 1)
            topmsids.push(f.msid);
    });

    //Now go through the HTML and add the styleclass
    // Convert the innerHTML to a DOM structure for easier manipulation
    const rows = mapElement.querySelectorAll('tr'); // Get all rows in the table

    // Loop through each row and each cell to check and highlight
    rows.forEach(row => {
        const cells = row.querySelectorAll('td'); // Get all cells in the row
        cells.forEach(cell => {
            // Extract sid and msid values from the cell (value before <br>)
            const sid = cell.querySelector('.sid').textContent.trim(); // Extract the content of the span with class "sid"
            const msid = cell.querySelector('.msid').textContent.trim(); // Extract the content of the span with class "msid"

            // Convert to integers if needed
            const sidInt = parseInt(sid, 10);
            const msidInt = parseInt(msid, 10);

            // Check if cellValue matches any value in serverNumbers array
            if (topmsids.includes(msidInt)) {
                let index = topmsids.indexOf(msidInt) % colors.length;
                if(msidInt == sidInt){  //faction leader
                    cell.style.background = `radial-gradient(circle, rgba(255, 255, 255, 0) 0%, 
                    ${colors[index]} 100%)`;
                }
                else{
                    cell.style.backgroundColor = colors[index];
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
