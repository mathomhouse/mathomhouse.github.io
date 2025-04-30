document.addEventListener('DOMContentLoaded', () => {
  fetch('header2.html')
    .then(res => res.text())
    .then(html => {
      // Inject header HTML
      const placeholder = document.getElementById('header-placeholder');
      placeholder.innerHTML = html;

      // Now that the header exists, wire up the buttons and behavior

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

      // Mobile menu toggle
      const menuToggle = document.querySelector('.menu-toggle');
      const nav = document.getElementById('nav');
      if (menuToggle && nav) {
        menuToggle.addEventListener('click', () => {
          nav.classList.toggle('active');
        });
      }
    })
    .catch(err => console.error('Header load error:', err));
});
