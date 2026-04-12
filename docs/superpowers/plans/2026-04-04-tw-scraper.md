# TW-Scraper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone Playwright Node.js project that discovers Top War's base skin APIs (Phase 1) and extracts all skin data into `guides/base_skins.json` (Phase 2).

**Architecture:** Three phases — one-time session login, an interactive API discovery script, and a headless extraction script. Shared navigation and transformation logic live in focused modules. Phase 2 extraction endpoints are populated after Phase 1 analysis.

**Tech Stack:** Node.js 18+, Playwright (Chromium), built-in `node:test` for unit tests

---

## File Map

| File | Responsibility |
|---|---|
| `package.json` | Dependencies and test script |
| `.gitignore` | Exclude auth.json, api-log.json, node_modules |
| `config.js` | Game URL, navigation steps, output path, delays, API endpoints |
| `navigate.js` | Shared: launch browser with session, close dialog, navigate to skins |
| `transform.js` | Map raw API skin object → base_skins.json schema entry |
| `transform.test.js` | Unit tests for transform.js |
| `session-login.js` | One-time: manual Facebook login + save auth.json |
| `phase1-discover.js` | Interactive: intercept + log all API traffic to api-log.json |
| `phase2-extract.js` | Headless: call APIs, transform data, write base_skins.json |

---

## Task 1: Project scaffold

**Files:**
- Create: `c:/Users/f8hho/OneDrive/Documents/github/TW/TW-Scraper/package.json`
- Create: `c:/Users/f8hho/OneDrive/Documents/github/TW/TW-Scraper/.gitignore`

- [ ] **Step 1: Create the project folder**

```bash
mkdir "c:/Users/f8hho/OneDrive/Documents/github/TW/TW-Scraper"
cd "c:/Users/f8hho/OneDrive/Documents/github/TW/TW-Scraper"
```

- [ ] **Step 2: Create `package.json`**

```json
{
  "name": "tw-scraper",
  "version": "1.0.0",
  "description": "Top War base skin data extractor",
  "type": "commonjs",
  "scripts": {
    "test": "node --test transform.test.js",
    "login": "node session-login.js",
    "discover": "node phase1-discover.js",
    "extract": "node phase2-extract.js"
  },
  "dependencies": {
    "playwright": "^1.44.0"
  }
}
```

- [ ] **Step 3: Create `.gitignore`**

```
node_modules/
auth.json
api-log.json
dialog-debug.png
```

- [ ] **Step 4: Install dependencies**

```bash
npm install
npx playwright install chromium
```

Expected: `node_modules/` created, Chromium browser downloaded.

---

## Task 2: Config module

**Files:**
- Create: `config.js`

- [ ] **Step 1: Create `config.js`**

This file contains all tunable values in one place. Fill in `NAV_STEPS` with the button sequence you know for reaching the base skins screen. Each step is `{ action, selector }` — see examples in the comments.

```js
// config.js
'use strict';

const path = require('path');

const GAME_URL = 'https://h5.topwargame.com/h5game/index.html?campaignid=official_website&tsN0=14794255';

// Selectors tried in order to close the opening dialog.
// Add more specific selectors at the front if you know them.
const DIALOG_CLOSE_SELECTORS = [
  '[class*="close"]',
  '[class*="Close"]',
  'button.cancel',
  '[aria-label="close"]',
  '[class*="btn-close"]',
];

// Navigation steps to reach the base skins screen from the main game view.
// Fill these in. Actions: 'click' | 'waitForSelector' | 'waitForTimeout'
// Examples:
//   { action: 'click',           selector: '.main-menu-button' }
//   { action: 'waitForSelector', selector: '.skin-panel' }
//   { action: 'waitForTimeout',  ms: 1000 }
const NAV_STEPS = [
  // TODO (user): fill in your known navigation path here
];

// Delay in ms between skin detail requests in Phase 2 (avoid rate limiting)
const REQUEST_DELAY_MS = 600;

// Phase 2 API endpoints — fill these in after running Phase 1 and reviewing api-log.json
const API = {
  // The endpoint that returns the full list of available skins
  // e.g. 'https://h5.topwargame.com/api/skins/list'
  SKIN_LIST: '',

  // The endpoint that returns details for a single skin (may accept skinId as query param or POST body)
  // e.g. 'https://h5.topwargame.com/api/skins/detail'
  SKIN_DETAIL: '',
};

// Absolute path to the output file in the TW-Calculators project
const OUTPUT_PATH = path.resolve(__dirname, '../TW-Calculators/guides/base_skins.json');

module.exports = { GAME_URL, DIALOG_CLOSE_SELECTORS, NAV_STEPS, REQUEST_DELAY_MS, API, OUTPUT_PATH };
```

