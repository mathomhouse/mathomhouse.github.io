function loadHeader(){
  fetch('header2.html')
  .then(res => res.text())
  .then(html => {
    // Inject header HTML
    const placeholder = document.getElementById('header-placeholder');
    placeholder.innerHTML = html; 
    initializeHeader();
  })
  .catch(err => console.error('Header load error:', err));
}

function initializeHeader(){
    // Now that the header exists, wire up the buttons and behavior
    const hamburger = document.getElementById("hamburger");
    const dropdown =  document.getElementById("nav");

    // Theme toggle setup
    const toggleButton = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme === 'dark') {
      document.body.dataset.theme = 'dark';
      toggleButton.textContent = '☀️';
    }

    toggleButton.addEventListener('click', () => {
      const isDark = document.body.dataset.theme === 'dark';
      document.body.dataset.theme = isDark ? '' : 'dark';
      localStorage.setItem('theme', isDark ? 'light' : 'dark');
      toggleButton.textContent = isDark ? '🌓' : '☀️';
    });

    // Hide dropdown when clicking outside of it
    document.addEventListener("click", function(event) {
      if (!dropdown.contains(event.target) && !hamburger.contains(event.target)) {
          dropdown.style.display = "none";
          // Close any open submenus
          document.querySelectorAll('.submenu-container.open').forEach(el => el.classList.remove('open'));
      }
    });

    // Mobile menu toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.getElementById('nav');
    if (menuToggle && nav) {
      menuToggle.addEventListener('click', () => {
        nav.classList.toggle('active');
      });
    }

    // === Submenu support ===
    document.querySelectorAll('.submenu-container > a').forEach(trigger => {
      trigger.addEventListener("click", function (e) {
        e.preventDefault();
        const container = this.closest('.submenu-container');

        // Close all other open submenus
        document.querySelectorAll('.submenu-container.open').forEach(open => {
          if (open !== container) open.classList.remove('open');
        });

        container.classList.toggle("open");
      });
    });
}

function toggleDropdown() {
  const hamburger = document.getElementById("hamburger");
  const dropdown =  document.getElementById("nav");
  const rect = hamburger.getBoundingClientRect();
  dropdown.style.top = rect.bottom + "px";
  dropdown.style.left = rect.left + "px";
  dropdown.style.display = dropdown.style.display === "flex" ? "none" : "flex";
}

document.addEventListener("DOMContentLoaded", loadHeader);
