document.addEventListener('DOMContentLoaded', () => {
  fetch('/header2.html')
    .then(res => res.text())
    .then(html => {
      const placeholder = document.getElementById('header-placeholder');
      placeholder.innerHTML = html;

      // Set saved theme
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark') {
        document.body.dataset.theme = 'dark';
        document.getElementById('themeToggle').textContent = '☀️';
      }

      // Toggle theme
      document.getElementById('themeToggle').addEventListener('click', () => {
        const isDark = document.body.dataset.theme === 'dark';
        document.body.dataset.theme = isDark ? '' : 'dark';
        localStorage.setItem('theme', isDark ? 'light' : 'dark');
        document.getElementById('themeToggle').textContent = isDark ? '🌓' : '☀️';
      });

      // Mobile nav toggle
      document.querySelector('.menu-toggle').addEventListener('click', () => {
        document.getElementById('nav').classList.toggle('active');
      });
    })
    .catch(err => console.error('Header load error:', err));
});