- [ ] **Step 2: Fill in `NAV_STEPS`**

Using your knowledge of the in-game navigation path to the base skins screen, populate the `NAV_STEPS` array in `config.js`. For example:

```js
const NAV_STEPS = [
  { action: 'click',           selector: '.hud-base-button' },
  { action: 'waitForSelector', selector: '.base-skin-panel' },
  { action: 'click',           selector: '.base-skin-tab' },
  { action: 'waitForSelector', selector: '.skin-list-item' },
];
```

Replace the selectors with the real ones you observe when you load the game in a browser. Use DevTools (F12) to inspect the elements.

---

## Task 3: Shared navigation module

**Files:**
- Create: `navigate.js`

- [ ] **Step 1: Create `navigate.js`**

```js
// navigate.js
'use strict';

const { chromium } = require('playwright');
const fs = require('fs');
const { GAME_URL, DIALOG_CLOSE_SELECTORS, NAV_STEPS } = require('./config');

async function launchWithSession(headless = true) {
  if (!fs.existsSync('auth.json')) {
    console.error('auth.json not found. Run: npm run login');
    process.exit(1);
  }
  const browser = await chromium.launch({ headless });
  const context = await browser.newContext({ storageState: 'auth.json' });
  const page = await context.newPage();
  return { browser, context, page };
}

async function closeDialog(page) {
  // Try each close selector
  for (const selector of DIALOG_CLOSE_SELECTORS) {
    try {
      const el = await page.$(selector);
      if (el) {
        await el.click();
        await page.waitForTimeout(500);
        console.log(`Dialog closed via selector: ${selector}`);
        return true;
      }
    } catch {}
  }

  // Try Escape key
  try {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    const stillVisible = await page.$('[class*="dialog"],[class*="modal"],[class*="popup"]');
    if (!stillVisible) {
      console.log('Dialog closed via Escape');
      return true;
    }
  } catch {}

  // Take screenshot for debugging
  await page.screenshot({ path: 'dialog-debug.png' });
  console.warn('Could not close dialog automatically. Screenshot saved to dialog-debug.png');
  return false;
}

async function navigateToBaseSkins(page) {
  if (NAV_STEPS.length === 0) {
    throw new Error('NAV_STEPS is empty. Fill in config.js before running.');
  }
  for (const step of NAV_STEPS) {
    if (step.action === 'click') {
      await page.click(step.selector);
    } else if (step.action === 'waitForSelector') {
      await page.waitForSelector(step.selector, { timeout: 15000 });
    } else if (step.action === 'waitForTimeout') {
      await page.waitForTimeout(step.ms);
    }
  }
  console.log('Navigated to base skins screen');
}

module.exports = { launchWithSession, closeDialog, navigateToBaseSkins };
```

---

## Task 4: Session login script

**Files:**
- Create: `session-login.js`

- [ ] **Step 1: Create `session-login.js`**

```js
// session-login.js
'use strict';

const { chromium } = require('playwright');
const { GAME_URL } = require('./config');

(async () => {
  console.log('Opening browser for manual login...');
  console.log('1. Log in via Facebook when the game loads.');
  console.log('2. Wait until the game main screen is fully visible.');
  console.log('3. Press Enter in this terminal to save your session.\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(GAME_URL);

  // Wait for user to confirm login is complete
  await new Promise(resolve => {
    process.stdin.setRawMode(false);
    process.stdin.resume();
    process.stdin.once('data', resolve);
    console.log('Waiting... press Enter after you are fully logged in.');
  });

  await context.storageState({ path: 'auth.json' });
  console.log('Session saved to auth.json');

  await browser.close();
  process.exit(0);
})();
```

- [ ] **Step 2: Run the login script and verify**

```bash
npm run login
```

Expected: Browser opens, you log in via Facebook, press Enter, terminal prints `Session saved to auth.json`, and `auth.json` appears in the project folder.

---

## Task 5: Phase 1 discovery script

