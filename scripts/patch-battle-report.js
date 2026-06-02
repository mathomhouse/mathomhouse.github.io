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

// 5i. Add fonts.gstatic.com to img-src (Google Translate widget icon)
if (!content.match(/img-src[^"]*fonts\.gstatic\.com/)) {
  content = content.replace(
    /(img-src\s[^"]*?)(https:\/\/www\.gstatic\.com)/,
    '$1https://fonts.gstatic.com $2'
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
const fontFixStyle = '<style id="br-font-fix">body,p,th,td,li,h1,h2,h3,h4,h5,h6,button{font-family:\'Rajdhani\',-apple-system,BlinkMacSystemFont,sans-serif;}input,select,textarea{font-family:\'Rajdhani\',-apple-system,BlinkMacSystemFont,sans-serif!important;}.home-btn,#bnpBtn,#bnpPop,.theme-btn{display:none!important;}.br-feedback-btn{display:inline-flex;align-items:center;gap:.3rem;padding:.25rem .55rem;background:transparent;border:1px solid currentColor;border-radius:4px;cursor:pointer;font-size:.82rem;color:inherit;opacity:.9;font-family:inherit;}.br-feedback-btn:hover{opacity:1;}.raw-json{display:none!important;}.header{position:relative;}.bnp-wrap{position:static!important;}#br-header-right{position:absolute;right:1rem;top:50%;transform:translateY(-50%);margin-left:0!important;}</style>';
content = content.replace(/<style id="br-font-fix">[\s\S]*?<\/style>\n?/, '');
content = content.replace('</head>', `${fontFixStyle}\n</head>`);



// 8. Inject back-to-top before </body>
if (!content.includes('id="backToTop"')) {
  content = content.replace('</body>', '<a href="#" class="back-top" id="backToTop" aria-label="Back to top">&#8593;</a>\n</body>');
}

// 16a. Tag right-side button container for CSS positioning
if (!content.includes('id="br-header-right"')) {
  content = content.replace(
    '<div style="margin-left:auto;display:flex;align-items:center;gap:.4rem;">',
    '<div id="br-header-right" style="margin-left:auto;display:flex;align-items:center;gap:.4rem;">'
  );
}

// 16. Inject feedback button before lang button
if (!content.includes('<!-- MATHOMHOUSE: br-feedback-btn -->')) {
  const feedbackBtn = '<!-- MATHOMHOUSE: br-feedback-btn -->'
    + '<button class="br-feedback-btn" type="button" title="Send Feedback"'
    + ' onclick="if(typeof openFeedbackModal===\'function\')openFeedbackModal()">'
    + '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"'
    + ' stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
    + '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'
    + '</svg><span>Feedback</span></button>';
  content = content.replace(
    '<button class="lang-btn notranslate" id="langBtn"',
    `${feedbackBtn}\n    <button class="lang-btn notranslate" id="langBtn"`
  );
}

// 18. Remove third-party feedback widget (replaced by mathomhouse feedback-modal.js)
content = content.replace('<script src="feedback-widget.js"></script>\n', '');
content = content.replace('<script src="feedback-widget.js"></script>', '');

// 20. Hide "No Alliance" placeholder — show alliance tag only when one exists
if (!content.includes('// MATHOMHOUSE: alliance-hide')) {
  content = content.replace(
    "tagEl.textContent = alTag ? '[' + alTag + ']' : 'No Alliance';\n    if (!alTag) tagEl.style.color = 'var(--muted)';",
    "// MATHOMHOUSE: alliance-hide\n    if (alTag) { tagEl.textContent = '[' + alTag + ']'; } else { tagEl.style.display = 'none'; }"
  );
}

// 19. Comment out original developer's telemetry worker call (CORS fails from mathomhouse.github.io)
if (!content.includes('// MATHOMHOUSE: telemetry-disabled')) {
  content = content.replace(
    "// Passive collect — fire-and-forget, never blocks the UI\n        fetch('https://push-worker.27tb8s6fct.workers.dev/collect-report', {\n          method: 'POST', headers: {'Content-Type':'application/json'},\n          body: JSON.stringify({id: id})\n        }).catch(function(){});",
    "// MATHOMHOUSE: telemetry-disabled\n        /* fetch('https://push-worker.27tb8s6fct.workers.dev/collect-report', {\n          method: 'POST', headers: {'Content-Type':'application/json'},\n          body: JSON.stringify({id: id})\n        }).catch(function(){}); */"
  );
}

// 21. Add credit line above search hint
if (!content.includes('Credit for the battle report viewer goes to Tex')) {
  content = content.replace(
    '<div class="search-hint">Paste a report ID from in-game battle mail</div>',
    '<div class="search-hint">Credit for the battle report viewer goes to Tex (S2864)<br>Paste a report ID from in-game battle mail</div>'
  );
}

// 17. Fix lang modal init — #langModal is rendered after the init script (~line 4407),
//     so getElementById returns null at parse time. Defer all modal setup to DOMContentLoaded.
if (!content.includes('// MATHOMHOUSE: lang-init-fix')) {
  content = content.replace(
    "var langModalEl=document.getElementById('langModal');",
    "var langModalEl=null; // MATHOMHOUSE: lang-init-fix"
  );
  // Replace the IIFE + lb/lmc/overlay wiring block with a single DOMContentLoaded handler
  content = content.replace(
    /\(function\(\)\{var g=document\.getElementById\('langGrid'\);[\s\S]*?if\(langModalEl\)langModalEl\.addEventListener\('click',function\(e\)\{if\(e\.target===langModalEl\)closeLangModal\(\);\}\);/,
    `document.addEventListener('DOMContentLoaded',function(){\n`
    + `    langModalEl=document.getElementById('langModal');\n`
    + `    var g=document.getElementById('langGrid');\n`
    + `    if(g){var det=detectCurrentLang();LANGUAGES.forEach(function(l){var b=document.createElement('button');b.className='lang-option'+(l.code===det?' active':'');b.dataset.lang=l.code;b.innerHTML='<span class="lang-flag">'+l.flag+'</span><span class="lang-name">'+esc(l.name)+'</span>';b.addEventListener('click',function(){selectLanguage(l.code);});g.appendChild(b);});updateLangBtn(det);}\n`
    + `    var lb=document.getElementById('langBtn');if(lb)lb.addEventListener('click',openLangModal);\n`
    + `    var lmc=document.getElementById('langModalClose');if(lmc)lmc.addEventListener('click',closeLangModal);\n`
    + `    if(langModalEl)langModalEl.addEventListener('click',function(e){if(e.target===langModalEl)closeLangModal();});\n`
    + `  });`
  );
}

fs.writeFileSync(filePath, content, 'utf8');
console.log(`Patched ${filePath}`);
