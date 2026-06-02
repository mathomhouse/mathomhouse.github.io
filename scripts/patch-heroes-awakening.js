#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const file = process.argv[2] || 'guides/heroes-awakening.html';
const filePath = path.resolve(file);
let content = fs.readFileSync(filePath, 'utf8');

// 1. Inject site assets + nav script into </head>.
//    Each item guarded individually so re-runs on a partially-patched file don't create duplicates.
const toInject = [];
if (!content.includes('localStorage.getItem(\'theme\')')) {
  toInject.push('<script>(function(){var t=localStorage.getItem(\'theme\');if(t)document.documentElement.setAttribute(\'data-theme\',t)})();</script>');
}
if (!content.includes('/styles/mathomhouse.css')) {
  toInject.push('<link rel="stylesheet" href="/styles/mathomhouse.css">');
}
if (!content.includes('/styles/header.css')) {
  toInject.push('<link rel="stylesheet" href="/styles/header.css">');
}
if (!content.includes('/styles/layout.css')) {
  toInject.push('<link rel="stylesheet" href="/styles/layout.css">');
}
if (!content.includes('"/header.js"') && !content.includes('\'/header.js\'')) {
  toInject.push('<script src="/header.js" defer></script>');
}
if (!content.includes('feedback-modal.js')) {
  toInject.push('<script src="/scripts/feedback-modal.js" defer></script>');
}
if (!content.includes('og:image')) {
  toInject.push('<meta property="og:image" content="https://mathomhouse.github.io/mathomhouselogo.png">');
}
if (toInject.length > 0) {
  content = content.replace('</head>', `${toInject.join('\n')}\n</head>`);
}

// 2. Inject header placeholder after <body>
if (!content.includes('id="header-placeholder"')) {
  content = content.replace(/(<body[^>]*>)/s, '$1\n<header id="header-placeholder"></header>');
}

// 3. Set page title
content = content.replace(/<title>[^<]*<\/title>/, '<title>Heroes Awakening | Mathom House</title>');

// 4. Update og: meta tags — replace each individually (idempotent: regex matches any value).
content = content.replace(/<meta property="og:type"[^>]*>/, '<meta property="og:type" content="website">');
content = content.replace(/<meta property="og:site_name"[^>]*>/, '<meta property="og:site_name" content="From Artu, Gikey, and Tex">');
content = content.replace(/<meta property="og:url"[^>]*>/, '<meta property="og:url" content="https://mathomhouse.github.io/guides/heroes-awakening.html">');
content = content.replace(/<meta property="og:title"[^>]*>/, '<meta property="og:title" content="Heroes Awakening • Mathom House">');
content = content.replace(/<meta property="og:description"[^>]*>/, '<meta property="og:description" content="Heroes Awakening Guide.">');

// 5. Inject back-to-top before </body>
if (!content.includes('id="backToTop"')) {
  content = content.replace('</body>', '<a href="#" class="back-top" id="backToTop" aria-label="Back to top">↑</a>\n</body>');
}

// 6. Replace all 2864tw.com references with mathomhouse.github.io
//    Covers: appbar home link, og:url, cookie domain in lang switcher JS
content = content.replace(/https:\/\/2864tw\.com\b/g, 'https://mathomhouse.github.io');

// 7. Update appbar subtitle — "Server 2864" is 2864tw-specific branding
content = content.replace('Top War &middot; Server 2864', 'Top War &middot; Mathom House');

// 8. Remove feedback-widget.js script tag (dead on mathomhouse fork)
if (!content.includes('<!-- MATHOMHOUSE: removed-feedback-widget-script -->')) {
  content = content.replace(/<script src="feedback-widget\.js[^"]*"><\/script>/, '<!-- MATHOMHOUSE: removed-feedback-widget-script -->');
}

// 9. Add GA domains to script-src (needed for header.js GA snippet)
if (!content.includes('https://www.googletagmanager.com')) {
  content = content.replace(
    /(script-src\s[^"]*?)(https:\/\/c\.bing\.com)/,
    '$1$2 https://www.googletagmanager.com'
  );
}

// 10. Add GA to connect-src
if (!content.includes('https://www.google-analytics.com')) {
  content = content.replace(
    /(connect-src\s[^"]*?)(https:\/\/c\.bing\.com)/,
    '$1$2 https://www.google-analytics.com'
  );
}

// 11a. Add 'self' to style-src (missing in original — blocks /styles/*.css from same origin).
//     Guard uses [^;]* (not [^"]*) so it doesn't cross into later CSP directives that have 'self'.
if (!content.match(/style-src[^;]*'self'/)) {
  content = content.replace(/(style-src\s)/, "$1'self' ");
}

// 11b. Add fonts.googleapis.com to style-src (needed for Google Fonts <link>)
if (!content.match(/style-src[^;]*fonts\.googleapis\.com/)) {
  content = content.replace(
    /(style-src\s[^"]*?)(https:\/\/translate\.googleapis\.com)/,
    '$1https://fonts.googleapis.com $2'
  );
}

// 12. Add font-src (no such directive in original — default-src 'none' blocks woff2)
if (!content.match(/font-src/)) {
  content = content.replace(
    /(frame-src\s[^;]*;)(")/,
    '$1 font-src https://fonts.gstatic.com;$2'
  );
}

// 13. Add site canonical Google Fonts (Rajdhani used by header nav, Crimson Pro for site prose)
if (!content.includes('fonts.googleapis.com/css2?family=Rajdhani')) {
  const fontsLink = '<link rel="preconnect" href="https://fonts.googleapis.com">'
    + '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
    + '<link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Crimson+Pro:ital,wght@0,300;0,400;1,300&display=swap" rel="stylesheet">';
  content = content.replace('</head>', `${fontsLink}\n</head>`);
}

// 14. Font override — mathomhouse.css body sets Crimson Pro (serif prose font) but
//     heroes-awakening uses Rajdhani (site UI font) as body font so inherit-based elements
//     (buttons, appbar, tabs) match the rest of the site rather than falling back to system-ui.
//     Injected last so it wins over mathomhouse.css.
const fontFixStyle = '<style id="ha-font-fix">html,body{font-family:\'Rajdhani\',BlinkMacSystemFont,\'Segoe UI\',sans-serif!important;font-size:14px!important;}button,input,select,textarea{font-family:inherit!important;}</style>';
if (content.includes('id="ha-font-fix"')) {
  content = content.replace(/<style id="ha-font-fix">[\s\S]*?<\/style>/, fontFixStyle);
} else {
  content = content.replace('</head>', `${fontFixStyle}\n</head>`);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log(`Patched ${filePath}`);