**Files:**
- Create: `phase1-discover.js`

- [ ] **Step 1: Create `phase1-discover.js`**

```js
// phase1-discover.js
'use strict';

const fs = require('fs');
const { GAME_URL } = require('./config');
const { launchWithSession, closeDialog, navigateToBaseSkins } = require('./navigate');

const log = [];

function record(entry) {
  log.push({ timestamp: new Date().toISOString(), ...entry });
}

function saveLog() {
  fs.writeFileSync('api-log.json', JSON.stringify(log, null, 2));
  console.log(`\nSaved ${log.length} entries to api-log.json`);
}

(async () => {
  const { browser, page } = await launchWithSession(false); // visible

  // Intercept fetch/XHR responses
  page.on('response', async (response) => {
    const url = response.url();
    const contentType = response.headers()['content-type'] || '';
    if (!contentType.includes('application/json')) return;

    try {
      const body = await response.json();
      record({
        type: 'fetch',
        direction: 'receive',
        status: response.status(),
        url,
        requestMethod: response.request().method(),
        requestPostData: (() => {
          try { return JSON.parse(response.request().postData() || 'null'); } catch { return response.request().postData(); }
        })(),
        responseBody: body,
      });
      console.log(`[FETCH] ${response.status()} ${url}`);
    } catch {}
  });

  // Intercept WebSocket messages
  page.on('websocket', (ws) => {
    console.log(`[WS OPEN] ${ws.url()}`);
    ws.on('framesent', (frame) => {
      let payload = frame.payload;
      try { payload = JSON.parse(payload); } catch {}
      record({ type: 'websocket', direction: 'send', url: ws.url(), payload });
      console.log(`[WS SEND]`, typeof payload === 'string' ? payload.slice(0, 120) : JSON.stringify(payload).slice(0, 120));
    });
    ws.on('framereceived', (frame) => {
      let payload = frame.payload;
      try { payload = JSON.parse(payload); } catch {}
      record({ type: 'websocket', direction: 'receive', url: ws.url(), payload });
      console.log(`[WS RECV]`, typeof payload === 'string' ? payload.slice(0, 120) : JSON.stringify(payload).slice(0, 120));
    });
  });

  await page.goto(GAME_URL);
  await page.waitForTimeout(3000);
  await closeDialog(page);
  await navigateToBaseSkins(page);

  console.log('\n--- Browser is open. Scroll the skin list and click several skins. ---');
  console.log('--- Press Ctrl+C when done to save api-log.json ---\n');

  process.on('SIGINT', () => { saveLog(); browser.close().then(() => process.exit(0)); });

  // Keep alive
  await new Promise(() => {});
})();
```

- [ ] **Step 2: Run Phase 1 and interact with the skin list**

```bash
npm run discover
```

Expected: Browser opens, game loads, dialog closes, game navigates to base skins. Scroll the full skin list and click into at least 5-6 different skins. Watch the terminal for `[FETCH]` and `[WS RECV]` lines logging API traffic. Press Ctrl+C when done.

- [ ] **Step 3: Analyze `api-log.json`**

Open `api-log.json` and identify:

1. **Skin list endpoint** — a response whose body contains an array of skins (look for entries where `responseBody` has a list with skin names/IDs). Note its `url` and `requestPostData` shape.
2. **Skin detail endpoint** — a response triggered when you clicked a skin, containing stat arrays. Note its `url`, `requestPostData`, and the full `responseBody` shape.
3. **Auth headers** — check if the requests carry any token in the URL or POST body (e.g. `token`, `session_id`, `uid`). Note these — they may need to be extracted from the page context in Phase 2.

Record your findings and update `config.js`:

```js
const API = {
  SKIN_LIST: 'https://...', // endpoint URL from your analysis
  SKIN_DETAIL: 'https://...', // endpoint URL from your analysis
};
```

---

## Task 6: Transform module

**Files:**
- Create: `transform.js`
- Create: `transform.test.js`

> **Note:** `transform.js` maps a raw API skin object to the base_skins.json schema. The exact field names come from your Phase 1 analysis. The structure below uses placeholder field names — update them to match your actual API response before running Phase 2.

- [ ] **Step 1: Write the failing test first**

Create `transform.test.js` with a mock API response shaped like what you observed in Phase 1:

