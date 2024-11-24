document.getElementById('fileInput').addEventListener('change', handleFile);
document.getElementById('updateButton').addEventListener('click', updateMap);

let sheetData = []; // To store Excel data

// Read the Excel file
function handleFile(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        displayMap(sheetData);
    };
    reader.readAsArrayBuffer(file);
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

// Update the map based on user input
function updateMap() {
    const centerInput = document.getElementById('centerInput').value;
    if (!centerInput) {
        alert('Please enter a valid center point!');
        return;
    }

    // Example logic to adjust map based on centerInput (e.g., re-center around a point)
    // You can write your own logic here depending on how you want the map adjusted.
    alert(`Re-centering map around ${centerInput} (this functionality is a placeholder!)`);
    // Placeholder: redisplay the same map for now
    displayMap(sheetData);
}