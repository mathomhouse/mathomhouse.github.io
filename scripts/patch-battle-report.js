#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const file = process.argv[2] || 'battle-report.html';
const filePath = path.resolve(file);
let content = fs.readFileSync(filePath, 'utf8');

// 1. Ensure Rajdhani font is loaded
if (!content.includes('fonts.googleapis.com/css2?family=Rajdhani')) {
  const fontsLink = '<link rel="preconnect" href="https://fonts.googleapis.com">'
    + '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
    + '<link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&display=swap" rel="stylesheet">';
  content = content.replace('</head>', `${fontsLink}\n</head>`);
}

// 2. Font override — ensure inputs/selects/textareas use Rajdhani (browsers don't inherit font-family into form elements by default)
const fontFixStyle = '<style id="br-font-fix">input,select,textarea{font-family:\'Rajdhani\',-apple-system,BlinkMacSystemFont,sans-serif!important;}</style>';
if (content.includes('id="br-font-fix"')) {
  content = content.replace(/<style id="br-font-fix">[\s\S]*?<\/style>/, fontFixStyle);
} else {
  content = content.replace('</head>', `${fontFixStyle}\n</head>`);
}

// 3. Remove "fk boats" footer div (replace with blank div to preserve layout).
//    Guard on text presence first so this is a no-op on already-patched files.
//    Two-</div> pattern needed: non-greedy [\s\S]*? stops at inner div; \s*<\/div> consumes the outer.
if (content.includes('fk boats')) {
  content = content.replace(
    /<div class="footer">[\s\S]*?<\/div>\s*<\/div>/,
    '<div class="footer"></div>'
  );
}

// 4. Inject header placeholder after <body> (if not already present)
if (!content.includes('id="header-placeholder"')) {
  content = content.replace(/(<body[^>]*>)/s, '$1\n<header id="header-placeholder"></header>');
}

// 5. Inject site assets into </head> (each guarded against duplicates)
const toInject = [];
if (!content.includes('localStorage.getItem(\'theme\')')) {
  toInject.push('<script>(function(){var t=localStorage.getItem(\'theme\');if(t)document.documentElement.setAttribute(\'data-theme\',t)})();</script>');
}
if (!content.includes('styles/mathomhouse.css')) {
  toInject.push('<link rel="stylesheet" href="styles/mathomhouse.css">');
}
if (!content.includes('styles/header.css')) {
  toInject.push('<link rel="stylesheet" href="styles/header.css">');
}
if (!content.includes('"header.js"')) {
  toInject.push('<script src="header.js" defer></script>');
}
if (toInject.length > 0) {
  content = content.replace('</head>', `${toInject.join('\n')}\n</head>`);
}

// 6. Ensure mathomhouse site footer exists (before </body>)
if (!content.includes('Mathom House &middot; Not affiliated with TopWar')) {
  content = content.replace('</body>', '<footer>&copy; 2024 Mathom House &middot; Not affiliated with TopWar</footer>\n</body>');
}

// 7. Inject back-to-top before </body>
if (!content.includes('id="backToTop"')) {
  content = content.replace('</body>', '<a href="#" class="back-top" id="backToTop" aria-label="Back to top">&#8593;</a>\n</body>');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log(`Patched ${filePath}`);
