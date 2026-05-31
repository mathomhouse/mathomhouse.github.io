#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');

const file = process.argv[2] || 'all-bookmarklet.js';
const filePath = path.resolve(file);
let content = fs.readFileSync(filePath, 'utf8');
const original = content;

if (!content.includes('Skill Dismantle wizard')) {
  console.log('No dismantle section found — already patched or missing. No changes made.');
  process.exit(0);
}

// 1. Remove the dismantle section block.
//    Start: the comment banner containing "Skill Dismantle wizard" (include preceding blank
//           line so we don't leave a stray blank in its place).
//    End: just before the next top-level construct — anchored on either the "Builds the
//         human-readable" comment OR "function summarizeDump", whichever appears first.
//    The end boundary is chosen to be stable even if the section grows/shrinks.
const lines = content.split('\n');
let startIdx = -1;
let endIdx = -1;

for (let i = 0; i < lines.length; i++) {
  if (startIdx === -1 && lines[i].includes('Skill Dismantle wizard')) {
    // Include the preceding blank line so removal is clean.
    startIdx = (i > 0 && lines[i - 1].trim() === '') ? i - 1 : i;
  }
  if (startIdx !== -1 && endIdx === -1 && i > startIdx) {
    if (
      lines[i].includes('function summarizeDump') ||
      lines[i].includes('Builds the human-readable')
    ) {
      endIdx = i;
    }
  }
}

if (startIdx === -1 || endIdx === -1) {
  console.error('ERROR: Could not locate dismantle section boundaries. Aborting.');
  process.exit(1);
}

lines.splice(startIdx, endIdx - startIdx);
content = lines.join('\n');

// 2. Remove sharedExtractInventory declaration and its two-line comment.
//    The comment reads "Captured during inventory extraction so the dismantle wizard can / ..."
content = content.replace(
  /\n[ \t]*\/\/ Captured during inventory extraction[^\n]*\n[^\n]*\n[ \t]*var sharedExtractInventory = null;/,
  ''
);

// 3. Remove the sharedExtractInventory assignment inside extractInventory().
content = content.replace(
  /\n[ \t]*sharedExtractInventory = extractInventory;/,
  ''
);

// 4. Remove the dismantle button block inside attachCopyUI.
//    Runs from the "// Dismantle hand-off" comment through bg.appendChild(dismantleRow).
content = content.replace(
  /\n[ \t]*\/\/ Dismantle hand-off[\s\S]*?bg\.appendChild\(dismantleRow\);/,
  ''
);

if (content === original) {
  console.log('WARNING: Dismantle section marker found but no changes were applied. Check patterns.');
  process.exit(1);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log(`Patched ${filePath} — dismantle section removed.`);
