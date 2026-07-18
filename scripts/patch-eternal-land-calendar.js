#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const file = process.argv[2] || 'eternal-land-calendar.html';
const filePath = path.resolve(file);
let content = fs.readFileSync(filePath, 'utf8');

// 1. Inject site assets + nav script into </head>.
//    Each item guarded individually so re-runs on a partially-patched file don't create duplicates.
//    Injected before </head> — i.e. AFTER the page's own inline <style> — so the page keeps
//    working; the font/color guard (step 15) re-asserts the page's look over mathomhouse.css.
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
if (!content.includes('name="description"')) {
  toInject.push('<meta name="description" content="Top War Eternal Land event calendar: stage timeline, daily schedule, unlock countdowns, and push reminders in your local time.">');
}
if (!content.includes('og:type')) {
  toInject.push('<meta property="og:type" content="website">');
}
if (!content.includes('og:site_name')) {
  toInject.push('<meta property="og:site_name" content="From Artu, Gikey, and Tex">');
}
if (!content.includes('og:url')) {
  toInject.push('<meta property="og:url" content="https://mathomhouse.github.io/eternal-land-calendar.html">');
}
if (!content.includes('og:title')) {
  toInject.push('<meta property="og:title" content="Eternal Land Calendar • Mathom House">');
}
if (!content.includes('og:description')) {
  toInject.push('<meta property="og:description" content="Eternal Land event stage timeline and countdowns.">');
}
if (!content.includes('og:image')) {
  toInject.push('<meta property="og:image" content="https://mathomhouse.github.io/mathomhouselogo.png">');
}
if (toInject.length > 0) {
  content = content.replace('</head>', `${toInject.join('\n')}\n</head>`);
}

// 2. Inject header placeholder after <body> (header.js fetches /header.html into it)
if (!content.includes('id="header-placeholder"')) {
  content = content.replace(/(<body[^>]*>)/s, '$1\n<header id="header-placeholder"></header>');
}

// 3. Set page title
content = content.replace(/<title>[^<]*<\/title>/, '<title>Eternal Land Calendar | Mathom House</title>');

// 4. Add GA domains to script-src (needed for header.js GA snippet)
if (!content.includes('https://www.googletagmanager.com')) {
  content = content.replace(/(script-src\s[^;]*?)(;)/, '$1 https://www.googletagmanager.com$2');
}

// 5. Add GA to connect-src + img-src (gtag beacons)
if (!content.match(/connect-src[^;]*google-analytics/)) {
  content = content.replace(/(connect-src\s[^;]*?)(;)/, '$1 https://www.google-analytics.com$2');
}
if (!content.match(/img-src[^;]*google-analytics/)) {
  content = content.replace(/(img-src\s[^;]*?)(;)/, '$1 https://www.google-analytics.com$2');
}

// 6. style-src: original is 'unsafe-inline' only — blocks same-origin /styles/*.css and Google Fonts.
if (!content.match(/style-src[^;]*'self'/)) {
  content = content.replace(/style-src\s/, "style-src 'self' ");
}
if (!content.match(/style-src[^;]*fonts\.googleapis\.com/)) {
  content = content.replace(/(style-src\s[^;]*?)(;)/, '$1 https://fonts.googleapis.com$2');
}

// 7. Add font-src (no such directive in original — default-src 'none' blocks Google Fonts woff2)
if (!content.match(/font-src/)) {
  content = content.replace(/(object-src 'none';)/, '$1 font-src https://fonts.gstatic.com;');
}

// 8. Site canonical Google Fonts (Rajdhani used by header nav, Crimson Pro for site prose)
if (!content.includes('fonts.googleapis.com/css2?family=Rajdhani')) {
  const fontsLink = '<link rel="preconnect" href="https://fonts.googleapis.com">'
    + '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
    + '<link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Crimson+Pro:ital,wght@0,300;0,400;1,300&display=swap" rel="stylesheet">';
  content = content.replace('</head>', `${fontsLink}\n</head>`);
}

// 9. Remove the 2864tw home button from the page's own header — the shared mathomhouse nav
//    (injected via header.js) provides the home link.
if (!content.includes('<!-- MATHOMHOUSE: removed-home-btn -->')) {
  content = content.replace(/<a href="https:\/\/2864tw\.com"[^>]*class="nav-link"[^>]*>[\s\S]*?<\/a>/, '<!-- MATHOMHOUSE: removed-home-btn -->');
}

// 10. Strip "Server 2864 · " prefix from the header subtitle (keep whatever date range upstream ships)
content = content.replace(/(<div class="header-sub">)Server \d+ . /, '$1');

// 11. Replace any remaining 2864tw.com references with mathomhouse.github.io
content = content.replace(/https:\/\/2864tw\.com\b/g, 'https://mathomhouse.github.io');

