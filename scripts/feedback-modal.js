(function () {
  'use strict';

  if (!document.getElementById('_mh_fb_style')) {
    var style = document.createElement('style');
    style.id = '_mh_fb_style';
    style.textContent =
      '._mh-fb-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:9999;padding:16px;}' +
      '._mh-fb-overlay._mh-hidden{display:none;}' +
      '._mh-fb-modal{background:var(--surface,#111625);border:1px solid var(--border,#252d45);border-radius:var(--radius,8px);padding:24px;width:100%;max-width:460px;font-family:Rajdhani,-apple-system,BlinkMacSystemFont,sans-serif;}' +
      '._mh-fb-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;}' +
      '._mh-fb-hdr h3{font-family:Rajdhani,-apple-system,BlinkMacSystemFont,sans-serif;font-size:1.1rem;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;color:var(--text,#dde0e8);margin:0;}' +
      '._mh-fb-close{background:none;border:none;color:var(--text-dim,#7a8099);cursor:pointer;font-size:1.2rem;padding:4px 8px;line-height:1;}' +
      '._mh-fb-close:hover{color:var(--text,#dde0e8);}' +
      '._mh-fb-charcount{font-family:Rajdhani,-apple-system,BlinkMacSystemFont,sans-serif;font-size:0.78rem;color:var(--text-dim,#7a8099);margin-top:-12px;margin-bottom:16px;text-align:right;}' +
      '._mh-fb-btnrow{display:flex;gap:10px;margin-top:8px;}' +
      '._mh-fb-confirm{color:var(--green,#4ade80);font-family:Rajdhani,-apple-system,BlinkMacSystemFont,sans-serif;font-size:0.9rem;font-weight:600;margin-top:14px;display:none;}';
    document.head.appendChild(style);
  }

  if (!document.getElementById('_mh_fb_overlay')) {
    var overlay = document.createElement('div');
    overlay.id = '_mh_fb_overlay';
    overlay.className = '_mh-fb-overlay _mh-hidden';
    overlay.innerHTML =
      '<div class="_mh-fb-modal">' +
        '<div class="_mh-fb-hdr">' +
          '<h3>Send Feedback</h3>' +
          '<button class="_mh-fb-close" onclick="closeFeedbackModal()" aria-label="Close">✕</button>' +
        '</div>' +
        '<label for="_mh_fb_type">Type</label>' +
        '<select id="_mh_fb_type">' +
          '<option>General</option>' +
          '<option>Guides</option>' +
          '<option>Bug Report</option>' +
          '<option>Feature Request</option>' +
          '<option>Design/UI</option>' +
        '</select>' +
        '<label for="_mh_fb_input">Your Feedback</label>' +
        '<textarea id="_mh_fb_input" placeholder="Let us know what you’re thinking…" rows="5" maxlength="500"></textarea>' +
        '<div class="_mh-fb-charcount"><span id="_mh_fb_chars">0</span> / 500</div>' +
        '<label for="_mh_fb_discord">Discord Username <span style="font-weight:400;text-transform:none">(optional)</span></label>' +
        '<input type="text" id="_mh_fb_discord" placeholder="e.g. .gikey">' +
        '<div class="_mh-fb-btnrow">' +
          '<button class="btn btn-gold" onclick="_mhSubmitFeedback()">Submit</button>' +
          '<button class="btn btn-ghost" onclick="_mhClearFeedback()">Clear</button>' +
        '</div>' +
        '<div class="_mh-fb-confirm" id="_mh_fb_confirm">✅ Feedback sent! Thank you!</div>' +
      '</div>';
    document.body.appendChild(overlay);

    document.getElementById('_mh_fb_input').addEventListener('input', function () {
      document.getElementById('_mh_fb_chars').textContent = this.value.length;
    });

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeFeedbackModal();
    });
  }

  window.openFeedbackModal = function () {
    document.getElementById('_mh_fb_overlay').classList.remove('_mh-hidden');
  };

  window.closeFeedbackModal = function () {
    document.getElementById('_mh_fb_overlay').classList.add('_mh-hidden');
    document.getElementById('_mh_fb_confirm').style.display = 'none';
  };

  window._mhClearFeedback = function () {
    document.getElementById('_mh_fb_input').value = '';
    document.getElementById('_mh_fb_chars').textContent = '0';
  };

  window._mhSubmitFeedback = function () {
    var type = document.getElementById('_mh_fb_type').value;
    var text = document.getElementById('_mh_fb_input').value.trim();
    var disc = document.getElementById('_mh_fb_discord').value.trim();
    if (!text) { alert('Please enter your feedback.'); return; }
    var fd = new FormData();
    fd.append('entry.1593678335', type);
    fd.append('entry.486773277', text);
    fd.append('entry.1545987824', disc);
    fetch(
      'https://docs.google.com/forms/d/e/1FAIpQLSerJUAkcskPE5sDyrMarZoskzm6wpN2HvHzPeKxjnFmPZHddg/formResponse',
      { method: 'POST', mode: 'no-cors', body: fd }
    );
    document.getElementById('_mh_fb_input').value = '';
    document.getElementById('_mh_fb_discord').value = '';
    document.getElementById('_mh_fb_chars').textContent = '0';
    document.getElementById('_mh_fb_confirm').style.display = 'block';
  };
}());
