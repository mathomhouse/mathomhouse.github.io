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
const state = { servers: [] };

/** --- UI CORE --- **/

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
        
        // This line applies the gold glow when the checkbox is hit
        card.className = `alliance-card ${server.hasEternal ? 'has-eternal' : ''}`;
        
        card.innerHTML = `
            <button class="remove-btn" onclick="removeServer(${sIndex})">×</button>
            
            <div class="card-header">
                <input type="text" value="${server.label}" oninput="state.servers[${sIndex}].label = this.value; updateCharts();">
            </div>

            <div class="card-body">
                <div class="stat-row main-input">
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
                </div>

                <div class="eternal-control">
                    <label class="eternal-label">
                        <input type="checkbox" ${server.hasEternal ? 'checked' : ''} 
                               onchange="toggleEternal(${sIndex}, this.checked)">
                        <span>Eternal City (300)</span>
                    </label>
                </div>
            </div>

            <div class="card-footer">
                <div class="footer-stat">HPM: <span class="gold-text" id="hpm-${sIndex}">0</span></div>
                <div class="footer-stat">PROJ: <span class="gold-text" id="proj-${sIndex}">0</span></div>
            </div>
        `;
        container.appendChild(card);
    });
    calculatePoints();
}

/** --- LOGIC & LIMITS --- **/

function getGlobalTotal(buildingIndex) {
    return state.servers.reduce((sum, s) => sum + s.buildingCounts[buildingIndex], 0);
}

function adjustBuilding(sIndex, bIndex, delta) {
    const currentGlobal = getGlobalTotal(bIndex);
    if (delta > 0 && currentGlobal >= buildingData[bIndex].max) {
        alert(`Limit reached! Max ${buildingData[bIndex].max} on map.`);
        return;
    }
    const currentVal = state.servers[sIndex].buildingCounts[bIndex];
    if (currentVal + delta >= 0) {
        state.servers[sIndex].buildingCounts[bIndex] += delta;
        renderCards();
    }
}

function manualBuildingEntry(sIndex, bIndex, value) {
    const val = Math.max(0, parseInt(value) || 0);
    const otherTeams = getGlobalTotal(bIndex) - state.servers[sIndex].buildingCounts[bIndex];
    if (val + otherTeams > buildingData[bIndex].max) {
        state.servers[sIndex].buildingCounts[bIndex] = buildingData[bIndex].max - otherTeams;
    } else {
        state.servers[sIndex].buildingCounts[bIndex] = val;
    }
    renderCards();
}

function toggleEternal(sIndex, checked) {
    // If checking this one, uncheck all others first
    if (checked) {
        state.servers.forEach((s, idx) => {
            if (idx !== sIndex) s.hasEternal = false;
        });
    }
    state.servers[sIndex].hasEternal = checked;
    renderCards(); // Re-render to update the UI and checkboxes
}

function updateCurrentPoints(sIndex, val) {
    state.servers[sIndex].currentPoints = parseInt(val) || 0;
    calculatePoints();
}

function removeServer(index) {
    state.servers.splice(index, 1);
    renderCards();
}

function resetAll() {
    state.servers = [];
    addAlliance();
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
        
        document.getElementById(`hpm-${i}`).textContent = hpm.toLocaleString();
        document.getElementById(`proj-${i}`).textContent = Math.round(projected).toLocaleString();
    });
    updateCharts();
}

/** --- CHART LOGIC --- **/

function updateCharts() {
    const labels = state.servers.map(s => s.label || "Unnamed");
    const hpmData = state.servers.map(s => {
        let hpm = s.buildingCounts.reduce((sum, count, idx) => sum + count * buildingData[idx].points, 0);
        return s.hasEternal ? hpm + 300 : hpm;
    });

    // 1. HPM Bar Chart
    if (hpmChart) hpmChart.destroy();
    const ctxHpm = document.getElementById('hpmChart').getContext('2d');
    hpmChart = new Chart(ctxHpm, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Points Per Minute (HPM)',
                data: hpmData,
                backgroundColor: serverColors.slice(0, state.servers.length),
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1
            }]
        },
        options: { responsive: true, plugins: { legend: { display: false } } }
    });

    // 2. Projection Line Chart
    const endTimeValue = document.getElementById("endTimeInput").value;
    if (!endTimeValue) return;

    const now = new Date();
    const end = new Date(endTimeValue);
    const minutesRemaining = Math.floor((end - now) / 60000);
    if (minutesRemaining <= 0) return;

    const timeLabels = [];
    const projectionDatasets = state.servers.map((s, i) => ({
        label: s.label,
        data: [],
        borderColor: serverColors[i % serverColors.length],
        fill: false,
        tension: 0.1
    }));

    // Generate data points every 10 mins to prevent lag
    for (let m = 0; m <= minutesRemaining; m += 10) {
        timeLabels.push(new Date(now.getTime() + m * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        state.servers.forEach((s, i) => {
            let hpm = s.buildingCounts.reduce((sum, count, idx) => sum + count * buildingData[idx].points, 0);
            if (s.hasEternal) hpm += 300;
            projectionDatasets[i].data.push(s.currentPoints + (hpm * m));
        });
    }

    if (projectionChart) projectionChart.destroy();
    const ctxProj = document.getElementById('projectionChart').getContext('2d');
    projectionChart = new Chart(ctxProj, {
        type: 'line',
        data: { labels: timeLabels, datasets: projectionDatasets },
        options: { responsive: true, scales: { x: { display: true }, y: { beginAtZero: false } } }
    });
}

document.addEventListener("DOMContentLoaded", () => addAlliance());