// 12. Remove dead upstream feedback-widget.js script tag (mathomhouse uses feedback-modal.js)
if (!content.includes('<!-- MATHOMHOUSE: removed-feedback-widget-script -->')) {
  content = content.replace(/<script src="feedback-widget\.js[^"]*"><\/script>/, '<!-- MATHOMHOUSE: removed-feedback-widget-script -->');
}

// 13. Add back-to-top before </body>
if (!content.includes('id="backToTop"')) {
  content = content.replace('</body>', '<a href="#" class="back-top" id="backToTop" aria-label="Back to top">↑</a>\n</body>');
}

// 14. Append standard mathomhouse footer before </body>
if (!content.includes('<!-- MATHOMHOUSE: footer -->')) {
  content = content.replace('</body>', '<!-- MATHOMHOUSE: footer -->\n<footer>&copy; 2024 Mathom House &middot; Not affiliated with TopWar</footer>\n</body>');
}

// 14b. Move the page-header title + date range into the hero card, then the page header itself is
//      hidden in step 15. Text is captured from the existing markup (run after step 10 strips the
//      "Server NNNN · " prefix) so it tracks upstream renames/date changes. Guarded by hero-el-title.
if (!content.includes('hero-el-title')) {
  const titleM = content.match(/<div class="header-title[^"]*"[^>]*>([\s\S]*?)<\/div>/);
  const subM = content.match(/<div class="header-sub"[^>]*>([\s\S]*?)<\/div>/);
  if (titleM) {
    const titleTxt = titleM[1].trim();
    const subTxt = subM ? subM[1].trim() : '';
    const block = '<div class="hero-el-title notranslate">' + titleTxt
      + (subTxt ? ' <span class="hero-el-date">' + subTxt + '</span>' : '') + '</div>';
    content = content.replace('<div class="hero-next">NEXT UP</div>', block + '<div class="hero-next">NEXT UP</div>');
  }
}

// 14c. Move the ".sub" intro line ("Times and countdowns are shown in your local time…") out of
//      its spot above the hero and into the flow, just below the stage bar. It becomes a flow flex
//      child, so step 15 assigns it an explicit order for both breakpoints. Guarded by a marker.
if (!content.includes('<!-- MATHOMHOUSE: moved-sub -->')) {
  const subMatch = content.match(/<div class="sub">[\s\S]*?<\/div>/);
  if (subMatch) {
    content = content.replace(subMatch[0], '<!-- MATHOMHOUSE: moved-sub -->');
    content = content.replace(/(<div class="rhythms">)/, `${subMatch[0]}\n$1`);
  }
}

