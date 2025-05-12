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
    // Theme toggle setup
    const toggleButton = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('theme');
    console.WriteLine("saved theme" + savedTheme);
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


    const hamburger = document.getElementById("menu-toggle");
    const dropdown =  document.getElementById("nav");

    function toggleDropdown() {
      const rect = hamburger.getBoundingClientRect();
      dropdown.style.top = rect.bottom + "px";
      dropdown.style.left = rect.left + "px";
      dropdown.style.display = dropdown.style.display === "flex" ? "none" : "flex";
    }
    hamburger.onclick = toggleDropdown;

    // Hide dropdown when clicking outside of it
    document.addEventListener("click", function(event) {
      if (!dropdown.contains(event.target) && !hamburger.contains(event.target)) {
          dropdown.style.display = "none";
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
}

document.addEventListener("DOMContentLoaded", loadHeader);