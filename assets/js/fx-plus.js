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
  // A simple silhouette of Gainesville: live oaks, campus buildings and Century Tower (windows light up at night)
  var SKYLINE = '<svg viewBox="0 0 1200 90" preserveAspectRatio="xMidYMax slice">' +
    '<g class="sk-trees">' +
      '<circle cx="60" cy="62" r="26"/><circle cx="92" cy="56" r="30"/><circle cx="128" cy="64" r="22"/>' +
      '<circle cx="330" cy="60" r="24"/><circle cx="362" cy="66" r="20"/>' +
      '<circle cx="880" cy="58" r="28"/><circle cx="916" cy="64" r="22"/>' +
      '<circle cx="1090" cy="60" r="26"/><circle cx="1124" cy="56" r="30"/><circle cx="1160" cy="64" r="24"/>' +
    '</g>' +
    '<g class="sk-build">' +
      '<path d="M170 90 V58 L200 44 L230 58 V90 Z"/><rect x="230" y="62" width="70" height="28"/>' +
      '<path d="M420 90 V60 H470 V52 L495 40 L520 52 V60 H570 V90 Z"/>' +
      '<rect x="700" y="58" width="90" height="32"/><path d="M790 90 V64 L815 54 L840 64 V90 Z"/>' +
      '<rect x="960" y="60" width="80" height="30"/>' +
      '<path d="M620 90 V30 H610 L632 4 L654 30 H644 V90 Z"/>' +
    '</g>' +
    '<g class="sk-win">' +
      '<rect x="182" y="66" width="6" height="8"/><rect x="200" y="66" width="6" height="8"/><rect x="246" y="70" width="6" height="7"/><rect x="270" y="70" width="6" height="7"/>' +
      '<rect x="436" y="68" width="6" height="8"/><rect x="458" y="68" width="6" height="8"/><rect x="490" y="56" width="10" height="10"/><rect x="530" y="68" width="6" height="8"/><rect x="552" y="68" width="6" height="8"/>' +
      '<rect x="714" y="66" width="6" height="8"/><rect x="740" y="66" width="6" height="8"/><rect x="766" y="66" width="6" height="8"/>' +
      '<rect x="976" y="68" width="6" height="7"/><rect x="1000" y="68" width="6" height="7"/><rect x="1022" y="68" width="6" height="7"/>' +
      '<circle class="sk-clock" cx="632" cy="40" r="5"/><rect x="628" y="54" width="8" height="10"/>' +
    '</g></svg>';


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

  /* ---------- Page transitions ----------
     Going to Travel: a hyperspace star warp. Going to the CV: a page turns like a book.
     Anywhere else: gator jaws snap shut and open again on the new page. */
  if (has('pagefx') && !reduceMotion) {
    var TEETH_DOWN = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='26'%3E%3Cpath d='M2 0 L22 26 L42 0 Z' fill='%23fbfaf6'/%3E%3C/svg%3E\")";
    var TEETH_UP = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='26'%3E%3Cpath d='M2 26 L22 0 L42 26 Z' fill='%23fbfaf6'/%3E%3C/svg%3E\")";
    var typeFor = function (path) { return /^\/travel\b/.test(path) ? 'warp' : /^\/cv\b/.test(path) ? 'book' : 'jaws'; };

    var build = function (type) {
      var o = document.createElement('div');
      o.className = 'pt pt-' + type;
      o.setAttribute('aria-hidden', 'true');
      if (type === 'jaws') {
        o.innerHTML = '<span class="pt-jaw pt-top"><i style="background-image:' + TEETH_DOWN.replace(/"/g, '&quot;') + '"></i></span>' +
                      '<span class="pt-jaw pt-bottom"><i style="background-image:' + TEETH_UP.replace(/"/g, '&quot;') + '"></i></span>';
      } else if (type === 'book') {
        o.innerHTML = '<span class="pt-page"><span class="pt-lines"></span></span>';
      } else {
        o.innerHTML = '<canvas class="pt-warp"></canvas>';
      }
      document.body.appendChild(o);
      return o;
    };

    // Hyperspace: stars stream out of the middle, faster and longer, then (on arrival) slow down
    var warp = function (o, out, ms, done) {
      var cv = o.querySelector('canvas'), x = cv.getContext('2d');
      var W = cv.width = innerWidth, H = cv.height = innerHeight, cx = W / 2, cy = H / 2;
      var stars = [];
      for (var i = 0; i < 260; i++) stars.push({ a: Math.random() * Math.PI * 2, r: Math.random() * Math.max(W, H) * 0.5, s: 0.4 + Math.random() });
      var t0 = performance.now();
      var step = function (now) {
        var t = Math.min(1, (now - t0) / ms), k = out ? t : 1 - t;                 // speed: up when leaving, down when arriving
        x.fillStyle = 'rgba(7,11,31,' + (out ? 0.25 + 0.75 * t * t : 1) + ')';
        x.fillRect(0, 0, W, H);
        x.lineCap = 'round';
        stars.forEach(function (st) {
          var v = (2 + 40 * k * k) * st.s;
          st.r += v;
          if (st.r > Math.max(W, H)) st.r = Math.random() * 40;
          var x1 = cx + Math.cos(st.a) * st.r, y1 = cy + Math.sin(st.a) * st.r;
          var len = 2 + 120 * k * k * st.s;
          x.strokeStyle = 'rgba(' + (200 + (st.s * 55 | 0)) + ',215,255,' + (0.5 + 0.5 * st.s) + ')';
          x.lineWidth = 1 + st.s;
          x.beginPath(); x.moveTo(x1, y1); x.lineTo(x1 - Math.cos(st.a) * len, y1 - Math.sin(st.a) * len); x.stroke();
        });
        if (t < 1) requestAnimationFrame(step); else done();
      };
      requestAnimationFrame(step);
    };

    // arriving: the cover opens
    if (root.classList.contains('pt-in')) {
      var type = root.getAttribute('data-pt') || 'jaws';
      sessionStorage.removeItem('ptType');
      var cover = build(type);
      cover.classList.add('is-closed');
      root.classList.remove('pt-in');
      root.removeAttribute('data-pt');
      var finish = function () { cover.classList.add('is-gone'); setTimeout(function () { cover.remove(); }, 450); };
      if (type === 'warp') {
        warp(cover, false, 750, finish);
      } else {
        requestAnimationFrame(function () { requestAnimationFrame(function () { cover.classList.remove('is-closed'); cover.classList.add('is-opening'); }); });
        setTimeout(function () { cover.remove(); }, type === 'book' ? 900 : 800);
      }
    }

    // leaving
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a || a.target === '_blank' || a.hasAttribute('download') || a.hasAttribute('data-photo')) return;
      var url = new URL(a.href, location.href);
      if (url.origin !== location.origin || /^(mailto|tel):/.test(a.href)) return;
      if (url.pathname === location.pathname) return;                     // same page (or just a #jump)
      if (/\.(pdf|jpg|jpeg|png|webp|zip)$/i.test(url.pathname)) return;
      e.preventDefault();
      var type = typeFor(url.pathname);
      try { sessionStorage.setItem('ptType', type); } catch (err) { /* ignore */ }
      var o = build(type);
      var go = function () { location.href = url.href; };
      if (type === 'warp') { warp(o, true, 700, go); }
      else {
        requestAnimationFrame(function () { requestAnimationFrame(function () { o.classList.add('is-closing'); }); });
        setTimeout(go, type === 'book' ? 650 : 560);
      }
    });
    window.addEventListener('pageshow', function (e) { if (e.persisted) each('.pt', function (n) { n.remove(); }); });
  }

  /* ---------- Header: hides while you scroll down, comes back when you scroll up ---------- */
  if (has('smarthead')) {
    var lastHY = window.scrollY, hideTick = false;
    window.addEventListener('scroll', function () {
      if (hideTick) return;
      hideTick = true;
      requestAnimationFrame(function () {
        hideTick = false;
        var y = window.scrollY, dy = y - lastHY;
        if (Math.abs(dy) < 6) return;
        root.classList.toggle('header-hidden', dy > 0 && y > 220 && !document.querySelector('dialog[open]'));
        lastHY = y;
      });
    }, { passive: true });
  }

  /* ---------- Header sky, fireflies, a crawling gator, and the logo blinking ---------- */
  var header = document.querySelector('.site-header');
  if (header) {
    var hour = new Date().getHours();                                       // the visitor's own clock
    var period = hour >= 5 && hour < 8 ? 'dawn' : hour >= 8 && hour < 17 ? 'day' : hour >= 17 && hour < 20 ? 'dusk' : 'night';
    var sky = (location.search.match(/[?&]sky=(dawn|day|dusk|night)\b/) || [])[1];
    if (sky) period = sky;
    root.setAttribute('data-period', period);
    if (has('headsky')) {
      var hs = document.createElement('span');
      hs.className = 'hdr-sky';
      hs.setAttribute('aria-hidden', 'true');
      header.insertBefore(hs, header.firstChild);
    }
    if (has('fireflies') && !reduceMotion) {
      var ff = document.createElement('span');
      ff.className = 'hdr-flies';
      ff.setAttribute('aria-hidden', 'true');
      for (var f = 0; f < 9; f++) {
        var b = document.createElement('i');
        b.style.left = (5 + Math.random() * 90).toFixed(1) + '%';
        b.style.top = (15 + Math.random() * 70).toFixed(1) + '%';
        b.style.animationDelay = (-Math.random() * 8).toFixed(2) + 's, ' + (-Math.random() * 3).toFixed(2) + 's';
        b.style.animationDuration = (6 + Math.random() * 6).toFixed(2) + 's, ' + (1.6 + Math.random() * 2).toFixed(2) + 's';
        ff.appendChild(b);
      }
      header.insertBefore(ff, header.firstChild);
    }
    if (has('headgator') && !reduceMotion) {
      var hg = document.createElement('span');
      hg.className = 'hdr-gator';
      hg.setAttribute('aria-hidden', 'true');
      hg.innerHTML = '<span>🐊</span>';
      header.appendChild(hg);
    }
    var logo = header.querySelector('.brand img');
    if (has('blink') && logo && !reduceMotion) {
      var blinkLater = function () {
        setTimeout(function () {
          if (!document.hidden && !isLite()) {
            var move = Math.random() < 0.7 ? 'is-blinking' : 'is-yawning';
            logo.classList.add(move);
            setTimeout(function () { logo.classList.remove(move); }, move === 'is-blinking' ? 520 : 1300);
          }
          blinkLater();
        }, 4000 + Math.random() * 6000);
      };
      blinkLater();
    }
  }

  /* ---------- Footer: Gainesville skyline, a swimming gator, and the season ---------- */
  var foot = document.querySelector('.site-footer');
  if (foot) {
    if (has('skyline')) {
      var sk = document.createElement('div');
      sk.className = 'footer-skyline';
      sk.setAttribute('aria-hidden', 'true');
      sk.innerHTML = SKYLINE;
      foot.insertBefore(sk, foot.firstChild);
    }
    if (has('swimmer') && !reduceMotion) {
      var sw = document.createElement('span');
      sw.className = 'footer-swimmer';
      sw.setAttribute('aria-hidden', 'true');
      sw.innerHTML = '<span>🐊</span>';
      foot.appendChild(sw);
    }
    if (has('seasons') && !reduceMotion) {
      var m = new Date().getMonth() + 1;                                   // the visitor's own calendar
      var season = (location.search.match(/[?&]season=(spring|summer|fall|winter)\b/) || [])[1] ||
        (m >= 3 && m <= 5 ? 'spring' : m >= 6 && m <= 8 ? 'summer' : m >= 9 && m <= 11 ? 'fall' : 'winter');
      var glyph = { spring: ['🌸', '🌸', '🌼'], summer: ['', '', ''], fall: ['🍂', '🍁', '🍂'], winter: ['❄️', '❄️', '✻'] }[season];
      var se = document.createElement('div');
      se.className = 'footer-season season-' + season;
      se.setAttribute('aria-hidden', 'true');
      for (var q = 0; q < 12; q++) {
        var it = document.createElement('i');
        it.textContent = glyph[q % 3];
        it.style.left = (q * 8.3 + Math.random() * 6).toFixed(1) + '%';
        it.style.animationDelay = (-Math.random() * 12).toFixed(2) + 's';
        it.style.animationDuration = (8 + Math.random() * 7).toFixed(2) + 's';
        se.appendChild(it);
      }
      foot.insertBefore(se, foot.firstChild);
    }
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
