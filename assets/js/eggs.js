/* Easter eggs. Each one has its own switch and texts in _config.yml → eggs.
   Preview the time-based ones with ?egg=owl, ?egg=screensaver or ?egg=regular. */
(function () {
  'use strict';

  var dataEl = document.getElementById('egg-data');
  if (!dataEl) return;
  var D = {};
  try { D = JSON.parse(dataEl.textContent) || {}; } catch (e) { return; }
  var E = D.eggs || {};
  var on = function (k) { return E[k] && E[k].show !== false; };
  var root = document.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var preview = (location.search.match(/[?&]egg=([a-z]+)/) || [])[1] || '';

  /* ---------- A small message that pops up and fades away ---------- */
  function toast(text, ms) {
    var t = document.createElement('div');
    t.className = 'egg-toast';
    t.setAttribute('role', 'status');
    t.textContent = text;
    document.body.appendChild(t);
    requestAnimationFrame(function () { requestAnimationFrame(function () { t.classList.add('is-shown'); }); });
    setTimeout(function () {
      t.classList.remove('is-shown');
      setTimeout(function () { t.remove(); }, 500);
    }, ms || 3200);
  }
  window.siteToast = toast;

  // A bubble with a big emoji, used by the night owl and the bottom peek
  function critter(cls, emoji, text, ms) {
    var c = document.createElement('div');
    c.className = 'egg-critter ' + cls;
    c.setAttribute('role', 'status');
    c.innerHTML = '<span class="ec-emoji" aria-hidden="true"></span><span class="ec-bubble"></span>' +
      '<button type="button" class="ec-close" aria-label="Close">&times;</button>';
    c.querySelector('.ec-emoji').textContent = emoji;
    c.querySelector('.ec-bubble').textContent = text;
    var close = function () { c.classList.remove('is-shown'); setTimeout(function () { c.remove(); }, 500); };
    c.querySelector('.ec-close').addEventListener('click', close);
    document.body.appendChild(c);
    requestAnimationFrame(function () { requestAnimationFrame(function () { c.classList.add('is-shown'); }); });
    if (ms) setTimeout(close, ms);
    return c;
  }

  /* ---------- 1. Night owl: late at night in the visitor's own time zone ---------- */
  if (on('night_owl')) {
    var o = E.night_owl, h = new Date().getHours();
    var from = Number(o.from || 0), to = Number(o.to || 5);
    var late = from <= to ? (h >= from && h < to) : (h >= from || h < to);
    var seen = false;
    try { seen = !!sessionStorage.getItem('owlShown'); } catch (e) { seen = false; }
    if ((late && !seen) || preview === 'owl') {
      try { sessionStorage.setItem('owlShown', '1'); } catch (e) { /* ignore */ }
      var time = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      setTimeout(function () { critter('egg-owl', '🦉', String(o.text || '').replace('{time}', time), 14000); }, 2500);
    }
  }

  /* ---------- 2. Shake your phone: confetti ---------- */
  if (on('shake') && window.DeviceMotionEvent) {
    var last = null, hits = [], cool = 0;
    var onMotion = function (e) {
      var a = e.accelerationIncludingGravity;
      if (!a || a.x === null) return;
      if (last) {
        var d = Math.abs(a.x - last.x) + Math.abs(a.y - last.y) + Math.abs(a.z - last.z);
        var now = Date.now();
        if (d > 25) { hits.push(now); hits = hits.filter(function (t) { return now - t < 900; }); }
        if (hits.length >= 3 && now > cool) {
          cool = now + 3000;
          hits = [];
          if (window.siteConfetti && !reduceMotion) window.siteConfetti();
          toast(E.shake.text || '🐊');
        }
      }
      last = { x: a.x, y: a.y, z: a.z };
    };
    // iPhones ask for permission first; we ask the first time the visitor taps the big name.
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      var nameEl = document.querySelector('.display-name');
      if (nameEl) nameEl.addEventListener('click', function () {
        DeviceMotionEvent.requestPermission().then(function (r) { if (r === 'granted') window.addEventListener('devicemotion', onMotion); }).catch(function () {});
      }, { once: true });
    } else {
      window.addEventListener('devicemotion', onMotion);
    }
  }

  /* ---------- 3. A note for developers in the browser console ---------- */
  if (on('console') && window.console) {
    var art = [
      '        _  _',
      '    ___(o)(o)____________________',
      '   /                             \\_____',
      '  |  \\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/        >',
      '   \\___/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\_____/',
      '        Go Gators!'
    ].join('\n');
    try {
      console.log('%c' + art, 'color:#0a7a3c;font-family:monospace;font-size:12px;line-height:1.25');
      console.log('%c' + (E.console.text || ''), 'color:#fa4616;font-size:13px;font-weight:600');
    } catch (e) { /* ignore */ }
  }

  /* ---------- 4. Leaving the tab ---------- */
  if (on('tab_away')) {
    var realTitle = document.title, backTimer = null;
    document.addEventListener('visibilitychange', function () {
      clearTimeout(backTimer);
      if (document.hidden) {
        realTitle = document.title.indexOf(E.tab_away.away_title) === 0 ? realTitle : document.title;
        document.title = E.tab_away.away_title || realTitle;
      } else {
        document.title = E.tab_away.back_title || realTitle;
        backTimer = setTimeout(function () { document.title = realTitle; }, 1800);
      }
    });
  }

  /* ---------- 5. Screensaver: the gator logo bounces around after a minute of no activity ---------- */
  if (on('screensaver') && (finePointer || preview === 'screensaver') && !reduceMotion) {
    var idleMs = Math.max(10, Number(E.screensaver.idle_seconds || 60)) * 1000;
    var idleTimer = null, saver = null, raf = null;
    var stopSaver = function () {
      if (!saver) return;
      cancelAnimationFrame(raf);
      saver.classList.remove('is-shown');
      var s = saver; saver = null;
      setTimeout(function () { s.remove(); }, 400);
    };
    var startSaver = function () {
      if (saver || document.hidden || document.querySelector('dialog[open]')) return;
      saver = document.createElement('div');
      saver.className = 'egg-saver';
      saver.setAttribute('aria-hidden', 'true');
      saver.innerHTML = '<img src="/images/intro-logo.webp" alt="">';
      document.body.appendChild(saver);
      requestAnimationFrame(function () { saver && saver.classList.add('is-shown'); });
      var img = saver.querySelector('img');
      var w = 180, h = 114, x = Math.random() * (innerWidth - w), y = Math.random() * (innerHeight - h);
      var vx = 2.2, vy = 1.8, hue = 0;
      var step = function () {
        if (!saver) return;
        x += vx; y += vy;
        if (x <= 0 || x + w >= innerWidth) { vx = -vx; hue = (hue + 70) % 360; x = Math.max(0, Math.min(innerWidth - w, x)); }
        if (y <= 0 || y + h >= innerHeight) { vy = -vy; hue = (hue + 70) % 360; y = Math.max(0, Math.min(innerHeight - h, y)); }
        img.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
        img.style.filter = 'hue-rotate(' + hue + 'deg) drop-shadow(0 6px 18px rgba(0,0,0,0.35))';
        raf = requestAnimationFrame(step);
      };
      step();
    };
    var poke = function () {
      stopSaver();
      clearTimeout(idleTimer);
      idleTimer = setTimeout(startSaver, idleMs);
    };
    ['mousemove', 'keydown', 'wheel', 'scroll', 'pointerdown', 'touchstart'].forEach(function (ev) {
      window.addEventListener(ev, poke, { passive: true });
    });
    poke();
    if (preview === 'screensaver') setTimeout(startSaver, 800);
  }

  /* ---------- 6. Keep scrolling past the bottom: a gator peeks up ---------- */
  if (on('bottom_peek')) {
    var pushes = 0, peekCool = 0, touchY = null;
    var atBottom = function () { return window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2; };
    var peek = function () {
      var now = Date.now();
      if (now < peekCool) return;
      peekCool = now + 12000;
      critter('egg-peek', '🐊', E.bottom_peek.text || '', 3600);
    };
    window.addEventListener('wheel', function (e) {
      if (e.deltaY > 0 && atBottom()) { if (++pushes >= 4) { pushes = 0; peek(); } } else if (e.deltaY < 0) pushes = 0;
    }, { passive: true });
    window.addEventListener('touchstart', function (e) { touchY = e.touches[0].clientY; }, { passive: true });
    window.addEventListener('touchmove', function (e) {
      if (touchY !== null && atBottom() && touchY - e.touches[0].clientY > 80) { touchY = null; peek(); }
    }, { passive: true });
  }

  /* ---------- 7. Type "vllm": a pretend inference server starts up ---------- */
  if (on('vllm')) {
    var word = String(E.vllm.word || 'vllm').toLowerCase(), typed = '', term = null;
    var openTerm = function () {
      if (term) return;
      term = document.createElement('div');
      term.className = 'egg-term';
      term.setAttribute('role', 'log');
      term.innerHTML = '<div class="et-bar"><i></i><i></i><i></i><span>vllm — bash</span><button type="button" aria-label="Close">&times;</button></div><pre class="et-body"></pre>';
      document.body.appendChild(term);
      requestAnimationFrame(function () { term.classList.add('is-shown'); });
      var body = term.querySelector('.et-body'), lines = E.vllm.lines || [], li = 0, ci = 0, me = term;
      var close = function () { if (!me.parentNode) return; me.classList.remove('is-shown'); setTimeout(function () { me.remove(); }, 400); if (term === me) term = null; };
      term.querySelector('button').addEventListener('click', close);
      var type = function () {
        if (!me.parentNode) return;
        if (li >= lines.length) { setTimeout(close, 9000); return; }
        var line = lines[li];
        body.textContent += line.charAt(ci++);
        if (ci >= line.length) { body.textContent += '\n'; li++; ci = 0; setTimeout(type, li === 1 ? 500 : 260); }
        else setTimeout(type, li === 0 ? 28 : 6);
      };
      setTimeout(type, 300);
    };
    window.addEventListener('keydown', function (e) {
      if (!e.key || e.key.length !== 1) return;
      var t = e.target;
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      typed = (typed + e.key.toLowerCase()).slice(-word.length);
      if (typed === word) { typed = ''; openTerm(); }
    });
  }

  /* ---------- 8. Returning visitor: a hello on the 10th, 25th, ... visit ---------- */
  if (on('returning')) {
    var n = 0;
    try {
      n = Number(localStorage.getItem('visits') || 0);
      if (!sessionStorage.getItem('visitCounted')) {
        n += 1;
        localStorage.setItem('visits', String(n));
        sessionStorage.setItem('visitCounted', '1');
        if ((E.returning.visits || []).indexOf(n) !== -1) setTimeout(function () { toast(String(E.returning.text || '').replace('{n}', n), 4500); }, 2200);
      }
    } catch (e) { /* storage blocked */ }
    if (preview === 'regular') setTimeout(function () { toast(String(E.returning.text || '').replace('{n}', 10), 4500); }, 800);
  }

  /* ---------- 9. Press and hold the header gator: it eats the cursor ---------- */
  if (on('long_press')) {
    var brand = document.querySelector('.brand');
    var holdTimer = null, ate = false;
    if (brand) {
      var start = function () {
        ate = false;
        clearTimeout(holdTimer);
        holdTimer = setTimeout(function () {
          ate = true;
          brand.classList.remove('is-chomping'); void brand.offsetWidth;
          brand.classList.add('is-chomping');
          root.classList.add('cursor-eaten');
          var b = document.createElement('span');
          b.className = 'egg-nom';
          b.textContent = E.long_press.text || 'Nom nom!';
          brand.appendChild(b);
          if (navigator.vibrate) navigator.vibrate([30, 40, 30]);
          setTimeout(function () { root.classList.remove('cursor-eaten'); brand.classList.remove('is-chomping'); b.remove(); }, 1800);
        }, 650);
      };
      var cancel = function () { clearTimeout(holdTimer); };
      brand.addEventListener('pointerdown', start);
      ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { brand.addEventListener(ev, cancel); });
      brand.addEventListener('contextmenu', function (e) { if (ate) e.preventDefault(); });
      // a long press shouldn't also follow the link
      brand.addEventListener('click', function (e) { if (ate) { e.preventDefault(); e.stopImmediatePropagation(); ate = false; } }, true);
    }
  }
})();
