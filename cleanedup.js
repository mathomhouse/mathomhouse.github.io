// ==========================
// Constants & Configurations
// ==========================
const API_URLS = {
  live: 'https://script.google.com/macros/s/AKfycbw5qdmm2p_5lCMlfWlxAWfWy6jcZwsBt5RSDXttvWxfag150xb-hPJlceEs6mcyrNvJgQ/exec',
  fallback: '/titan-gear-data.json'
};

const htIconMap = {
  "Earthshaker E-100": "yellow",
  "Blazing Gale Rx": "red",
  "Tide Crusher BW-3": "blue",
  "Doom Sawblade D-4": "ball",
  "Luminary Knight LP-4": "white",
  "Blade Angel BA-6": "pink"
};

const chipIconMap = {
  "Xyston": "xyston",
  "Hoplon": "hoplon",
  "Shamshir": "shamshir",
  "Estoc Piercing Sword": "estoc",
  "Rondel Dagger": "rondel",
  "Scramsax Blade": "scramsax",
  "Kris Sword": "kris-sword",
  "Ring of Cosmos": "cosmos",
  "Sasanian's Chain": "sasanian"
};

// ==========================
// Utility Functions
// ==========================
function encodeFileName(name) {
  return name.replace(/ /g, '%20');
}

function clearSkeleton(containerId) {
  document.getElementById(containerId).innerHTML = '';
}

function populateDropdown(dropdownId, options) {
  const select = document.getElementById(dropdownId);
  select.innerHTML = '';
  options.forEach(option => {
    const opt = document.createElement('option');
    opt.value = option;
    opt.textContent = option;
    select.appendChild(opt);
  });
}

// ==========================
// Data Fetching & Initialization
// ==========================
function fetchData() {
  fetch(API_URLS.live)
    .then(res => {
      if (!res.ok) throw new Error('Live data unavailable');
      return res.json();
    })
    .then(data => initializeData(data))
    .catch(err => {
      console.warn("Falling back to static data:", err.message);
      showFallbackBanner();
      fetch(API_URLS.fallback)
        .then(res => res.json())
        .then(data => initializeData(data));
    });
}

function initializeData(data) {
  // Assign data to global vars
  titanGearData = data.titanGearData;
  suggestedCombosData = data.suggestedCombos;
  heavyTrooperData = data.heavyTroopers || {};

  filterHeroesByRole();
  updateMarchOptions();

  // Clear skeletons after data is ready
  clearSkeleton('results');
  clearSkeleton('comboResults');
}

function showFallbackBanner() {
  document.body.insertAdjacentHTML('afterbegin', `
    <div id="fallback-banner" style="background:#fdd;padding:10px;text-align:center;">⚠️ Live data could not be loaded. Displaying cached data.</div>
  `);
}

// ==========================
// UI Rendering Functions
// ==========================
function renderGearDetails(gear) {
  const displayNames = {
    Gun: 'Assault Pistol',
    Chest: 'Tactical Backarmor',
    Optical: 'Optical Add-on',
    Headset: 'Raytheon Headset',
    Arms: 'Portable GPS',
    Boots: 'Power Boots'
  };

  const slotOrder = [
    ['Gun', 'Headset'],
    ['Chest', 'Arms'],
    ['Optical', 'Boots']
  ];

  return `<div class="gear-grid">` + slotOrder.map(pair => {
    return pair.map(slot => {
      const rune = gear[slot];
      const iconPath = `/images/runes/${rune.replace(/ /g, '%20')}.png`;
      return `
        <div class="gear-slot">
          <p><strong>${displayNames[slot]}</strong></p>
          <img src="${iconPath}" alt="${rune}" title="${rune}" />
          <p>${rune}</p>
        </div>
      `;
    }).join('');
  }).join('') + `</div>`;
}

