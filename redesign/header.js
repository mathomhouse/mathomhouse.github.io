// ── Google Analytics ──────────────────────────────────────────
(function(){
  var s1 = document.createElement('script');
  s1.async = true;
  s1.src = 'https://www.googletagmanager.com/gtag/js?id=G-4R1NPM39PL';
  document.head.appendChild(s1);

  var s2 = document.createElement('script');
  s2.innerHTML = 'window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag("js",new Date());gtag("config","G-4R1NPM39PL");';
  document.head.appendChild(s2);
})();

// ── Header loader ─────────────────────────────────────────────
function loadHeader() {
  fetch('/redesign/header.html')
    .then(function(res){ return res.text(); })
    .then(function(html){
      var ph = document.getElementById('header-placeholder');
      if (ph) {
        ph.innerHTML = html;
        initHeader();
      }
    })
    .catch(function(err){ console.error('Header load error:', err); });
}

// ── Init (called after header HTML is injected) ───────────────
function initHeader() {
  markActivePage();
  initThemeToggle();
  initHamburger();
  initMobileAccordion();
  initBackToTop();
}

// ── Active page highlighting ───────────────────────────────────
function markActivePage() {
  var path = window.location.pathname;
  document.querySelectorAll('.main-site-nav a, .mobile-menu a, .dropdown-panel a, .mobile-group-links a').forEach(function(a){
    try {
      var href = a.getAttribute('href');
      if (!href) return;
      // Resolve relative href against current origin
      var url = new URL(href, window.location.origin);
      if (url.pathname === path || (path === '/' && url.pathname === '/index.html')) {
        a.classList.add('active');
      }
    } catch(e){}
  });
}

// ── Theme toggle ───────────────────────────────────────────────
function initThemeToggle() {
  // Theme is pre-applied by the anti-flash script; just wire up buttons
  var buttons = document.querySelectorAll('.theme-toggle-btn');

  function updateButtons() {
    var isLight = document.documentElement.getAttribute('data-theme') === 'light';
    buttons.forEach(function(btn){
      btn.innerHTML = isLight ? '🌙 Dark' : '☀️ Light';
    });
  }

  updateButtons(); // sync initial state

  buttons.forEach(function(btn){
    btn.addEventListener('click', function(){
      var current = document.documentElement.getAttribute('data-theme');
      var next = current === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      updateButtons();
    });
  });
}

// ── Hamburger / mobile menu ────────────────────────────────────
function initHamburger() {
  var hamburger  = document.getElementById('hamburger');
  var mobileMenu = document.getElementById('mobileMenu');
  if (!hamburger || !mobileMenu) return;

  hamburger.addEventListener('click', function(){
    var isOpen = mobileMenu.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
  });

  // Close on outside click
  document.addEventListener('click', function(e){
    if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
      mobileMenu.classList.remove('open');
      hamburger.classList.remove('open');
    }
  });
}

// ── Mobile accordion ──────────────────────────────────────────
function initMobileAccordion() {
  document.querySelectorAll('.mobile-group-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      var links = btn.nextElementSibling;
      if (!links) return;
      var isOpen = links.classList.toggle('open');
      btn.classList.toggle('open', isOpen);
    });
  });
}

// ── Back-to-top ───────────────────────────────────────────────
function initBackToTop() {
  var btn = document.getElementById('backToTop');
  if (!btn) return;
  window.addEventListener('scroll', function(){
    btn.classList.toggle('visible', window.scrollY > 300);
  });
  btn.addEventListener('click', function(){
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

document.addEventListener('DOMContentLoaded', loadHeader);
