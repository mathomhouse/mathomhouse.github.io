// header.js

// Function to load the header.html content
function loadHeader() {
    // Fetch the header.html content
    fetch('header.html')
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
