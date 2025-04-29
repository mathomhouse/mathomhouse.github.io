// Fire a manual page_view event with page metadata after the DOM loads
document.addEventListener("DOMContentLoaded", function() {
  gtag('event', 'page_view', {
    page_title: document.title,
    page_location: window.location.href,
    page_path: window.location.pathname
  });
});



// header.js

// Function to dynamically add the favicon
function addFavicon() {
    const link = document.createElement('link');
    link.rel = 'icon';
    link.href = 'cutelogo.ico'; // Make sure the path is correct
    link.type = 'image/x-icon';
    
    document.head.appendChild(link);
}

// Call the function to add the favicon when the page loads
document.addEventListener('DOMContentLoaded', addFavicon);

// Function to load the header.html content
function loadHeader() {
    // Fetch the header.html content
    fetch('/header.html')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load header');
            }
            return response.text(); // Read the HTML content as text
        })
        .then(data => {
            document.getElementById('header-placeholder').innerHTML = data; // Insert the header HTML into the placeholder
            initializeHeader(); // Initialize header behavior after loading
        })
        .catch(error => console.error('Error loading header:', error));
}

// Function to initialize dropdown and event listeners
function initializeHeader() {
    const dropdown = document.getElementById("dropdownMenu");
    const hamburger = document.getElementById("hamburger");

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
}

// Call the loadHeader function when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", loadHeader);
