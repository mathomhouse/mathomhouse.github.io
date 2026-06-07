(function () {
  var overlay  = document.getElementById('authOverlay');
  var pageBody = document.getElementById('pageBody');
  var input    = document.getElementById('pwInput');
  var btn      = document.getElementById('authBtn');
  var errEl    = document.getElementById('authError');

  function attempt() {
    if (input.value.trim().toLowerCase() === 'llama') {
      overlay.classList.remove('active');
      pageBody.classList.add('visible');
    } else {
      errEl.textContent = 'Incorrect access code.';
      input.classList.remove('shake');
      void input.offsetWidth;
      input.classList.add('shake');
      input.value = '';
      input.focus();
      setTimeout(function () { window.location.href = '404.html'; }, 600);
    }
  }

  btn.addEventListener('click', attempt);
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') attempt(); });
  input.focus();
})();