function showGear() {
  const branch = document.getElementById('branch').value;
  const selections = [
    { role: "Attack", id: "heroAttack" },
    { role: "HP", id: "heroHP" },
    { role: "Indestructible", id: "heroIndestructible" }
  ];

  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = '';

  selections.forEach(({ role, id }) => {
    const heroName = document.getElementById(id).value.trim();
    const hero = titanGearData.find(item =>
      item.Hero.trim() === heroName &&
      item.Branch === branch
    );
    if (!hero || !hero.Loadouts) return;

    const heroBox = document.createElement('div');
    heroBox.className = 'gear-box';
    heroBox.dataset.hero = hero.Hero;
    heroBox.dataset.branch = branch;

    const loadoutKeys = Object.keys(hero.Loadouts);
    const defaultLoadout = loadoutKeys[0];
    const gear = hero.Loadouts[defaultLoadout];

    heroBox.innerHTML = `
      <h2>${hero.Hero}<br> <span style="font-size: 0.7em;">(${role})</span></h2>
      <label>Loadout:</label>
      <select class="hero-loadout" data-hero="${hero.Hero}" data-branch="${branch}" onchange="updateDynamicGear(this)">
        ${loadoutKeys.map(key => `<option value="${key}">${key}</option>`).join('')}
      </select>
      <div class="gear-details" id="gear-${hero.Hero}-${branch}">
        ${renderGearDetails(gear)}
      </div>
    `;
    resultsDiv.appendChild(heroBox);
  });
}

function updateMarchOptions() {
  const skillLevel = document.getElementById('skillLevel').value;
  const marchSelect = document.getElementById('marchType');
  marchSelect.innerHTML = '';

  const marchTypes = Object.keys(suggestedCombosData[skillLevel] || {});
  marchTypes.forEach(march => {
    const opt = document.createElement('option');
    opt.value = march;
    opt.textContent = march;
    marchSelect.appendChild(opt);
  });
}

function renderHeroCombos() {
  const skillLevel = document.getElementById('skillLevel').value;
  const marchType = document.getElementById('marchType').value;
  const resultsDiv = document.getElementById('comboResults');
  resultsDiv.innerHTML = '';

  const heroes = suggestedCombosData[skillLevel]?.[marchType] || [];
  const heavyTroopers = heavyTrooperData?.[marchType] || [];
  console.log(`Rendering combos for: ${marchType}`, heavyTroopers);

  // Hero gear boxes
  heroes.forEach(heroObj => {
    const box = document.createElement('div');
    box.className = 'gear-box';
    box.innerHTML = `
      <h3>${heroObj.Hero}</h3>
      ${renderGearDetails(heroObj.Gear)}
    `;
    resultsDiv.appendChild(box);
  });

  // HT box
  if (heavyTroopers.length) {
    const box = document.createElement('div');
    box.className = 'gear-box';
    box.innerHTML = `
      <h3>Heavy Trooper</h3>
      <div class="gear-grid">
        ${heavyTroopers.map(ht => {
          const htIconMap = {
            "Earthshaker E-100": "yellow",
            "Blazing Gale Rx": "red",
            "Tide Crusher BW-3": "blue",
            "Doom Sawblade D-4": "ball",
            "Luminary Knight LP-4": "white",
            "Blade Angel BA-6": "pink"
          };

          const chipIconMap = {
            "Xyston": "xyston",
            "Hoplon": "hoplon",
            "Shamshir": "shamshir",
            "Estoc Piercing Sword": "estoc",
            "Rondel Dagger": "rondel",
            "Scramsax Blade": "scramsax",
            "Kris Sword": "kris-sword",
            "Ring of Cosmos": "cosmos",
            "Sasanian's Chain": "sasanian"
          };

          const htKey = htIconMap[ht.trooper] || "unknown";
          const chipKey = chipIconMap[ht.chipType] || "unknown";

          return `
            <div class="ht-slot">Slot ${ht.slot}</div>
            <div class="gear-slot">
              <div class="ht-icon-row">
                <div class="ht-icon-column">
                  <img src="/images/${chipKey.replace(/ /g, '%20')}-icon.png" alt="${ht.chipType}" title="${ht.chipType}" />
                  <div class="chip-name">${ht.chipType}</div>
                </div>
                <div class="ht-icon-column">
                  <img src="/images/${htKey.replace(/ /g, '%20')}-ht-icon.png" alt="${ht.trooper}" title="${ht.trooper}" />
                  <div class="ht-name">${ht.trooper}</div>
                </div>
              </div>
            </div>
          `;

        }).join('')}
      </div>
    `;
    resultsDiv.appendChild(box);
  }
}

// ==========================
// Event Handlers
// ==========================
function openTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
  event.target.classList.add('active');
}

// ==========================
// Initialize Page
// ==========================
fetchData();