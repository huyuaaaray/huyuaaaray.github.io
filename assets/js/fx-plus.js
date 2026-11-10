/* Even more effects, each switched on/off in _config.yml → effects.
   (neon_dark, header_fx and liquid_buttons are pure CSS.) */
(function () {
  'use strict';

  var root = document.documentElement;
  var fx = (root.getAttribute('data-fx') || '').split(/\s+/);
  var has = function (n) { return fx.indexOf(n) !== -1; };
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var isLite = function () { return root.classList.contains('lite'); };
  var D = {};
  try { D = JSON.parse((document.getElementById('egg-data') || {}).textContent || '{}') || {}; } catch (e) { D = {}; }
  var each = function (sel, fn) { Array.prototype.forEach.call(document.querySelectorAll(sel), fn); };
  var SCRAMBLE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&@$';

  /* ---------- Title shine: a wave of light runs across a title when you point at it ---------- */
  if (has('shine') && !reduceMotion) {
    each('.section-title, .cv-section > h2, .display-name', function (h) {
      h.addEventListener('mouseenter', function () {
        var chars = h.querySelectorAll('.tl-ch, .dc');
        Array.prototype.forEach.call(chars, function (c, i) { c.style.setProperty('--si', i); });
        h.classList.remove('is-shining', 'shine-whole');
        void h.offsetWidth;
        h.classList.add(chars.length ? 'is-shining' : 'shine-whole');
        setTimeout(function () { h.classList.remove('is-shining', 'shine-whole'); }, 1600);
      });
    });
  }

  /* ---------- Header: shrinks once you scroll down ---------- */
  if (has('shrink')) {
    var shrinkTick = false;
    var setShrink = function () { root.classList.toggle('scrolled', window.scrollY > 40); shrinkTick = false; };
    window.addEventListener('scroll', function () { if (!shrinkTick) { shrinkTick = true; requestAnimationFrame(setShrink); } }, { passive: true });
    setShrink();
  }

  /* ---------- Menu links: letters scramble, and a little flourish (a plane for Travel, a pencil for CV) ---------- */
  each('.site-header .tab', function (tab) {
    var text = tab.textContent.trim();
    tab.textContent = '';
    var label = document.createElement('span');
    label.className = 'tab-label';
    label.textContent = text;
    tab.appendChild(label);
    if (has('navfx')) {
      var href = tab.getAttribute('href') || '';
      var kind = /travel/.test(href) ? 'plane' : /cv/.test(href) ? 'pencil' : 'spark';
      var f = document.createElement('span');
      f.className = 'nav-fx nav-fx-' + kind;
      f.setAttribute('aria-hidden', 'true');
      f.innerHTML = '<span class="nf-trail"></span><span class="nf-icon">' + (kind === 'plane' ? '✈️' : kind === 'pencil' ? '✏️' : '✨') + '</span>';
      tab.appendChild(f);
    }
    if (has('navscramble') && !reduceMotion) {
      var busy = false;
      tab.addEventListener('mouseenter', function () {
        if (busy) return;
        busy = true;
        var frame = 0, total = 12;
        var step = function () {
          frame++;
          var keep = Math.floor(text.length * frame / total);
          label.textContent = text.split('').map(function (ch, i) {
            return i < keep || ch === ' ' ? ch : SCRAMBLE.charAt((Math.random() * SCRAMBLE.length) | 0);
          }).join('');
          if (frame < total) setTimeout(step, 32); else { label.textContent = text; busy = false; }
        };
        step();
      });
    }
  });

  /* ---------- Scroll skew: the page leans a little when you scroll fast, then settles ---------- */
  var main = document.querySelector('main');
  if (has('skew') && main && !reduceMotion) {
    var lastY = window.scrollY, lastT = performance.now(), skew = 0, target = 0, skewRaf = null;
    var settle = function () {
      skew += (target - skew) * 0.18;
      target *= 0.85;
      if (Math.abs(skew) < 0.02 && Math.abs(target) < 0.02) { main.style.transform = ''; skewRaf = null; return; }
      main.style.transform = 'skewY(' + skew.toFixed(3) + 'deg)';
      skewRaf = requestAnimationFrame(settle);
    };
    window.addEventListener('scroll', function () {
      if (isLite()) return;
      var now = performance.now(), dt = Math.max(8, now - lastT), v = (window.scrollY - lastY) / dt;  // px per ms
      lastY = window.scrollY; lastT = now;
      target = Math.max(-2.2, Math.min(2.2, v * 0.9));
      if (!skewRaf) skewRaf = requestAnimationFrame(settle);
    }, { passive: true });
  }

  /* ---------- Dot grid: a field of dots that bulges around the mouse (CV and 404 pages) ---------- */
  if (has('dotgrid') && finePointer && !document.querySelector('.bg-network, .bg-stars')) {
    var cv = document.createElement('canvas');
    cv.className = 'dot-grid';
    cv.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(cv, document.body.firstChild);
    var g = cv.getContext('2d'), GW = 0, GH = 0, gdpr = 1, mx = -999, my = -999, gRaf = null;
    var GAP = 26, R = 130;
    var dotColor = function () { return getComputedStyle(root).getPropertyValue('--muted').trim() || '#888'; };
    var markColor = function () { return getComputedStyle(root).getPropertyValue('--mark').trim() || '#fa4616'; };
    var drawGrid = function () {
      gRaf = null;
      g.clearRect(0, 0, GW, GH);
      var base = dotColor(), hot = markColor();
      for (var y = GAP / 2; y < GH; y += GAP) {
        for (var x = GAP / 2; x < GW; x += GAP) {
          var dx = x - mx, dy = y - my, d = Math.sqrt(dx * dx + dy * dy), f = d < R ? Math.pow(1 - d / R, 2) : 0;
          var px = x + (d ? dx / d : 0) * f * 16, py = y + (d ? dy / d : 0) * f * 16;
          g.globalAlpha = 0.22 + f * 0.6;
          g.fillStyle = f > 0.25 ? hot : base;
          g.beginPath(); g.arc(px, py, 1.1 + f * 1.8, 0, Math.PI * 2); g.fill();
        }
      }
      g.globalAlpha = 1;
    };
    var sizeGrid = function () {
      gdpr = Math.min(window.devicePixelRatio || 1, 2);
      GW = window.innerWidth; GH = window.innerHeight;
      cv.width = Math.round(GW * gdpr); cv.height = Math.round(GH * gdpr);
      g.setTransform(gdpr, 0, 0, gdpr, 0, 0);
      drawGrid();
    };
    window.addEventListener('resize', sizeGrid);
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      mx = e.clientX; my = e.clientY;
      if (!gRaf && !isLite()) gRaf = requestAnimationFrame(drawGrid);
    }, { passive: true });
    window.addEventListener('themechange', drawGrid);
    sizeGrid();
  }

  /* ---------- Flowing borders: a ring of color slowly running around cards ---------- */
  if (has('flowborder')) {
    var ring = function (el, cls) {
      var r = document.createElement('span');
      r.className = 'fb-ring ' + cls;
      r.setAttribute('aria-hidden', 'true');
      el.appendChild(r);
    };
    each('.ask-box, .place-card, .photo', function (el) { ring(el, 'fb-always'); });
    each('.news li, .cv-section .entry', function (el) { ring(el, 'fb-hover'); });
  }

  /* ---------- Odometer: the stats roll into place like an old mileage counter ---------- */
  var odometer = function (el) {
    if (el.dataset.odoDone) return;
    el.dataset.odoDone = '1';
    var target = String(el.getAttribute('data-odo') || el.textContent).trim();
    if (reduceMotion) { el.textContent = target; return; }
    el.textContent = '';
    el.setAttribute('aria-label', target);
    var strips = [];
    Array.prototype.forEach.call(target, function (ch, k) {
      if (!/\d/.test(ch)) { var s = document.createElement('span'); s.textContent = ch; s.setAttribute('aria-hidden', 'true'); el.appendChild(s); return; }
      var col = document.createElement('span');
      col.className = 'odo-col';
      col.setAttribute('aria-hidden', 'true');
      var strip = document.createElement('span');
      strip.className = 'odo-strip';
      for (var r = 0; r < 3; r++) for (var d = 0; d <= 9; d++) { var n = document.createElement('span'); n.textContent = d; strip.appendChild(n); }
      col.appendChild(strip);
      el.appendChild(col);
      strips.push({ strip: strip, digit: Number(ch), k: k });
    });
    var go = function () {
      strips.forEach(function (s) {
        s.strip.style.transitionDelay = (s.k * 120) + 'ms';
        s.strip.style.transform = 'translateY(' + (-(20 + s.digit)) + 'em)';
      });
    };
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { io.disconnect(); setTimeout(go, 150); } }, { threshold: 0.6 });
      io.observe(el);
    } else go();
  };
  window.siteOdometer = odometer;
  if (has('odometer')) each('[data-odo]', odometer);

  /* ---------- Code rain behind the research-interest banner ---------- */
  var banner = document.querySelector('.research-banner');
  if (has('coderain') && banner && (D.code || []).length) {
    var rain = document.createElement('div');
    rain.className = 'code-rain';
    rain.setAttribute('aria-hidden', 'true');
    var pre = document.createElement('pre');
    pre.textContent = D.code.concat([''], D.code, ['']).join('\n');
    rain.appendChild(pre);
    banner.insertBefore(rain, banner.firstChild);
  }

  /* ---------- Back-to-top button: a ring that fills as you read ---------- */
  var toTop = document.querySelector('.to-top');
  if (has('ring') && toTop) {
    var NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'top-ring');
    svg.setAttribute('viewBox', '0 0 52 52');
    svg.setAttribute('aria-hidden', 'true');
    var c = document.createElementNS(NS, 'circle');
    c.setAttribute('cx', '26'); c.setAttribute('cy', '26'); c.setAttribute('r', '24');
    c.setAttribute('pathLength', '1');
    svg.appendChild(c);
    toTop.appendChild(svg);
    var ringTick = false;
    var fill = function () {
      ringTick = false;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      c.style.strokeDashoffset = (1 - p).toFixed(4);
    };
    window.addEventListener('scroll', function () { if (!ringTick) { ringTick = true; requestAnimationFrame(fill); } }, { passive: true });
    fill();
  }

  /* ---------- Particle name: click the big name and it bursts into dust, then pulls itself back together ---------- */
  var nameEl = document.querySelector('.display-name');
  if (has('particles') && nameEl && !reduceMotion) {
    var bursting = false;
    nameEl.addEventListener('click', function () {
      if (bursting) return;
      bursting = true;
      var spans = nameEl.querySelectorAll('.dc');
      var temp = false;
      if (!spans.length) {                                   // wrap the letters just to measure them
        var txt = nameEl.textContent;
        nameEl.textContent = '';
        txt.split('').forEach(function (ch) { var s = document.createElement('span'); s.className = 'dc'; s.textContent = ch; nameEl.appendChild(s); });
        spans = nameEl.querySelectorAll('.dc');
        temp = txt;
      }
      var box = nameEl.getBoundingClientRect(), cs = getComputedStyle(nameEl);
      var pad = 120, W = Math.ceil(box.width + pad * 2), H = Math.ceil(box.height + pad * 2), dpr = Math.min(window.devicePixelRatio || 1, 2);
      var off = document.createElement('canvas');
      off.width = W; off.height = H;
      var o = off.getContext('2d');
      o.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
      o.textAlign = 'center'; o.textBaseline = 'middle'; o.fillStyle = '#000';
      Array.prototype.forEach.call(spans, function (s) {
        var r = s.getBoundingClientRect();
        o.fillText(s.textContent, r.left - box.left + pad + r.width / 2, r.top - box.top + pad + r.height / 2);
      });
      if (temp !== false) nameEl.textContent = temp;
      var data = o.getImageData(0, 0, W, H).data, pts = [], step = 3;
      for (var y = 0; y < H; y += step) for (var x = 0; x < W; x += step) if (data[(y * W + x) * 4 + 3] > 140) pts.push({ hx: x, hy: y, x: x, y: y, vx: 0, vy: 0 });
      var canvas = document.createElement('canvas');
      canvas.className = 'name-particles';
      canvas.style.left = (box.left + window.scrollX - pad) + 'px';
      canvas.style.top = (box.top + window.scrollY - pad) + 'px';
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      canvas.width = W * dpr; canvas.height = H * dpr;
      document.body.appendChild(canvas);
      var ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var color = cs.color;
      pts.forEach(function (p) { var a = Math.random() * Math.PI * 2, v = 3 + Math.random() * 9; p.vx = Math.cos(a) * v; p.vy = Math.sin(a) * v - 2; });
      nameEl.classList.add('is-dust');
      var t0 = performance.now();
      var frame = function (now) {
        var t = now - t0, pull = t > 450;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = color;
        var settled = true;
        pts.forEach(function (p) {
          if (pull) { p.vx += (p.hx - p.x) * 0.06; p.vy += (p.hy - p.y) * 0.06; p.vx *= 0.78; p.vy *= 0.78; }
          else { p.vx *= 0.94; p.vy *= 0.94; }
          p.x += p.vx; p.y += p.vy;
          if (Math.abs(p.x - p.hx) > 0.6 || Math.abs(p.y - p.hy) > 0.6) settled = false;
          ctx.fillRect(p.x, p.y, 2.2, 2.2);
        });
        if ((pull && settled) || t > 3200) {
          nameEl.classList.remove('is-dust');
          canvas.remove();
          bursting = false;
          return;
        }
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
  }

  /* ---------- Ink transition between pages ---------- */
  if (has('ink') && !reduceMotion) {
    // arriving: the ink that covered the old page pulls back to reveal this one
    if (root.classList.contains('ink-in')) {
      var from = (sessionStorage.getItem('inkFrom') || '50,50').split(',');
      sessionStorage.removeItem('inkFrom');
      var cover = document.createElement('div');
      cover.className = 'ink is-full';
      cover.style.setProperty('--ix', from[0] + '%');
      cover.style.setProperty('--iy', from[1] + '%');
      document.body.appendChild(cover);
      root.classList.remove('ink-in');
      requestAnimationFrame(function () { requestAnimationFrame(function () { cover.classList.add('is-out'); }); });
      setTimeout(function () { cover.remove(); }, 900);
    }
    // leaving: ink spreads from where you clicked, then the next page loads
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a || a.target === '_blank' || a.hasAttribute('download') || a.hasAttribute('data-photo')) return;
      var url = new URL(a.href, location.href);
      if (url.origin !== location.origin || /^(mailto|tel):/.test(a.href)) return;
      if (url.pathname === location.pathname && url.hash) return;            // just a jump on this page
      if (/\.(pdf|jpg|jpeg|png|webp|zip)$/i.test(url.pathname)) return;
      e.preventDefault();
      var px = (e.clientX / window.innerWidth * 100).toFixed(1), py = (e.clientY / window.innerHeight * 100).toFixed(1);
      try { sessionStorage.setItem('inkFrom', px + ',' + py); } catch (err) { /* ignore */ }
      var ink = document.createElement('div');
      ink.className = 'ink is-in';
      ink.style.setProperty('--ix', px + '%');
      ink.style.setProperty('--iy', py + '%');
      document.body.appendChild(ink);
      requestAnimationFrame(function () { requestAnimationFrame(function () { ink.classList.add('is-full'); }); });
      setTimeout(function () { location.href = url.href; }, 520);
    });
    // coming back with the browser's Back button: don't leave ink on the page
    window.addEventListener('pageshow', function (e) { if (e.persisted) each('.ink', function (n) { n.remove(); }); });
  }

  /* ---------- Orbit icons: little icons circling the profile photo ---------- */
  var portrait = document.querySelector('.portrait');
  if (has('orbit') && portrait && (D.orbit || []).length) {
    var orbit = document.createElement('div');
    orbit.className = 'orbit';
    orbit.setAttribute('aria-hidden', 'true');
    D.orbit.forEach(function (icon, k) {
      var s = document.createElement('span');
      s.className = 'orbit-item';
      s.style.setProperty('--k', k);
      s.style.setProperty('--n', D.orbit.length);
      s.innerHTML = '<span class="orbit-icon">' + icon + '</span>';
      orbit.appendChild(s);
    });
    portrait.appendChild(orbit);
  }

  /* ---------- Reading focus on the CV: the entry in the middle of the screen stays sharp ---------- */
  if (has('focus') && document.querySelector('.cv-body') && !reduceMotion) {
    root.classList.add('reading-focus');
    var entries = Array.prototype.slice.call(document.querySelectorAll('.cv-section .entry'));
    var fTick = false;
    var focusNow = function () {
      fTick = false;
      var mid = window.innerHeight / 2;
      entries.forEach(function (el) {
        var r = el.getBoundingClientRect();
        var d = r.bottom < mid ? mid - r.bottom : r.top > mid ? r.top - mid : 0;
        el.style.setProperty('--rf', Math.max(0.42, 1 - d / (window.innerHeight * 0.55)).toFixed(3));
      });
    };
    window.addEventListener('scroll', function () { if (!fTick) { fTick = true; requestAnimationFrame(focusNow); } }, { passive: true });
    window.addEventListener('resize', focusNow);
    focusNow();
  }

  /* ---------- Greeting above the name, by the visitor's own clock ---------- */
  var head = document.querySelector('.intro-head');
  if (has('greeting') && head && D.greeting) {
    var hr = new Date().getHours();
    var key = hr >= 5 && hr < 12 ? 'morning' : hr >= 12 && hr < 17 ? 'afternoon' : hr >= 17 && hr < 22 ? 'evening' : 'night';
    var p = document.createElement('p');
    p.className = 'greeting';
    p.textContent = D.greeting[key] || '';
    if (p.textContent) head.insertBefore(p, head.firstChild);
  }

  /* ---------- Footer wave ---------- */
  var footer = document.querySelector('.site-footer');
  if (has('wave') && footer) {
    var wave = document.createElement('div');
    wave.className = 'footer-wave';
    wave.setAttribute('aria-hidden', 'true');
    wave.innerHTML = '<span class="fw-a"></span><span class="fw-b"></span>';
    footer.insertBefore(wave, footer.firstChild);
  }

  /* ---------- Drag the profile photo: it springs back when you let go ---------- */
  var photo = document.querySelector('.photo');
  if (has('drag') && photo && !reduceMotion) {
    var drag = null;
    photo.addEventListener('dragstart', function (e) { e.preventDefault(); });
    photo.addEventListener('pointerdown', function (e) {
      if (e.button !== 0 || (e.target.closest && e.target.closest('a, button'))) return;
      drag = { x: e.clientX, y: e.clientY, id: e.pointerId };
      photo.setPointerCapture(e.pointerId);
      photo.classList.add('is-dragging');
    });
    photo.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      photo.style.setProperty('--dx', dx + 'px');
      photo.style.setProperty('--dy', dy + 'px');
      photo.style.setProperty('--dr', Math.max(-18, Math.min(18, dx * 0.06)) + 'deg');
    });
    var drop = function () {
      if (!drag) return;
      drag = null;
      photo.classList.remove('is-dragging');
      photo.style.setProperty('--dx', '0px');
      photo.style.setProperty('--dy', '0px');
      photo.style.setProperty('--dr', '0deg');
    };
    photo.addEventListener('pointerup', drop);
    photo.addEventListener('pointercancel', drop);
  }
})();
