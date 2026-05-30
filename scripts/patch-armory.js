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

// 5. Remove frame-ancestors from CSP meta (ignored by browsers; self-bust handles it at runtime)
content = content.replace(/\s*frame-ancestors[^;]*;/g, '');

// 5b. Add GA domains to CSP (needed for header.js GA snippet)
if (!content.includes('https://www.googletagmanager.com')) {
  content = content.replace(
    /(script-src\s[^"]*?)(https:\/\/c\.bing\.com)/,
    '$1$2 https://www.googletagmanager.com'
  );
}
if (!content.includes('https://www.google-analytics.com')) {
  content = content.replace(
    /(connect-src\s[^"]*?)(https:\/\/c\.bing\.com)/,
    '$1$2 https://www.google-analytics.com'
  );
}

// 5c. Expose ArmoryIdentity on window — it's var-scoped inside the page IIFE, not on window
if (!content.includes('window.ArmoryIdentity = ArmoryIdentity')) {
  content = content.replace(
    'function getStoredIdentity()',
    'window.ArmoryIdentity = ArmoryIdentity;\n\n  function getStoredIdentity()'
  );
}

// 5e. Add mathomhouse.github.io and fonts.googleapis.com to style-src
if (!content.match(/style-src[^"]*mathomhouse\.github\.io/)) {
  content = content.replace(
    /(style-src\s[^"]*?)(https:\/\/translate\.googleapis\.com)/,
    '$1https://mathomhouse.github.io $2'
  );
}
if (!content.match(/style-src[^"]*fonts\.googleapis\.com/)) {
  content = content.replace(
    /(style-src\s[^"]*?)(https:\/\/translate\.googleapis\.com)/,
    '$1https://fonts.googleapis.com $2'
  );
}

// 5f. Add mathomhouse worker to connect-src
if (!content.match(/connect-src[^"]*mathomhouse-tw-worker/)) {
  content = content.replace(
    /(connect-src\s[^"]*?)('self')/,
    `$1'self' https://mathomhouse-tw-worker.mathomhouse-tw.workers.dev`
  );
}

// 6. Worker URL replacements
const MATHOMHOUSE_WORKER = 'https://mathomhouse-tw-worker.mathomhouse-tw.workers.dev';
content = content.replace(/((?:var|const|let)\s+PUSH_WORKER\s*=\s*)(['"])[^'"]*\2/g, (_, prefix) => `${prefix}'${MATHOMHOUSE_WORKER}'`);
content = content.replace(/((?:var|const|let)\s+SUPPLEMENT_WORKER\s*=\s*)(['"])[^'"]*\2/g, (_, prefix) => `${prefix}'${MATHOMHOUSE_WORKER}'`);

// 7. ASSET_BASE → raw GitHub URL so game assets resolve from the repo
content = content.replace(/((?:var|const|let)\s+ASSET_BASE\s*=\s*)(['"])[^'"]*\2/, `$1'https://raw.githubusercontent.com/mathomhouse/mathomhouse.github.io/main/'`);

// 8. ASSET URL → mathomhouse.github.io
content = content.replace(
  /https:\/\/raw\.githubusercontent\.com\/texnottexas\/landing-page\/main\/assets\//g,
  'https://raw.githubusercontent.com/mathomhouse/mathomhouse.github.io/main/assets/'
);

// 9. Replace all 2864tw.com references with mathomhouse.github.io
content = content.replace(/https:\/\/2864tw\.com\b/g, 'https://mathomhouse.github.io');

// 10. Remove :root color variable block (site tokens take over)
content = content.replace(/:root\s*\{[\s\S]*?--bg:[\s\S]*?\}/s, '');

// 11. Replace Google Fonts with site canonical set
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
