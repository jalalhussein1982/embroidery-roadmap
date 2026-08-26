/* Anna's Adorable Creations — checklist progress.
   Storage: localStorage (per browser, per origin).
   Portability: JSON export/import + a save link that packs every tick into the URL.
   Degrades quietly wherever storage or the clipboard is unavailable. */
(function () {
  var KEY  = 'aac.roadmap.v1';
  var PREV = 'aac.roadmap.v1.prev';
  var KEYS = window.AAC_KEYS || [];

  /* ---------- storage ---------- */
  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }
  function save(s) {
    try { localStorage.setItem(KEY, JSON.stringify(s)); return true; } catch (e) { return false; }
  }

  var state = load();
  state.checks = state.checks || {};

  var page  = document.body.getAttribute('data-page');
  var boxes = Array.prototype.slice.call(document.querySelectorAll('.check input[type="checkbox"]'));

  /* ---------- save-link codec ---------- */
  function b64urlEncode(bytes) {
    var s = '';
    for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function b64urlDecode(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    var s = atob(str), out = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
    return out;
  }
  function encodeState() {
    var bytes = new Uint8Array(Math.ceil(KEYS.length / 8));
    for (var i = 0; i < KEYS.length; i++) {
      if (state.checks[KEYS[i]]) bytes[i >> 3] |= (1 << (i & 7));
    }
    return 'v1' + b64urlEncode(bytes);
  }
  function decodeState(code) {
    if (code.slice(0, 2) !== 'v1') return null;
    var bytes = b64urlDecode(code.slice(2));
    if (bytes.length !== Math.ceil(KEYS.length / 8)) return null;
    var checks = {};
    for (var i = 0; i < KEYS.length; i++) {
      if (bytes[i >> 3] & (1 << (i & 7))) checks[KEYS[i]] = 1;
    }
    return checks;
  }

  /* ---------- painting ---------- */
  var bar   = document.querySelector('.bar i');
  var count = document.querySelector('.progress .count');

  function paintBoxes() {
    boxes.forEach(function (b) { b.checked = !!state.checks[b.getAttribute('data-k')]; });
  }
  function paintPage() {
    var done = boxes.filter(function (b) { return b.checked; }).length;
    var pct  = boxes.length ? Math.round((done / boxes.length) * 100) : 0;
    if (bar) bar.style.width = pct + '%';
    if (count) count.textContent = done + ' / ' + boxes.length + '  ·  ' + pct + '%';
  }
  function paintNav() {
    document.querySelectorAll('.nav a[data-page]').forEach(function (a) {
      var p = a.getAttribute('data-page');
      var slot = a.querySelector('.done');
      if (!slot) return;
      var total = 0, done = 0;
      for (var i = 0; i < KEYS.length; i++) {
        if (KEYS[i].indexOf(p + '-') === 0) {
          total++;
          if (state.checks[KEYS[i]]) done++;
        }
      }
      if (!total) { slot.textContent = ''; return; }
      slot.textContent = done + '/' + total;
      slot.classList.toggle('zero', done === 0);
    });
  }
  function paintAll() { paintBoxes(); paintPage(); paintNav(); }

  /* ---------- toast ---------- */
  var toastEl;
  function toast(msg, undoFn) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      document.body.appendChild(toastEl);
    }
    toastEl.innerHTML = '';
    var span = document.createElement('span');
    span.textContent = msg;
    toastEl.appendChild(span);
    if (undoFn) {
      var b = document.createElement('button');
      b.textContent = 'Undo';
      b.addEventListener('click', function () { undoFn(); hide(); });
      toastEl.appendChild(b);
    }
    var x = document.createElement('button');
    x.className = 'x';
    x.setAttribute('aria-label', 'Dismiss');
    x.textContent = '✕';
    x.addEventListener('click', hide);
    toastEl.appendChild(x);
    toastEl.classList.add('show');
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(hide, undoFn ? 14000 : 5000);
    function hide() { toastEl.classList.remove('show'); }
  }

  /* ---------- apply an incoming snapshot ---------- */
  function applySnapshot(checks, source) {
    var prev = JSON.parse(JSON.stringify(state.checks));
    var known = {};
    var n = 0;
    for (var k in checks) {
      if (KEYS.indexOf(k) !== -1) { known[k] = 1; n++; }
    }
    state.checks = known;
    save(state);
    paintAll();
    toast('Restored ' + n + ' of ' + KEYS.length + ' ticks from ' + source + '.', function () {
      state.checks = prev;
      save(state);
      paintAll();
      toast('Reverted to the previous progress.');
    });
    try { localStorage.setItem(PREV, JSON.stringify(prev)); } catch (e) {}
  }

  /* ---------- restore from #s= on load ---------- */
  (function () {
    var m = /[#&]s=([A-Za-z0-9\-_]+)/.exec(location.hash);
    if (!m) return;
    var checks = decodeState(m[1]);
    history.replaceState(null, '', location.pathname + location.search);
    if (!checks) { toast('That save link does not match this version of the checklist.'); return; }
    applySnapshot(checks, 'the save link');
  })();

  paintAll();

  /* ---------- ticking ---------- */
  var linkGuard = false;
  document.querySelectorAll('.check a').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.stopPropagation();
      linkGuard = true;
      setTimeout(function () { linkGuard = false; }, 0);
    });
  });

  var warnedNoStorage = false;
  boxes.forEach(function (b) {
    b.addEventListener('change', function () {
      if (linkGuard) { b.checked = !b.checked; return; }
      var k = b.getAttribute('data-k');
      if (!k) return;
      if (b.checked) state.checks[k] = 1; else delete state.checks[k];
      if (!save(state) && !warnedNoStorage) {
        warnedNoStorage = true;
        toast('This browser is blocking storage — ticks will be lost on reload. Use "Copy save link" to keep them.');
      }
      paintPage();
      paintNav();
    });
  });

  /* ---------- reset ---------- */
  document.querySelectorAll('[data-reset]').forEach(function (btn) {
    var label = btn.textContent;
    btn.addEventListener('click', function () {
      var prev = JSON.parse(JSON.stringify(state.checks));
      if (btn.getAttribute('data-reset') === 'all') {
        state.checks = {};
      } else {
        boxes.forEach(function (b) { delete state.checks[b.getAttribute('data-k')]; });
      }
      save(state);
      paintAll();
      toast('Cleared.', function () {
        state.checks = prev;
        save(state);
        paintAll();
      });
      btn.textContent = 'Cleared';
      setTimeout(function () { btn.textContent = label; }, 1400);
    });
  });

  /* ---------- clipboard ---------- */
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (res, rej) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:absolute;left:-9999px';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); res(); } catch (e) { rej(e); }
      document.body.removeChild(ta);
    });
  }

  document.querySelectorAll('.btn-copy').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var pre = btn.closest('.copyblock').querySelector('pre');
      if (!pre) return;
      copyText(pre.innerText).then(function () {
        btn.textContent = 'Copied ✓';
        btn.classList.add('ok');
        setTimeout(function () { btn.textContent = 'Copy'; btn.classList.remove('ok'); }, 1600);
      }).catch(function () {
        btn.textContent = 'Select & copy';
        setTimeout(function () { btn.textContent = 'Copy'; }, 1600);
      });
    });
  });

  /* ---------- save link ---------- */
  document.querySelectorAll('[data-savelink]').forEach(function (btn) {
    var label = btn.textContent;
    btn.addEventListener('click', function () {
      var url = location.href.split('#')[0] + '#s=' + encodeState();
      copyText(url).then(function () {
        btn.textContent = 'Link copied ✓';
        btn.classList.add('ok');
        toast('Save link copied. Open it on any device or browser to restore this progress.');
        setTimeout(function () { btn.textContent = label; btn.classList.remove('ok'); }, 2200);
      }).catch(function () {
        window.prompt('Copy this save link:', url);
      });
    });
  });

  /* ---------- export ---------- */
  document.querySelectorAll('[data-export]').forEach(function (btn) {
    var label = btn.textContent;
    btn.addEventListener('click', function () {
      var done = 0;
      for (var k in state.checks) if (state.checks[k]) done++;
      var payload = {
        app: 'anna-adorable-creations-roadmap',
        version: 1,
        savedAt: new Date().toISOString(),
        done: done,
        total: KEYS.length,
        link: location.href.split('#')[0] + '#s=' + encodeState(),
        checks: state.checks
      };
      var stamp = new Date().toISOString().slice(0, 10);
      var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      var url  = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'roadmap-progress-' + stamp + '.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      btn.textContent = 'Exported ✓';
      btn.classList.add('ok');
      setTimeout(function () { btn.textContent = label; btn.classList.remove('ok'); }, 2000);
    });
  });

  /* ---------- import ---------- */
  var fileInput = document.querySelector('[data-importfile]');
  document.querySelectorAll('[data-import]').forEach(function (btn) {
    btn.addEventListener('click', function () { if (fileInput) fileInput.click(); });
  });
  if (fileInput) {
    fileInput.addEventListener('change', function () {
      var file = fileInput.files && fileInput.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        var data;
        try { data = JSON.parse(reader.result); } catch (e) { data = null; }
        if (!data || typeof data.checks !== 'object' || data.checks === null) {
          toast('That file is not a roadmap backup.');
        } else {
          applySnapshot(data.checks, 'the backup file');
        }
        fileInput.value = '';
      };
      reader.onerror = function () { toast('Could not read that file.'); fileInput.value = ''; };
      reader.readAsText(file);
    });
  }
})();
