/* Coffee and matcha: effects (switches in _config.yml → effects) and easter eggs (→ eggs).
   Previews: ?egg=morning, ?egg=matchatime, ?season=summer (ice cubes) */
(function () {
  'use strict';

  var root = document.documentElement;
  var fx = (root.getAttribute('data-fx') || '').split(/\s+/);
  var has = function (n) { return fx.indexOf(n) !== -1; };
  var D = {};
  try { D = JSON.parse((document.getElementById('egg-data') || {}).textContent || '{}') || {}; } catch (e) { D = {}; }
  var E = D.eggs || {};
  var on = function (k) { return E[k] && E[k].show !== false; };
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var isLite = function () { return root.classList.contains('lite'); };
  var preview = (location.search.match(/[?&]egg=([a-z]+)/) || [])[1] || '';
  var toast = function (t, ms) { if (window.siteToast) window.siteToast(t, ms); };
  var each = function (sel, fn) { Array.prototype.forEach.call(document.querySelectorAll(sel), fn); };
  var make = function (cls, html, parent) {
    var el = document.createElement('div');
    el.className = cls;
    el.setAttribute('aria-hidden', 'true');
    if (html) el.innerHTML = html;
    (parent || document.body).appendChild(el);
    return el;
  };
  var INTERACTIVE = 'a, button, input, textarea, select, label, dialog, summary, .map-wrap, .place-card, .ask-box, [data-tilt], .news-dot';

  /* ================= Effects ================= */

  /* Latte cursor: when the mouse stops after moving, a little latte-art heart is left behind */
  if (has('lattecursor') && finePointer && !reduceMotion) {
    var travelled = 0, last = null, stopTimer = null;
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      if (last) travelled += Math.hypot(e.clientX - last.x, e.clientY - last.y);
      last = { x: e.clientX, y: e.clientY };
      clearTimeout(stopTimer);
      stopTimer = setTimeout(function () {
        if (travelled < 160 || isLite()) { travelled = 0; return; }
        travelled = 0;
        var h = make('latte-heart', '<svg viewBox="0 0 40 36"><path d="M20 34 C6 24 2 16 2 10 A8.5 8.5 0 0 1 20 7 A8.5 8.5 0 0 1 38 10 C38 16 34 24 20 34 Z"/><path class="lh-swirl" d="M20 30 C14 22 12 16 15 11"/></svg>');
        h.style.left = last.x + 'px';
        h.style.top = last.y + 'px';
        setTimeout(function () { h.remove(); }, 2200);
      }, 450);
    }, { passive: true });
  }

  /* Matcha powder: clicking an empty spot sprinkles a little matcha */
  if (has('matchaclick') && !reduceMotion) {
    document.addEventListener('click', function (e) {
      if (isLite() || (e.target.closest && e.target.closest(INTERACTIVE))) return;
      if (window.getSelection && String(window.getSelection()).length) return;
      for (var i = 0; i < 16; i++) {
        var p = make('matcha-dust');
        p.style.left = (e.clientX + (Math.random() - 0.5) * 18) + 'px';
        p.style.top = (e.clientY + (Math.random() - 0.5) * 10) + 'px';
        p.style.setProperty('--dx', ((Math.random() - 0.5) * 50).toFixed(0) + 'px');
        p.style.setProperty('--dy', (40 + Math.random() * 60).toFixed(0) + 'px');
        p.style.setProperty('--s', (0.6 + Math.random() * 0.9).toFixed(2));
        p.style.animationDelay = (Math.random() * 120).toFixed(0) + 'ms';
        setTimeout(function (n) { return function () { n.remove(); }; }(p), 1500);
      }
    });
  }

  /* Coffee-cup reading progress: the back-to-top button fills with coffee as you read */
  var toTop = document.querySelector('.to-top');
  if (has('cupprogress') && toTop) {
    toTop.classList.add('is-cup');
    toTop.insertAdjacentHTML('afterbegin',
      '<svg class="cup-svg" viewBox="0 0 32 32" aria-hidden="true">' +
        '<defs><clipPath id="cup-in"><path d="M7 11 H22 V19 A6 6 0 0 1 16 25 H13 A6 6 0 0 1 7 19 Z"/></clipPath></defs>' +
        '<rect class="cup-fill" x="6" y="25" width="17" height="15" clip-path="url(#cup-in)"/>' +
        '<path class="cup-line" d="M7 11 H22 V19 A6 6 0 0 1 16 25 H13 A6 6 0 0 1 7 19 Z M22 13 H24 A3 3 0 0 1 24 19 H22"/>' +
        '<path class="cup-steam" d="M12 8 C11 6.5 13 5.5 12 4 M16.5 8 C15.5 6.5 17.5 5.5 16.5 4"/>' +
      '</svg>');
    var fill = toTop.querySelector('.cup-fill'), cupTick = false;
    var pour = function () {
      cupTick = false;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      fill.setAttribute('y', (25 - 14 * p).toFixed(2));                   // the cup's inside runs from y=25 up to y=11
      toTop.classList.toggle('is-full', p > 0.97);
    };
    window.addEventListener('scroll', function () { if (!cupTick) { cupTick = true; requestAnimationFrame(pour); } }, { passive: true });
    pour();
  }

  /* Drip loading: while a photo loads, espresso drips into a little cup */
  if (has('drip') && !reduceMotion) {
    var SEL = '.photo img, .place-media img, .polaroid img, .media-grid img, .pw-item img';
    var drip = function (img) {
      if (img.dataset.dripDone) return;
      img.dataset.dripDone = '1';
      if (img.complete && img.naturalWidth) return;
      var box = img.parentElement;
      if (!box) return;
      if (getComputedStyle(box).position === 'static') box.style.position = 'relative';
      var d = make('drip-loader', '<span class="dl-drop"></span><span class="dl-cup"></span>', box);
      var done = function () { d.classList.add('is-done'); setTimeout(function () { d.remove(); }, 400); };
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true });
    };
    each(SEL, drip);
    if ('MutationObserver' in window) {
      new MutationObserver(function (list) {
        list.forEach(function (m) {
          Array.prototype.forEach.call(m.addedNodes, function (n) {
            if (n.nodeType !== 1) return;
            if (n.matches && n.matches(SEL)) drip(n);
            if (n.querySelectorAll) Array.prototype.forEach.call(n.querySelectorAll(SEL), drip);
          });
        });
      }).observe(document.body, { childList: true, subtree: true });
    }
  }

  /* Steam: point at a title and a few wisps of steam rise from it */
  if (has('steam') && !reduceMotion) {
    each('.section-title, .cv-section > h2', function (h) {
      h.addEventListener('mouseenter', function () {
        if (isLite() || h.querySelector('.steam')) return;
        var s = document.createElement('span');
        s.className = 'steam';
        s.setAttribute('aria-hidden', 'true');
        s.innerHTML = '<i></i><i></i><i></i>';
        h.appendChild(s);
        setTimeout(function () { s.remove(); }, 2200);
      });
    });
  }

  /* Coffee stains on the CV "paper", which wobble a little when the mouse comes close */
  var cvBody = document.querySelector('.cv-body');
  if (has('stains') && cvBody) {
    var spots = [{ x: '-6%', y: '9%', r: 58 }, { x: '94%', y: '38%', r: 46 }, { x: '-4%', y: '71%', r: 40 }];
    var stains = spots.map(function (sp) {
      var st = make('coffee-stain', '', cvBody);
      st.style.left = sp.x; st.style.top = sp.y;
      st.style.width = st.style.height = (sp.r * 2) + 'px';
      return st;
    });
    if (finePointer && !reduceMotion) {
      window.addEventListener('pointermove', function (e) {
        stains.forEach(function (st) {
          var b = st.getBoundingClientRect(), d = Math.hypot(e.clientX - (b.left + b.width / 2), e.clientY - (b.top + b.height / 2));
          st.classList.toggle('is-wobbling', d < b.width);
        });
      }, { passive: true });
    }
  }

  /* Ice cubes floating in the header in summer; bump one with the mouse and it clinks away */
  var month = new Date().getMonth() + 1;
  var summer = /[?&]season=summer\b/.test(location.search) || (month >= 6 && month <= 8 && !/[?&]season=/.test(location.search));
  var headerEl = document.querySelector('.site-header');
  if (has('ice') && summer && headerEl && !reduceMotion) {
    var ice = make('ice-tray', '<i>🧊</i><i>🧊</i><i>🧊</i>', headerEl);
    Array.prototype.forEach.call(ice.children, function (cube, k) {
      cube.style.left = (22 + k * 22 + Math.random() * 8) + '%';
      cube.addEventListener('mouseenter', function () {
        cube.classList.remove('is-bumped'); void cube.offsetWidth;
        cube.style.setProperty('--bx', ((Math.random() < 0.5 ? -1 : 1) * (30 + Math.random() * 40)).toFixed(0) + 'px');
        cube.classList.add('is-bumped');
      });
    });
  }

  /* Latte signature: point at the big name and a tulip is poured underneath it */
  var nameEl = document.querySelector('.display-name');
  if (has('lattesign') && nameEl && !reduceMotion) {
    var sign = document.createElement('span');
    sign.className = 'latte-sign';
    sign.setAttribute('aria-hidden', 'true');
    sign.innerHTML = '<svg viewBox="0 0 120 60"><path d="M60 56 V36 M60 36 C44 36 38 28 44 22 C50 16 60 22 60 28 C60 22 70 16 76 22 C82 28 76 36 60 36 Z M60 24 C50 24 46 18 50 13 C54 9 60 13 60 17 C60 13 66 9 70 13 C74 18 70 24 60 24 Z M60 14 C54 14 52 10 54 7 C56 4 60 6 60 8 C60 6 64 4 66 7 C68 10 66 14 60 14 Z"/></svg>';
    nameEl.parentNode.insertBefore(sign, nameEl.nextSibling);
    nameEl.addEventListener('mouseenter', function () {
      sign.classList.remove('is-pouring'); void sign.offsetWidth;
      sign.classList.add('is-pouring');
    });
  }

  /* Coffee thermometer in the footer: your coffee slowly cools while you stay */
  var footerLeft = document.querySelector('.footer-left');
  if (has('thermo') && footerLeft) {
    var unitC = ((document.querySelector('.local-now') || {}).getAttribute ? (document.querySelector('.local-now').getAttribute('data-unit') || 'F') : 'F').toUpperCase() === 'C';
    var th = document.createElement('span');
    th.className = 'coffee-temp';
    th.title = 'Your coffee';
    footerLeft.appendChild(th);
    var startF = 165, warned = false, t0 = Date.now();
    var showTemp = function () {
      var mins = (Date.now() - t0) / 60000;
      var f = Math.max(72, startF - mins * 9);                                   // cools about 9 °F a minute
      var shown = unitC ? Math.round((f - 32) * 5 / 9) + '°C' : Math.round(f) + '°F';
      th.textContent = '☕ ' + shown;
      th.classList.toggle('is-cold', f < 110);
      if (f < 110 && !warned) { warned = true; toast('Your coffee is getting cold ☕', 3500); }
    };
    showTemp();
    setInterval(showTemp, 10000);
  }

  /* ================= Easter eggs ================= */

  // Typed words: coffee, matcha, latte, espresso, boba, "dirty matcha", and "tea" on the 404 page
  var words = {};
  var add = function (key, fallback, fn) { if (on(key)) words[String(E[key].word || fallback).toLowerCase()] = fn; };
  add('coffee', 'coffee', function () { cupScene('coffee', E.coffee.text); });
  add('matcha', 'matcha', matchaScene);
  add('latte', 'latte', latteHeart);
  add('espresso', 'espresso', espresso);
  add('boba', 'boba', boba);
  add('dirty_matcha', 'dirty matcha', function () { cupScene('dirty', E.dirty_matcha.text); });
  if (document.querySelector('.not-found')) add('teapot', 'tea', teapot);
  var typed = '';
  window.addEventListener('keydown', function (e) {
    if (!e.key || e.key.length !== 1 || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    // the space in "dirty matcha" shouldn't scroll the page
    if (e.key === ' ' && Object.keys(words).some(function (w) { var i = w.indexOf(' '); return i > 0 && typed.slice(-i) === w.slice(0, i); })) e.preventDefault();
    typed = (typed + e.key.toLowerCase()).slice(-16);
    Object.keys(words).sort(function (a, b) { return b.length - a.length; }).some(function (w) {
      if (typed.slice(-w.length) !== w) return false;
      typed = '';
      // "dirty matcha" ends with "matcha": the longer word wins because it's checked first
      words[w]();
      return true;
    });
  });

  // A cup in the middle of the screen fills up (coffee, or matcha + milk + espresso layers)
  function cupScene(kind, text) {
    if (document.querySelector('.egg-cup')) return;
    var c = make('egg-cup egg-cup-' + kind,
      '<div class="ecp-cup"><span class="ecp-l l1"></span><span class="ecp-l l2"></span><span class="ecp-l l3"></span><span class="ecp-handle"></span>' +
      '<span class="ecp-steam"><i></i><i></i><i></i></span></div><p class="ecp-text"></p>');
    c.querySelector('.ecp-text').textContent = text || '';
    requestAnimationFrame(function () { requestAnimationFrame(function () { c.classList.add('is-on'); }); });
    setTimeout(function () { c.classList.add('is-out'); setTimeout(function () { c.remove(); }, 500); }, 3600);
  }

  // matcha: a whisk froths a bowl, and the site turns matcha green for a while
  function matchaScene() {
    if (document.querySelector('.egg-matcha')) return;
    var m = make('egg-matcha', '<div class="em-bowl"><span class="em-tea"></span><span class="em-whisk">🍵</span></div><p class="ecp-text"></p>');
    m.querySelector('.ecp-text').textContent = E.matcha.text || '';
    requestAnimationFrame(function () { requestAnimationFrame(function () { m.classList.add('is-on'); }); });
    setTimeout(function () { m.classList.add('is-out'); setTimeout(function () { m.remove(); }, 500); }, 3200);
    var before = root.getAttribute('data-theme');
    if (before !== 'matcha') {
      root.setAttribute('data-theme', 'matcha');
      window.dispatchEvent(new CustomEvent('themechange', { detail: 'matcha' }));
      setTimeout(function () {
        if (root.getAttribute('data-theme') === 'matcha') {
          root.setAttribute('data-theme', before);
          window.dispatchEvent(new CustomEvent('themechange', { detail: before }));
        }
      }, 10000);
    }
  }

  // latte: a big latte-art heart blooms, then melts away
  function latteHeart() {
    if (document.querySelector('.egg-latte')) return;
    var l = make('egg-latte', '<svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="92" class="el-coffee"/>' +
      '<path class="el-heart" d="M100 160 C55 128 42 100 42 80 A28 28 0 0 1 100 70 A28 28 0 0 1 158 80 C158 100 145 128 100 160 Z"/>' +
      '<path class="el-line" d="M100 165 C100 120 92 90 100 62"/></svg>');
    setTimeout(function () { l.remove(); }, 3600);
  }

  // espresso: every animation on the page runs twice as fast for ten seconds
  function espresso() {
    toast(E.espresso.text || '', 3000);
    root.classList.add('caffeinated');
    var bump = function (rate) { if (document.getAnimations) document.getAnimations().forEach(function (a) { try { a.playbackRate = rate; } catch (e) { /* ignore */ } }); };
    bump(2);
    var keep = setInterval(function () { bump(2); }, 1000);                    // catch animations that start meanwhile
    setTimeout(function () { clearInterval(keep); bump(1); root.classList.remove('caffeinated'); }, 10000);
  }

  // boba: tapioca pearls rain down and bounce at the bottom of the screen
  function boba() {
    if (reduceMotion) return;
    for (var i = 0; i < 28; i++) {
      var b = make('boba-pearl');
      b.style.left = (3 + Math.random() * 94) + '%';
      b.style.animationDelay = (Math.random() * 900).toFixed(0) + 'ms';
      b.style.setProperty('--sz', (12 + Math.random() * 8).toFixed(0) + 'px');
      setTimeout(function (n) { return function () { n.remove(); }; }(b), 3600);
    }
  }

  // tea on the 404 page: HTTP 418
  function teapot() {
    var nf = document.querySelector('.not-found');
    var h = nf && nf.querySelector('h1');
    if (!h || nf.classList.contains('is-teapot')) return;
    nf.classList.add('is-teapot');
    h.textContent = E.teapot.title || "418 I'm a teapot";
    var p = document.createElement('p');
    p.className = 'teapot-note';
    p.innerHTML = '<span class="teapot-pot" aria-hidden="true">🫖</span> <span></span>';
    p.querySelector('span:last-child').textContent = E.teapot.text || '';
    h.parentNode.insertBefore(p, h.nextSibling);
  }

  // Morning coffee and matcha o'clock, by the visitor's own clock (once per visit)
  var once = function (key) { try { if (sessionStorage.getItem(key)) return false; sessionStorage.setItem(key, '1'); } catch (e) { /* ignore */ } return true; };
  var hour = new Date().getHours();
  if (on('morning_coffee') && ((hour >= Number(E.morning_coffee.from || 7) && hour < Number(E.morning_coffee.to || 9) && once('morningShown')) || preview === 'morning')) {
    setTimeout(function () {
      var b = make('egg-critter egg-barista', '<span class="ec-emoji">🐊☕</span><span class="ec-bubble"></span><button type="button" class="ec-close" aria-label="Close">&times;</button>');
      b.removeAttribute('aria-hidden');
      b.setAttribute('role', 'status');
      b.querySelector('.ec-bubble').textContent = E.morning_coffee.text || '';
      var close = function () { b.classList.remove('is-shown'); setTimeout(function () { b.remove(); }, 500); };
      b.querySelector('.ec-close').addEventListener('click', close);
      requestAnimationFrame(function () { requestAnimationFrame(function () { b.classList.add('is-shown'); }); });
      setTimeout(close, 10000);
    }, 2000);
  }
  if (on('matcha_oclock') && ((hour === Number(E.matcha_oclock.hour || 15) && once('matchaShown')) || preview === 'matchatime')) {
    setTimeout(function () { toast(E.matcha_oclock.text || '', 4000); }, 2500);
  }

  // Shift + click the header gator: it puts on an apron and hands you a coffee
  if (on('barista')) {
    var brand = document.querySelector('.brand');
    if (brand) brand.addEventListener('click', function (e) {
      if (!e.shiftKey) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (brand.querySelector('.barista')) return;
      var s = document.createElement('span');
      s.className = 'barista';
      s.setAttribute('role', 'status');
      s.innerHTML = '<span class="ba-gator" aria-hidden="true">🐊</span><span class="ba-apron" aria-hidden="true">🎽</span><span class="ba-cup" aria-hidden="true">☕</span><span class="ba-text"></span>';
      s.querySelector('.ba-text').textContent = E.barista.text || '';
      brand.appendChild(s);
      setTimeout(function () { s.remove(); }, 3600);
    }, true);
  }
})();
