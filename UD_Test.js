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
