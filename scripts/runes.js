let marchData = {};
let recommendedData = [];

const dataUrl = 'data/titan-gear-data2.json';

fetch(dataUrl)
  .then(res => {
    if (!res.ok) throw new Error("Data unavailable");
    return res.json();
  })
  .then(data => {
    marchData = data.marches;
    recommendedData = data.recommended || [];
    populateMarchTypeDropdown();
    populateSkillLevelDropdown();
  })
  .catch(err => {
    console.error("Failed to load data:", err.message);
    document.body.insertAdjacentHTML('afterbegin', `
      <div id="fallback-banner" style="
        background-color: #ffdddd;
        color: #900;
        padding: 10px;
        text-align: center;
        font-weight: bold;
        border-bottom: 2px solid #900;
        font-family: sans-serif;
      ">
        ⚠️ Could not load guide data. Please try refreshing the page.
      </div>
    `);
  });

// ─── Hero Portraits ───────────────────────────────────────────────────────────
// File extensions vary across assets/heroes-awakening/, so map slug → ext.
const heroPortraitExt = {
  alvida: 'jpg', heid: 'jpg', joanmature: 'jpg',
  carna: 'jpg', sara: 'png', shensuyu: 'png',
  ella: 'jpeg', franziska: 'jpeg', lilia: 'jpeg', margaretha: 'jpeg', tannis: 'jpeg',
  jett: 'jpeg', lophy: 'jpeg', nova: 'jpeg', marvingt: 'jpeg', rohr: 'jpeg',
  sinope: 'jpeg', vivian: 'jpeg'
};
// Pause portrait animations on cards outside the viewport (save CPU)
const cardObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => e.target.classList.toggle('in-view', e.isIntersecting));
}, { rootMargin: '120px' });
function observeGearBoxes() {
  document.querySelectorAll('.gear-box').forEach(b => cardObserver.observe(b));
}

// Pause all portrait animations while the tab is backgrounded
document.addEventListener('visibilitychange', () => {
  document.body.classList.toggle('anims-paused', document.hidden);
});

function heroPortrait(name) {
  const slug = (name || '').toLowerCase().replace(/\s+/g, '');
  const ext = heroPortraitExt[slug];
  if (!ext) return '';
  return `<span class="hero-portrait-wrap"><img class="hero-portrait" src="assets/heroes-awakening/${slug}_headshot.${ext}" alt="${name}" loading="lazy" onerror="this.closest('.hero-portrait-wrap').style.display='none'"></span>`;
}

// ─── Tab Switching ────────────────────────────────────────────────────────────

function openTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
  event.target.classList.add('active');
}

// ─── Loadouts Tab ─────────────────────────────────────────────────────────────

// Dropdown 1: march type/meta — one option per tab in the JSON
function populateMarchTypeDropdown() {
  const select = document.getElementById('marchTypeMeta');
  select.innerHTML = '<option value="" disabled selected>Select march type</option>';

  // Display label map: JSON key → human-readable label
  const labelMap = {
    army_magnet:       'Army - Magnet',
    army_hostile:      'Army - Hostile',
    navy_splash:       'Navy - Splash',
    navy_control:      'Navy - Control',
    airforce_ignition: 'Air Force - Ignition',
    airforce_combo:    'Air Force - Combo'
  };

  Object.keys(marchData).forEach(key => {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = labelMap[key] || key;
    select.appendChild(opt);
  });
}

// Dropdown 2: loadout names — populated when march type is chosen
function updateLoadoutOptions() {
  const key = document.getElementById('marchTypeMeta').value;
  const select = document.getElementById('loadoutName');
  select.innerHTML = '<option value="" disabled selected>Select loadout</option>';

  // Hide results when march type changes
  document.getElementById('loadoutResults').style.display = 'none';

  if (!key || !marchData[key]) return;

  marchData[key].forEach((loadout, index) => {
    const opt = document.createElement('option');
    opt.value = index;
    opt.textContent = loadout.march_name;
    select.appendChild(opt);
  });
}

