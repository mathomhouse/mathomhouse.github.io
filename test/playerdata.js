// Firebase-ready player data page for a static site (GitHub Pages).
// Anonymous auth only for now. Works in local-only mode until FIREBASE_CONFIG is supplied.

const FIREBASE_CONFIG = null;
// Example:
// const FIREBASE_CONFIG = {
//   apiKey: '...',
//   authDomain: 'your-project.firebaseapp.com',
//   projectId: 'your-project-id',
//   storageBucket: 'your-project.appspot.com',
//   messagingSenderId: '...',
//   appId: '...'
// };

const LOCAL_DRAFT_KEY = 'tw_playerdata_local_draft_v2';
const SCHEMA_VERSION = 2;
const FIRESTORE_DOC_LIMIT_WARN_BYTES = 900 * 1024;

const CHIP_SLOTS = ['Core', 'Left 1', 'Left 2', 'Left 3', 'Right 1', 'Right 2', 'Right 3'];
const GEAR_SLOTS = ['Weapon', 'Armor', 'Engine', 'Radar', 'Chip', 'Component'];
const MAX_MARCHES = 6;

const state = {
  firebaseEnabled: false,
  auth: null,
  db: null,
  user: null,
  lastCloudUpdatedAt: null,
  autosaveTimer: null,
  baseSkinNames: [],
  pendingBaseSkinSelection: null
};

const els = {
  form: document.getElementById('playerDataForm'),
  firebaseStatus: document.getElementById('firebaseStatus'),
  authStatus: document.getElementById('authStatus'),
  saveStatus: document.getElementById('saveStatus'),
  localMeta: document.getElementById('localMeta'),
  cloudMeta: document.getElementById('cloudMeta'),
  sizeMeta: document.getElementById('sizeMeta'),
  signInGuestBtn: document.getElementById('signInGuestBtn'),
  signOutBtn: document.getElementById('signOutBtn'),
  saveCloudBtn: document.getElementById('saveCloudBtn'),
  playerName: document.getElementById('playerName'),
  serverName: document.getElementById('serverName'),
  alliance: document.getElementById('alliance'),
  mainBranch: document.getElementById('mainBranch'),
  marchesContainer: document.getElementById('marchesContainer'),
  htName: document.getElementById('htName'),
  htNotes: document.getElementById('htNotes'),
  htChipGrid: document.getElementById('htChipGrid'),
  titanGearHeroes: document.getElementById('titanGearHeroes'),
  baseSkinSearch: document.getElementById('baseSkinSearch'),
  clearBaseSkinSearchBtn: document.getElementById('clearBaseSkinSearchBtn'),
  baseSkinCount: document.getElementById('baseSkinCount'),
  baseSkinsList: document.getElementById('baseSkinsList'),
  notes: document.getElementById('notes')
};

function setStatus(el, text, className = '') {
  el.textContent = text;
  el.className = `status-line${className ? ` ${className}` : ''}`;
}

function setMutedStatus(el, text) {
  el.textContent = text;
  el.className = 'status-line status-muted';
}

function getNowIso() {
  return new Date().toISOString();
}

