# TW-Scraper: Base Skins Extraction — Design Spec

**Date:** 2026-04-04
**Status:** Approved

## Overview

A standalone Node.js Playwright project (`TW-Scraper/`, sibling to `TW-Calculators/`) that extracts base skin data from the browser version of Top War and writes it to `../TW-Calculators/guides/base_skins.json`.

Not part of the TW-Calculators site — dev tooling only, no build system, no git repo (for now).

---

## Project Location

```
c:/Users/f8hho/OneDrive/Documents/github/TW/
  TW-Calculators/   ← existing site project
  TW-Scraper/       ← new standalone scraper project
    package.json
    session-login.js
    phase1-discover.js
    phase2-extract.js
    auth.json         ← gitignored; saved Facebook session
    api-log.json      ← gitignored; Phase 1 output
```

---

## Target Game URL

```
https://h5.topwargame.com/h5game/index.html?campaignid=official_website&tsN0=14794255
```

---

## Output Schema

Matches the existing `guides/base_skins.json` flat object structure:

```json
{
  "Base Skin Name": "",
  "Equipped Stat 1": "", "Equipped Stat 1 Value": "",
  "Equipped Stat 2": "", "Equipped Stat 2 Value": "",
  "Equipped Stat 3": "", "Equipped Stat 3 Value": "",
  "Equipped Stat 4": "", "Equipped Stat 4 Value": "",
  "Holding In Stock Stat 1": "", "Holding In Stock Stat 1 Value": "",
  "Holding In Stock Stat 2": "", "Holding In Stock Stat 2 Value": "",
  "Holding In Stock Stat 3": "", "Holding In Stock Stat 3 Value": "",
  "Holding In Stock Stat 4": "", "Holding In Stock Stat 4 Value": "",
  "Base Skill?": "",
  "Skill Details": "",
  "Notes": "",
  "Highest Level?": ""
}
```

Fields left as empty strings where game API data is absent or unmappable.

---

## Scripts

### `session-login.js` — One-time session capture

- Opens a **visible** Chromium browser
- Navigates to the game URL
- Waits for the user to manually log in via Facebook
- Saves the full browser session (cookies, localStorage) to `auth.json`
- Run once; reuse `auth.json` on all subsequent runs
- Re-run if session expires

### `phase1-discover.js` — API traffic discovery

**Purpose:** Identify the endpoints and response shapes used for the skin list and individual skin details.

**Steps:**
1. Load `auth.json` session
2. Navigate to game URL (visible browser)
3. Close the opening dialog (see Dialog Handling below)
4. Follow the known navigation path to the base skins screen
5. Begin intercepting and logging:
   - All XHR/fetch responses with `Content-Type: application/json`
   - All WebSocket messages (both sent and received)
6. Log each event to `api-log.json`:
   ```json
   {
     "timestamp": "...",
     "type": "fetch|websocket",
     "direction": "send|receive",
     "url": "...",
     "requestBody": {},
     "responseBody": {},
     "status": 200
   }
   ```
7. Keep browser open — user scrolls the skin list and clicks into several skins
8. User presses Ctrl+C to end session; all captured traffic saved

**Output:** `api-log.json` — reviewed manually to identify:
- Skin list endpoint (+ pagination shape)
- Skin detail endpoint (+ request/response shape)
- Auth headers or tokens required

### `phase2-extract.js` — Full extraction

**Purpose:** Use the identified APIs to extract all skins and write `base_skins.json`.

**Steps:**
1. Load `auth.json` session
2. Navigate to game URL, close dialog, navigate to skins screen (to establish game context and any session-bound auth tokens)
3. Call the skin **list** endpoint in a loop, handling pagination, to collect all skin IDs/names
4. For each skin, call the skin **detail** endpoint with a configurable delay between requests (default: 500ms) to avoid rate limiting
5. Map API response fields to the output schema:
   - Equipped stats and in-stock stats mapped from whatever arrays/objects the API returns
   - `Base Skill?` and `Skill Details` populated from skill-related fields if present
   - `Notes` and `Highest Level?`: best-effort from level/upgrade-chain fields in the API; fields marked with `"TODO: verify"` where mapping is uncertain
6. Write full array to `../TW-Calculators/guides/base_skins.json`
7. Print a summary: total skins found, fields that had TODO markers

**Iterative mapping:** The Notes/Highest Level mapping is expected to require iteration. Phase 2 will be updated as the API shape becomes known from Phase 1 output.

---

## Dialog Handling

On game load, a dialog appears that must be closed before navigation. The script tries these strategies in order:

1. Click a button matching selectors: `[class*="close"]`, `[class*="Close"]`, `button.cancel`, `[aria-label="close"]`
2. Press `Escape`
3. Click a backdrop/overlay element
4. Take a screenshot to `dialog-debug.png` and log a warning if none of the above worked

---

## Error Handling

| Scenario | Behavior |
|---|---|
| `auth.json` missing | Print clear message: "Run session-login.js first" and exit |
| Session expired (redirected to login) | Detect redirect, print "Session expired — re-run session-login.js" and exit |
| Skin detail request fails | Log warning, write empty-field entry with skin name, continue |
| Rate limit response | Wait 5 seconds, retry once; if still failing, stop and report how far it got |
| Missing/unmappable API fields | Write empty string; do not crash |

---

## Dependencies

```json
{
  "playwright": "latest",
  "chromium": "(installed via npx playwright install chromium)"
}
```

No other dependencies. Pure Node.js scripts.

---

## Not In Scope

- Automating Facebook login (session saved manually once)
- Scraping any data other than base skins
- Any UI or web server
- Committing `auth.json` or `api-log.json` to git
