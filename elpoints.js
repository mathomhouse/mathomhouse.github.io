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
        label: `Alliance/Server ${state.servers.length + 1}`,
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
    const now = new Date();
    const endTimeValue = document.getElementById("endTimeInput").value;
    const end = new Date(endTimeValue);
    
    // Define these clearly so the charts can see them
    const validEndTime = endTimeValue && end > now;
    const minutesRemaining = validEndTime ? Math.floor((end - now) / 60000) : 0;

    state.servers.forEach((s, i) => {
        // 1. Calculate HPM
        let hpm = s.buildingCounts.reduce((sum, count, bIdx) => sum + count * buildingData[bIdx].points, 0);
        if (s.hasEternal) hpm += 300;

        // 2. Calculate Projection
        const projected = s.currentPoints + (hpm * minutesRemaining);

        // 3. Update UI Labels in the cards
        const hpmEl = document.getElementById(`hpm-${i}`);
        const projEl = document.getElementById(`proj-${i}`);
        if (hpmEl) hpmEl.textContent = hpm.toLocaleString();
        if (projEl) projEl.textContent = Math.round(projected).toLocaleString();
    });

    updateCharts(validEndTime, minutesRemaining);
}

function updateCharts(validEndTime, minutesRemaining) {
    const labels = state.servers.map((s, i) => s.label || `Alliance ${i + 1}`);
    const hpmData = state.servers.map(s => {
        let hpm = s.buildingCounts.reduce((sum, count, bIdx) => sum + count * buildingData[bIdx].points, 0);
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
                label: 'Points Per Minute',
                data: hpmData,
                backgroundColor: serverColors.slice(0, state.servers.length),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } }
        }
    });

    // 2. Projected Final Totals Chart
    if (!validEndTime) {
        if (projectionChart) projectionChart.destroy();
        return;
    }

    const projectedFinalData = state.servers.map(s => {
        let hpm = s.buildingCounts.reduce((sum, count, bIdx) => sum + count * buildingData[bIdx].points, 0);
        if (s.hasEternal) hpm += 300;
        return s.currentPoints + (hpm * minutesRemaining);
    });

    if (projectionChart) projectionChart.destroy();
    const ctxProj = document.getElementById('projectionChart').getContext('2d');
    projectionChart = new Chart(ctxProj, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Projected Final Score',
                data: projectedFinalData,
                backgroundColor: serverColors.slice(0, state.servers.length).map(c => c + 'AA'),
                borderColor: serverColors.slice(0, state.servers.length),
                borderWidth: 2
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { beginAtZero: true, ticks: { color: '#7a8099' } },
                y: { ticks: { color: '#c9a84c', font: { weight: 'bold' } } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

document.addEventListener("DOMContentLoaded", () => addAlliance());