// 15. Theme guard + light theme. The page is fully self-styled with hardcoded GitHub-dark hex,
//     so (a) mathomhouse.css would otherwise hijack body font/bg/color, and (b) toggling the site
//     to light did nothing to the calendar itself. This block re-asserts the page font, keeps the
//     native dark look, and remaps every surface/accent to a GitHub-light palette under
//     [data-theme="light"]. The html[data-theme=...] prefix outranks the page's bare class
//     selectors, so overrides win without !important (except the font, which fights mathomhouse.css).
//     Injected last so it wins the cascade. Guarded by id="elc-theme".
const elcTheme = '<style id="elc-theme">'
  // mathomhouse font (Rajdhani = the site UI font) — !important beats both the page's inline
  // body rule and mathomhouse.css's Crimson Pro body. Form controls inherit it too.
  + "html body{font-family:'Rajdhani',BlinkMacSystemFont,'Segoe UI',sans-serif!important;font-size:15px!important;line-height:1.5!important;}"
  + 'html body button,html body input,html body select,html body textarea{font-family:inherit!important;}'
  // the page's bare header{} rule (flex + padding + justify) also hits the injected shared-nav
  // placeholder and shrinks it to content width — reset it so the mathomhouse nav spans full width
  // and its margin-left:auto pushes the theme toggle to the right edge.
  + '#header-placeholder{display:block;padding:0;box-shadow:none;}'
  // drop the page's own header entirely — its title/date moved into the hero (step 14b) and its
  // buttons are redundant with the shared nav. Kept in DOM (display:none) so the page's inline JS
  // (remOpen listener, bnpPop handlers) doesn't throw on missing elements.
  + 'body > header:not(#header-placeholder){display:none;}'
  // full-bleed the hero card background to the screen edges while its content stays put: the real
  // .hero box keeps its position/size (so text, grid, and the absolute title don't move), we just
  // paint a 100vw band behind it via ::before. Its own bg/border are made transparent.
  + '.hero{position:relative;z-index:0;overflow:visible!important;margin-top:-16px;background:transparent!important;border-color:transparent!important;border-radius:0!important;}'
  + ".hero::before{content:'';position:absolute;top:0;bottom:0;left:calc(50% - 50vw);width:100vw;background-image:radial-gradient(ellipse 80% 60% at 50% 0%,rgba(201,168,76,0.08) 0%,transparent 70%),repeating-linear-gradient(60deg,transparent,transparent 30px,rgba(37,45,69,0.3) 30px,rgba(37,45,69,0.3) 31px),repeating-linear-gradient(-60deg,transparent,transparent 30px,rgba(37,45,69,0.3) 30px,rgba(37,45,69,0.3) 31px),linear-gradient(135deg,#161b22,#1c2128);border-top:1px solid #30363d;border-bottom:1px solid #30363d;z-index:-1;pointer-events:none;}"
  // relocated page title inside the hero — enlarged, with the date as its own line under the title
  // (block, not inline) so it sits above the NEXT UP block in both layouts.
  + '.hero-el-title{font-size:1.45rem;font-weight:700;color:#79c0ff;margin-bottom:8px;}'
  + '.hero-el-title .hero-el-date{display:block;font-size:.8rem;font-weight:600;color:#8b949e;margin-top:3px;}'
  // desktop only: center the NEXT UP block. 3-col grid (1fr auto 1fr) centers the left column;
  // countdown pinned right; title+date pulled out (absolute top-left) so they stay put.
  + '@media(min-width:701px){.hero{position:relative;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;min-height:120px;}.hero>div:first-child{grid-column:2;text-align:center;}.hero-count{grid-column:3;justify-self:end;}.hero-el-title{position:absolute;top:50%;left:18px;transform:translateY(-50%);margin:0;}}'
  // relocated intro line — order:1 = same as the hero, and it's DOM-after the hero, so it renders
  // directly below the hero (above the stage bar) in both layouts. Lives inside .flow now, so
  // .flow>* zeroes its old margin.
  + '.sub{order:1;}'
  + 'html:not([data-theme="light"]) body{background:#0d1117;color:#e6edf3;}'
  // ---- light theme ----
  + 'html[data-theme="light"] body{background:#ffffff;color:#1f2328;}'
  // surfaces
  + 'html[data-theme="light"] header,html[data-theme="light"] #bnpPop,html[data-theme="light"] .rhythms,html[data-theme="light"] .modal,html[data-theme="light"] .day,html[data-theme="light"] .foot{background:#f6f8fa;}'
  + 'html[data-theme="light"] .hero::before{background-image:radial-gradient(ellipse 80% 60% at 50% 0%,rgba(201,168,76,0.05) 0%,transparent 70%),repeating-linear-gradient(60deg,transparent,transparent 30px,rgba(37,45,69,0.07) 30px,rgba(37,45,69,0.07) 31px),repeating-linear-gradient(-60deg,transparent,transparent 30px,rgba(37,45,69,0.07) 30px,rgba(37,45,69,0.07) 31px),#f6f8fa;border-top-color:#d0d7de;border-bottom-color:#d0d7de;}'
  + 'html[data-theme="light"] #toast{background:#ffffff;}'
  // solid borders #30363d -> #d0d7de
  + 'html[data-theme="light"] header{border-bottom-color:#d0d7de;box-shadow:0 1px 0 #d0d7de;}'
  + 'html[data-theme="light"] .nav-link,html[data-theme="light"] #bnpBtn,html[data-theme="light"] #bnpPop,html[data-theme="light"] .hero,html[data-theme="light"] .rhythms,html[data-theme="light"] .modal,html[data-theme="light"] .rembtn,html[data-theme="light"] .remsel,html[data-theme="light"] .navbtn,html[data-theme="light"] .day,html[data-theme="light"] .foot,html[data-theme="light"] #toast{border-color:#d0d7de;}'
  + 'html[data-theme="light"] .day{border-top-color:#d0d7de;}'
  // subtle dashed borders #21262d -> #d8dee4
  + 'html[data-theme="light"] .rhyrow+.rhyrow,html[data-theme="light"] .remrow,html[data-theme="light"] .dhead,html[data-theme="light"] .item+.item{border-color:#d8dee4;}'
  // muted text #8b949e -> #656d76
  + 'html[data-theme="light"] .header-sub,html[data-theme="light"] .nav-link,html[data-theme="light"] #bnpBtn,html[data-theme="light"] .bnp-link,html[data-theme="light"] .sub,html[data-theme="light"] .hero-next,html[data-theme="light"] .hero-local,html[data-theme="light"] .dow,html[data-theme="light"] .dsub,html[data-theme="light"] .note,html[data-theme="light"] .local,html[data-theme="light"] .remnote,html[data-theme="light"] .reminfo .rd,html[data-theme="light"] .viewlabel,html[data-theme="light"] .gg-who{color:#656d76;}'
  + 'html[data-theme="light"] .ri{color:#656d76;}'
  // body/strong text
  + 'html[data-theme="light"] .rhyrow,html[data-theme="light"] .acts,html[data-theme="light"] #stageDesc{color:#1f2328;}'
  + 'html[data-theme="light"] .rhyrow b,html[data-theme="light"] .reminfo .rt{color:#1f2328;}'
  // accent blue #79c0ff -> #0969da
  + 'html[data-theme="light"] .header-title,html[data-theme="light"] .hero-label,html[data-theme="light"] .navbtn,html[data-theme="light"] .hero-el-title{color:#0969da;}'
  + 'html[data-theme="light"] .hero-el-title .hero-el-date{color:#656d76;}'
  + 'html[data-theme="light"] .nav-link:hover{border-color:#0969da;color:#0969da;}'
  // green #3fb950 -> #1a7f37
  + 'html[data-theme="light"] .hero-count{color:#1a7f37;}'
  + 'html[data-theme="light"] #bnpBtn:hover{border-color:#1a7f37;color:#1a7f37;}'
  + 'html[data-theme="light"] .bnp-link.bnp-cur{color:#1a7f37;}'
  + 'html[data-theme="light"] .bnp-link:hover{color:#1f2328;background:rgba(26,127,55,.08);}'
  // yellow #d29922 -> #9a6700
  + 'html[data-theme="light"] .rhy-title{color:#9a6700;}'
  // stage tint segments
  + 'html[data-theme="light"] .seg.prep{background:#eaeef2;}html[data-theme="light"] .seg.s1{background:#dafbe1;}html[data-theme="light"] .seg.s2{background:#ddf4ff;}html[data-theme="light"] .seg.s3{background:#fff8c5;}html[data-theme="light"] .seg.s4{background:#ffebe9;}html[data-theme="light"] .seg.s5{background:#fbefff;}'
  // day stage top-border colors (map dark-only prep grey)
  + 'html[data-theme="light"] .day.prep{border-top-color:#656d76;}'
  // day-sub accent per stage
  + 'html[data-theme="light"] .day.s2 .dsub{color:#0969da;}html[data-theme="light"] .day.s3 .dsub{color:#9a6700;}html[data-theme="light"] .day.s1 .dsub{color:#1a7f37;}html[data-theme="light"] .day.s5 .dsub{color:#8250df;}'
  // rhythm pills
  + 'html[data-theme="light"] .rhycd{color:#0969da;background:#ddf4ff;}html[data-theme="light"] .rhycd.live{color:#1a7f37;background:#dafbe1;}'
  // countdown pills
  + 'html[data-theme="light"] .cd.upcoming{color:#0969da;background:#ddf4ff;}html[data-theme="light"] .cd.live{color:#1a7f37;background:#dafbe1;}html[data-theme="light"] .cd.done{color:#656d76;background:#eaeef2;}'
  // buttons
  + 'html[data-theme="light"] .navbtn{background:#eaeef2;}html[data-theme="light"] .togglebtn{color:#0969da;background:#ddf4ff;border-color:#0969da;}'
  + 'html[data-theme="light"] .rembtn{color:#656d76;background:#eaeef2;}html[data-theme="light"] .rembtn.on{color:#1a7f37;background:#dafbe1;border-color:#1a7f37;}'
  + 'html[data-theme="light"] .remsel{background:#ffffff;color:#1f2328;}'
  // tags
  + 'html[data-theme="light"] .tag-stage{color:#0969da;border-color:#0969da;background:#ddf4ff;}'
  + 'html[data-theme="light"] .tag-open{color:#1a7f37;border-color:#1a7f37;background:#dafbe1;}'
  + 'html[data-theme="light"] .tag-unlock{color:#9a6700;border-color:#9a6700;background:#fff8c5;}'
  + 'html[data-theme="light"] .tag-city{color:#1f2328;border-color:#9a6700;background:#f2cc60;}'
  + 'html[data-theme="light"] .tag-ms{color:#1b7c83;border-color:#1b7c83;background:#ddf4ff;}'
  + 'html[data-theme="light"] .tag-grp{color:#0969da;border-color:#0969da;background:#ddf4ff;}'
  + 'html[data-theme="light"] .tag-ch{color:#8250df;border-color:#8250df;background:#fbefff;}'
  + '</style>';
if (content.includes('id="elc-theme"')) {
  content = content.replace(/<style id="elc-theme">[\s\S]*?<\/style>/, elcTheme);
} else {
  content = content.replace('</head>', `${elcTheme}\n</head>`);
}
// Retire the earlier single-line guard if a prior patch version left one behind.
content = content.replace(/<style id="elc-fix">[\s\S]*?<\/style>\n?/, '');

fs.writeFileSync(filePath, content, 'utf8');
console.log(`Patched ${filePath}`);
