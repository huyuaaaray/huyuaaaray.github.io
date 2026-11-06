/* Site-wide effects: scroll reveal, photo tilt and parallax, rotating roles,
   magnetic icons, card spotlight, count-up numbers, CV progress bar,
   and a Gators easter egg. Everything here is optional polish; the site
   works without it. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

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

  /* ---------- Easter egg: type "gogators", or tap the header gator 5 times ---------- */
  var secret = 'gogators';
  var typed = '';
  document.addEventListener('keydown', function (e) {
    var t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    if (!e.key || e.key.length !== 1) return;
    typed = (typed + e.key.toLowerCase()).slice(-secret.length);
    if (typed === secret) { typed = ''; goGators(); }
  });

  // On the home page the header gator doesn't need to navigate, so taps count instead.
  var brandImg = document.querySelector('.brand img');
  if (brandImg && location.pathname === '/') {
    var taps = 0, tapTimer = null;
    brandImg.addEventListener('click', function (e) {
      e.preventDefault();
      taps++;
      clearTimeout(tapTimer);
      tapTimer = setTimeout(function () { taps = 0; }, 1500);
      if (taps >= 5) {
        taps = 0;
        goGators();
      } else if (taps === 1) {
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    });
  }

  var celebrating = false;
  function goGators() {
    if (celebrating) return;
    celebrating = true;

    var toast = document.createElement('div');
    toast.className = 'gator-toast';
    toast.setAttribute('role', 'status');
    toast.innerHTML = 'Go Gators<span>!</span>';
    document.body.appendChild(toast);
    requestAnimationFrame(function () { toast.classList.add('is-shown'); });

    var finish = function () {
      toast.classList.remove('is-shown');
      setTimeout(function () { toast.remove(); celebrating = false; }, 400);
    };
    if (reduceMotion) { setTimeout(finish, 1800); return; }

    var canvas = document.createElement('canvas');
    canvas.className = 'confetti';
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
      else { canvas.remove(); finish(); }
    };
    requestAnimationFrame(draw);
  }
})();
