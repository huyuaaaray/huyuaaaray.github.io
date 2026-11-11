/* Site-wide effects: scroll reveal, photo tilt and parallax, rotating roles,
   magnetic icons, card spotlight, count-up numbers, CV progress bar,
   and a Gators easter egg. Everything here is optional polish; the site
   works without it. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var root = document.documentElement;
  var fx = (root.getAttribute('data-fx') || '').split(/\s+/);
  var has = function (name) { return fx.indexOf(name) !== -1; };

  /* ---------- "Reduce animations" button ----------
     Lite mode only switches off the heaviest effects (background network, starfield,
     cursor tail and spotlight, globe spin and planes, holiday particles, floating orbs).
     Each of those scripts listens for the "litechange" event. */
  var motionBtn = document.querySelector('.motion-toggle');
  function syncMotionBtn() {
    if (motionBtn) motionBtn.setAttribute('aria-pressed', root.classList.contains('lite') ? 'true' : 'false');
  }
  syncMotionBtn();
  if (motionBtn) {
    motionBtn.addEventListener('click', function () {
      var lite = !root.classList.contains('lite');
      root.classList.toggle('lite', lite);
      try { localStorage.setItem('lite', lite ? '1' : '0'); } catch (e) { /* storage blocked */ }
      syncMotionBtn();
      window.dispatchEvent(new CustomEvent('litechange', { detail: lite }));
    });
  }

  /* ---------- Light / dark: header button, browser bar color, following the system ---------- */
  var THEME_BG = { light: '#f6f5f8', dark: '#0e1320', latte: '#f4ece2', matcha: '#eef3e6' };
  function syncThemeColor() {
    if (root.classList.contains('theme-night')) return;
    var c = THEME_BG[root.getAttribute('data-theme')] || THEME_BG.light;
    Array.prototype.forEach.call(document.querySelectorAll('meta[name="theme-color"]'), function (m) {
      m.removeAttribute('media');
      m.setAttribute('content', c);
    });
  }
  // The theme button shows the theme it will switch to next
  function syncNext() {
    var btn = document.querySelector('.theme-toggle');
    if (!btn) return;
    var order = (btn.getAttribute('data-themes') || 'light dark').split(/\s+/);
    btn.setAttribute('data-next', order[(order.indexOf(root.getAttribute('data-theme')) + 1) % order.length] || 'light');
  }
  function applyTheme(t, remember) {
    root.setAttribute('data-theme', t);
    syncNext();
    if (remember) { try { localStorage.setItem('theme', t); } catch (e) { /* storage blocked */ } }
    syncThemeColor();
    window.dispatchEvent(new CustomEvent('themechange', { detail: t }));
  }
  syncThemeColor();
  syncNext();

  // Follow the system setting live, unless the visitor picked a theme themselves.
  var systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
  if (systemDark && systemDark.addEventListener) {
    systemDark.addEventListener('change', function (e) {
      var saved = null;
      try { saved = localStorage.getItem('theme'); } catch (err) { /* ignore */ }
      if (saved !== 'light' && saved !== 'dark') applyTheme(e.matches ? 'dark' : 'light', false);
    });
  }

  var themeBtn = document.querySelector('.theme-toggle');
  var currentVT = null, wanted = null;
  function toggleTheme(cx, cy) {
    // light → dark → latte → matcha → light (latte and matcha only if switched on).
    // Count from the theme the last click asked for, which may not be painted yet.
    var order = (themeBtn.getAttribute('data-themes') || 'light dark').split(/\s+/);
    var next = order[(order.indexOf(wanted || root.getAttribute('data-theme')) + 1) % order.length] || 'light';
    wanted = next;
    if (!document.startViewTransition || reduceMotion) { applyTheme(next, true); wanted = null; return; }
    // A switch that is still running finishes at once, so every click gets its own circle.
    if (currentVT) { try { currentVT.skipTransition(); } catch (e) { /* ignore */ } }
    // The new colors spread out in a circle from where you clicked.
    var b = themeBtn.getBoundingClientRect();
    var x = cx || (b.left + b.width / 2), y = cy || (b.top + b.height / 2);
    var radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    root.classList.add('theme-switching');
    var vt = currentVT = document.startViewTransition(function () { applyTheme(next, true); });
    vt.ready.then(function () {
      root.animate(
        { clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + radius + 'px at ' + x + 'px ' + y + 'px)'] },
        { duration: 480, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)', pseudoElement: '::view-transition-new(root)' }
      );
    }).catch(function () { /* skipped */ });
    var done = function () { if (currentVT === vt) { currentVT = null; wanted = null; root.classList.remove('theme-switching'); } };
    vt.finished.then(done, done);
  }
  if (themeBtn) {
    themeBtn.addEventListener('click', function (e) { toggleTheme(e.clientX, e.clientY); });
    // While a switch is running the page is covered by its snapshot, so a click lands on <html>
    // instead of the button. Pass it on to the button, so quick clicks are never lost.
    document.addEventListener('click', function (e) {
      if (!currentVT || themeBtn.contains(e.target)) return;
      var b = themeBtn.getBoundingClientRect();
      if (e.clientX >= b.left && e.clientX <= b.right && e.clientY >= b.top && e.clientY <= b.bottom) {
        themeBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: e.clientX, clientY: e.clientY }));
      }
    }, true);
  }

  /* ---------- Scroll reveal ---------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));

  // Children of a [data-reveal-stagger] list come in one after another.
  Array.prototype.forEach.call(document.querySelectorAll('[data-reveal-stagger]'), function (list) {
    var items = list.querySelectorAll(':scope > [data-reveal]');
    Array.prototype.forEach.call(items, function (el, i) {
      el.style.setProperty('--reveal-delay', Math.min(i, 8) * 70 + 'ms');
    });
  });

  function showAll() {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  if (reduceMotion || !('IntersectionObserver' in window)) {
    showAll();
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
    // Safety net: never leave content hidden.
    setTimeout(showAll, 4000);
  }

  /* ---------- Photo 3D tilt + glare ---------- */
  if (finePointer && !reduceMotion) {
    Array.prototype.forEach.call(document.querySelectorAll('[data-tilt]'), function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width;
        var y = (e.clientY - r.top) / r.height;
        el.style.setProperty('--rx', ((0.5 - y) * 14).toFixed(2) + 'deg');
        el.style.setProperty('--ry', ((x - 0.5) * 16).toFixed(2) + 'deg');
        el.style.setProperty('--gx', (x * 100).toFixed(1) + '%');
        el.style.setProperty('--gy', (y * 100).toFixed(1) + '%');
        el.classList.add('is-tilting');
      });
      el.addEventListener('pointerleave', function () {
        el.classList.remove('is-tilting');
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
      });
    });
  }

  /* ---------- Count-up numbers ---------- */
  var counters = Array.prototype.slice.call(document.querySelectorAll('[data-count]'));
  if (counters.length && !reduceMotion && 'IntersectionObserver' in window) {
    var countUp = function (el) {
      var target = parseInt(el.getAttribute('data-count'), 10) || 0;
      var start = null;
      var duration = 900 + Math.min(target, 50) * 12;
      var tick = function (now) {
        if (start === null) start = now;
        var t = Math.min((now - start) / duration, 1);
        var eased = 1 - Math.pow(1 - t, 3);
        el.textContent = String(Math.round(target * eased));
        if (t < 1) requestAnimationFrame(tick);
      };
      el.textContent = '0';
      requestAnimationFrame(tick);
    };
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          countUp(entry.target);
          cio.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { cio.observe(el); });
  }
  /* ---------- Rotating roles under the name (typewriter) ---------- */
  var rolesEl = document.querySelector('[data-roles]');
  if (rolesEl && !reduceMotion) {
    var roles = [];
    try { roles = JSON.parse(rolesEl.getAttribute('data-roles')) || []; } catch (e) { roles = []; }
    if (roles.length > 1) {
      var r = 0, chars = roles[0].length, deleting = true;
      var typeStep = function () {
        var delay;
        if (deleting) {
          chars--;
          delay = 45;
          if (chars <= 0) { deleting = false; r = (r + 1) % roles.length; delay = 350; }
        } else {
          chars++;
          delay = 85;
          if (chars >= roles[r].length) { deleting = true; delay = 2200; }
        }
        rolesEl.textContent = roles[r].slice(0, Math.max(chars, 0)) || '\u200b';
        setTimeout(typeStep, delay);
      };
      setTimeout(typeStep, 2600);
    }
  }

  /* ---------- Research banner: type the sentence once when it scrolls into view ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('[data-type-once]'), function (el) {
    if (reduceMotion || !('IntersectionObserver' in window)) return;
    var full = el.getAttribute('data-type-once') || '';
    var banner = el.closest('.research-banner');
    el.textContent = '\u200b';
    var started = false;
    var io2 = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting || started) return;
      started = true;
      io2.disconnect();
      var i = 0;
      var step = function () {
        i++;
        el.textContent = full.slice(0, i);
        if (i < full.length) {
          var ch = full.charAt(i - 1);
          setTimeout(step, /[,.:;]/.test(ch) ? 260 : 26 + Math.random() * 30);
        } else if (banner) {
          banner.classList.add('is-typed');
        }
      };
      setTimeout(step, 500);
    }, { threshold: 0.5 });
    io2.observe(el);
  });

  /* ---------- Name decode: the big "Yu Hu" resolves out of scrambled characters ---------- */
  var nameEl = document.querySelector('.display-name');
  var repelOn = !!(nameEl && has('repel') && finePointer && !reduceMotion);
  var decodeName = function () {};
  if (nameEl && has('decode') && !reduceMotion) {
    var nameText = nameEl.textContent.trim();
    var GLYPHS = 'ABCDEFGHIJKLNOPQRSTUVXYZabcdefghijklnopqrstuvxyz0123456789#$+=<>/';
    var decoding = false;
    nameEl.setAttribute('aria-label', nameText);
    decodeName = function () {
      if (decoding) return;
      decoding = true;
      // Wrap each letter and lock its width so scrambling never shifts the layout.
      nameEl.textContent = '';
      var spans = nameText.split('').map(function (ch) {
        var sp = document.createElement('span');
        sp.className = 'dc';
        sp.setAttribute('aria-hidden', 'true');
        sp.textContent = ch;
        nameEl.appendChild(sp);
        return sp;
      });
      spans.forEach(function (sp) { sp.style.width = sp.getBoundingClientRect().width + 'px'; });
      var start = performance.now();
      var settle = spans.map(function (sp, i) { return 250 + i * 130 + Math.random() * 160; });
      var lastSwap = 0;
      var tick = function (now) {
        var t = now - start, busy = false, swap = now - lastSwap > 55;
        if (swap) lastSwap = now;
        spans.forEach(function (sp, i) {
          var ch = nameText.charAt(i);
          if (ch === ' ') return;
          if (t < settle[i]) {
            busy = true;
            sp.classList.add('is-scrambling');
            if (swap) sp.textContent = GLYPHS.charAt((Math.random() * GLYPHS.length) | 0);
          } else if (sp.classList.contains('is-scrambling')) {
            sp.classList.remove('is-scrambling');
            sp.classList.add('is-fresh');
            sp.textContent = ch;
            setTimeout(function () { sp.classList.remove('is-fresh'); }, 260);
          }
        });
        if (busy) { requestAnimationFrame(tick); return; }
        // Done: put the plain text back so the letters kern normally again
        // (unless the letters need to stay separate for the "repel" effect).
        setTimeout(function () {
          if (!repelOn) nameEl.textContent = nameText;
          decoding = false;
        }, 700);
      };
      requestAnimationFrame(tick);
    };
    if (document.documentElement.classList.contains('intro')) {
      window.addEventListener('introdone', function () { setTimeout(decodeName, 150); }, { once: true });
    } else {
      setTimeout(decodeName, 350);
    }
    var lastHover = 0;
    if (!repelOn) nameEl.addEventListener('mouseenter', function () {
      if (performance.now() - lastHover > 2500) { lastHover = performance.now(); decodeName(); }
    });
  }

  /* ---------- About: words light up one by one as you scroll ---------- */
  var aboutProse = document.querySelector('.intro-about .prose');
  if (aboutProse && has('highlight') && !reduceMotion) {
    var words = [];
    var walker = document.createTreeWalker(aboutProse, NodeFilter.SHOW_TEXT, null);
    var textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    textNodes.forEach(function (node) {
      if (!node.nodeValue.trim()) return;
      var frag = document.createDocumentFragment();
      node.nodeValue.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
        var w = document.createElement('span');
        w.className = 'w';
        w.textContent = part;
        frag.appendChild(w);
        words.push(w);
      });
      node.parentNode.replaceChild(frag, node);
    });
    aboutProse.classList.add('is-highlighting');
    var litCount = -1;
    var updateWords = function () {
      var r = aboutProse.getBoundingClientRect();
      var line = window.innerHeight * 0.66;                       // the "reading line"
      var p = (line - r.top) / Math.max(r.height, 1);
      var atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      var n = atBottom ? words.length : Math.round(Math.max(0, Math.min(1, p)) * words.length);
      if (n === litCount) return;
      for (var k = 0; k < words.length; k++) words[k].classList.toggle('is-lit', k < n);
      litCount = n;
    };
    var wordTick = false;
    window.addEventListener('scroll', function () {
      if (!wordTick) { wordTick = true; requestAnimationFrame(function () { wordTick = false; updateWords(); }); }
    }, { passive: true });
    window.addEventListener('resize', updateWords);
    updateWords();
  }

  /* ---------- Photo: click to flip it over ---------- */
  var flipPhoto = document.querySelector('.photo-flippable');
  if (flipPhoto) {
    var front = flipPhoto.querySelector('.photo-front');
    var back = flipPhoto.querySelector('.photo-back');
    var setFlipped = function (on) {
      flipPhoto.classList.toggle('is-flipped', on);
      if (on) { front.setAttribute('inert', ''); back.removeAttribute('inert'); }
      else { back.setAttribute('inert', ''); front.removeAttribute('inert'); }
      var target = on ? back.querySelector('.pb-flip') : front;
      if (target && document.activeElement && flipPhoto.contains(document.activeElement)) {
        setTimeout(function () { target.focus({ preventScroll: true }); }, 60);
      }
    };
    front.addEventListener('click', function () { setFlipped(true); });
    back.addEventListener('click', function (e) {
      if (e.target.closest('a')) return;      // the email button works normally
      setFlipped(false);
    });
  }

  /* ---------- Magnetic icons (and News items, which are big, so they move less) ---------- */
  if (finePointer && !reduceMotion) {
    var magnets = Array.prototype.slice.call(document.querySelectorAll('.icon-btn'));
    if (has('magnet')) magnets = magnets.concat(Array.prototype.slice.call(document.querySelectorAll('.news li')));
    magnets.forEach(function (btn) {
      var big = btn.tagName === 'LI';
      var pull = big ? 0.06 : 0.35, cap = big ? 10 : 99;
      btn.addEventListener('pointermove', function (e) {
        var b = btn.getBoundingClientRect();
        var dx = e.clientX - (b.left + b.width / 2);
        var dy = e.clientY - (b.top + b.height / 2);
        btn.classList.add('is-magnet');
        btn.style.setProperty('--mx', Math.max(-cap, Math.min(cap, dx * pull)).toFixed(1) + 'px');
        btn.style.setProperty('--my', Math.max(-cap, Math.min(cap, dy * pull * (big ? 2 : 1))).toFixed(1) + 'px');
      });
      btn.addEventListener('pointerleave', function () {
        btn.classList.remove('is-magnet');
        btn.style.setProperty('--mx', '0px');
        btn.style.setProperty('--my', '0px');
      });
    });
  }

  /* ---------- News: "More" shows the older items ---------- */
  var moreBtn = document.querySelector('.news-more');
  if (moreBtn) {
    var extras = Array.prototype.slice.call(document.querySelectorAll('.news-extra'));
    var label = moreBtn.querySelector('.news-more-text');
    var count = moreBtn.querySelector('.news-more-count');
    moreBtn.addEventListener('click', function () {
      var open = moreBtn.getAttribute('aria-expanded') !== 'true';
      moreBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      label.textContent = moreBtn.getAttribute(open ? 'data-less' : 'data-more');
      if (count) count.hidden = open;
      extras.forEach(function (li, k) {
        if (open) {
          li.hidden = false;
          li.classList.remove('is-visible');
          li.style.setProperty('--reveal-delay', (k * 70) + 'ms');
          requestAnimationFrame(function () { requestAnimationFrame(function () { li.classList.add('is-visible'); }); });
        } else {
          li.hidden = true;
        }
      });
      if (!open) {
        var top = document.getElementById('news-title');
        if (top && top.getBoundingClientRect().top < 0) top.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      }
    });
  }

  /* ---------- Big name: letters are pushed away by the mouse, then spring back ---------- */
  if (repelOn) {
    var nameLetters = function () {
      var spans = nameEl.querySelectorAll('.dc');
      if (spans.length) return spans;
      // not decoded yet (or decode is off): wrap the letters now
      var txt = nameEl.textContent.trim();
      nameEl.setAttribute('aria-label', txt);
      nameEl.textContent = '';
      txt.split('').forEach(function (ch) {
        var sp = document.createElement('span');
        sp.className = 'dc';
        sp.setAttribute('aria-hidden', 'true');
        sp.textContent = ch;
        nameEl.appendChild(sp);
      });
      return nameEl.querySelectorAll('.dc');
    };
    var mouse = { x: -9999, y: -9999 };
    var offsets = [];
    var running = false;
    var RADIUS = 170, PUSH = 34;
    var step = function () {
      var spans = nameLetters();
      var moving = false;
      Array.prototype.forEach.call(spans, function (sp, i) {
        var o = offsets[i] || (offsets[i] = { x: 0, y: 0, r: 0 });
        var b = sp.getBoundingClientRect();
        // measure from the letter's resting place, not where it has been pushed to
        var cx = b.left + b.width / 2 - o.x, cy = b.top + b.height / 2 - o.y;
        var dx = cx - mouse.x, dy = cy - mouse.y;
        var d = Math.sqrt(dx * dx + dy * dy) || 1;
        var f = d < RADIUS ? Math.pow(1 - d / RADIUS, 2) : 0;
        var tx = (dx / d) * PUSH * f, ty = (dy / d) * PUSH * f, tr = (dx / d) * 14 * f;
        o.x += (tx - o.x) * 0.18;
        o.y += (ty - o.y) * 0.18;
        o.r += (tr - o.r) * 0.18;
        if (Math.abs(o.x - tx) > 0.1 || Math.abs(o.y - ty) > 0.1 || Math.abs(o.x) > 0.1 || Math.abs(o.y) > 0.1) moving = true;
        sp.style.setProperty('--rx', o.x.toFixed(2) + 'px');
        sp.style.setProperty('--ry', o.y.toFixed(2) + 'px');
        sp.style.setProperty('--rr', o.r.toFixed(2) + 'deg');
      });
      if (moving) requestAnimationFrame(step); else running = false;
    };
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      mouse.x = e.clientX; mouse.y = e.clientY;
      var b = nameEl.getBoundingClientRect();
      var near = mouse.x > b.left - RADIUS && mouse.x < b.right + RADIUS && mouse.y > b.top - RADIUS && mouse.y < b.bottom + RADIUS;
      if ((near || offsets.length) && !running) { running = true; requestAnimationFrame(step); }
    }, { passive: true });
    document.documentElement.addEventListener('mouseleave', function () {
      mouse.x = mouse.y = -9999;
      if (!running) { running = true; requestAnimationFrame(step); }
    });
  }

  /* ---------- Card spotlight ---------- */
  if (finePointer) {
    document.addEventListener('pointermove', function (e) {
      var card = e.target.closest && e.target.closest('[data-glow]');
      if (!card) return;
      var b = card.getBoundingClientRect();
      card.style.setProperty('--gx', (e.clientX - b.left).toFixed(0) + 'px');
      card.style.setProperty('--gy', (e.clientY - b.top).toFixed(0) + 'px');
    }, { passive: true });
  }

  /* ---------- Scroll-linked: photo parallax, CV progress, back to top ---------- */
  var portrait = document.querySelector('.portrait');
  var progressBar = document.querySelector('.read-progress');
  var toTop = document.querySelector('.to-top');
  var wideScreen = window.matchMedia && window.matchMedia('(min-width: 1001px)');
  var ticking = false;

  function onScroll() {
    ticking = false;
    var y = window.scrollY || window.pageYOffset;
    if (portrait && !reduceMotion && wideScreen && wideScreen.matches) {
      // 0 at the top of the page (so the photo lines up with About), then it lags behind as you scroll.
      portrait.style.setProperty('--parallax', Math.min(32, y * 0.08).toFixed(1) + 'px');
    }
    if (progressBar) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progressBar.style.setProperty('--progress', max > 0 ? Math.min(1, y / max).toFixed(4) : '0');
    }
    if (toTop) toTop.classList.toggle('is-shown', y > 600);
  }

  if (portrait || progressBar || toTop) {
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
    }, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
  }
  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---------- Easter egg: click the big "Yu Hu" on the home page, or type the secret word ----------
     The word, the message and the on/off switch are in _config.yml (easter_egg). */
  var eggOn = root.hasAttribute('data-egg');
  var secret = document.documentElement.getAttribute('data-egg') || '';
  var eggMessage = document.documentElement.getAttribute('data-egg-msg') || '';
  var typed = '';
  document.addEventListener('keydown', function (e) {
    var t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    if (!secret || !e.key || e.key.length !== 1) return;
    typed = (typed + e.key.toLowerCase()).slice(-secret.length);
    if (typed === secret) { typed = ''; goGators(); }
  });

  if (nameEl && eggOn) {
    nameEl.addEventListener('click', function () {
      goGators();
      decodeName();
    });
  }

  // On the home page the header gator just glides back to the top.
  var brandLink = document.querySelector('.brand');
  if (brandLink && location.pathname === '/') {
    brandLink.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  // The mascot picture with the message underneath fades in, stays a moment, then fades out.
  var eggImage = document.documentElement.getAttribute('data-egg-img') || '';
  var celebrating = false;
  function goGators() {
    if (celebrating) return;
    celebrating = true;

    var box = document.createElement('div');
    box.className = 'gator-egg';
    box.setAttribute('role', 'status');
    var img = null;
    if (eggImage) {
      img = new Image();
      img.alt = '';
      img.src = eggImage;
      box.appendChild(img);
    }
    var line = document.createElement('p');
    var bang = /!$/.test(eggMessage);
    line.appendChild(document.createTextNode(bang ? eggMessage.slice(0, -1) : eggMessage));
    if (bang) { var mark = document.createElement('span'); mark.textContent = '!'; line.appendChild(mark); }
    box.appendChild(line);
    document.body.appendChild(box);

    var shown = false;
    var show = function () {
      if (shown) return;
      shown = true;
      requestAnimationFrame(function () { requestAnimationFrame(function () { box.classList.add('is-shown'); }); });
      setTimeout(function () {
        box.classList.remove('is-shown');
        setTimeout(function () { box.remove(); celebrating = false; }, 800);
      }, 2800);
    };
    // Wait for the picture so it fades in together with the text (but never wait long).
    if (img && img.decode) { img.decode().then(show, show); setTimeout(show, 1200); } else { show(); }

    if (!reduceMotion) confetti();
    if (root.hasAttribute('data-egg-sound')) chomp();
  }

  // Sound for the easter egg, made in the browser (no audio file): two gator "chomps" and a short fanfare.
  // It only ever plays right after the visitor clicks or types, as browsers require.
  function chomp() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    var ac;
    try { ac = new AC(); } catch (e) { return; }
    var t = ac.currentTime + 0.03;
    [0, 0.26].forEach(function (off) {
      // the snap: a burst of filtered noise
      var len = 0.12, buf = ac.createBuffer(1, Math.round(ac.sampleRate * len), ac.sampleRate), d = buf.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
      var src = ac.createBufferSource(); src.buffer = buf;
      var bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1600; bp.Q.value = 0.9;
      var g = ac.createGain(); g.gain.value = 0.8;
      src.connect(bp); bp.connect(g); g.connect(ac.destination);
      src.start(t + off);
      // the jaw: a quick low thump
      var o = ac.createOscillator(), og = ac.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(190, t + off);
      o.frequency.exponentialRampToValueAtTime(55, t + off + 0.13);
      og.gain.setValueAtTime(0.55, t + off);
      og.gain.exponentialRampToValueAtTime(0.001, t + off + 0.16);
      o.connect(og); og.connect(ac.destination);
      o.start(t + off); o.stop(t + off + 0.18);
    });
    // a bright little fanfare: G C E G
    [392, 523.25, 659.25, 783.99].forEach(function (f, k) {
      var st = t + 0.62 + k * 0.11, o = ac.createOscillator(), g = ac.createGain(), last = k === 3;
      o.type = 'triangle';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, st);
      g.gain.exponentialRampToValueAtTime(0.22, st + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, st + (last ? 0.7 : 0.17));
      o.connect(g); g.connect(ac.destination);
      o.start(st); o.stop(st + (last ? 0.75 : 0.2));
    });
    setTimeout(function () { try { ac.close(); } catch (e) { /* ignore */ } }, 2600);
  }

  // Orange and blue confetti bursting up from both bottom corners.
  function confetti() {
    var canvas = document.createElement('canvas');
    canvas.className = 'confetti';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = canvas.width = Math.round(window.innerWidth * dpr);
    var H = canvas.height = Math.round(window.innerHeight * dpr);
    var colors = ['#fa4616', '#ff8a5c', '#0021a5', '#4a6cf7'];
    var bits = [];
    for (var i = 0; i < 170; i++) {
      var fromLeft = i % 2 === 0;
      bits.push({
        x: (fromLeft ? 0.02 : 0.98) * W,
        y: H * 0.75,
        vx: (fromLeft ? 1 : -1) * (Math.random() * 9 + 5) * dpr,
        vy: -(Math.random() * 15 + 11) * dpr,
        w: (Math.random() * 6 + 5) * dpr,
        h: (Math.random() * 10 + 6) * dpr,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        color: colors[i % colors.length]
      });
    }
    var start = null;
    var draw = function (now) {
      if (start === null) start = now;
      var t = now - start;
      ctx.clearRect(0, 0, W, H);
      bits.forEach(function (b) {
        b.vy += 0.38 * dpr;
        b.vx *= 0.99;
        b.x += b.vx;
        b.y += b.vy;
        b.rot += b.vr;
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - Math.max(0, t - 2200) / 900);
        ctx.translate(b.x, b.y);
        ctx.rotate(b.rot);
        ctx.fillStyle = b.color;
        ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h * Math.abs(Math.cos(b.rot * 2)));
        ctx.restore();
      });
      if (t < 3100) requestAnimationFrame(draw);
      else canvas.remove();
    };
    requestAnimationFrame(draw);
  }

  // Fetch the picture ahead of time once the page is idle, so the first click shows it instantly.
  if (eggImage && location.pathname === '/') {
    var preload = function () { var im = new Image(); im.src = eggImage; };
    if ('requestIdleCallback' in window) requestIdleCallback(preload, { timeout: 4000 }); else setTimeout(preload, 2500);
  }
  // shared with eggs.js (the phone-shake easter egg)
  window.siteConfetti = confetti;
})();
