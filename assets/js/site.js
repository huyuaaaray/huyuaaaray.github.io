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

  /* ---------- Light / dark: header button, browser bar color, following the system ---------- */
  var THEME_BG = { light: '#f6f5f8', dark: '#0e1320' };
  function syncThemeColor() {
    if (root.classList.contains('theme-night')) return;
    var c = THEME_BG[root.getAttribute('data-theme')] || THEME_BG.light;
    Array.prototype.forEach.call(document.querySelectorAll('meta[name="theme-color"]'), function (m) {
      m.removeAttribute('media');
      m.setAttribute('content', c);
    });
  }
  function applyTheme(t, remember) {
    root.setAttribute('data-theme', t);
    if (remember) { try { localStorage.setItem('theme', t); } catch (e) { /* storage blocked */ } }
    syncThemeColor();
    window.dispatchEvent(new CustomEvent('themechange', { detail: t }));
  }
  syncThemeColor();

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
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      if (!document.startViewTransition || reduceMotion) { applyTheme(next, true); return; }
      // The new colors spread out in a circle from the button.
      var b = themeBtn.getBoundingClientRect();
      var x = b.left + b.width / 2, y = b.top + b.height / 2;
      var radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
      root.classList.add('theme-switching');
      var vt = document.startViewTransition(function () { applyTheme(next, true); });
      vt.ready.then(function () {
        root.animate(
          { clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + radius + 'px at ' + x + 'px ' + y + 'px)'] },
          { duration: 700, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)', pseudoElement: '::view-transition-new(root)' }
        );
      }).catch(function () { /* skipped */ });
      vt.finished.then(done, done);
      function done() { root.classList.remove('theme-switching'); }
    });
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
        // Done: put the plain text back so the letters kern normally again.
        setTimeout(function () { nameEl.textContent = nameText; decoding = false; }, 700);
      };
      requestAnimationFrame(tick);
    };
    if (document.documentElement.classList.contains('intro')) {
      window.addEventListener('introdone', function () { setTimeout(decodeName, 150); }, { once: true });
    } else {
      setTimeout(decodeName, 350);
    }
    var lastHover = 0;
    nameEl.addEventListener('mouseenter', function () {
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

  /* ---------- Magnetic icons ---------- */
  if (finePointer && !reduceMotion) {
    Array.prototype.forEach.call(document.querySelectorAll('.icon-btn'), function (btn) {
      btn.addEventListener('pointermove', function (e) {
        var b = btn.getBoundingClientRect();
        var dx = e.clientX - (b.left + b.width / 2);
        var dy = e.clientY - (b.top + b.height / 2);
        btn.classList.add('is-magnet');
        btn.style.setProperty('--mx', (dx * 0.35).toFixed(1) + 'px');
        btn.style.setProperty('--my', (dy * 0.35).toFixed(1) + 'px');
      });
      btn.addEventListener('pointerleave', function () {
        btn.classList.remove('is-magnet');
        btn.style.setProperty('--mx', '0px');
        btn.style.setProperty('--my', '0px');
      });
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
})();