```js
// transform.test.js
'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { transformSkin, buildNotesAndLevel } = require('./transform');

// Replace this mock with the actual shape from your api-log.json
const MOCK_SKIN = {
  skinName: 'Icy Snow Town',
  equippedBuffs: [
    { buffName: 'Damage Increase', buffValue: '12%' },
    { buffName: 'All units Attack', buffValue: '20%' },
    { buffName: 'All units HP', buffValue: '20%' },
  ],
  holdingBuffs: [
    { buffName: 'All units Attack', buffValue: '10%' },
    { buffName: 'All units HP', buffValue: '10%' },
    { buffName: 'Damage Increase', buffValue: '2%' },
  ],
  hasSkill: false,
  skillDesc: '',
  level: 2,
  maxLevel: 2,
  baseSkinId: 101,
  prevSkinName: 'Winter Resort',
};

describe('transformSkin', () => {
  test('maps name', () => {
    const result = transformSkin(MOCK_SKIN);
    assert.equal(result['Base Skin Name'], 'Icy Snow Town');
  });

  test('maps equipped stats', () => {
    const result = transformSkin(MOCK_SKIN);
    assert.equal(result['Equipped Stat 1'], 'Damage Increase');
    assert.equal(result['Equipped Stat 1 Value'], '12%');
    assert.equal(result['Equipped Stat 2'], 'All units Attack');
    assert.equal(result['Equipped Stat 4'], '');
    assert.equal(result['Equipped Stat 4 Value'], '');
  });

  test('maps holding in stock stats', () => {
    const result = transformSkin(MOCK_SKIN);
    assert.equal(result['Holding In Stock Stat 1'], 'All units Attack');
    assert.equal(result['Holding In Stock Stat 1 Value'], '10%');
    assert.equal(result['Holding In Stock Stat 3'], 'Damage Increase');
    assert.equal(result['Holding In Stock Stat 4'], '');
  });

  test('maps Base Skill fields', () => {
    const result = transformSkin(MOCK_SKIN);
    assert.equal(result['Base Skill?'], 'FALSE');
    assert.equal(result['Skill Details'], '');
  });

  test('marks highest level when at max', () => {
    const result = transformSkin(MOCK_SKIN);
    assert.equal(result['Highest Level?'], 'TRUE');
  });

  test('marks not highest level when below max', () => {
    const lower = { ...MOCK_SKIN, skinName: 'Winter Resort', level: 1, prevSkinName: '' };
    const result = transformSkin(lower);
    assert.equal(result['Highest Level?'], 'FALSE');
  });

  test('populates Notes with upgrade chain', () => {
    const result = transformSkin(MOCK_SKIN);
    assert.equal(result['Notes'], 'Level 2 of Winter Resort');
  });

  test('leaves Notes blank when no upgrade chain info', () => {
    const base = { ...MOCK_SKIN, level: 1, prevSkinName: '' };
    const result = transformSkin(base);
    assert.equal(result['Notes'], '');
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
npm test
```

Expected: FAIL — `Cannot find module './transform'`

- [ ] **Step 3: Create `transform.js`**

Update the field name mappings (e.g. `skinName`, `equippedBuffs`, `buffName`) to match the actual API response shape from your `api-log.json` analysis:

