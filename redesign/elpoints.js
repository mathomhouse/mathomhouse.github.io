const buildingData = [
    { name: 'Expedition Outpost', max: 32, points: 10 },
    { name: 'Expedition Base', max: 8, points: 30 },
    { name: 'Arsenal', max: 8, points: 20 },
    { name: 'Military Base', max: 8, points: 20 },
    { name: 'Military Fortress', max: 4, points: 80 },
    { name: 'Research Facility', max: 12, points: 50 },
];
const eternalCity = { name: 'Eternal City', max: 1, points: 300 };

const serverColors = ['#c9a84c', '#4ade80', '#f87171', '#3b82f6', '#a78bfa', '#fb923c', '#2dd4bf', '#e879f9'];

let hpmChart, projectionChart;

// Start with an empty array of servers
const state = {
    servers: []
};

function addAlliance() {
    state.servers.push({
        buildingCounts: Array(buildingData.length).fill(0),
        hasEternal: false,
        label: `Alliance ${state.servers.length + 1}`,
        currentPoints: 0,
    });
    renderCards();
}

function renderCards() {
    const container = document.getElementById("allianceContainer");
    if (!container) return;
    container.innerHTML = "";

    state.servers.forEach((server, sIndex) => {
        const card = document.createElement("div");
        card.className = "alliance-card";
        card.innerHTML = `
            <div class="card-header">
                <input type="text" value="${server.label}" oninput="state.servers[${sIndex}].label = this.value; updateCharts();">
                <button class="remove-btn" onclick="removeServer(${sIndex})">×</button>
            </div>
            <div class="card-body">
                <div class="stat-row">
                    <label>Current Points</label>
                    <input type="number" value="${server.currentPoints}" oninput="updateCurrentPoints(${sIndex}, this.value)">
                </div>
                <div class="buildings-grid">
                    ${buildingData.map((b, bIndex) => `
                        <div class="building-control">
                            <span>${b.name} (${b.points})</span>
                            <div class="stepper">
                                <button onclick="adjustBuilding(${sIndex}, ${bIndex}, -1)">-</button>
                                <input type="number" class="manual-entry" value="${server.buildingCounts[bIndex]}" 
                                       onchange="manualBuildingEntry(${sIndex}, ${bIndex}, this.value)">
                                <button onclick="adjustBuilding(${sIndex}, ${bIndex}, 1)">+</button>
                            </div>
                        </div>
                    `).join('')}
                    <div class="building-control">
                        <span>Eternal City (300)</span>
                        <input type="checkbox" ${server.hasEternal ? 'checked' : ''} 
                               onchange="toggleEternal(${sIndex}, this.checked)">
                    </div>
                </div>
            </div>
            <div class="card-footer">
                <div>HPM: <span class="gold-text" id="hpm-${sIndex}">0</span></div>
                <div>Proj: <span class="gold-text" id="proj-${sIndex}">0</span></div>
            </div>
        `;
        container.appendChild(card);
    });
    calculatePoints();
}

// Logic to check if the total buildings across all teams exceeds the map max
function getGlobalTotal(buildingIndex) {
    return state.servers.reduce((sum, s) => sum + s.buildingCounts[buildingIndex], 0);
}

function adjustBuilding(sIndex, bIndex, delta) {
    const currentGlobal = getGlobalTotal(bIndex);
    const currentVal = state.servers[sIndex].buildingCounts[bIndex];
    
    if (delta > 0 && currentGlobal >= buildingData[bIndex].max) {
        alert(`Limit reached! Only ${buildingData[bIndex].max} ${buildingData[bIndex].name}s exist on the map.`);
        return;
    }
    
    if (currentVal + delta >= 0) {
        state.servers[sIndex].buildingCounts[bIndex] += delta;
        renderCards();
    }
}

function manualBuildingEntry(sIndex, bIndex, value) {
    const val = parseInt(value) || 0;
    const currentOtherTeams = getGlobalTotal(bIndex) - state.servers[sIndex].buildingCounts[bIndex];
    
    if (val + currentOtherTeams > buildingData[bIndex].max) {
        alert(`Invalid amount. Max remaining on map: ${buildingData[bIndex].max - currentOtherTeams}`);
        state.servers[sIndex].buildingCounts[bIndex] = Math.max(0, buildingData[bIndex].max - currentOtherTeams);
    } else {
        state.servers[sIndex].buildingCounts[bIndex] = Math.max(0, val);
    }
    renderCards();
}

function updateCurrentPoints(sIndex, val) {
    state.servers[sIndex].currentPoints = parseInt(val) || 0;
    calculatePoints();
}

function toggleEternal(sIndex, checked) {
    // Optional: Add logic here to ensure only one team can hold Eternal City
    state.servers[sIndex].hasEternal = checked;
    calculatePoints();
}

function removeServer(index) {
    state.servers.splice(index, 1);
    renderCards();
}

function resetAll() {
    state.servers = [];
    addAlliance(); // Restart with one fresh card
}

function calculatePoints() {
    const endTimeValue = document.getElementById("endTimeInput").value;
    const now = new Date();
    const end = new Date(endTimeValue);
    const minutesRemaining = (endTimeValue && end > now) ? Math.floor((end - now) / 60000) : 0;

    state.servers.forEach((s, i) => {
        let hpm = s.buildingCounts.reduce((sum, count, bIndex) => sum + count * buildingData[bIndex].points, 0);
        if (s.hasEternal) hpm += eternalCity.points;
        
        const projected = s.currentPoints + (hpm * minutesRemaining);
        
        const hpmEl = document.getElementById(`hpm-${i}`);
        const projEl = document.getElementById(`proj-${i}`);
        if (hpmEl) hpmEl.textContent = hpm.toLocaleString();
        if (projEl) projEl.textContent = Math.round(projected).toLocaleString();
    });
    updateCharts();
}

function updateCharts() {
    // Placeholder for your chart logic
}

// Startup
document.addEventListener("DOMContentLoaded", () => {
    addAlliance();
});