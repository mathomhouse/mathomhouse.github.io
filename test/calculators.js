document.addEventListener('DOMContentLoaded', function () {
    // Theme setup
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.body.dataset.theme = 'dark';
      //document.getElementById('themeToggle').textContent = '☀️';
    }
  
    const toggleButton = document.getElementById('themeToggle');
    if (toggleButton) {
      toggleButton.addEventListener('click', () => {
        const isDark = document.body.dataset.theme === 'dark';
        document.body.dataset.theme = isDark ? '' : 'dark';
        localStorage.setItem('theme', isDark ? 'light' : 'dark');
        toggleButton.textContent = isDark ? '🌓' : '☀️';
      });
    }
  
    // Back to top visibility
    window.addEventListener('scroll', () => {
      const button = document.getElementById('backToTop');
      if (button) {
        button.classList.toggle('show', window.scrollY > 300);
      }
    });
  
    // Section reveal observer
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('show');
      });
    }, { threshold: 0.1 });
  
    document.querySelectorAll('.section').forEach(section => observer.observe(section));
  
    // HT icon cycling
    const htIcons = [
      "/images/yellow-ht-icon.png",
      "/images/red-ht-icon.png",
      "/images/blue-ht-icon.png",
      "/images/ball-ht-icon.png",
      "/images/white-ht-icon.png",
      "/images/pink-ht-icon.png"
    ];
  
    const iconElement = document.getElementById("ht-icon");
    if (iconElement) {
      let currentIcon = 0;
      setInterval(() => {
        iconElement.style.opacity = 0;
        iconElement.addEventListener('transitionend', function handler() {
          iconElement.removeEventListener('transitionend', handler);
          currentIcon = (currentIcon + 1) % htIcons.length;
          iconElement.src = htIcons[currentIcon];
          iconElement.style.opacity = 1;
        });
      }, 5000);
    }
  
    // Feedback modal character counter
    const feedbackInput = document.getElementById('modal-feedback-input');
    const charCount = document.getElementById('char-count');
    if (feedbackInput && charCount) {
      feedbackInput.addEventListener('input', function () {
        charCount.textContent = this.value.length;
      });
    }
  
    // Feedback modal controls
    window.openFeedbackModal = function () {
      document.getElementById('feedback-modal').classList.remove('hidden');
      document.getElementById('modal-backdrop').classList.remove('hidden');
    };
  
    window.closeFeedbackModal = function () {
      document.getElementById('feedback-modal').classList.add('hidden');
      document.getElementById('modal-backdrop').classList.add('hidden');
      document.getElementById('feedback-confirmation').classList.add('hidden');
    };
  
    window.submitModalFeedback = function () {
      const type = document.getElementById('feedback-type').value;
      const feedback = document.getElementById('modal-feedback-input').value.trim();
      const discord = document.getElementById('discord-name').value.trim();
      const pageURL = window.location.href;
  
      if (!feedback) {
        alert("Please enter your feedback.");
        return;
      }
  
      const localTime = new Date().toLocaleString('en-US', {
        timeZone: 'America/Los_Angeles',
        dateStyle: 'medium',
        timeStyle: 'short'
      });
  
      const userLang = navigator.language || navigator.userLanguage;
  
      const formURL = 'https://docs.google.com/forms/d/e/1FAIpQLSerJUAkcskPE5sDyrMarZoskzm6wpN2HvHzPeKxjnFmPZHddg/formResponse';
      const formData = new FormData();
      formData.append('entry.1593678335', type);
      formData.append('entry.486773277', feedback);
      formData.append('entry.1545987824', discord);
  
      fetch(formURL, {
        method: 'POST',
        mode: 'no-cors',
        body: formData
      });
  
      const discordWebhookUrl = 'https://discord.com/api/webhooks/1372702749145436160/T2Up9M6X6ZkgAU10Yw5zFTR6XBDiSs7cU33So9McJZp7SP504koGAIbQ7APYS9jx9TEN';
      const discordPayload = {
        embeds: [{
          title: "📬 New Feedback Submitted",
          color: 3447003,
          fields: [
            { name: "🗂️ Type", value: type, inline: true },
            { name: "👤 Discord", value: discord || "N/A", inline: true },
            { name: "📝 Message", value: feedback },
            { name: "📍 Page", value: pageURL },
            { name: "🌐 Language", value: userLang, inline: true },
            { name: "🕒 Local Time (PST)", value: localTime, inline: true }
          ],
          timestamp: new Date().toISOString()
        }]
      };
  
      fetch(discordWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discordPayload)
      });
  
      document.getElementById('modal-feedback-input').value = '';
      document.getElementById('discord-name').value = '';
      charCount.textContent = '0';
  
      showToast("✅ Feedback submitted!");
      setTimeout(() => closeFeedbackModal(), 3000);
    };
  
    function showToast(message) {
      const toast = document.getElementById('toast');
      toast.textContent = message;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 3000);
    }
  
    // Support modal
    window.openSupportModal = function () {
      document.getElementById('support-modal').classList.remove('hidden');
      document.getElementById('support-backdrop').classList.remove('hidden');
    };
  
    window.closeSupportModal = function () {
      document.getElementById('support-modal').classList.add('hidden');
      document.getElementById('support-backdrop').classList.add('hidden');
    };
  });
  
  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }