#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const file = process.argv[2] || 'armory-report.html';
const filePath = path.resolve(file);
let content = fs.readFileSync(filePath, 'utf8');

// 1. Inject site assets + auth override into </head>.
//    Each item guarded individually so re-runs on a partially-patched file don't create duplicates.
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
if (!content.includes('styles/layout.css')) {
  toInject.push('<link rel="stylesheet" href="styles/layout.css">');
}
if (!content.includes('"header.js"')) {
  toInject.push('<script src="header.js" defer></script>');
}
if (!content.includes('armory-auth-override.js')) {
  toInject.push('<script src="armory-auth-override.js" defer></script>');
}
if (toInject.length > 0) {
  content = content.replace('</head>', `${toInject.join('\n')}\n</head>`);
}

// 2. Inject header placeholder after <body>
if (!content.includes('id="header-placeholder"')) {
  content = content.replace(/(<body[^>]*>)/s, '$1\n<header id="header-placeholder"></header>');
}

// 3. Replace footer with site footer
content = content.replace(/<footer>[\s\S]*?<\/footer>/s, '<footer>&copy; 2024 Mathom House &middot; Not affiliated with TopWar</footer>');

// 4. Inject back-to-top before </body>
if (!content.includes('id="backToTop"')) {
  content = content.replace('</body>', '<a href="#" class="back-top" id="backToTop" aria-label="Back to top">↑</a>\n</body>');
}

// 5. Worker URL replacements
const MATHOMHOUSE_WORKER = 'https://mathomhouse-tw-worker.mathomhouse-tw.workers.dev';
content = content.replace(/((?:var|const|let)\s+PUSH_WORKER\s*=\s*)(['"])[^'"]*\2/g, (_, prefix) => `${prefix}'${MATHOMHOUSE_WORKER}'`);
content = content.replace(/((?:var|const|let)\s+SUPPLEMENT_WORKER\s*=\s*)(['"])[^'"]*\2/g, (_, prefix) => `${prefix}'${MATHOMHOUSE_WORKER}'`);

// 6. ASSET_BASE → '/' so game assets resolve against GitHub Pages root
content = content.replace(/((?:var|const|let)\s+ASSET_BASE\s*=\s*)(['"])[^'"]*\2/, `$1'/'`);

// 7. ASSET URL → mathomhouse.github.io
content = content.replace(
  /((?:var|const|let)\s+ASSET\s*=\s*)(['"])https:\/\/raw\.githubusercontent\.com\/texnottexas\/landing-page\/main\/assets\/\2/g,
  `$1'https://raw.githubusercontent.com/mathomhouse/mathomhouse.github.io/main/assets/'`
);

// 8. Replace all 2864tw.com references with mathomhouse.github.io
content = content.replace(/https:\/\/2864tw\.com\b/g, 'https://mathomhouse.github.io');

// 9. Remove :root color variable block (site tokens take over)
content = content.replace(/:root\s*\{[\s\S]*?--bg:[\s\S]*?\}/s, '');

// 10. Replace Google Fonts with site canonical set
content = content.replace(/<link[^>]*fonts\.googleapis\.com[^>]*>/g, '');
content = content.replace(/<link[^>]*fonts\.gstatic\.com[^>]*>/g, '');
if (!content.includes('fonts.googleapis.com/css2?family=Rajdhani')) {
  const fontsLink = '<link rel="preconnect" href="https://fonts.googleapis.com">'
    + '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
    + '<link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Crimson+Pro:ital,wght@0,300;0,400;1,300&display=swap" rel="stylesheet">';
  content = content.replace('</head>', `${fontsLink}\n</head>`);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log(`Patched ${filePath}`);
