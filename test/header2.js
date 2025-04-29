// Fetch and load the header HTML
function loadHeader() {
  fetch('header2.html')
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to load header');
      }
      return response.text();
    })
    .then(html => {
      document.getElementById('header-placeholder').innerHTML = html;
      initializeHeader(); // Initialize event listeners after header is loaded
    })
    .catch(error => console.error('Error loading header:', error));
}

// Initialize the menu toggle and theme toggle
function initializeHeader() {
  const nav = document.getElementById('nav');
  const themeToggle = document.getElementById('themeToggle');
  const menuToggle = document.querySelector('.menu-toggle');

  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      nav.classList.toggle('active');
    });
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.dataset.theme = 'dark';
    if (themeToggle) themeToggle.textContent = '☀️';
  }
}

// Function to toggle dark/light theme
function toggleTheme() {
  const themeToggle = document.getElementById('themeToggle');
  if (document.body.dataset.theme === 'dark') {
    document.body.dataset.theme = '';
    localStorage.setItem('theme', 'light');
    if (themeToggle) themeToggle.textContent = '🌓';
  } else {
    document.body.dataset.theme = 'dark';
    localStorage.setItem('theme', 'dark');
    if (themeToggle) themeToggle.textContent = '☀️';
  }
}

// Run loadHeader once DOM is ready
document.addEventListener('DOMContentLoaded', loadHeader);
