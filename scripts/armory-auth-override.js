(function() {
  if (window.top !== window.self) { window.top.location = window.self.location; return; }

  // Hide source-site header buttons not relevant to mathomhouse.
  // buildReportHeader is closure-scoped so window override doesn't fire;
  // CSS is the reliable removal path.
  (function() {
    var s = document.createElement('style');
    s.id = 'ar-mh-header-hide';
    s.textContent = [
      '.report-header a.rh-btn[title="Home"]',
      '.report-header .bnp-wrap',
      '.report-header .whats-new-pill',
      '.tab-btn[data-tab="myadvisorplans"]',
      '.tab-btn[data-tab="advisorplan"]',
      '.runepool-advice-btn',
      '#rh-prefs-btn'
    ].join(',') + '{display:none!important}';
    s.textContent += '.rh-prefs-modal{background:#1c2128!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}';
    s.textContent += '.saved-configs-section{display:none!important}';
    s.textContent += '#advisor-modal.show{padding-top:calc(60px + 1rem)}.advisor-modal-card{max-height:calc(100vh - 60px - 2rem)}';
    s.textContent += '.modal-bg:has(.sup-unlock-modal){padding-top:calc(20px + 1rem)}.sup-unlock-modal{max-height:calc(100vh - 20px - 2rem);overflow-y:auto}.sup-unlock-modal>h2:first-child{margin-top:0}';
    if (new URLSearchParams(window.location.search).get('code')) {
      s.textContent += 'button.reports-badge{display:none!important}';
    }
    document.head.appendChild(s);
  })();

  const _WORKER = window.SUPPLEMENT_WORKER
    || 'https://mathomhouse-tw-worker.mathomhouse-tw.workers.dev';

  // Suppress calls to unimplemented routes (advisor, feedback) to avoid 404 noise.
  // Note: /flag-overrides is handled server-side — its fetch fires before this defer script runs.
  const _baseFetch = window.fetch.bind(window);

  // Eager handshake — caches a single token promise so supplement GETs never race the handshake.
  // Called immediately after ArmoryIdentity is patched; all concurrent GETs await the same promise.
  let _tokenPromise = null;
  function _ensureToken() {
    if (_tokenPromise) return _tokenPromise;
    const sk = window.ArmoryIdentity && window.ArmoryIdentity.get && window.ArmoryIdentity.get()?.siteKey;
    if (!sk) return Promise.resolve(null);
    _tokenPromise = _baseFetch(_WORKER + '/supplement/handshake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siteKey: sk })
    }).then(r => r.json()).then(d => {
      if (d.token) window._ar_supplementToken = d.token;
      return d.token || null;
    }).catch(() => null);
    return _tokenPromise;
  }

  window.fetch = function(url, opts) {
    if (typeof url === 'string' && url.startsWith(_WORKER)) {
      const path = url.slice(_WORKER.length).replace(/\?.*$/, '');

      // Inject auth on supplement GET reads — owner HMAC token or viewer shortcode
      if (/^\/supplement\/[^/]+\/[0-9a-f]{16}$/.test(path)) {
        const method = (opts && opts.method) ? opts.method.toUpperCase() : 'GET';
        if (method === 'GET') {
          const hasAuth = opts && opts.headers && (opts.headers['Authorization'] || opts.headers['authorization']);
          if (!hasAuth) {
            const code = new URLSearchParams(window.location.search).get('code');
            if (code) {
              // Viewer path — shortcode is the access credential
              const sep = url.includes('?') ? '&' : '?';
              return _baseFetch(url + sep + 'code=' + encodeURIComponent(code), opts);
            } else {
              // Owner path — wait for handshake token (may already be resolved)
              const _url = url, _opts = opts;
              return _ensureToken().then(function(token) {
                if (!token) return _baseFetch(_url, _opts);
                const newOpts = Object.assign({}, _opts, {
                  headers: Object.assign({}, _opts && _opts.headers, { 'Authorization': 'Bearer ' + token })
                });
                return _baseFetch(_url, newOpts);
              });
            }
          }
        }
      }

      // Reuse existing shortcode on Save — inject cached code into POST body so
      // the worker updates the existing entry rather than generating a new one.
      if (path === '/report-config' && opts && (opts.method || '').toUpperCase() === 'POST') {
        try {
          var cached = JSON.parse(localStorage.getItem('playerReport') || '{}').shortcode;
          if (cached) {
            var bodyObj = JSON.parse(opts.body);
            if (!bodyObj.shortcode) {
              bodyObj.shortcode = cached;
              var newOpts = Object.assign({}, opts, { body: JSON.stringify(bodyObj) });
              return _baseFetch(url, newOpts);
            }
          }
        } catch (_) {}
      }

      if (path.startsWith('/advisor/')) {
        const method = (opts && opts.method) ? opts.method.toUpperCase() : 'GET';
        if (/^\/advisor\/index\//.test(path)) {
          return Promise.resolve(new Response(JSON.stringify({ entries: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
        }
        if (method === 'POST' || method === 'DELETE') {
          return Promise.resolve(new Response(JSON.stringify({ ok: false, error: 'not available' }), { status: 503, headers: { 'Content-Type': 'application/json' } }));
        }
        return Promise.resolve(new Response(null, { status: 404 }));
      }
      if (path.startsWith('/feedback/')) {
        return Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
      }
    }
    if (typeof url === 'string' && (url === 'player-data.json' || url.endsWith('/player-data.json'))) {
      return Promise.resolve(new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    }
    return _baseFetch(url, opts);
  };

  if (!window.ArmoryIdentity) {
    console.error('armory-auth-override: ArmoryIdentity not found — source update may have renamed it');
    return;
  }

  // 1a. Random siteKey — patch in place to preserve prototype chain
  const _origGet = window.ArmoryIdentity.get.bind(window.ArmoryIdentity);
  const _origSet = window.ArmoryIdentity.set.bind(window.ArmoryIdentity);

  window.ArmoryIdentity.get = function() {
    let id = _origGet();
    if (!id || !id.siteKey || id.siteKey.startsWith('guest_')) {
      const arr = new Uint8Array(8);
      crypto.getRandomValues(arr);
      const sk = Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
      id = { name: id?.name || '', alliance: id?.alliance || '', siteKey: sk };
      _origSet(id);
      localStorage.removeItem('armory_unlocked');
      Object.keys(localStorage)
        .filter(k => k.startsWith('armory_uidHash_'))
        .forEach(k => localStorage.removeItem(k));
    }
    return id;
  };
  window.ArmoryIdentity.isUnlocked = () => true;
  window.ArmoryIdentity.setUnlocked = () => {};
  window.ArmoryIdentity.getUidHash = () => null;
  window.ArmoryIdentity.setUidHash = () => {};
  window.ArmoryIdentity.removeUidHash = () => {};

  // Pre-fire handshake now that ArmoryIdentity.get() returns a valid siteKey
  _ensureToken();

  // 2. Unlock modal → auto-approve
  window._ar_openUnlockModal = function(siteKey, playerName, onUnlock) {
    if (onUnlock) onUnlock();
  };

  // 5. isUnlocked → always true
  window._ar_isUnlocked = () => true;

  // isVerifiedS2864Member → always true so "Import TopWar Data" renders unconditionally
  window.isVerifiedS2864Member = () => true;

  // _ar_getRosterMap: must assign window._ar_rosterMap/_ar_rosterByName as side-effects
  // (line 8070 discards return value). _ar_rosterByName uses Proxy so fresh-paste
  // name lookup (line 8073) resolves to viewer's siteKey for supplement tabs.
  window._ar_getRosterMap = async function() {
    const sk = window.ArmoryIdentity.get()?.siteKey;
    const map = sk ? { [sk]: { siteKey: sk, name: '', alliance: '' } } : {};
    window._ar_rosterMap = map;
    window._ar_rosterByName = new Proxy({}, {
      get(_, name) { return { siteKey: sk, name, alliance: '' }; }
    });
    return map;
  };
  // Pre-populate synchronously before any DOMContentLoaded handler reads _ar_rosterMap
  window._ar_getRosterMap();

  // 6. Share link URL → mathomhouse.github.io
  window.copyShareLink = function(code) {
    const link = `https://mathomhouse.github.io/armory-report.html?code=${code}`;
    navigator.clipboard?.writeText(link)
      .then(() => showToastMessage('Link copied!'))
      .catch(() => showShortcodeModal(code));
  };

  // 1b. Export / Import UI — wrap renderManageView (direct DOM injection is wiped on each render)
  function exportProfile() {
    const sk = window.ArmoryIdentity.get()?.siteKey;
    const out = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k === 'playerIdentity' || k === 'playerReport' || k === 'reportDeviceId'
          || (sk && k.includes(sk))) {
        out[k] = localStorage.getItem(k);
      }
    }
    const blob = new Blob([JSON.stringify(out)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'armory-profile.json';
    a.click();
  }

  const IMPORT_KEY_ALLOW = /^(playerIdentity|playerReport|reportDeviceId|armory_)/;
  const IMPORT_KEY_DENY  = /^(armory_unlocked$|armory_uidHash_)/;

  function importProfile(file) {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target.result);
        if (typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid format');

        // Always keep our locally-generated siteKey — never adopt an imported UID-derived one
        const ourSk = window.ArmoryIdentity.get()?.siteKey;

        let importedSk = null;
        if (data.playerIdentity) {
          try { importedSk = JSON.parse(data.playerIdentity)?.siteKey || null; } catch (_) {}
        }

        let count = 0;
        Object.entries(data).forEach(([k, v]) => {
          if (!IMPORT_KEY_ALLOW.test(k) || IMPORT_KEY_DENY.test(k) || typeof v !== 'string') return;

          // Re-key supplement data from imported siteKey → our siteKey
          if (importedSk && ourSk && importedSk !== ourSk && k.includes(importedSk)) {
            k = k.replace(importedSk, ourSk);
          }

          // Replace siteKey inside playerIdentity with ours
          if (k === 'playerIdentity' && ourSk) {
            try {
              const id = JSON.parse(v);
              id.siteKey = ourSk;
              v = JSON.stringify(id);
            } catch (_) {}
          }

          localStorage.setItem(k, v);
          count++;
        });
        if (count === 0) throw new Error('No recognised keys in file');
        location.reload();
      } catch (err) {
        alert('Import failed: ' + err.message);
      }
    };
    reader.onerror = () => alert('Could not read file.');
    reader.readAsText(file);
  }

  const _origRenderManageView = window.renderManageView;
  if (_origRenderManageView) {
    window.renderManageView = function(containerArg) {
      _origRenderManageView.call(this, containerArg);
      const container = containerArg || document.getElementById('wizard-content');
      if (!container) return;
      if (container.querySelector('#ar-profile-btns')) return;
      const btnRow = container.querySelector('.manage-btn-row');
      if (!btnRow) return;

      const exportBtn = document.createElement('button');
      exportBtn.className = 'btn-secondary';
      exportBtn.textContent = 'Export Profile';
      exportBtn.addEventListener('click', exportProfile);

      const importLabel = document.createElement('label');
      importLabel.className = 'btn-secondary';
      importLabel.style.cursor = 'pointer';
      importLabel.textContent = 'Import Profile';
      const importInput = document.createElement('input');
      importInput.type = 'file';
      importInput.accept = '.json';
      importInput.style.display = 'none';
      importInput.addEventListener('change', e => { if (e.target.files[0]) importProfile(e.target.files[0]); });
      importLabel.appendChild(importInput);

      // Task 3 — Sync from Cloud button (commented out)
      // const syncBtn = document.createElement('button');
      // syncBtn.className = 'btn-secondary';
      // syncBtn.textContent = 'Sync from Cloud';
      // syncBtn.addEventListener('click', async () => {
      //   syncBtn.disabled = true;
      //   syncBtn.textContent = 'Syncing…';
      //   const sk = window.ArmoryIdentity.get()?.siteKey;
      //   if (sk) {
      //     ['inv','bench','chips','gear','runepool','heroes','formation','enigma','decor','skin']
      //       .forEach(kind => localStorage.removeItem('armory_lastSync_' + kind + '_' + sk));
      //   }
      //   if (window._ar_hydrateSupplementsFromWorker) {
      //     await window._ar_hydrateSupplementsFromWorker(sk);
      //   }
      //   location.reload();
      // });

      const wrapper = document.createElement('span');
      wrapper.id = 'ar-profile-btns';
      wrapper.appendChild(exportBtn);
      wrapper.appendChild(importLabel);
      // wrapper.appendChild(syncBtn); // Task 3
      btnRow.appendChild(wrapper);
    };
  }

  // 1c. Recovery code — first-visit detection
  // Read pre-call state so ArmoryIdentity.get() write below doesn't confuse the check
  const _hasIdentity = !!localStorage.getItem('playerIdentity');
  const _hasCode = !!localStorage.getItem('armory_recovery_code');

  if (!_hasCode) {
    const _id = window.ArmoryIdentity.get(); // generates random sk if needed
    if (!_hasIdentity) {
      // Brand-new visitor: show get-code banner + restore option
      _ar_showRecoveryUI(_id.siteKey, _id.name || '', _id.alliance || '');
    } else {
      // Returning visitor migrating from UID system: silently register
      _ar_saveRecoveryCode(_id.siteKey, _id.name || '', _id.alliance || '');
    }
  }

  async function _ar_saveRecoveryCode(siteKey, name, alliance) {
    try {
      const res = await fetch(_WORKER + '/recovery/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteKey, name, alliance,
          deviceId: localStorage.getItem('reportDeviceId') || ''
        })
      });
      if (!res.ok) return null;
      const { code } = await res.json();
      localStorage.setItem('armory_recovery_code', code);
      return code;
    } catch { return null; }
  }

  function _ar_showRecoveryUI(siteKey, name, alliance) {
    if (!document.getElementById('ar-rc-style')) {
      const s = document.createElement('style');
      s.id = 'ar-rc-style';
      s.textContent = `
        #armory-recovery-banner {
          position: fixed; bottom: 1rem; left: 50%; transform: translateX(-50%);
          z-index: 9999; background: var(--surface, #1e2230); color: var(--text, #e0e0e0);
          border: 1px solid var(--border, #444); border-radius: 6px;
          padding: 0.75rem 1rem; font-size: 0.875rem; max-width: 480px; width: 90%;
          box-shadow: 0 4px 16px rgba(0,0,0,0.5);
        }
        #armory-recovery-banner button {
          margin-left: 0.5rem; padding: 0.2rem 0.6rem;
          background: var(--accent, #4a7cff); color: #fff;
          border: none; border-radius: 4px; cursor: pointer;
        }
        #armory-recovery-banner a { color: var(--accent, #4a7cff); margin-left: 0.75rem; }
        #armory-recovery-banner input {
          background: var(--input-bg, #2a2f45); color: var(--text, #e0e0e0);
          border: 1px solid var(--border, #444); border-radius: 4px;
          padding: 0.2rem 0.5rem; font-size: 0.875rem; width: 14ch;
        }
      `;
      document.head.appendChild(s);
    }

    const el = document.createElement('div');
    el.id = 'armory-recovery-banner';
    el.innerHTML = `
      <div class="ar-rc-new">
        <span>New profile created.</span>
        <button id="ar-get-code-btn">Get recovery code</button>
        <a href="#" id="ar-restore-link">Restore existing profile</a>
      </div>
      <div class="ar-rc-restore" style="display:none">
        <input id="ar-rc-input" placeholder="12-char recovery code" maxlength="12">
        <button id="ar-restore-btn">Restore</button>
        <button id="ar-cancel-btn">Cancel</button>
        <span id="ar-rc-error" style="display:none;color:var(--error,red)"></span>
      </div>`;
    document.body.appendChild(el);

    el.querySelector('#ar-get-code-btn').addEventListener('click', async () => {
      const code = await _ar_saveRecoveryCode(siteKey, name, alliance);
      el.innerHTML = code
        ? `<span>Recovery code: <strong>${code}</strong> — save this to restore your profile on other devices. <button id="ar-dismiss">Dismiss</button></span>`
        : `<span style="color:var(--error,red)">Could not get recovery code. Try again later.</span>`;
      el.querySelector('#ar-dismiss')?.addEventListener('click', () => el.remove());
    });

    el.querySelector('#ar-restore-link').addEventListener('click', e => {
      e.preventDefault();
      el.querySelector('.ar-rc-new').style.display = 'none';
      el.querySelector('.ar-rc-restore').style.display = '';
    });

    el.querySelector('#ar-cancel-btn').addEventListener('click', () => {
      el.querySelector('.ar-rc-restore').style.display = 'none';
      el.querySelector('.ar-rc-new').style.display = '';
    });

    el.querySelector('#ar-restore-btn').addEventListener('click', async () => {
      const code = el.querySelector('#ar-rc-input').value.trim().toUpperCase();
      const errEl = el.querySelector('#ar-rc-error');
      errEl.style.display = 'none';
      if (code.length !== 12) {
        errEl.textContent = 'Enter the full 12-character code.';
        errEl.style.display = '';
        return;
      }
      try {
        const res = await fetch(`${_WORKER}/recovery/load?code=${code}`);
        if (res.status === 404) { errEl.textContent = 'Code not found or expired.'; errEl.style.display = ''; return; }
        if (!res.ok) { errEl.textContent = 'Server error — try again.'; errEl.style.display = ''; return; }
        const data = await res.json();
        localStorage.setItem('playerIdentity', JSON.stringify({
          siteKey: data.siteKey, name: data.name || '', alliance: data.alliance || ''
        }));
        localStorage.setItem('armory_recovery_code', code);
        // Task 4 — remove incorrect alert (commented out; supplement data loads from KV automatically)
        // alert('Profile restored.\n\nNote: supplement data (inventory, bench, chips) is not included — re-import via bookmarklet after reload.');
        location.reload();
      } catch {
        errEl.textContent = 'Network error — try again.';
        errEl.style.display = '';
      }
    });
  }

})();
