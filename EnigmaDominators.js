import {weekMapData, colors, defaultSid} from './EnigmaDominatorsWeekly.js';

document.addEventListener("DOMContentLoaded", loadMap);
let mapData = [];
let grid = {};
let currentMap = '';
let gridTotalRows = 0;
let gridTotalCols = 0;
let centeredSid = defaultSid;
let highlightedSids = '';
let serverNumbers = [];

// Load the JSON map data
function loadMap(){
    let currentWeekNumber = weekMapData.length - 1;
    let currentWeek = weekMapData[currentWeekNumber];
    currentMap = currentWeek.round;
    loadEDRounds();
    loadJsonMap(currentWeek.file);
}

function loadEDRounds(){
    let edrounds = document.getElementById("edrounds");
    weekMapData.forEach((round, idx) => {
		let selected = weekMapData.length - 1 === idx ? 'selected="selected"' : "";
		edrounds.innerHTML += `<option class="opts" ${selected} value=${round.round}>Round: ${round.round}</option>`;
	});
}

function loadJsonMap(fileName){
    fetch(fileName)
    .then((response) => response.json())
    .then((data) => {
        //we have the raw json data
        gridTotalRows = data.maxX + 1;
        gridTotalCols = data.maxY + 1;   //this is 0 based so add 1

        mapData = [
            ...data.cityInfos
            .filter(city => (city.pos.x >= 0 && city.pos.y >= 0)) //exclude Void City, which is -1, -1
            .map(city => ({
              sid: mapCityInfoSpecId(city.specId), // Use specId for cityInfos
              pos: {
                ...city.pos,
                x: city.pos.x,
                y: data.maxY - city.pos.y
              },
              //pos: city.pos,
              msid: mapCityInfoMSids(city.mSid),
              name: "",
              color: city.color
            })),
            ...data.serverInfos.map(server => ({
              sid: server.sid, // Use sid for serverInfos
              pos: {
                ...server.pos,
                x: server.pos.x,
                y: data.maxY - server.pos.y
              },
             // pos: server.pos,
              msid: `k${server.mSid}`,
              name: "",
              color: server.color
            }))
          ];

        centerMap(mapData, centeredSid);  
        renderMap(mapData);  
        highlightCells();
    })
    .catch(error =>{
        console.error('Error loading map data: ', error);
        alert('Failed to load map data. Please try again later. If this issue persists please reach out to artu.');
    });
}

function mapCityInfoSpecId(specId){
    if (specId >= 597 && specId <= 606){  //level 3 NC
        return `Lvl 3 NC ${specId - 596}`;
    }
    else if (specId >= 607 && specId <= 656){  //level 2 NC
        return `Lvl 2 NC ${specId - 606}`;
    }
    else {  //level 1
        return `Lvl 1 NC ${specId - 655}`;
    }
}

function mapCityInfoMSids(mSid){
    if (mSid === 0){
        return '';
    }
    else{
        return `k${mSid}`
    }
}

