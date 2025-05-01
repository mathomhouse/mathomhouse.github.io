const buildingData = [
    { name: 'Expedition Outpost', max: 32, points: 10 },
    { name: 'Expedition Base', max: 8, points: 30 },
    { name: 'Arsenal', max: 8, points: 20 },
    { name: 'Military Base', max: 8, points: 20 },
    { name: 'Military Fortress', max: 4, points: 80 },
    { name: 'Research Facility', max: 12, points: 50 },
  ];
  const eternalCity = { name: 'Eternal City', max: 1, points: 300 };
  const serverCount = 8;

  const tbody = document.querySelector("#honorTable tbody");
  const endTimeInput = document.getElementById("endTimeInput");

  const state = {
    servers: Array.from({ length: serverCount }, () => ({
      buildingCounts: Array(buildingData.length).fill(0),
      hasEternal: false,
      label: '',
      currentPoints: 0,
    }))
  };

  function buildTable() {
    for (let i = 0; i < serverCount; i++) {
      const row = document.createElement("tr");
      row.dataset.server = i;

      // Server label + input
      const labelCell = document.createElement("td");
      const div = document.createElement("div");
      div.className = "server-name";
      const span = document.createElement("span");
      span.className = "server-label";
      span.textContent = `Server/Alliance ${i + 1}`;
      const nameInput = document.createElement("input");
      nameInput.type = "text";
      nameInput.placeholder = "Label";
      nameInput.className = "name-input";
      nameInput.addEventListener("input", () => {
        state.servers[i].label = nameInput.value.trim();
        updateCharts();
      });
      div.appendChild(span);
      div.appendChild(nameInput);
      labelCell.appendChild(div);
      row.appendChild(labelCell);

      // Building dropdowns
      buildingData.forEach((building, bIndex) => {
        const select = document.createElement("select");
        select.dataset.server = i;
        select.dataset.building = bIndex;
        for (let j = 0; j <= building.max; j++) {
          const option = document.createElement("option");
          option.value = j;
          option.textContent = j;
          select.appendChild(option);
        }
        select.addEventListener("change", (e) => {
          const server = +e.target.dataset.server;
          const bIndex = +e.target.dataset.building;
          state.servers[server].buildingCounts[bIndex] = +e.target.value;
          enforceLimits();
          calculatePoints();
        });
        const td = document.createElement("td");
        td.appendChild(select);
        row.appendChild(td);
      });

      // Eternal City checkbox
      const ecCheckbox = document.createElement("input");
      ecCheckbox.type = "checkbox";
      ecCheckbox.dataset.server = i;
      ecCheckbox.addEventListener("change", (e) => {
        const server = +e.target.dataset.server;
        state.servers.forEach((s, idx) => s.hasEternal = false);
        state.servers[server].hasEternal = e.target.checked;
        document.querySelectorAll("input[type='checkbox']").forEach((box, idx) => {
          if (idx !== server) box.checked = false;
        });
        calculatePoints();
      });
      const ecCell = document.createElement("td");
      ecCell.appendChild(ecCheckbox);
      row.appendChild(ecCell);

      const totalCell = document.createElement("td");
      totalCell.className = "total-hpm";
      totalCell.textContent = "0";
      row.appendChild(totalCell);

      const pointsInput = document.createElement("input");
      pointsInput.type = "number";
      pointsInput.min = "0";
      pointsInput.value = "0";
      pointsInput.className = "points-input";
      pointsInput.addEventListener("input", () => {
        state.servers[i].currentPoints = parseInt(pointsInput.value) || 0;
        calculatePoints();
      });
      const currentCell = document.createElement("td");
      currentCell.appendChild(pointsInput);
      row.appendChild(currentCell);

      const projectedCell = document.createElement("td");
      projectedCell.className = "projected-points";
      projectedCell.textContent = "0";
      row.appendChild(projectedCell);

      tbody.appendChild(row);
    }
  }

  function enforceLimits() {
    buildingData.forEach((building, bIndex) => {
      const totalUsed = state.servers.reduce((sum, s) => sum + s.buildingCounts[bIndex], 0);
      const selects = document.querySelectorAll(`select[data-building="${bIndex}"]`);
      selects.forEach(select => {
        const currentValue = +select.value;
        for (let i = 0; i < select.options.length; i++) {
          const optVal = +select.options[i].value;
          const adjustedTotal = totalUsed - currentValue + optVal;
          select.options[i].disabled = adjustedTotal > building.max;
        }
      });
    });
  }

  function calculatePoints() {
    const now = new Date();
    const endTime = new Date(endTimeInput.value);
    const minutesRemaining = (endTime - now) / 60000;

    const rows = tbody.querySelectorAll("tr");
    rows.forEach((row, i) => {
      const server = state.servers[i];
      let hpm = server.buildingCounts.reduce(
        (sum, count, bIndex) => sum + count * buildingData[bIndex].points,
        0
      );
      if (server.hasEternal) hpm += eternalCity.points;

      const rawProjected = server.currentPoints + hpm * Math.max(0, minutesRemaining);
      const projected = Math.round(rawProjected / 10) * 10;

      row.querySelector(".total-hpm").textContent = hpm;
      row.querySelector(".projected-points").textContent = isNaN(projected)
  ? "0"
  : projected.toLocaleString();

    });

    updateCharts();
  }

  function resetAll() {
    state.servers.forEach(s => {
      s.buildingCounts = Array(buildingData.length).fill(0);
      s.hasEternal = false;
      s.label = '';
      s.currentPoints = 0;
    });

    document.querySelectorAll("select").forEach(sel => sel.value = 0);
    document.querySelectorAll("input[type='checkbox']").forEach(box => box.checked = false);
    document.querySelectorAll(".name-input").forEach(input => input.value = '');
    document.querySelectorAll(".points-input").forEach(input => input.value = '0');
    document.getElementById("endTimeInput").value = '';

    calculatePoints();
  }

  const hpmCtx = document.getElementById("hpmChart").getContext("2d");
  const projectionCtx = document.getElementById("projectionChart").getContext("2d");

  const hpmChart = new Chart(hpmCtx, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        label: 'Honor Points per Minute',
        data: [],
        backgroundColor: [
          '#f8a8a8', '#a8f8a8', '#a8a8f8', '#ffd8b0',
          '#c0ffc0', '#b0d0ff', '#f0e68c', '#ffb0d0'
        ]
      }]
    },
    options: { scales: { y: { beginAtZero: true } } }
  });

  let projectionChart;

  function updateCharts() {
    const now = new Date();
    const endTime = new Date(endTimeInput.value);
    const validEndTime = endTime > now;
    const minutesRemaining = validEndTime ? Math.floor((endTime - now) / 60000) : 0;

    hpmChart.data.labels = state.servers.map((s, i) =>
      s.label ? `${s.label} (Server ${i + 1})` : `Server ${i + 1}`
    );
    hpmChart.data.datasets[0].data = state.servers.map((s, i) => {
      let total = s.buildingCounts.reduce((sum, count, bIndex) => sum + count * buildingData[bIndex].points, 0);
      if (s.hasEternal) total += eternalCity.points;
      return total;
    });
    hpmChart.update();

    if (!validEndTime) {
      if (projectionChart) projectionChart.destroy();
      return;
    }

    const labels = [];
    const pointsByServer = Array(serverCount).fill(null).map(() => []);
    for (let min = 0; min <= minutesRemaining; min += 5) {
      const timeLabel = new Date(now.getTime() + min * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      labels.push(timeLabel);
      state.servers.forEach((s, i) => {
        let hpm = s.buildingCounts.reduce((sum, count, bIndex) => sum + count * buildingData[bIndex].points, 0);
        if (s.hasEternal) hpm += eternalCity.points;
        const raw = s.currentPoints + hpm * min;
        const rounded = Math.round(raw / 10) * 10;
        pointsByServer[i].push(rounded);
      });
    }

    const datasets = pointsByServer.map((points, i) => ({
      label: state.servers[i].label ? `${state.servers[i].label} (S${i + 1})` : `Server ${i + 1}`,
      data: points,
      borderWidth: 2,
      fill: false,
      tension: 0.2
    }));

    if (projectionChart) projectionChart.destroy();
    projectionChart = new Chart(projectionCtx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: 'Projected Total Points Over Time' }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }

  buildTable();