// Render the selected loadout
function showLoadout() {
  const key = document.getElementById('marchTypeMeta').value;
  const index = document.getElementById('loadoutName').value;

  if (!key || index === '') return;

  const loadout = marchData[key][index];
  const resultsDiv = document.getElementById('loadoutResults');
  resultsDiv.style.display = '';
  resultsDiv.innerHTML = '';

  const heroes = [
    { role: 'Attack',         prefix: 'attack' },
    { role: 'Indestructible', prefix: 'indestructible' },
    { role: 'HP',             prefix: 'hp' }
  ];

  heroes.forEach(({ role, prefix }) => {
    const heroName = loadout[`${prefix}_name`];
    const gear = {
      Gun:     loadout[`${prefix}_assault_pistol`],
      Chest:   loadout[`${prefix}_tactical_backarmor`],
      Optical: loadout[`${prefix}_optical_addon`],
      Headset: loadout[`${prefix}_raysor_headset`],
      Arms:    loadout[`${prefix}_portable_gps`],
      Boots:   loadout[`${prefix}_power_boots`]
    };

    const box = document.createElement('div');
    box.className = 'gear-box';
    box.innerHTML = `
      <div class="hero-head">
        <h2>${heroName}<br><span style="font-size: 0.7em;">(${role})</span></h2>
        ${heroPortrait(heroName)}
      </div>
      <div class="gear-details">
        ${renderGearDetails(gear)}
      </div>
    `;
    resultsDiv.appendChild(box);
  });

  observeGearBoxes();
}

// ─── Recommendations Tab ──────────────────────────────────────────────────────

function populateSkillLevelDropdown() {
  // Skill level dropdown is static — values must match what's in the JSON
  // No dynamic population needed; just ensure the march type dropdown resets
  const select = document.getElementById('recMarchType');
  select.innerHTML = '<option value="" disabled selected>Select march type</option>';
}

// Dropdown 2 (rec tab): march types available for the selected skill level
function updateRecMarchTypes() {
  const skillLevel = document.getElementById('skillLevel').value;
  const select = document.getElementById('recMarchType');

  // Remember what was selected before repopulating
  const previousMarchType = select.value;

  select.innerHTML = '<option value="" disabled selected>Select march type</option>';

  if (!skillLevel) {
    document.getElementById('recResults').style.display = 'none';
    return;
  }

  // Get unique march_type values for this skill level
  const marchTypes = [...new Set(
    recommendedData
      .filter(r => r.skill_level === skillLevel)
      .map(r => r.march_type)
  )];

  const labelMap = {
    army_magnet:       'Army - Magnet',
    army_hostile:      'Army - Hostile',
    navy_splash:       'Navy - Splash',
    navy_control:      'Navy - Control',
    airforce_ignition: 'Air Force - Ignition',
    airforce_combo:    'Air Force - Combo'
  };

  marchTypes.forEach(type => {
    const opt = document.createElement('option');
    opt.value = type;
    opt.textContent = labelMap[type] || type;
    select.appendChild(opt);
  });

  // Re-select the previous march type if it's still available
  if (previousMarchType && marchTypes.includes(previousMarchType)) {
    select.value = previousMarchType;
    showRecommendedLoadout(); // auto-render with preserved selection
  } else {
    document.getElementById('recResults').style.display = 'none';
  }
}

