/* Holiday themes, switched on by the date in Gainesville (settings in _config.yml → holidays):
   game days: a banner under the header · Dec 1–26: snow · Dec 31–Jan 2: fireworks ·
   Lunar New Year (eve to the Lantern Festival): two lanterns and a greeting.
   Preview any of them by adding ?holiday=gameday / snow / newyear / lunar to the address. */
(function () {
  'use strict';

  var dataEl = document.getElementById('holiday-data');
  if (!dataEl) return;
  var cfg = {};
  try { cfg = JSON.parse(dataEl.textContent) || {}; } catch (e) { return; }

  var root = document.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isLite = function () { return root.classList.contains('lite'); };

  // Today's date in Gainesville, as YYYY-MM-DD
  var today;
  try {
    today = new Intl.DateTimeFormat('en-CA', { timeZone: cfg.tz || 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  } catch (e) {
    var d0 = new Date();
    today = d0.getFullYear() + '-' + String(d0.getMonth() + 1).padStart(2, '0') + '-' + String(d0.getDate()).padStart(2, '0');
  }
  var md = today.slice(5);
  var preview = (location.search.match(/[?&]holiday=([a-z]+)/) || [])[1] || '';
  var dayNum = function (s) { return Math.floor(Date.parse(s + 'T12:00:00Z') / 86400000); };

  var game = null;
  (cfg.games || []).forEach(function (g) { if (g.date === today) game = g; });
  if (preview === 'gameday') game = game || { date: today, text: (cfg.games && cfg.games[0] && cfg.games[0].text) || 'Game day! Go Gators!' };

  var active = {
    gameday: !!(cfg.gameDay && game),
    snow: preview === 'snow' || (!preview && cfg.snow && md >= '12-01' && md <= '12-26'),
    newyear: preview === 'newyear' || (!preview && cfg.newYear && (md === '12-31' || md === '01-01' || md === '01-02')),
    lunar: preview === 'lunar' || (!preview && cfg.lunar && (cfg.lunarDates || []).some(function (eve) {
      var n = dayNum(today) - dayNum(eve);
      return n >= 0 && n <= 15;
    }))
  };

  /* ---------- Banner under the header (game day / Lunar New Year) ---------- */
  function banner(kind, text) {
    var key = 'banner-closed:' + kind + ':' + today;
    try { if (!preview && localStorage.getItem(key)) return; } catch (e) { /* ignore */ }
    var b = document.createElement('div');
    b.className = 'holiday-banner is-' + kind;
    b.setAttribute('role', 'status');
    var icon = kind === 'gameday' ? '<img src="/images/header-icon.png" alt="" width="24" height="24">' : '<span class="hb-lantern" aria-hidden="true"></span>';
    b.innerHTML = '<div class="container hb-inner">' + icon + '<span class="hb-text"></span>' +
      '<button type="button" class="hb-close" aria-label="Close">&times;</button></div>';
    b.querySelector('.hb-text').textContent = text;
    b.querySelector('.hb-close').addEventListener('click', function () {
      b.classList.add('is-leaving');
      try { localStorage.setItem(key, '1'); } catch (e) { /* ignore */ }
      setTimeout(function () { b.remove(); }, 350);
    });
    var header = document.querySelector('.site-header');
    if (header && header.parentNode) header.parentNode.insertBefore(b, header.nextSibling);
  }
  if (active.gameday) banner('gameday', game.text);
  if (active.lunar) banner('lunar', cfg.lunarText || 'Happy Lunar New Year');

  /* ---------- Lanterns hanging at both sides ---------- */
  if (active.lunar) {
    ['left', 'right'].forEach(function (side) {
      var l = document.createElement('div');
      l.className = 'lantern lantern-' + side;
      l.setAttribute('aria-hidden', 'true');
      l.innerHTML = '<span class="lantern-string"></span><span class="lantern-body"><span class="lantern-char">福</span></span><span class="lantern-tassel"></span>';
      document.body.appendChild(l);
    });
  }

  /* ---------- Particle canvas shared by snow and fireworks ---------- */
  if (!(active.snow || active.newyear) || reduceMotion) return;
  var canvas = document.createElement('canvas');
  canvas.className = 'holiday-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.insertBefore(canvas, document.body.firstChild);
  var ctx = canvas.getContext('2d');
  var W = 0, H = 0, dpr = 1;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  var flakes = [];
  if (active.snow) {
    var n = Math.min(130, Math.round((W * H) / 12000));
    for (var i = 0; i < n; i++) {
      flakes.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 2.2 + 0.8,
                    vy: Math.random() * 0.6 + 0.35, sway: Math.random() * Math.PI * 2, sp: Math.random() * 0.015 + 0.005 });
    }
  }
  var sparks = [];
  var nextBurst = 0;
  var fireworksUntil = performance.now() + 25000;         // a show for the first 25 seconds
  var COLORS = ['250,70,22', '255,170,60', '74,108,247', '255,215,120', '255,255,255'];
  function burst() {
    var x = W * (0.15 + Math.random() * 0.7), y = H * (0.12 + Math.random() * 0.35);
    var c = COLORS[(Math.random() * COLORS.length) | 0];
    var count = 46 + ((Math.random() * 20) | 0);
    for (var k = 0; k < count; k++) {
      var a = (k / count) * Math.PI * 2, sp = 2.2 + Math.random() * 2.4;
      sparks.push({ x: x, y: y, px: x, py: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, c: c });
    }
  }

  var raf = null;
  var dark = function () { return root.getAttribute('data-theme') === 'dark' || root.classList.contains('theme-night'); };
  function frame(now) {
    raf = null;
    ctx.clearRect(0, 0, W, H);
    if (flakes.length) {
      ctx.fillStyle = dark() ? 'rgba(255,255,255,0.85)' : 'rgba(150,170,215,0.75)';
      flakes.forEach(function (f) {
        f.sway += f.sp;
        f.y += f.vy;
        f.x += Math.sin(f.sway) * 0.4;
        if (f.y > H + 5) { f.y = -5; f.x = Math.random() * W; }
        ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2); ctx.fill();
      });
    }
    if (active.newyear) {
      if (now < fireworksUntil && now > nextBurst) { burst(); nextBurst = now + 700 + Math.random() * 900; }
      for (var k = sparks.length - 1; k >= 0; k--) {
        var s = sparks[k];
        s.px = s.x; s.py = s.y;
        s.vx *= 0.985; s.vy = s.vy * 0.985 + 0.045;
        s.x += s.vx; s.y += s.vy;
        s.life -= 0.012;
        if (s.life <= 0) { sparks.splice(k, 1); continue; }
        ctx.strokeStyle = 'rgba(' + s.c + ',' + s.life.toFixed(3) + ')';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(s.px, s.py); ctx.lineTo(s.x, s.y); ctx.stroke();
      }
    }
    var more = flakes.length || sparks.length || (active.newyear && now < fireworksUntil);
    if (more && !document.hidden && !isLite()) raf = requestAnimationFrame(frame);
  }
  function start() { if (!raf && !isLite()) raf = requestAnimationFrame(frame); }
  start();
  document.addEventListener('visibilitychange', function () { if (!document.hidden) start(); });
  window.addEventListener('litechange', function () {
    if (isLite()) { if (raf) cancelAnimationFrame(raf); raf = null; ctx.clearRect(0, 0, W, H); }
    else start();
  });
})();
