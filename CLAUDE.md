# TW-Calculators

## Project Overview

A player companion site for the mobile game **Top War** (https://h5.topwargame.com/).

Hosted at: **https://mathomhouse.github.io/**

The site provides guides, calculators, and reference tools for Top War players.

## Tech Stack

- **Pure static HTML + JavaScript** — no build system, no framework, no npm
- Hosted on **GitHub Pages** — deploys automatically from the `main` branch
- All pages are standalone `.html` files with inline or linked JS/CSS

## Project Structure

- Root-level `.html` files — main calculators and tools (gems, gear, VIP, equipment, etc.)
- `guides/` — player guides
- `styles/` — shared CSS files
- `domain/` — domain map round pages
- `test/` — work-in-progress/experimental pages
- `archive/` — old versions of pages
- `old files/` — deprecated files kept for reference
- `templates/` — page templates

## Key Notes

- No local dev server needed — open HTML files directly in browser
- Changes to `main` branch go live on GitHub Pages immediately
- Keep all code self-contained in HTML/JS/CSS; avoid external dependencies where possible
