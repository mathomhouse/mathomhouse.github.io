// header2.js

// Load header2.html dynamically
fetch('/header2.html')
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to load header2.html');
    }
    return response.text();
  })
  .then(data => {
    document.getElementById('header-placeholder').innerHTML = data;
    initializeHeader();
  })
  .catch(error => console.error('Error loading header:', error));

// Initialize header interactions
function initializeHeader() {
  const menuToggle = document.getElementById('menu-toggle');
  const headerRight = document.querySelector('.header-right');
  const themeToggle = document.getElementById('theme-toggle');
  const header = document.getElementById('main-header');

  // Toggle mobile menu
  menuToggle.addEventListener('click', () => {
    headerRight.classList.toggle('show');
  });

  // Add shadow to header on scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // Toggle dark/light mode (saved to localStorage)
    themeToggle.addEventListener('click', () => {
    if (document.body.dataset.theme === 'dark') {
      document.body.dataset.theme = '';
      localStorage.setItem('theme', 'light');
    } else {
      document.body.dataset.theme = 'dark';
      localStorage.setItem('theme', 'dark');
    }
  });
