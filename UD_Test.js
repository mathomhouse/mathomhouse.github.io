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

            mapData = json.map((row, x) => 
                row.map((cell, y) => {
                    const [sid, msid, color] = cell.split(" ");
                    return {
                        sid: parseInt(sid),
                        msid: parseInt(msid),
                        color: `#${color}`,
                        pos: { x, y },
                        name: "",
                    };
                })
            );
            renderMap();
        })
        .catch(error => {
            console.error('Error loading map data: ', error);
            alert('Failed to load map data. Please try again later. If this issue persists please reach out to artu.');
        });

    // Render Map
    function renderMap(centerSid = null) {
        mapElement.innerHTML = "";
        const size = mapData.length; // Assuming square map
        mapElement.style.gridTemplateColumns = `repeat(${size}, auto)`;

        mapData.forEach((row) => {
            row.forEach((cell) => {
                const cellDiv = document.createElement("div");
                cellDiv.className = "cell";
                cellDiv.style.backgroundColor = cell.color;
                cellDiv.textContent = cell.sid;

                if (centerSid === cell.sid) {
                    cellDiv.classList.add("center");
                }
                mapElement.appendChild(cellDiv);
            });
        });
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
