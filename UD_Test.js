document.addEventListener("DOMContentLoaded", () => {
    const mapElement = document.getElementById("mapContainer");
    const centerInput = document.getElementById("centerInput");
    const centerButton = document.getElementById("updateButton");
    let mapData = [];

    // Parse Excel and Initialize Map
    fetch("UD_Test.xlsx")
        .then((response) => response.arrayBuffer())
        .then((data) => {
            const workbook = XLSX.read(data, { type: "array" });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            document.getElementById("testLabel").innerText = json;
            // Process Excel data into the desired structure
            json.forEach((row, x) => {
                row.forEach((cell, y) => {
                    if (cell) {
                        const [sid, msid, color] = cell.split(" ");
                        mapData.push({
                            sid: parseInt(sid),
                            msid: parseInt(msid),
                            pos: { x, y },
                            color: `#${color}` || "#FFFFFF", // Default color if undefined
                            name: "",
                        });
                    }
                });
            });

            exportJson(mapData);
            renderMap();
        })
        .catch(error => {
            console.error('Error loading map data: ', error);
            alert('Failed to load map data. Please try again later. If this issue persists please reach out to artu.');
        });

    // Export JSON Data Automatically
    function exportJson(data) {
        const jsonData = JSON.stringify(data, null, 2); // Format JSON with indentation
        const blob = new Blob([jsonData], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "mapData.json"; // The filename for the downloaded file
        a.click();

        URL.revokeObjectURL(url); // Clean up the URL object
    }

    // Render Map
    function renderMap(centerSid = null) {
        mapElement.innerHTML = ""; // Clear existing table
        const grid = {};
        mapData.forEach((cell) => {
            const { pos, sid, msid, color } = cell;
            if (!grid[pos.x]) grid[pos.x] = [];
            grid[pos.x][pos.y] = { sid, msid, color };
        });

        for (const rowKey in grid) {
            const rowElement = document.createElement("tr");
            const row = grid[rowKey];
            row.forEach((cell) => {
                const cellElement = document.createElement("td");
                cellElement.style.backgroundColor = cell.color;
                cellElement.innerHTML = `${cell.sid}<br>${cell.msid}`; // Display sid and msid with a line break
                if (centerSid === cell.sid) {
                    cellElement.classList.add("center");
                }
                rowElement.appendChild(cellElement);
            });
            mapElement.appendChild(rowElement);
        }
    }

    // Center Map on Input
    centerButton.addEventListener("click", () => {
        const centerSid = parseInt(centerInput.value);
        if (!centerSid) {
            alert("Please enter a valid server number.");
            return;
        }
        renderMap(centerSid);
    });
});
