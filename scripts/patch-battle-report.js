#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const file = process.argv[2] || 'battle-report.html';
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
if (!content.includes('scripts/feedback-modal.js')) {
  toInject.push('<script src="scripts/feedback-modal.js" defer></script>');
}
if (!content.includes('name="description"')) {
  toInject.push('<meta name="description" content="Tools and calculators for Top War players.">');
}
if (!content.includes('og:title')) {
  toInject.push('<meta property="og:title" content="Mathom House • Battle Report">');
}
if (!content.includes('og:description')) {
  toInject.push('<meta property="og:description" content="Look at battle report details!">');
}
if (!content.includes('og:image')) {
  toInject.push('<meta property="og:image" content="https://mathomhouse.github.io/mathomhouselogo.png">');
}
if (!content.includes('og:url')) {
  toInject.push('<meta property="og:url" content="https://mathomhouse.github.io/battle-report.html">');
}
if (!content.includes('og:type')) {
  toInject.push('<meta property="og:type" content="website">');
}
if (!content.includes('og:site_name')) {
  toInject.push('<meta property="og:site_name" content="From Artu, Gikey, and Tex">');
}
if (toInject.length > 0) {
  content = content.replace('</head>', `${toInject.join('\n')}\n</head>`);
}

// // 1. Ensure Rajdhani font is loaded
// if (!content.includes('fonts.googleapis.com/css2?family=Rajdhani')) {
//   const fontsLink = '<link rel="preconnect" href="https://fonts.googleapis.com">'
//     + '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
//     + '<link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&display=swap" rel="stylesheet">';
//   content = content.replace('</head>', `${fontsLink}\n</head>`);
// }

// 2. Inject header placeholder after <body>
if (!content.includes('id="header-placeholder"')) {
  content = content.replace(/(<body[^>]*>)/s, '$1\n<header id="header-placeholder"></header>');
}

// 3. Remove "fk boats" footer div (replace with blank div to preserve layout).
//    Guard on text presence first so this is a no-op on already-patched files.
//    Two-</div> pattern needed: non-greedy [\s\S]*? stops at inner div; \s*<\/div> consumes the outer.
if (content.includes('fk boats')) {
  content = content.replace(
    /<div class="footer">[\s\S]*?<\/div>\s*<\/div>/,
    '<footer>&copy; 2024 Mathom House &middot; Not affiliated with TopWar</footer>'
  );
}

// 3b. Set page title
content = content.replace(/<title>[^<]*<\/title>/, '<title>Battle Report | Mathom House</title>');

// 4. Inject back-to-top before </body>
if (!content.includes('id="backToTop"')) {
  content = content.replace('</body>', '<a href="#" class="back-top" id="backToTop" aria-label="Back to top">↑</a>\n</body>');
}

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


// 5h. Add docs.google.com to connect-src (feedback modal Google Forms POST)
if (!content.match(/connect-src[^"]*docs\.google\.com/)) {
  content = content.replace(
    /(connect-src\s[^"]*?)('self')/,
    "$1'self' https://docs.google.com"
  );
}

// 5g. Add font-src (no such directive in original — default-src 'none' blocks woff2)
if (!content.match(/font-src/)) {
  content = content.replace(
    /(frame-src\s[^;]*;)(")/,
    '$1 font-src https://fonts.gstatic.com;$2'
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


// 11. Replace Google Fonts with site canonical set
content = content.replace(/<link[^>]*fonts\.googleapis\.com[^>]*>/g, '');
content = content.replace(/<link[^>]*fonts\.gstatic\.com[^>]*>/g, '');
if (!content.includes('fonts.googleapis.com/css2?family=Rajdhani')) {
  const fontsLink = '<link rel="preconnect" href="https://fonts.googleapis.com">'
    + '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
    + '<link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Crimson+Pro:ital,wght@0,300;0,400;1,300&display=swap" rel="stylesheet">';
  content = content.replace('</head>', `${fontsLink}\n</head>`);
}

// 6. Font override — must come AFTER mathomhouse.css so it wins the cascade.
//     mathomhouse.css sets body to Crimson Pro (prose font); battle-report is a dense data UI.
//     Form elements don't inherit font-family by default, hence !important on those.
//     Always strip and re-inject so the position stays correct on re-runs.
const fontFixStyle = '<style id="br-font-fix">body,p,th,td,li,h1,h2,h3,h4,h5,h6,button{font-family:\'Rajdhani\',-apple-system,BlinkMacSystemFont,sans-serif;}input,select,textarea{font-family:\'Rajdhani\',-apple-system,BlinkMacSystemFont,sans-serif!important;}</style>';
content = content.replace(/<style id="br-font-fix">[\s\S]*?<\/style>\n?/, '');
content = content.replace('</head>', `${fontFixStyle}\n</head>`);



// 8. Inject back-to-top before </body>
if (!content.includes('id="backToTop"')) {
  content = content.replace('</body>', '<a href="#" class="back-top" id="backToTop" aria-label="Back to top">&#8593;</a>\n</body>');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log(`Patched ${filePath}`);