// Render the selected recommended loadout
function showRecommendedLoadout() {
  const skillLevel = document.getElementById('skillLevel').value;
  const marchType = document.getElementById('recMarchType').value;

  if (!skillLevel || !marchType) return;

  const loadout = recommendedData.find(
    r => r.skill_level === skillLevel && r.march_type === marchType
  );

  const resultsDiv = document.getElementById('recResults');
  resultsDiv.style.display = '';
  resultsDiv.innerHTML = '';

  // Hero boxes
  const heroes = [
    { role: 'Attack',         prefix: 'attack' },
    { role: 'Indestructible', prefix: 'indestructible' },
    { role: 'HP',             prefix: 'hp' }
  ];

  heroes.forEach(({ role, prefix }) => {
    const heroName = loadout[`${prefix}_name`];
    const gear = {
      Gun:     loadout[`${prefix}_assault_pistol`],
      Chest:   loadout[`${prefix}_tactical_backarmor`],
      Optical: loadout[`${prefix}_optical_addon`],
      Headset: loadout[`${prefix}_raysor_headset`],
      Arms:    loadout[`${prefix}_portable_gps`],
      Boots:   loadout[`${prefix}_power_boots`]
    };

    const box = document.createElement('div');
    box.className = 'gear-box';
    box.innerHTML = `
      <div class="hero-head">
        <h2>${heroName}<br><span style="font-size: 0.7em;">(${role})</span></h2>
        ${heroPortrait(heroName)}
      </div>
      <div class="gear-details">
        ${renderGearDetails(gear)}
      </div>
    `;
    resultsDiv.appendChild(box);
  });

  // Heavy Trooper box
  const htTrooper = loadout.heavy_trooper_type;
  const htChip    = loadout.heavy_trooper_chip_type;
  const htSlot    = loadout.heavy_trooper_placement;
  const notes     = loadout.notes;

  if (htTrooper || htChip) {
    const htIconMap = {
      "Earthshaker E-100":  "mecha_1002",
      "Blazing Gale Rx":    "mecha_1003",
      "Tide Crusher BW-3":  "mecha_1004",
      "Doom Sawblade D-4":  "mecha_1005",
      "Luminary Knight LP-4": "mecha_1006",
      "Blade Angel BA-6":   "mecha_1007"
    };

    const chipIconMap = {
      "Xyston":               "Xyston",
      "Hoplon":               "Hoplon",
      "Shamshir":             "Shamshir",
      "Estoc Piercing Sword": "Estoc",
      "Rondel Dagger":        "Rondel_Dagger",
      "Scramsax Blade":       "Scramsax_Blade",
      "Kris Sword":           "Kris_Sword",
      "Ring of Cosmos":       "Ring_of_Cosmos",
      "Sasanian's Chain":     "Sasanians_Chain"
    };

    const htKey   = htIconMap[htTrooper] || "unknown";
    const chipKey = chipIconMap[htChip]  || "unknown";

    const box = document.createElement('div');
    box.className = 'gear-box';
    box.innerHTML = `
      <h3>Heavy Trooper</h3>
      <div class="gear-grid">
        <div class="ht-slot">${htSlot}</div>
        <div class="gear-slot">
          <div class="ht-icon-row">
            <div class="ht-icon-column">
              <img class="chip-icon" src="/assets/ht-chip-icons/${chipKey.replace(/ /g, '_')}.png" alt="${htChip}" title="${htChip}" />
              <div class="chip-name">${htChip}</div>
            </div>
            <div class="ht-icon-column">
              <img class="mecha-icon" src="/assets/mecha-icons/${htKey.replace(/ /g, '_')}.png" alt="${htTrooper}" title="${htTrooper}" />
              <div class="ht-name">${htTrooper}</div>
            </div>
          </div>
        </div>
      </div>
      ${notes ? `<p class="loadout-notes"><strong>Notes:</strong> ${notes}</p>` : ''}
    `;
    resultsDiv.appendChild(box);
  }

  observeGearBoxes();
}

// ─── Shared Rendering ─────────────────────────────────────────────────────────

function renderGearDetails(gear) {
  const displayNames = {
    Gun:     'Assault Pistol',
    Chest:   'Tactical Backarmor',
    Optical: 'Optical Add-on',
    Headset: 'Raysor Headset',
    Arms:    'Portable GPS',
    Boots:   'Power Boots'
  };

  const slotOrder = [
    ['Gun',     'Headset'],
    ['Chest',   'Arms'],
    ['Optical', 'Boots']
  ];

  return `<div class="gear-grid">` + slotOrder.map(pair => {
    return pair.map(slot => {
      const rune = gear[slot];
      if (!rune) return '';
      const iconPath = `/assets/rune-icons/${rune.toLowerCase().replace(/ /g, '-')}.png`;
      return `
        <div class="gear-slot">
          <p><strong>${displayNames[slot]}</strong></p>
          <img class="rune-icon" src="${iconPath}" alt="${rune}" title="${rune}" />
          <p>${rune}</p>
        </div>
      `;
    }).join('');
  }).join('') + `</div>`;
}