// Render Map
function renderMap(data) {
    let mapElement = document.getElementById("mapContainer");
    //set variables to find center of data for highlighting purposes
    let centerIndex = Math.floor(gridTotalRows / 2);

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
                <span class="sid">${cell.sid}</span>
                <span class="msid">${cell.msid}</span>
            `;
            cellElement.classList.add(cell.color);
            rowElement.appendChild(cellElement);
        });
        mapElement.appendChild(rowElement);
    }

    higlightFactions();
}

function centerMap(data, sid){
     // Find the cell containing the input value
    let centerRowIndex = -1;
    let centerColIndex = -1;

    for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
        let cell = data[rowIndex];
        if (cell.sid === parseInt(sid)) {
            centerRowIndex = cell.pos.x;
            centerColIndex = cell.pos.y;
            break;
        }
    }

    if (centerRowIndex === -1 || centerColIndex === -1) {
        alert('Server number not found in map data.');
        return;
    }
    centeredSid = sid;
    // Wrap the map
    wrapMap(data, centerRowIndex, centerColIndex);
}

// Update Map
function updateMap() {
    //if everything is the same, do nothing
    //if the selected round has changed, retrieve new data, re-render
    //else just re-render the current map (re-centers and re-highlights)
    var weekSelect = document.getElementById('edrounds');
    var selectedRound = weekSelect.value;
    let serverNumberString = document.getElementById('highlightServers').value.trim();
    let centerInput = document.getElementById('centerInput').value.trim();
    if (centerInput === '')
    {
        centerInput = centeredSid;
    }

    if(selectedRound === currentMap && serverNumberString === highlightedSids && 
        centerInput.toString() === centeredSid.toString()){
        return;
    }
    else if(selectedRound !== currentMap){
        var round = weekMapData.find(round => round.round === selectedRound);
        currentMap = selectedRound;
        centeredSid = centerInput;
        loadJsonMap(round.file);
    }
    else{
        centeredSid = centerInput;
        centerMap(mapData, centerInput);
        renderMap(mapData);  
        highlightCells();
    }
}

// Wrap the map like a globe
function wrapMap(dataRows, centerRow, centerCol) {
    // Create a grid for quick access
    const grid = Array.from({ length: gridTotalRows }, () => Array(gridTotalCols).fill(null));
    dataRows.forEach(cell => {
        grid[cell.pos.x][cell.pos.y] = cell;
    });

    // create the empty cells if they aren't there
    grid.forEach((row, x) => {
        row.forEach((cell, y) => {
            if (cell === null){
                grid[x][y] = {
                    sid: '',
                    pos:{
                        x: x, 
                        y: y
                    },
                    msid: '',
                    name: '',
                    color: 0
                }
            }
        });
    });
    // Create a wrapped version of the map
    const wrappedRows = [];

    for (let rowOffset = -Math.floor(gridTotalRows / 2); rowOffset < Math.ceil(gridTotalRows / 2); rowOffset++) {
        const rowIndex = (centerRow + rowOffset + gridTotalRows) % gridTotalRows; // Wrap vertically
        for (let colOffset = -Math.floor(gridTotalCols / 2); colOffset < Math.ceil(gridTotalCols / 2); colOffset++) {
            const colIndex = (centerCol + colOffset + gridTotalCols) % gridTotalCols; // Wrap horizontally
            wrappedRows.push(grid[rowIndex][colIndex]);
        }
    }

    mapData = wrappedRows;
    resetPosData();
}

//reset the pos.x and pos.y data for each server
function resetPosData() {
    // Update the `pos.x` and `pos.y` properties
    mapData.forEach((item, index) => {
        item.pos.x = Math.floor(index / gridTotalRows); // Row number
        item.pos.y = index % gridTotalRows; // Column number
    });
}

function getHighlightedCells(){
    let serverNumberString = document.getElementById('highlightServers').value.trim();
    highlightedSids = serverNumberString;
    let serverStrings = serverNumberString.split(' ');
    if (serverStrings === undefined || serverStrings.length == 0 || 
        (serverStrings.length == 1 && serverStrings[0] == '')){
            serverNumbers = [];
    }
    else{
        serverNumbers = []; //reset and rebuild
        serverStrings.forEach(num => {
            serverNumbers.push(parseInt(num.trim()));
        });
    }
}

//highlight additional cells
function highlightCells() {
    getHighlightedCells();   
    let mapElement = document.getElementById("mapContainer");
       
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
            } 
             else {
                // Remove "highlight" class in case it was previously applied
                if (cell.classList.contains('additionalHighlight')) {
                    cell.classList.remove('additionalHighlight');
                }
            }
        });
    });
}

//highlight the factions
function higlightFactions() {
    let mapElement = document.getElementById("mapContainer");

    //faction data is the msid of each server. Need to create a list of msid, and group by at the same time to get a count
    // Create a map to count the occurrences of each msid
    const msidCounts = mapData.reduce((acc, item) => {
        acc[item.msid] = (acc[item.msid] || 0) + 1;
        return acc;
    }, {});

     // Step 2: Filter msid's with count >= 2
     const frequentMsids = Object.entries(msidCounts)
        .filter(([msid, count]) => count >= 2)
        .map(([msid]) => parseInt(msid.slice(1), 10)); // Ensure msid is an integer

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
            const msidInt = parseInt(msid.slice(1), 10);

            // Check if cellValue matches any value in serverNumbers array
            if (frequentMsids.includes(msidInt)) {
                let index = frequentMsids.indexOf(msidInt) % colors.length;
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
document.getElementById('updateButton').addEventListener('click', updateMap);
