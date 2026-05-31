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
  toInject.push('<script src="scripts/armory-auth-override.js" defer></script>');
}
if (!content.includes('scripts/feedback-modal.js')) {
  toInject.push('<script src="scripts/feedback-modal.js" defer></script>');
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

// 3b. Set page title
content = content.replace(/<title>[^<]*<\/title>/, '<title>Armory Report | Mathom House</title>');

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

// 5d. isVerifiedS2864Member — remove id.name requirement (closure-scoped; window override can't reach it).
//     On mathomhouse fork every visitor with a siteKey is a member.
if (!content.includes('// MATHOMHOUSE: member gate')) {
  content = content.replace(
    'return !!(id && id.name && id.siteKey && !id.guest);',
    'return !!(id && id.siteKey && !id.guest); // MATHOMHOUSE: member gate'
  );
}

// 5e_a_pre. wizardState.player.siteKey fallback — roster name lookup uses closure-scoped
//           _ar_rosterByName (CDN, empty for mathomhouse). Without a match, siteKey stays null
//           → inS2864 = false → Inventory/Rune Pool tabs never render. Fall back to local identity.
if (!content.includes('// MATHOMHOUSE: siteKey fallback')) {
  content = content.replace(
    /if \(rosterMatch && rosterMatch\.siteKey\) wizardState\.player\.siteKey = rosterMatch\.siteKey;\r?\n(\s*)\}/,
    (_, indent) =>
      `if (rosterMatch && rosterMatch.siteKey) wizardState.player.siteKey = rosterMatch.siteKey;\n` +
      `      if (!wizardState.player.siteKey) { try { var _li = window.ArmoryIdentity && window.ArmoryIdentity.get && window.ArmoryIdentity.get(); if (_li && _li.siteKey) wizardState.player.siteKey = _li.siteKey; } catch(_e){} } // MATHOMHOUSE: siteKey fallback\n` +
      `${indent}}`
  );
}

// 5e_a. inS2864 (renderFullReport) — original checks _ar_rosterMap (closure var); our override
//       writes window._ar_rosterMap, so it never matches. Use siteKey presence instead.
if (!content.includes('// MATHOMHOUSE: inS2864 renderFullReport')) {
  content = content.replace(
    /var inS2864 = false;\r?\n\s*if \(siteKey && _ar_rosterMap && _ar_rosterMap\[siteKey\]\) inS2864 = true;/,
    'var inS2864 = !!siteKey; // MATHOMHOUSE: inS2864 renderFullReport'
  );
}

// 5e_b. inS2864 (renderHeroesTab) — same root cause, different call site.
if (!content.includes('// MATHOMHOUSE: inS2864 heroesTab')) {
  content = content.replace(
    'var inS2864 = siteKey && _ar_rosterMap && _ar_rosterMap[siteKey];',
    'var inS2864 = !!siteKey; // MATHOMHOUSE: inS2864 heroesTab'
  );
}

