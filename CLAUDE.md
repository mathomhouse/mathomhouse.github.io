# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Player companion site for **Top War** mobile game. Hosted at **https://mathomhouse.github.io/** via GitHub Pages (auto-deploys from `main`).

Pure static HTML + JavaScript — no build system, no npm, no framework.

## Architecture Patterns

### Header / Nav
`header.html` is a shared nav fragment. Every page includes `<header id="header-placeholder"></header>` and loads `header.js` (deferred), which fetches `/header.html` and injects it. `header.js` also bootstraps Google Analytics.

### Theme
Anti-flash snippet runs inline (before CSS) in every page `<head>`:
```html
<script>(function(){var t=localStorage.getItem('theme');if(t)document.documentElement.setAttribute('data-theme',t);})()</script>
```
Theme toggle is handled inside `header.js`.

### CSS stack
Most pages load these three in order:
1. `styles/mathomhouse.css` — base tokens, dark/light theme vars
2. `styles/header.css` — nav styles
3. `styles/layout.css` — page layout

Additional specialized sheets: `styles/store.css`, `styles/calculators.css`, `styles/bobsrunes.css`.

### Scripts
Page-specific JS lives in `scripts/` and is loaded via `<script src="scripts/foo.js" defer>`. Data files live in `data/` as JSON.

### Patch workflow (third-party files)

Three files are third-party sources that get replaced from upstream. **NEVER edit them directly.** All changes must go in their respective patch scripts. Do not run the patch scripts — the user runs them.

All patch scripts are idempotent (each step guarded by a marker comment or string check).

#### `armory-report.html`
**NEVER directly edit `armory-report.html`.** All changes go in `scripts/patch-armory.js` or `scripts/armory-auth-override.js`.
```
node scripts/patch-armory.js armory-report.html
```
`scripts/armory-auth-override.js` is injected by the patch and handles auth bridging to the mathomhouse Cloudflare Worker (`mathomhouse-tw-worker.mathomhouse-tw.workers.dev`).

#### `battle-report.html`
**NEVER directly edit `battle-report.html`.** All changes go in `scripts/patch-battle-report.js`.
```
node scripts/patch-battle-report.js battle-report.html
```

#### `all-bookmarklet.js`
**NEVER directly edit `all-bookmarklet.js`.** All changes go in `scripts/patch-bookmarklet.js`.
```
node scripts/patch-bookmarklet.js all-bookmarklet.js
```

#### `guides/heroes-awakening.html`
**NEVER directly edit `guides/heroes-awakening.html`.** All changes go in `scripts/patch-heroes-awakening.js`.
```
node scripts/patch-heroes-awakening.js guides/heroes-awakening.html
```

## Key Notes

- No local dev server needed — open HTML files directly in browser (or via `file://`)
- `archive/` and `old files/` are kept for reference; don't edit them
- When adding a new page to the nav, update both the desktop and mobile sections of `header.html` (they are separate DOM blocks)
- `armory-report.html`, `battle-report.html`, `all-bookmarklet.js`, and `guides/heroes-awakening.html` are patched third-party files — never edit directly, see patch workflow above
- New guide pages: copy `templates/guidetemplate.html` as the starting point
- Every page `<head>` must include the Google Fonts block (Rajdhani + Crimson Pro) — see `styles/mathomhouse.css` header comment for the exact snippet
- `scripts/feedback-modal.js` is a self-contained drop-in feedback widget; load it on any page that needs a feedback button
- `domain/` contains per-round Domain War pages (`round1.html`–`round6.html`); `domainmaps/` holds their JSON data; `EnigmaDominators/` holds Enigma Dominator round JSON data
