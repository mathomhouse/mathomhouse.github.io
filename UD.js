document.addEventListener('DOMContentLoaded', loadMap);

let sheetData = []; // To store the map data

// Load the JSON map data
function loadMap() {
    fetch('UD_MAP.json')
        .then(response => response.json())
        .then(data => {
            sheetData = data;
            displayMap(sheetData);
        })
        .catch(error => {
            console.error('Error loading map data:', error);
            alert('Failed to load map data. Please try again later.');
        });
}

// Display the map as a table
function displayMap(data) {
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

// Placeholder for re-centering the map (to be implemented later)
document.getElementById('updateButton').addEventListener('click', () => {
    alert('Re-centering is not implemented yet!');
});