// 5e_c. _ar_ensureSupplementToken — bypass UID hash; call worker handshake with siteKey directly.
if (!content.includes('// MATHOMHOUSE: siteKey handshake')) {
  content = content.replace(
    /async function _ar_ensureSupplementToken\(siteKey\) \{[\s\S]*?await _ar_handshake\(hash\);\r?\n  \}/,
    'async function _ar_ensureSupplementToken(siteKey) { // MATHOMHOUSE: siteKey handshake\n    if (_ar_supplementToken && _ar_supplementToken !== \'local\' && _ar_supplementTokenExpires > Date.now()) return;\n    var r = await fetch(SUPPLEMENT_WORKER + \'/supplement/handshake\', {\n      method: \'POST\',\n      headers: { \'Content-Type\': \'application/json\' },\n      body: JSON.stringify({ siteKey: siteKey })\n    });\n    var d = await r.json();\n    _ar_supplementToken = d.token;\n    _ar_supplementTokenExpires = Date.now() + 864e7;\n  }'
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

// 12. Font override — mathomhouse.css body sets Crimson Pro (prose site font) but armory
//     is a dense data UI; restore sans-serif. Injected last so it wins over mathomhouse.css.
const fontFixStyle = '<style id="armory-font-fix">body,button,.tab-btn{font-family:Rajdhani,-apple-system,BlinkMacSystemFont,sans-serif;font-size:15px;}input,select,textarea{font-family:Rajdhani,-apple-system,BlinkMacSystemFont,sans-serif!important;font-size:15px!important;}</style>';
if (content.includes('id="armory-font-fix"')) {
  content = content.replace(/<style id="armory-font-fix">[\s\S]*?<\/style>/, fontFixStyle);
} else {
  content = content.replace('</head>', `${fontFixStyle}\n</head>`);
}

// 13. Replace S2864-specific login prompt with generic text
content = content.replace(/log in to your S2864 account/g, 'log in to your account');

// 14. Remove walkthrough video card from Import modal
content = content.replace(
  /\s*\/\/ Bookmarklet walkthrough videos[\s\S]*?modal\.appendChild\(_ar_buildWalkthroughVideoCard\(\)\);/,
  ''
);

// 15. Tex credit — CSS
const creditCSS = '<style id="armory-tex-credit-css">.landing-credit{font-size:.78rem;color:var(--muted);text-align:center;margin:0 auto .5rem;opacity:.7;}</style>';
if (content.includes('id="armory-tex-credit-css"')) {
  content = content.replace(/<style id="armory-tex-credit-css">[\s\S]*?<\/style>/, creditCSS);
} else {
  content = content.replace('</head>', `${creditCSS}\n</head>`);
}

// 15a. Tex credit — static HTML landing (between h2 title and landing-desc paragraph)
const CREDIT_TEXT = 'Credit for implementation of the armory report goes to Tex (S2864).';
if (!content.includes('<!-- MATHOMHOUSE: tex-credit-landing -->')) {
  content = content.replace(
    '<p class="landing-desc">Paste your battle report IDs',
    `<p class="landing-credit">${CREDIT_TEXT}</p>\n    <!-- MATHOMHOUSE: tex-credit-landing -->\n    <p class="landing-desc">Paste your battle report IDs`
  );
}

// 15b. Tex credit — JS-rendered landing page (after title appended, before description)
if (!content.includes('// MATHOMHOUSE: tex-credit-landing-js')) {
  content = content.replace(
    "// Description\r\n    var desc = document.createElement('p');",
    `var _texCreditL = document.createElement('p');\r\n    _texCreditL.className = 'landing-credit';\r\n    _texCreditL.textContent = '${CREDIT_TEXT}'; // MATHOMHOUSE: tex-credit-landing-js\r\n    hero.appendChild(_texCreditL);\r\n\r\n    // Description\r\n    var desc = document.createElement('p');`
  );
}

// 15c. Tex credit — Welcome Back dialog (before "You have a saved report configuration")
if (!content.includes('// MATHOMHOUSE: tex-credit-welcome')) {
  content = content.replace(
    "h2.textContent = 'Welcome Back';\r\n    container.appendChild(h2);\r\n\r\n    var sub = document.createElement('p');",
    `h2.textContent = 'Welcome Back';\r\n    container.appendChild(h2);\r\n\r\n    var _texCreditWB = document.createElement('p');\r\n    _texCreditWB.className = 'landing-credit';\r\n    _texCreditWB.textContent = '${CREDIT_TEXT}';\r\n    container.appendChild(_texCreditWB); // MATHOMHOUSE: tex-credit-welcome\r\n\r\n    var sub = document.createElement('p');`
  );
}

// 16. Reinstate Feedback button — replaces dead feedback-widget.js block
if (!content.includes('// MATHOMHOUSE: feedback-btn')) {
  content = content.replace(
    /\/\/ Feedback: handled by feedback-widget\.js \(auto-appends to <header>\)[\s\S]*?}, 100\);/,
    `// MATHOMHOUSE: feedback-btn
    var _mhFbBtn = document.createElement('button');
    _mhFbBtn.className = 'rh-btn';
    _mhFbBtn.type = 'button';
    _mhFbBtn.title = 'Send Feedback';
    var _mhFbSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    _mhFbSvg.setAttribute('width', '14'); _mhFbSvg.setAttribute('height', '14');
    _mhFbSvg.setAttribute('viewBox', '0 0 24 24'); _mhFbSvg.setAttribute('fill', 'none');
    _mhFbSvg.setAttribute('stroke', 'currentColor'); _mhFbSvg.setAttribute('stroke-width', '2');
    _mhFbSvg.setAttribute('stroke-linecap', 'round'); _mhFbSvg.setAttribute('stroke-linejoin', 'round');
    var _mhFbPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    _mhFbPath.setAttribute('d', 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z');
    _mhFbSvg.appendChild(_mhFbPath);
    _mhFbBtn.appendChild(_mhFbSvg);
    var _mhFbLbl = document.createElement('span');
    _mhFbLbl.className = 'rh-label';
    _mhFbLbl.textContent = 'Feedback';
    _mhFbBtn.appendChild(_mhFbLbl);
    _mhFbBtn.addEventListener('click', function () {
      if (typeof openFeedbackModal === 'function') openFeedbackModal();
    });
    right.insertBefore(_mhFbBtn, right.firstChild);`
  );
}

fs.writeFileSync(filePath, content, 'utf8');
console.log(`Patched ${filePath}`);