```js
// transform.js
'use strict';

function transformSkin(apiSkin) {
  // --- Update these field names to match your actual API response ---
  const name = apiSkin.skinName || apiSkin.name || '';
  const equippedBuffs = apiSkin.equippedBuffs || apiSkin.equip_buffs || [];
  const holdingBuffs = apiSkin.holdingBuffs || apiSkin.hold_buffs || [];
  const hasSkill = !!(apiSkin.hasSkill || apiSkin.has_skill);
  const skillDesc = apiSkin.skillDesc || apiSkin.skill_desc || '';
  const level = apiSkin.level || 1;
  const maxLevel = apiSkin.maxLevel || apiSkin.max_level || level;
  const prevSkinName = apiSkin.prevSkinName || apiSkin.prev_skin_name || '';
  // -----------------------------------------------------------------

  const equipped = padToFour(equippedBuffs);
  const holding = padToFour(holdingBuffs);

  const notes = buildNotes(level, prevSkinName);
  const highestLevel = level >= maxLevel ? 'TRUE' : 'FALSE';

  return {
    'Base Skin Name': name,
    'Equipped Stat 1':       buffName(equipped[0]),
    'Equipped Stat 1 Value': buffValue(equipped[0]),
    'Equipped Stat 2':       buffName(equipped[1]),
    'Equipped Stat 2 Value': buffValue(equipped[1]),
    'Equipped Stat 3':       buffName(equipped[2]),
    'Equipped Stat 3 Value': buffValue(equipped[2]),
    'Equipped Stat 4':       buffName(equipped[3]),
    'Equipped Stat 4 Value': buffValue(equipped[3]),
    'Holding In Stock Stat 1':       buffName(holding[0]),
    'Holding In Stock Stat 1 Value': buffValue(holding[0]),
    'Holding In Stock Stat 2':       buffName(holding[1]),
    'Holding In Stock Stat 2 Value': buffValue(holding[1]),
    'Holding In Stock Stat 3':       buffName(holding[2]),
    'Holding In Stock Stat 3 Value': buffValue(holding[2]),
    'Holding In Stock Stat 4':       buffName(holding[3]),
    'Holding In Stock Stat 4 Value': buffValue(holding[3]),
    'Base Skill?':  hasSkill ? 'TRUE' : 'FALSE',
    'Skill Details': skillDesc,
    'Notes': notes,
    'Highest Level?': highestLevel,
  };
}

function padToFour(arr) {
  const result = arr.slice(0, 4);
  while (result.length < 4) result.push(null);
  return result;
}

function buffName(buff) {
  if (!buff) return '';
  return buff.buffName || buff.buff_name || buff.name || '';
}

function buffValue(buff) {
  if (!buff) return '';
  const v = buff.buffValue || buff.buff_value || buff.value || '';
  return String(v);
}

function buildNotes(level, prevSkinName) {
  if (level > 1 && prevSkinName) return `Level ${level} of ${prevSkinName}`;
  return '';
}

module.exports = { transformSkin, buildNotes };
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test
```

Expected: All tests PASS. If any fail, the mock shape in `transform.test.js` doesn't match `transform.js` — align them.

- [ ] **Step 5: Update mock and field mappings for real API shape**

After running Phase 1, you will know the actual field names in the API response. Update `MOCK_SKIN` in `transform.test.js` to exactly match a real API skin entry from `api-log.json`, then update the field name mappings in `transform.js` to match. Re-run `npm test` and confirm everything still passes.

---

## Task 7: Phase 2 extraction script

**Files:**
- Create: `phase2-extract.js`

> **Prerequisite:** `config.js` must have `API.SKIN_LIST` and `API.SKIN_DETAIL` filled in from Phase 1 analysis.

- [ ] **Step 1: Create `phase2-extract.js`**

