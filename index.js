function showTab(event, tabId) {
    // Remove active class from all tabs and contents
    var tabs = document.getElementsByClassName('tab');
    var contents = document.getElementsByClassName('tab-content');
    for (var i = 0; i < tabs.length; i++) {
        tabs[i].classList.remove('active');
        contents[i].classList.remove('active');
    }

    // Add active class to clicked tab and corresponding content
    event.currentTarget.classList.add('active');
    document.getElementById(tabId).classList.add('active');
}