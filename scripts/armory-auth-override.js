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

  // Strip ?code from the URL after a recovery restore. Boot reads location.search
  // during its own deferred script, so by window 'load' the code is already consumed.
  var _mhStripUrl = false;
  try { _mhStripUrl = !!sessionStorage.getItem('_mh_strip_code_url'); } catch (e) {}
  if (_mhStripUrl) {
    try { sessionStorage.removeItem('_mh_strip_code_url'); } catch (e) {}
    window.addEventListener('load', function () {
      if (new URLSearchParams(window.location.search).get('code')) {
        history.replaceState({}, '', window.location.pathname);
      }
    });
  }

  // Suppress calls to unimplemented routes (advisor, feedback) to avoid 404 noise.
  // Note: /flag-overrides is handled server-side — its fetch fires before this defer script runs.
  const _baseFetch = window.fetch.bind(window);

  // Owner secret — high-entropy per-device write credential. Writes are gated by
  // it server-side (TOFU on first handshake); the recovery code distributes it
  // across devices. Generated lazily; once present it is never overwritten here,
  // so a recovery restore that adopts another device's secret survives (Trap 1).
  function _ensureOwnerSecret() {
    try {
      var s = localStorage.getItem('armory_owner_secret');
      if (s && /^[0-9a-f]{32,64}$/.test(s)) return s;
      var arr = new Uint8Array(16);
      crypto.getRandomValues(arr);
      s = Array.from(arr).map(function (b) { return b.toString(16).padStart(2, '0'); }).join(''); // 32 hex
      localStorage.setItem('armory_owner_secret', s);
      return s;
    } catch (e) { return null; }
  }

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
      body: JSON.stringify({ siteKey: sk, ownerSecret: _ensureOwnerSecret() })
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

      // Inject ownerSecret into every handshake POST (covers the page's own
      // _ar_ensureSupplementToken, which calls window.fetch). Our _ensureToken
      // already adds it directly via _baseFetch and bypasses this.
      if (path === '/supplement/handshake' && opts && (opts.method || '').toUpperCase() === 'POST') {
        try {
          var hb = opts.body ? JSON.parse(opts.body) : {};
          if (!hb.ownerSecret) {
            hb.ownerSecret = _ensureOwnerSecret();
            return _baseFetch(url, Object.assign({}, opts, { body: JSON.stringify(hb) }));
          }
        } catch (_) {}
      }

      // Save / delete a report config — attach the owner write token (and, on Save,
      // reuse the cached share code so the worker updates the existing entry). The
      // token is harmless while the worker isn't enforcing; required once it is.
      // Retry once on 401 in case a stale token was cached.
      if (path === '/report-config' && opts &&
          ((opts.method || '').toUpperCase() === 'POST' || (opts.method || '').toUpperCase() === 'DELETE')) {
        var _isPost = (opts.method || '').toUpperCase() === 'POST';
        var _u = url, _o = opts;
        var _send = function (token) {
          var bodyObj = {};
          try { bodyObj = _o.body ? JSON.parse(_o.body) : {}; } catch (_) {}
          if (_isPost) {
            try {
              var cached = JSON.parse(localStorage.getItem('playerReport') || '{}').shortcode;
              if (cached && !bodyObj.shortcode) bodyObj.shortcode = cached;
            } catch (_) {}
          }
          var headers = Object.assign({}, _o && _o.headers);
          if (token) headers['Authorization'] = 'Bearer ' + token;
          return _baseFetch(_u, Object.assign({}, _o, { body: JSON.stringify(bodyObj), headers: headers }));
        };
        return _ensureToken().then(_send).then(function (resp) {
          if (resp && resp.status === 401) {
            _tokenPromise = null; window._ar_supplementToken = null;
            return _ensureToken().then(_send);
          }
          return resp;
        });
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
          || k === 'armory_owner_secret' || k === 'armory_recovery_code'
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

      // Task 3 — Sync from Cloud button. The dead window._ar_hydrateSupplementsFromWorker
      // guard is dropped: clearing the last-sync markers + reload re-runs hydration on
      // load (armory-report.html), which performs the full re-pull.
      const syncBtn = document.createElement('button');
      syncBtn.className = 'btn-secondary';
      syncBtn.textContent = 'Sync from Cloud';
      syncBtn.addEventListener('click', function () {
        syncBtn.disabled = true;
        syncBtn.textContent = 'Syncing…';
        const sk = window.ArmoryIdentity.get()?.siteKey;
        if (sk) {
          ['inv','bench','chips','gear','runepool','heroes','formation','enigma','decor','skin']
            .forEach(kind => localStorage.removeItem('armory_lastSync_' + kind + '_' + sk));
        }
        location.reload(); // reload re-runs _ar_hydrateSupplementsFromWorker -> full re-pull
      });

      const wrapper = document.createElement('span');
      wrapper.id = 'ar-profile-btns';
      wrapper.appendChild(exportBtn);
      wrapper.appendChild(importLabel);
      wrapper.appendChild(syncBtn);
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
  } else if (!localStorage.getItem('armory_secret_backfilled')) {
    // Transition: a user who already had a recovery code (pre-ownerSecret) needs
    // the secret merged into their server-side recovery entry so cross-device
    // restore can hand it over. /recovery/save dedups and backfills (worker Trap 2).
    try {
      const _bid = window.ArmoryIdentity.get();
      Promise.resolve(_ar_saveRecoveryCode(_bid.siteKey, _bid.name || '', _bid.alliance || ''))
        .then(function () { try { localStorage.setItem('armory_secret_backfilled', '1'); } catch (e) {} });
    } catch (e) {}
  }

  async function _ar_saveRecoveryCode(siteKey, name, alliance) {
    try {
      const res = await fetch(_WORKER + '/recovery/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteKey, name, alliance,
          deviceId: localStorage.getItem('reportDeviceId') || '',
          ownerSecret: _ensureOwnerSecret()
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
        const errorMsg = await _mh_loadRecoveryCode(code);
        if (errorMsg) { errEl.textContent = errorMsg; errEl.style.display = ''; return; }
        // No saved report for this profile — reload to the landing page.
        location.reload();
      } catch {
        errEl.textContent = 'Network error — try again.';
        errEl.style.display = '';
      }
    });
  }

  // ── Settings dialog (player • recovery code • share code) ──────────────────
  // Opened from the header Settings button injected by patch-armory.js
  // (step 22). Lives here so it can call _ar_saveRecoveryCode directly.
  function _mh_copyToClipboard(text, btn) {
    if (!navigator.clipboard || !navigator.clipboard.writeText) return;
    navigator.clipboard.writeText(text).then(function () {
      var orig = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(function () { btn.textContent = orig; }, 1200);
    }).catch(function () {});
  }

  function _mh_buildCodeField(labelText, value, emptyText, actionLabel, actionFn) {
    var wrap = document.createElement('div');
    wrap.className = 'mh-set-field';
    var lbl = document.createElement('label');
    lbl.textContent = labelText;
    wrap.appendChild(lbl);

    function valueRow(val) {
      var row = document.createElement('div');
      row.className = 'mh-set-row';
      var code = document.createElement('div');
      code.className = 'mh-set-code';
      code.textContent = val;
      var copy = document.createElement('button');
      copy.className = 'mh-set-btn';
      copy.textContent = 'Copy';
      copy.addEventListener('click', function () { _mh_copyToClipboard(val, copy); });
      row.appendChild(code);
      row.appendChild(copy);
      return row;
    }

    if (value) {
      wrap.appendChild(valueRow(value));
    } else {
      var row = document.createElement('div');
      row.className = 'mh-set-row';
      var msg = document.createElement('span');
      msg.className = 'mh-set-muted';
      msg.textContent = emptyText;
      row.appendChild(msg);
      if (actionLabel && actionFn) {
        var btn = document.createElement('button');
        btn.className = 'mh-set-btn';
        btn.textContent = actionLabel;
        btn.addEventListener('click', function () {
          btn.disabled = true; btn.textContent = '…';
          Promise.resolve(actionFn(function (newVal) { row.replaceWith(valueRow(newVal)); }))
            .catch(function () {})
            .then(function () { btn.disabled = false; btn.textContent = actionLabel; });
        });
        row.appendChild(btn);
      }
      wrap.appendChild(row);
    }
    return wrap;
  }

  // A recovery code only restores the identity (siteKey/name/alliance). The
  // actual report — the battle-report-derived config — lives server-side keyed
  // by share code, not by siteKey, so a freshly restored device has no
  // playerReport and boots straight to the landing page. Look up this siteKey's
  // saved configs and jump into the richest one via ?code= (the boot handler
  // auto-applies it). Returns Promise<boolean> — true if it navigated away.
  function _mh_navigateToRestoredReport(siteKey) {
    if (!siteKey) return Promise.resolve(false);
    return fetch(_WORKER + '/report-configs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siteKey: siteKey })
    }).then(function (r) { return r.ok ? r.json() : null; }).then(function (res) {
      // /report-configs returns { configs } with no `ok` field — check the array directly.
      if (!res || !Array.isArray(res.configs) || !res.configs.length) return false;
      // Pick the most recently updated config; first on a tie / missing dates.
      function _ts(c) { var t = c && (c.updatedAt || c.date); var n = t ? new Date(t).getTime() : 0; return isNaN(n) ? 0 : n; }
      var best = res.configs.reduce(function (a, b) { return _ts(b) > _ts(a) ? b : a; });
      if (!best || !best.shortcode) return false;
      // Mark so the destination page strips ?code from the URL after the report
      // renders (recovery restore only — normal share links keep their ?code).
      try { sessionStorage.setItem('_mh_strip_code_url', '1'); } catch (e) {}
      window.location.replace('armory-report.html?code=' + encodeURIComponent(best.shortcode).toUpperCase());
      return true;
    }).catch(function () { return false; });
  }

  // Shared with the first-visit banner's restore flow. Returns Promise<string|null>:
  // an error message, or null on success (caller reloads). On success with a
  // saved report it navigates to ?code= and never resolves (page is unloading).
  function _mh_loadRecoveryCode(code) {
    return fetch(_WORKER + '/recovery/load?code=' + code).then(function (res) {
      if (res.status === 404) return 'Code not found or expired.';
      if (!res.ok) return 'Server error — try again.';
      return res.json().then(function (data) {
        localStorage.setItem('playerIdentity', JSON.stringify({
          siteKey: data.siteKey, name: data.name || '', alliance: data.alliance || ''
        }));
        localStorage.setItem('armory_recovery_code', code);
        // Force the next handshake to use the adopted/claimed secret.
        _tokenPromise = null; window._ar_supplementToken = null;

        function _finishRestore() {
          return _mh_navigateToRestoredReport(data.siteKey).then(function (navigated) {
            if (navigated) return new Promise(function () {}); // hold; page is navigating
            return null; // identity restored, no saved report — caller reloads to landing
          });
        }

        // Trap 1: adopt the origin device's secret BEFORE any generate-if-missing runs.
        if (data.ownerSecret && /^[0-9a-f]{32,64}$/.test(data.ownerSecret)) {
          try { localStorage.setItem('armory_owner_secret', data.ownerSecret); } catch (e) {}
          try { localStorage.setItem('armory_secret_backfilled', '1'); } catch (e) {}
          return _finishRestore();
        }
        // Trap 3: legacy recovery entry with no secret — claim write access with a
        // fresh secret, proving ownership via the recovery code, then store it.
        var sec = _ensureOwnerSecret();
        return _baseFetch(_WORKER + '/owner/reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: code, ownerSecret: sec })
        }).catch(function () {}).then(function () {
          try { localStorage.setItem('armory_secret_backfilled', '1'); } catch (e) {}
          return _finishRestore();
        });
      });
    }).catch(function () { return 'Network error — try again.'; });
  }
  // Exposed so the setup wizard (patched into armory-report.html via
  // patch-armory.js) can offer recovery-code restore, not just Settings.
  window._mh_loadRecoveryCode = _mh_loadRecoveryCode;

  function _mh_buildRestoreField() {
    var wrap = document.createElement('div');
    wrap.className = 'mh-set-field';
    var lbl = document.createElement('label');
    lbl.textContent = 'Restore from another device';
    wrap.appendChild(lbl);

    var row = document.createElement('div');
    row.className = 'mh-set-row';
    var input = document.createElement('input');
    input.className = 'mh-set-code';
    input.type = 'text';
    input.placeholder = '12-char recovery code';
    input.maxLength = 12;
    input.autocapitalize = 'characters';
    input.spellcheck = false;
    var btn = document.createElement('button');
    btn.className = 'mh-set-btn';
    btn.textContent = 'Restore';
    row.appendChild(input);
    row.appendChild(btn);
    wrap.appendChild(row);

    var err = document.createElement('div');
    err.className = 'mh-set-muted';
    err.style.marginTop = '6px';
    err.style.display = 'none';
    wrap.appendChild(err);

    function showErr(msg) { err.textContent = msg; err.style.color = '#f85149'; err.style.display = ''; }

    btn.addEventListener('click', function () {
      var code = input.value.trim().toUpperCase();
      err.style.display = 'none';
      if (code.length !== 12) { showErr('Enter the full 12-character code.'); return; }
      if (!window.confirm('Restoring replaces this device’s profile with the one for this code. Unsaved local data on this device will be lost. Continue?')) return;
      btn.disabled = true; btn.textContent = '…';
      _mh_loadRecoveryCode(code).then(function (errorMsg) {
        if (errorMsg) { showErr(errorMsg); btn.disabled = false; btn.textContent = 'Restore'; return; }
        location.reload();
      });
    });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') btn.click(); });

    return wrap;
  }

  window._mh_openSettingsDialog = function (player) {
    player = player || {};
    var id = (window.ArmoryIdentity && window.ArmoryIdentity.get && window.ArmoryIdentity.get()) || {};
    var name = player.name || id.name || 'Unknown';
    var siteKey = id.siteKey || '';
    var alliance = player.alliance || id.alliance || '';

    if (!document.getElementById('mh-settings-style')) {
      var st = document.createElement('style');
      st.id = 'mh-settings-style';
      st.textContent = [
        '.mh-set-bg{position:fixed;inset:0;z-index:10050;background:rgba(0,0,0,.55);display:flex;align-items:flex-start;justify-content:center;padding:calc(60px + 2rem) 1rem 1rem;}',
        '.mh-set-card{background:var(--card,#1c2128);color:var(--text,#e0e0e0);border:1px solid var(--border,#444);border-radius:10px;width:100%;max-width:420px;padding:18px 20px;box-shadow:0 8px 30px rgba(0,0,0,.5);max-height:calc(100vh - 60px - 4rem);overflow-y:auto;}',
        '.mh-set-card h2{margin:0 0 16px;font-size:18px;display:flex;align-items:center;justify-content:space-between;}',
        '.mh-set-close{background:none;border:none;color:var(--muted,#8b949e);font-size:24px;line-height:1;cursor:pointer;padding:0 4px;}',
        '.mh-set-player{display:flex;align-items:center;gap:12px;margin-bottom:18px;}',
        '.mh-set-av,.mh-set-av-fb{width:48px;height:48px;border-radius:50%;flex-shrink:0;}',
        '.mh-set-av{object-fit:cover;}',
        '.mh-set-av-fb{background:var(--accent,#4a7cff);color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;}',
        '.mh-set-pname{font-size:16px;font-weight:600;}',
        '.mh-set-pmeta{font-size:12px;color:var(--muted,#8b949e);margin-top:2px;}',
        '.mh-set-field{margin-bottom:14px;}',
        '.mh-set-field label{display:block;font-size:12px;color:var(--muted,#8b949e);margin-bottom:5px;}',
        '.mh-set-row{display:flex;align-items:center;gap:8px;}',
        '.mh-set-code{flex:1;font-family:monospace;font-size:15px;letter-spacing:.08em;font-weight:600;background:var(--input-bg,#2a2f45);border:1px solid var(--border,#444);border-radius:6px;padding:8px 10px;color:var(--text,#e0e0e0);overflow-wrap:anywhere;}',
        '.mh-set-btn{padding:8px 12px;background:transparent;color:var(--accent,#4a7cff);border:1px solid var(--border,#444);border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;}',
        '.mh-set-btn:hover{border-color:var(--accent,#4a7cff);}',
        '.mh-set-btn:disabled{opacity:.5;cursor:default;}',
        '.mh-set-muted{font-size:12px;color:var(--muted,#8b949e);}'
      ].join('');
      document.head.appendChild(st);
    }

    var bg = document.createElement('div');
    bg.className = 'mh-set-bg';
    var card = document.createElement('div');
    card.className = 'mh-set-card';
    bg.appendChild(card);

    function close() { bg.remove(); document.removeEventListener('keydown', onKey); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    bg.addEventListener('click', function (e) { if (e.target === bg) close(); });
    document.addEventListener('keydown', onKey);

    var h2 = document.createElement('h2');
    h2.appendChild(document.createTextNode('Settings'));
    var x = document.createElement('button');
    x.className = 'mh-set-close';
    x.setAttribute('aria-label', 'Close');
    x.innerHTML = '&times;';
    x.addEventListener('click', close);
    h2.appendChild(x);
    card.appendChild(h2);

    // Player name + image
    function fallbackAvatar() {
      var fb = document.createElement('div');
      fb.className = 'mh-set-av-fb';
      fb.textContent = (player.avatarFallback || (name || '?').charAt(0)).toUpperCase();
      return fb;
    }
    var pRow = document.createElement('div');
    pRow.className = 'mh-set-player';
    if (player.avatar) {
      var av = document.createElement('img');
      av.className = 'mh-set-av';
      av.src = player.avatar;
      av.alt = name;
      av.addEventListener('error', function () { av.replaceWith(fallbackAvatar()); });
      pRow.appendChild(av);
    } else {
      pRow.appendChild(fallbackAvatar());
    }
    var pInfo = document.createElement('div');
    var pn = document.createElement('div');
    pn.className = 'mh-set-pname';
    pn.textContent = name;
    pInfo.appendChild(pn);
    var metaParts = [];
    if (player.level) metaParts.push('Lv. ' + player.level);
    if (player.server) metaParts.push('S' + player.server);
    if (alliance) metaParts.push(alliance);
    if (metaParts.length) {
      var pm = document.createElement('div');
      pm.className = 'mh-set-pmeta';
      pm.textContent = metaParts.join(' · ');
      pInfo.appendChild(pm);
    }
    pRow.appendChild(pInfo);
    card.appendChild(pRow);

    // Recovery code (generate on demand if absent)
    card.appendChild(_mh_buildCodeField(
      'Recovery Code',
      localStorage.getItem('armory_recovery_code'),
      'No recovery code yet.',
      'Generate',
      function (setVal) {
        return _ar_saveRecoveryCode(siteKey, name, alliance).then(function (code) {
          if (code) setVal(code);
          else alert('Could not get recovery code. Try again later.');
        });
      }
    ));

    // Share code (read-only; created by saving a report)
    var shareCode = null;
    try { shareCode = JSON.parse(localStorage.getItem('playerReport') || '{}').shortcode || null; } catch (e) {}
    card.appendChild(_mh_buildCodeField(
      'Share Code',
      shareCode,
      'No share code yet — Save a report to create one.',
      null, null
    ));

    // Restore from another device's recovery code
    card.appendChild(_mh_buildRestoreField());

    document.body.appendChild(bg);
  };

})();