function formatBytes(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function estimateDraftSizeBytes(draft) {
  const encoder = new TextEncoder();
  return encoder.encode(JSON.stringify(draft)).length;
}

function createField(labelText, input) {
  const wrapper = document.createElement('label');
  wrapper.className = 'playerdata-field';

  const span = document.createElement('span');
  span.textContent = labelText;
  wrapper.appendChild(span);
  wrapper.appendChild(input);
  return wrapper;
}

function createTextInput(placeholder = '') {
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = placeholder;
  input.maxLength = 120;
  return input;
}

function createNumberInput(placeholder = '0') {
  const input = document.createElement('input');
  input.type = 'number';
  input.min = '0';
  input.step = 'any';
  input.placeholder = placeholder;
  return input;
}

function buildNamedStatPairs(container, count, prefix) {
  for (let i = 0; i < count; i += 1) {
    const statName = createTextInput(`Stat ${i + 1} name`);
    statName.dataset.field = `${prefix}StatName${i}`;
    container.appendChild(createField(`Stat ${i + 1} Name`, statName));

    const statValue = createNumberInput('0');
    statValue.dataset.field = `${prefix}StatValue${i}`;
    container.appendChild(createField(`Stat ${i + 1} Value`, statValue));
  }
}

function buildHtChipGrid() {
  els.htChipGrid.innerHTML = '';

  CHIP_SLOTS.forEach((slotName, index) => {
    const card = document.createElement('section');
    card.className = 'chip-card';
    card.dataset.chipSlot = String(index);

    const title = document.createElement('h4');
    title.textContent = slotName;
    card.appendChild(title);

    const fields = document.createElement('div');
    fields.className = 'chip-fields';

    const chipName = createTextInput('Chip name');
    chipName.dataset.field = 'chipName';
    fields.appendChild(createField('Chip Name', chipName));

    const statGrid = document.createElement('div');
    statGrid.className = 'stat-pair-grid';
    statGrid.style.gridColumn = '1 / -1';
    const statCount = slotName === 'Core' ? 2 : 4;
    buildNamedStatPairs(statGrid, statCount, 'chip');
    fields.appendChild(statGrid);

    card.appendChild(fields);
    els.htChipGrid.appendChild(card);
  });
}

function buildMarchSections() {
  els.marchesContainer.innerHTML = '';

  for (let index = 0; index < MAX_MARCHES; index += 1) {
    const isMain = index === 0;
    const details = document.createElement('details');
    details.className = 'data-group';
    details.dataset.marchIndex = String(index);
    details.open = isMain;

    const summary = document.createElement('summary');
    summary.textContent = isMain ? 'Main March' : `March ${index + 1}`;
    details.appendChild(summary);

    const body = document.createElement('div');
    body.className = 'details-body';

    if (!isMain) {
      const meta = document.createElement('div');
      meta.className = 'march-meta';

      const includeWrap = document.createElement('label');
      includeWrap.style.display = 'flex';
      includeWrap.style.alignItems = 'center';
      includeWrap.style.gap = '0.4rem';

      const includeCheckbox = document.createElement('input');
      includeCheckbox.type = 'checkbox';
      includeCheckbox.dataset.field = 'enabled';
      includeWrap.appendChild(includeCheckbox);

      const includeText = document.createElement('span');
      includeText.textContent = `Include March ${index + 1}`;
      includeWrap.appendChild(includeText);

      meta.appendChild(includeWrap);
      body.appendChild(meta);
    }

    const grid = document.createElement('div');
    grid.className = 'playerdata-grid';

    for (let heroSlot = 0; heroSlot < 3; heroSlot += 1) {
      const heroInput = createTextInput('Hero name');
      heroInput.dataset.field = `hero${heroSlot}`;
      grid.appendChild(createField(`Hero ${heroSlot + 1}`, heroInput));
    }

    const htInput = createTextInput('HT name');
    htInput.dataset.field = 'ht';
    grid.appendChild(createField('HT', htInput));

    body.appendChild(grid);
    details.appendChild(body);
    els.marchesContainer.appendChild(details);
  }
}

function buildTitanGearSections() {
  els.titanGearHeroes.innerHTML = '';

  for (let heroIndex = 0; heroIndex < 3; heroIndex += 1) {
    const heroDetails = document.createElement('details');
    heroDetails.className = 'data-group';
    heroDetails.open = heroIndex === 0;
    heroDetails.dataset.heroIndex = String(heroIndex);

    const heroSummary = document.createElement('summary');
    heroSummary.textContent = `Hero ${heroIndex + 1} Titan Gear`;
    heroDetails.appendChild(heroSummary);

    const body = document.createElement('div');
    body.className = 'details-body';

    const heroNameInput = createTextInput('Hero name (optional override)');
    heroNameInput.dataset.field = 'heroName';
    body.appendChild(createField('Hero Name', heroNameInput));

    GEAR_SLOTS.forEach((slotName, slotIndex) => {
      const slotDetails = document.createElement('details');
      slotDetails.className = 'data-group';
      slotDetails.dataset.slotIndex = String(slotIndex);

      const slotSummary = document.createElement('summary');
      slotSummary.textContent = `${slotName} Slot`;
      slotDetails.appendChild(slotSummary);

      const slotBody = document.createElement('div');
      slotBody.className = 'details-body';

      const slotGrid = document.createElement('div');
      slotGrid.className = 'gear-slot-fields';

      const gearName = createTextInput('Gear name');
      gearName.dataset.field = 'gearName';
      slotGrid.appendChild(createField('Gear Name', gearName));

      const gearLevel = createNumberInput('0');
      gearLevel.dataset.field = 'level';
      slotGrid.appendChild(createField('Level', gearLevel));

      const statGrid = document.createElement('div');
      statGrid.className = 'stat-pair-grid';
      statGrid.style.gridColumn = '1 / -1';
      buildNamedStatPairs(statGrid, 3, 'gear');
      slotGrid.appendChild(statGrid);

      slotBody.appendChild(slotGrid);
      slotDetails.appendChild(slotBody);
      body.appendChild(slotDetails);
    });

    heroDetails.appendChild(body);
    els.titanGearHeroes.appendChild(heroDetails);
  }
}

function parseNumberOrNull(value) {
  if (value === '' || value == null) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function readMarchesFromUi() {
  const marchSections = Array.from(els.marchesContainer.querySelectorAll('[data-march-index]'));
  const marches = [];

  marchSections.forEach((section, index) => {
    const isMain = index === 0;
    const enabledCheckbox = section.querySelector('[data-field="enabled"]');
    const heroes = [0, 1, 2].map((heroIdx) => {
      const input = section.querySelector(`[data-field="hero${heroIdx}"]`);
      return (input?.value || '').trim();
    });
    const ht = (section.querySelector('[data-field="ht"]')?.value || '').trim();

    const hasData = heroes.some(Boolean) || Boolean(ht);
    const enabled = isMain ? true : Boolean(enabledCheckbox?.checked || hasData);

    if (!enabled && !hasData) {
      return;
    }

    marches.push({
      index: index + 1,
      isMain,
      heroes,
      ht
    });
  });

  if (!marches.length) {
    marches.push({ index: 1, isMain: true, heroes: ['', '', ''], ht: '' });
  }

  return marches;
}

function writeMarchesToUi(marchesInput) {
  const marches = Array.isArray(marchesInput) && marchesInput.length
    ? marchesInput
    : [{ index: 1, isMain: true, heroes: ['', '', ''], ht: '' }];

  const sections = Array.from(els.marchesContainer.querySelectorAll('[data-march-index]'));
  sections.forEach((section, index) => {
    const marchData = marches[index];
    const isMain = index === 0;
    const enabledCheckbox = section.querySelector('[data-field="enabled"]');

    const enabled = isMain ? true : Boolean(marchData);
    if (enabledCheckbox) enabledCheckbox.checked = enabled;

    for (let heroIdx = 0; heroIdx < 3; heroIdx += 1) {
      setInputValue(section, `[data-field="hero${heroIdx}"]`, marchData?.heroes?.[heroIdx] || '');
    }
    setInputValue(section, '[data-field="ht"]', marchData?.ht || '');

    section.open = isMain || enabled;
  });
}

function readNamedStats(parent, prefix, count) {
  const stats = [];
  for (let i = 0; i < count; i += 1) {
    const nameInput = parent.querySelector(`[data-field="${prefix}StatName${i}"]`);
    const valueInput = parent.querySelector(`[data-field="${prefix}StatValue${i}"]`);
    const name = (nameInput?.value || '').trim();
    const value = parseNumberOrNull(valueInput?.value);
    if (!name && value == null) {
      stats.push({ name: '', value: null });
      continue;
    }
    stats.push({ name, value });
  }
  return stats;
}

function readChipCard(card) {
  const get = (field) => card.querySelector(`[data-field="${field}"]`);
  const statCount = (CHIP_SLOTS[Number(card.dataset.chipSlot)] || '') === 'Core' ? 2 : 4;
  return {
    slot: CHIP_SLOTS[Number(card.dataset.chipSlot)] || 'Unknown',
    chipName: (get('chipName')?.value || '').trim(),
    stats: readNamedStats(card, 'chip', statCount)
  };
}

function readGearSlot(slotDetails) {
  const get = (field) => slotDetails.querySelector(`[data-field="${field}"]`);
  return {
    slot: GEAR_SLOTS[Number(slotDetails.dataset.slotIndex)] || 'Unknown',
    gearName: (get('gearName')?.value || '').trim(),
    level: parseNumberOrNull(get('level')?.value),
    stats: readNamedStats(slotDetails, 'gear', 3)
  };
}

function readFormDraft() {
  const htChips = Array.from(els.htChipGrid.querySelectorAll('[data-chip-slot]')).map(readChipCard);
  const titanGearHeroes = Array.from(els.titanGearHeroes.querySelectorAll('[data-hero-index]')).map((heroDetails, idx) => {
    const heroNameInput = heroDetails.querySelector('[data-field="heroName"]');
    const slots = Array.from(heroDetails.querySelectorAll('[data-slot-index]')).map(readGearSlot);
    return {
      heroIndex: idx + 1,
      heroName: (heroNameInput?.value || '').trim(),
      slots
    };
  });

  return {
    schemaVersion: SCHEMA_VERSION,
    profile: {
      name: (els.playerName.value || '').trim(),
      server: (els.serverName.value || '').trim(),
      alliance: (els.alliance.value || '').trim(),
      mainBranch: (els.mainBranch.value || '').trim()
    },
    marches: readMarchesFromUi(),
    htData: {
      htName: (els.htName.value || '').trim(),
      notes: (els.htNotes.value || '').trim(),
      chips: htChips
    },
    titanGear: {
      heroes: titanGearHeroes
    },
    baseSkinsOwned: readSelectedBaseSkins(),
    notes: els.notes.value || '',
    clientUpdatedAt: getNowIso()
  };
}

function setInputValue(parent, selector, value) {
  const el = parent.querySelector(selector);
  if (!el) return;
  el.value = value ?? '';
}

function writeChipCard(card, chip) {
  setInputValue(card, '[data-field="chipName"]', chip?.chipName || '');
  const statCount = (CHIP_SLOTS[Number(card.dataset.chipSlot)] || '') === 'Core' ? 2 : 4;
  for (let i = 0; i < statCount; i += 1) {
    setInputValue(card, `[data-field="chipStatName${i}"]`, chip?.stats?.[i]?.name || '');
    setInputValue(card, `[data-field="chipStatValue${i}"]`, chip?.stats?.[i]?.value);
  }
}

function writeGearSlot(slotDetails, slotData) {
  setInputValue(slotDetails, '[data-field="gearName"]', slotData?.gearName || '');
  setInputValue(slotDetails, '[data-field="level"]', slotData?.level);
  for (let i = 0; i < 3; i += 1) {
    setInputValue(slotDetails, `[data-field="gearStatName${i}"]`, slotData?.stats?.[i]?.name || '');
    setInputValue(slotDetails, `[data-field="gearStatValue${i}"]`, slotData?.stats?.[i]?.value);
  }
}

function writeFormDraft(draft) {
  const data = draft || {};

  // Backward compatibility for earlier prototype flat shape.
  const profile = data.profile || {
    name: data.playerName,
    server: data.serverName,
    alliance: data.alliance,
    mainBranch: data.mainBranch
  };

  els.playerName.value = profile?.name || '';
  els.serverName.value = profile?.server || '';
  els.alliance.value = profile?.alliance || '';
  els.mainBranch.value = profile?.mainBranch || '';

  const marchesForUi = Array.isArray(data.marches)
    ? data.marches
    : [{
        index: 1,
        isMain: true,
        heroes: [
          data.mainMarch?.heroes?.[0] || '',
          data.mainMarch?.heroes?.[1] || '',
          data.mainMarch?.heroes?.[2] || ''
        ],
        ht: data.mainMarch?.ht || ''
      }];
  writeMarchesToUi(marchesForUi);

  els.htName.value = data.htData?.htName || '';
  els.htNotes.value = data.htData?.notes || '';
  els.notes.value = data.notes || '';
  writeSelectedBaseSkins(data.baseSkinsOwned || []);

  const chipCards = Array.from(els.htChipGrid.querySelectorAll('[data-chip-slot]'));
  chipCards.forEach((card, index) => {
    writeChipCard(card, data.htData?.chips?.[index]);
  });

  const heroSections = Array.from(els.titanGearHeroes.querySelectorAll('[data-hero-index]'));
  heroSections.forEach((heroSection, heroIndex) => {
    setInputValue(heroSection, '[data-field="heroName"]', data.titanGear?.heroes?.[heroIndex]?.heroName || '');
    const slotSections = Array.from(heroSection.querySelectorAll('[data-slot-index]'));
    slotSections.forEach((slotSection, slotIndex) => {
      writeGearSlot(slotSection, data.titanGear?.heroes?.[heroIndex]?.slots?.[slotIndex]);
    });
  });

  updateSizeMeta();
}

function readSelectedBaseSkins() {
  const checked = els.baseSkinsList.querySelectorAll('input[type="checkbox"]:checked');
  return Array.from(checked).map((cb) => cb.value);
}

function writeSelectedBaseSkins(names) {
  const wanted = new Set(Array.isArray(names) ? names : []);
  const checkboxes = els.baseSkinsList.querySelectorAll('input[type="checkbox"]');

  if (!checkboxes.length) {
    state.pendingBaseSkinSelection = Array.from(wanted);
    return;
  }

  checkboxes.forEach((cb) => {
    cb.checked = wanted.has(cb.value);
  });
  state.pendingBaseSkinSelection = null;
  updateBaseSkinCount();
}

function updateBaseSkinCount() {
  const all = els.baseSkinsList.querySelectorAll('.base-skin-item');
  const visible = Array.from(all).filter((item) => item.style.display !== 'none').length;
  const checked = els.baseSkinsList.querySelectorAll('input[type="checkbox"]:checked').length;
  const total = all.length;
  setMutedStatus(els.baseSkinCount, `${checked} owned | ${visible} shown | ${total} total`);
}

function filterBaseSkins() {
  const q = (els.baseSkinSearch.value || '').trim().toLowerCase();
  const items = els.baseSkinsList.querySelectorAll('.base-skin-item');
  items.forEach((item) => {
    const name = (item.getAttribute('data-name') || '').toLowerCase();
    item.style.display = !q || name.includes(q) ? '' : 'none';
  });
  updateBaseSkinCount();
}

function renderBaseSkinsList(names) {
  els.baseSkinsList.innerHTML = '';
  names.forEach((name, index) => {
    const row = document.createElement('div');
    row.className = 'base-skin-item';
    row.setAttribute('data-name', name);

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `baseSkin_${index}`;
    checkbox.value = name;

    const label = document.createElement('label');
    label.htmlFor = checkbox.id;
    label.textContent = name;

    row.appendChild(checkbox);
    row.appendChild(label);
    els.baseSkinsList.appendChild(row);
  });

  if (state.pendingBaseSkinSelection) {
    writeSelectedBaseSkins(state.pendingBaseSkinSelection);
  } else {
    updateBaseSkinCount();
  }
}

async function loadBaseSkinMasterList() {
  try {
    const res = await fetch('/guides/base_skins.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const names = [];
    const seen = new Set();

    if (Array.isArray(data)) {
      data.forEach((row) => {
        const name = typeof row?.['Base Skin Name'] === 'string' ? row['Base Skin Name'].trim() : '';
        if (!name || seen.has(name)) return;
        seen.add(name);
        names.push(name);
      });
    }

    state.baseSkinNames = names;
    renderBaseSkinsList(names);
    setMutedStatus(els.baseSkinCount, `0 owned | ${names.length} shown | ${names.length} total`);
  } catch (err) {
    els.baseSkinsList.innerHTML = '';
    setStatus(els.baseSkinCount, `Could not load base skins list: ${err.message}`, 'status-error');
  }
}

function updateSizeMeta() {
  try {
    const draft = readFormDraft();
    const bytes = estimateDraftSizeBytes(draft);
    setMutedStatus(els.sizeMeta, `Estimated payload size: ${formatBytes(bytes)}`);

    if (bytes > FIRESTORE_DOC_LIMIT_WARN_BYTES) {
      setStatus(
        els.saveStatus,
        'Payload is getting large for a single Firestore document. Consider splitting data before using cloud save.',
        'status-warn'
      );
    }
  } catch (err) {
    setStatus(els.saveStatus, `Could not estimate size: ${err.message}`, 'status-error');
  }
}

function saveDraftToLocal({ silent = false } = {}) {
  let draft;
  try {
    draft = readFormDraft();
  } catch (err) {
    setStatus(els.saveStatus, `Local save failed: ${err.message}`, 'status-error');
    return null;
  }

  const envelope = {
    schemaVersion: SCHEMA_VERSION,
    savedAt: getNowIso(),
    data: draft
  };

  localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(envelope));
  setMutedStatus(els.localMeta, `Local draft: saved ${new Date(envelope.savedAt).toLocaleString()}`);
  if (!silent) setStatus(els.saveStatus, 'Saved locally.', 'status-ok');
  updateSizeMeta();
  return envelope;
}

function loadDraftFromLocal() {
  const keysToTry = [LOCAL_DRAFT_KEY, 'tw_playerdata_local_draft_v1'];

  for (const key of keysToTry) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;

    try {
      const envelope = JSON.parse(raw);
      writeFormDraft(envelope.data || {});
      setMutedStatus(
        els.localMeta,
        `Local draft: loaded ${new Date(envelope.savedAt || Date.now()).toLocaleString()}`
      );
      setStatus(els.saveStatus, 'Loaded local draft.', 'status-ok');
      return envelope;
    } catch (err) {
      setStatus(els.saveStatus, `Could not read local draft: ${err.message}`, 'status-error');
      return null;
    }
  }

  setMutedStatus(els.localMeta, 'Local draft: none');
  return null;
}

function exportDraft() {
  let draft;
  try {
    draft = readFormDraft();
  } catch (err) {
    setStatus(els.saveStatus, `Export failed: ${err.message}`, 'status-error');
    return;
  }

  const payload = {
    exportedAt: getNowIso(),
    schemaVersion: SCHEMA_VERSION,
    data: draft
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `tw-playerdata-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  setStatus(els.saveStatus, 'Exported JSON backup.', 'status-ok');
}

function importDraftFromFile(file) {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result || ''));
      const importedData = parsed.data || parsed;
      writeFormDraft(importedData);
      readFormDraft(); // validate shape by attempting full read
      saveDraftToLocal();
      setStatus(els.saveStatus, 'Imported JSON backup.', 'status-ok');
    } catch (err) {
      setStatus(els.saveStatus, `Import failed: ${err.message}`, 'status-error');
    } finally {
      els.importFileInput.value = '';
    }
  };

  reader.onerror = () => {
    setStatus(els.saveStatus, 'Import failed: could not read file.', 'status-error');
    els.importFileInput.value = '';
  };

  reader.readAsText(file);
}

function clearLocalDraft() {
  localStorage.removeItem(LOCAL_DRAFT_KEY);
  setMutedStatus(els.localMeta, 'Local draft: cleared');
  setStatus(els.saveStatus, 'Local draft cleared (form values were left as-is).', 'status-ok');
}

function scheduleAutosave() {
  clearTimeout(state.autosaveTimer);
  state.autosaveTimer = setTimeout(() => {
    saveDraftToLocal({ silent: true });
  }, 600);
}

function updateAuthUi() {
  if (!state.firebaseEnabled) {
    els.signInGuestBtn.disabled = true;
    els.signOutBtn.disabled = true;
    els.saveCloudBtn.disabled = true;
    setStatus(els.firebaseStatus, 'Firebase not configured yet. Local-only mode is active.', 'status-warn');
    setStatus(els.authStatus, 'Not signed in.', '');
    setMutedStatus(els.cloudMeta, 'Cloud copy: unavailable');
    return;
  }

  els.signInGuestBtn.disabled = false;
  els.signOutBtn.disabled = !state.user;
  els.saveCloudBtn.disabled = !state.user;

  setStatus(els.firebaseStatus, 'Firebase configured. Cloud sync is available.', 'status-ok');

  if (!state.user) {
    setStatus(els.authStatus, 'Not signed in.', '');
    setMutedStatus(els.cloudMeta, 'Cloud copy: sign in to load/save');
    return;
  }

  setStatus(els.authStatus, `Signed in: Guest (${state.user.uid})`, 'status-ok');
  setMutedStatus(
    els.cloudMeta,
    state.lastCloudUpdatedAt
      ? `Cloud copy: last loaded/saved ${new Date(state.lastCloudUpdatedAt).toLocaleString()}`
      : 'Cloud copy: available'
  );
}

async function loadCloudDraftForSignedInUser(dbMod) {
  if (!state.user || !state.db) return;

  try {
    const docRef = dbMod.doc(state.db, 'players', state.user.uid);
    const snap = await dbMod.getDoc(docRef);
    if (!snap.exists()) {
      setStatus(els.saveStatus, 'No cloud record found yet for this guest account.', 'status-warn');
      return;
    }

    const data = snap.data();
    writeFormDraft(data);
    saveDraftToLocal({ silent: true });

    const cloudDate =
      data.updatedAt && typeof data.updatedAt.toDate === 'function'
        ? data.updatedAt.toDate().toISOString()
        : data.clientUpdatedAt || getNowIso();

    state.lastCloudUpdatedAt = cloudDate;
    updateAuthUi();
    setStatus(els.saveStatus, 'Loaded data from cloud.', 'status-ok');
  } catch (err) {
    setStatus(els.saveStatus, `Cloud auto-load failed: ${err.message}`, 'status-error');
  }
}

async function initFirebaseIfConfigured() {
  if (!FIREBASE_CONFIG) {
    updateAuthUi();
    return;
  }

  try {
    const [appMod, authMod, dbMod] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js')
    ]);

    const app = appMod.initializeApp(FIREBASE_CONFIG);
    state.auth = authMod.getAuth(app);
    state.db = dbMod.getFirestore(app);
    state.firebaseEnabled = true;

    authMod.onAuthStateChanged(state.auth, async (user) => {
      state.user = user;
      state.lastCloudUpdatedAt = null;
      updateAuthUi();
      if (user) {
        await loadCloudDraftForSignedInUser(dbMod);
      }
    });

    els.signInGuestBtn.addEventListener('click', async () => {
      try {
        await authMod.signInAnonymously(state.auth);
      } catch (err) {
        setStatus(els.saveStatus, `Guest sign-in failed: ${err.message}`, 'status-error');
      }
    });

    els.signOutBtn.addEventListener('click', async () => {
      try {
        await authMod.signOut(state.auth);
        state.lastCloudUpdatedAt = null;
        setStatus(els.saveStatus, 'Signed out.', 'status-ok');
      } catch (err) {
        setStatus(els.saveStatus, `Sign-out failed: ${err.message}`, 'status-error');
      }
    });

    els.saveCloudBtn.addEventListener('click', async () => {
      if (!state.user) {
        setStatus(els.saveStatus, 'Sign in before saving to cloud.', 'status-warn');
        return;
      }

      let draft;
      try {
        draft = readFormDraft();
      } catch (err) {
        setStatus(els.saveStatus, `Cloud save failed: ${err.message}`, 'status-error');
        return;
      }

      try {
        const bytes = estimateDraftSizeBytes(draft);
        if (bytes > FIRESTORE_DOC_LIMIT_WARN_BYTES) {
          setStatus(els.saveStatus, 'Payload may be too large for a single Firestore document.', 'status-warn');
        }

        const docRef = dbMod.doc(state.db, 'players', state.user.uid);
        await dbMod.setDoc(
          docRef,
          {
            ...draft,
            schemaVersion: SCHEMA_VERSION,
            authType: 'anonymous',
            updatedAt: dbMod.serverTimestamp()
          },
          { merge: true }
        );

        state.lastCloudUpdatedAt = getNowIso();
        saveDraftToLocal({ silent: true });
        updateAuthUi();
        setStatus(els.saveStatus, 'Saved to cloud.', 'status-ok');
      } catch (err) {
        setStatus(els.saveStatus, `Cloud save failed: ${err.message}`, 'status-error');
      }
    });

    updateAuthUi();
  } catch (err) {
    state.firebaseEnabled = false;
    updateAuthUi();
    setStatus(els.firebaseStatus, `Firebase failed to initialize: ${err.message}`, 'status-error');
  }
}

function wireLocalUi() {
  els.baseSkinSearch.addEventListener('input', filterBaseSkins);
  els.clearBaseSkinSearchBtn.addEventListener('click', () => {
    els.baseSkinSearch.value = '';
    filterBaseSkins();
  });
  els.baseSkinsList.addEventListener('change', (event) => {
    const target = event.target;
    if (target instanceof HTMLInputElement && target.type === 'checkbox') {
      updateBaseSkinCount();
      scheduleAutosave();
    }
  });

  els.form.addEventListener('input', () => {
    updateSizeMeta();
    scheduleAutosave();
  });
}

async function initPage() {
  buildMarchSections();
  buildHtChipGrid();
  buildTitanGearSections();
  wireLocalUi();
  await loadBaseSkinMasterList();
  loadDraftFromLocal();
  updateSizeMeta();
  updateAuthUi();
  initFirebaseIfConfigured();
}

initPage();