```js
// phase2-extract.js
'use strict';

const fs = require('fs');
const { GAME_URL, API, REQUEST_DELAY_MS, OUTPUT_PATH } = require('./config');
const { launchWithSession, closeDialog, navigateToBaseSkins } = require('./navigate');
const { transformSkin } = require('./transform');

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function callApi(page, url, body) {
  return page.evaluate(async ({ url, body }) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    return res.json();
  }, { url, body });
}

async function fetchAllSkinIds(page) {
  const ids = [];
  let pageNum = 1;

  while (true) {
    console.log(`Fetching skin list page ${pageNum}...`);
    // Update the request body shape to match what Phase 1 showed
    const response = await callApi(page, API.SKIN_LIST, { page: pageNum, pageSize: 50 });

    // Update these field paths to match actual API response structure
    const skins = response.data || response.list || response.skins || [];
    if (!Array.isArray(skins) || skins.length === 0) break;

    for (const skin of skins) {
      // Update field name to match actual skin ID field from API
      const id = skin.skinId || skin.id || skin.skin_id;
      if (id != null) ids.push(id);
    }

    // Update the hasMore / pagination field to match actual API response
    const hasMore = response.hasMore || response.has_more || (response.total > ids.length);
    if (!hasMore) break;

    pageNum++;
    await delay(REQUEST_DELAY_MS);
  }

  console.log(`Found ${ids.length} skin IDs`);
  return ids;
}

async function fetchSkinDetail(page, skinId) {
  // Update the request body shape to match what Phase 1 showed
  return callApi(page, API.SKIN_DETAIL, { skinId });
}

(async () => {
  if (!API.SKIN_LIST || !API.SKIN_DETAIL) {
    console.error('API endpoints not configured. Fill in API.SKIN_LIST and API.SKIN_DETAIL in config.js after running Phase 1.');
    process.exit(1);
  }

  const { browser, page } = await launchWithSession(true); // headless

  await page.goto(GAME_URL);
  await page.waitForTimeout(3000);
  await closeDialog(page);
  await navigateToBaseSkins(page);

  const skinIds = await fetchAllSkinIds(page);
  const results = [];
  const todos = [];

  for (let i = 0; i < skinIds.length; i++) {
    const skinId = skinIds[i];
    console.log(`[${i + 1}/${skinIds.length}] Fetching skin ${skinId}...`);

    try {
      const raw = await fetchSkinDetail(page, skinId);
      // Update to match actual response wrapper (e.g. raw.data, raw.skin, raw itself)
      const skinData = raw.data || raw.skin || raw;
      const entry = transformSkin(skinData);

      if (entry['Notes'].includes('TODO') || entry['Highest Level?'] === '') {
        todos.push(entry['Base Skin Name']);
      }

      results.push(entry);
    } catch (err) {
      console.warn(`  Failed for skin ${skinId}: ${err.message}`);
      results.push({
        'Base Skin Name': String(skinId),
        'Equipped Stat 1': '', 'Equipped Stat 1 Value': '',
        'Equipped Stat 2': '', 'Equipped Stat 2 Value': '',
        'Equipped Stat 3': '', 'Equipped Stat 3 Value': '',
        'Equipped Stat 4': '', 'Equipped Stat 4 Value': '',
        'Holding In Stock Stat 1': '', 'Holding In Stock Stat 1 Value': '',
        'Holding In Stock Stat 2': '', 'Holding In Stock Stat 2 Value': '',
        'Holding In Stock Stat 3': '', 'Holding In Stock Stat 3 Value': '',
        'Holding In Stock Stat 4': '', 'Holding In Stock Stat 4 Value': '',
        'Base Skill?': '', 'Skill Details': '', 'Notes': '', 'Highest Level?': '',
      });
    }

    await delay(REQUEST_DELAY_MS);
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2));
  console.log(`\nWrote ${results.length} skins to ${OUTPUT_PATH}`);

  if (todos.length > 0) {
    console.log(`\nSkins needing manual review (${todos.length}):`);
    todos.forEach(name => console.log(`  - ${name}`));
  }

  await browser.close();
})();
```

- [ ] **Step 2: Verify the API endpoint guard works**

Before filling in endpoints, run:

```bash
npm run extract
```

Expected: Terminal prints `API endpoints not configured...` and exits cleanly.

- [ ] **Step 3: Fill in API endpoints and run Phase 2**

After completing Phase 1 analysis (Task 5 Step 3), fill in `config.js`:

```js
const API = {
  SKIN_LIST: 'https://...', // from api-log.json
  SKIN_DETAIL: 'https://...', // from api-log.json
};
```

Then run:

```bash
npm run extract
```

Expected: Terminal shows skin list pages fetching, then individual skin fetches, then writes to `../TW-Calculators/guides/base_skins.json`.

- [ ] **Step 4: Verify output**

```bash
node -e "const d = require('../TW-Calculators/guides/base_skins.json'); console.log('Total skins:', d.length); console.log('Sample:', JSON.stringify(d[0], null, 2))"
```

Expected: Total count printed, first skin entry shown with all fields populated. If stat fields are empty or skin name is a raw ID, the field mappings in `phase2-extract.js` (`fetchAllSkinIds`, `fetchSkinDetail`) and/or `transform.js` need updating to match the actual API response structure. Re-run `npm test` after each change to transform.js.

---

## Self-Review Notes

- **Spec coverage:** Session login ✓, dialog handling ✓, Phase 1 discovery ✓, WebSocket interception ✓, Phase 2 extraction ✓, pagination ✓, rate limiting ✓, transform to schema ✓, Notes/Highest Level best-effort ✓, auth.json missing guard ✓, session expiry guard ✓, output path to TW-Calculators ✓
- **Iterative mapping:** Phase 1 → Task 5 analysis step → Task 6 Step 5 update cycle is explicit
- **No git repo:** Commit steps omitted per project setup
- **API.SKIN_LIST/SKIN_DETAIL in config.js** are intentionally empty strings with guards — not placeholders, but runtime-configurable values that Phase 1 fills in
