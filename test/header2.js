// header.js

// Dynamically add favicon
function addFavicon() {
    const link = document.createElement('link');
    link.rel = 'icon';
    link.href = '/cutelogo.ico'; // Adjust path if needed
    link.type = 'image/x-icon';
    document.head.appendChild(link);
}

document.addEventListener('DOMContentLoaded', addFavicon);

// Load header.html into placeholder
function loadHeader() {
    fetch('/header2.html')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load header');
            }
            return response.text();
        })
        .then(data => {
            document.getElementById('header-placeholder').innerHTML = data;
            initializeHeader(); // After inserting header HTML
        })
        .catch(error => console.error('Error loading header:', error));
}

// Initialize header behavior after load
function initializeHeader() {
    const dropdown = document.getElementById('dropdownMenu');
    const hamburger = document.getElementById('hamburger');
    const header = document.getElementById('main-header');

    function toggleDropdown() {
        const rect = hamburger.getBoundingClientRect();
        dropdown.style.top = rect.bottom + 'px';
        dropdown.style.left = rect.left + 'px';
        dropdown.style.display = dropdown.style.display === 'flex' ? 'none' : 'flex';
    }

    if (hamburger && dropdown) {
        hamburger.onclick = toggleDropdown;

        // Hide dropdown when clicking outside
        document.addEventListener('click', function(event) {
            if (!dropdown.contains(event.target) && !hamburger.contains(event.target)) {
                dropdown.style.display = 'none';
            }
        });
    }

    // Add header shadow on scroll
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 20) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }
}

// Start loading header when DOM ready
document.addEventListener('DOMContentLoaded', loadHeader);
