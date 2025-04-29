// header.js

// Load header.html into #header-placeholder
fetch('/header2.html')
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to load header');
    }
    return response.text();
  })
  .then(data => {
    document.getElementById('header-placeholder').innerHTML = data;

    // Initialize dropdown toggle behavior
    const hamburger = document.getElementById('hamburger');
    const dropdownMenu = document.getElementById('dropdownMenu');

    if (hamburger && dropdownMenu) {
      hamburger.addEventListener('click', () => {
        dropdownMenu.classList.toggle('show');
      });
    }

    // Add shadow to header on scroll
    const header = document.getElementById('main-header');
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });

  })
  .catch(error => {
    console.error('Error loading header:', error);
  });
