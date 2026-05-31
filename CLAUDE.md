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

### Armory patch workflow
`armory-report.html` is a third-party file (from 2864tw.com's armory tool) that gets patched to work on mathomhouse. The patch script is `scripts/patch-armory.js` — a Node.js CLI:
```
node scripts/patch-armory.js armory-report.html
```
It is idempotent (each step guarded by a marker comment or string check). `scripts/armory-auth-override.js` is injected by the patch and handles auth bridging to the mathomhouse Cloudflare Worker (`mathomhouse-tw-worker.mathomhouse-tw.workers.dev`).

`scripts/patch-bookmarklet.js` similarly patches `all-bookmarklet.js` for deployment.

## Key Notes

- No local dev server needed — open HTML files directly in browser (or via `file://`)
- `archive/` and `old files/` are kept for reference; don't edit them
- When adding a new page to the nav, update both the desktop and mobile sections of `header.html` (they are separate DOM blocks)
- The armory pages (`armory-report.html`, `bobgriftest.html`) are patched third-party files — edit with care and re-run the patch script if re-patching from source
