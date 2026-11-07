/* Travel page background: a twinkling, slowly drifting starfield with
   three depth layers, gentle mouse/scroll parallax, and the occasional
   shooting star. Pauses when the tab is hidden; one still frame for
   "reduce motion". */
(function () {
  'use strict';

  var canvas = document.querySelector('.bg-stars');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var W = 0, H = 0, dpr = 1;
  var stars = [];
  var shooting = [];
  var nextShot = 0;
  var mouseX = 0, mouseY = 0, smoothX = 0, smoothY = 0;
  var raf = null;
  var COLORS = ['255,255,255', '210,225,255', '255,240,215', '190,205,255'];

  /* ---------- Constellation easter egg ----------
     Every half minute or so, a few stars brighten and link up into "YH" or a
     little gator, hold for a moment, then fade back into the sky. */
  var constellationOn = (document.documentElement.getAttribute('data-fx') || '').split(/\s+/).indexOf('constellation') !== -1;
  var SHAPES = {
    // points in shape units, edges as index pairs
    yh: {
      pts: [[0, 0], [1, 0], [0.5, 0.62], [0.5, 1.4], [1.6, 0], [1.6, 0.7], [1.6, 1.4], [2.6, 0], [2.6, 0.7], [2.6, 1.4]],
      edges: [[0, 2], [1, 2], [2, 3], [4, 5], [5, 6], [7, 8], [8, 9], [5, 8]],
      unit: 70
    },
    gator: {
      pts: [[0, 0.55], [0.7, 0.38], [1.15, 0.12], [1.45, 0.32], [2.1, 0.22], [2.75, 0.3], [3.4, 0.36], [4.1, 0.5], [4.8, 0.72],
            [3.2, 0.72], [2.2, 0.8], [1.4, 0.72], [0.7, 0.68], [1.6, 1.12], [2.9, 1.1]],
      edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10], [10, 11], [11, 12], [12, 0],
              [11, 13], [9, 14]],
      unit: 48
    }
  };
  var figure = null;
  var nextFigure = 0;
  var lastShape = 'gator';

  function spawnFigure(now) {
    var name = lastShape === 'yh' ? 'gator' : 'yh';
    lastShape = name;
    var sh = SHAPES[name];
    var u = Math.min(sh.unit, W / 9);
    var maxX = 0, maxY = 0;
    sh.pts.forEach(function (p) { maxX = Math.max(maxX, p[0]); maxY = Math.max(maxY, p[1]); });
    var ox = rand(0.08 * W, Math.max(0.08 * W, W - maxX * u - 0.08 * W));
    var oy = rand(0.12 * H, Math.max(0.12 * H, H * 0.75 - maxY * u));
    figure = {
      start: now,
      pts: sh.pts.map(function (p) { return [ox + p[0] * u + rand(-4, 4), oy + p[1] * u + rand(-4, 4)]; }),
      edges: sh.edges
    };
    nextFigure = now + rand(22000, 34000);
  }

  function drawFigure(now) {
    var t = (now - figure.start) / 1000;            // seconds
    var IN = 0.8, DRAW = 2.2, HOLD = 3.2, OUT = 1.4;
    if (t > IN + DRAW + HOLD + OUT) { figure = null; return; }
    var starA = Math.min(1, t / IN);
    var out = t > IN + DRAW + HOLD ? 1 - (t - IN - DRAW - HOLD) / OUT : 1;
    var drawn = Math.max(0, Math.min(1, (t - IN) / DRAW)) * figure.edges.length;

    ctx.lineWidth = 1.1;
    ctx.lineCap = 'round';
    for (var e = 0; e < figure.edges.length && e < drawn; e++) {
      var a = figure.pts[figure.edges[e][0]], b = figure.pts[figure.edges[e][1]];
      var part = Math.min(1, drawn - e);
      ctx.strokeStyle = 'rgba(190,205,255,' + (0.55 * out).toFixed(3) + ')';
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(a[0] + (b[0] - a[0]) * part, a[1] + (b[1] - a[1]) * part);
      ctx.stroke();
    }
    for (var k = 0; k < figure.pts.length; k++) {
      var p = figure.pts[k];
      var tw = 0.85 + 0.15 * Math.sin(now / 300 + k);
      ctx.fillStyle = 'rgba(210,225,255,' + (0.22 * starA * out * tw).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(p[0], p[1], 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,' + (0.95 * starA * out * tw).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(p[0], p[1], 1.9, 0, Math.PI * 2); ctx.fill();
    }
  }
  var LAYERS = [
    { size: [0.3, 0.8], speed: 0.012, depth: 6,  share: 0.6 },
    { size: [0.7, 1.3], speed: 0.03,  depth: 14, share: 0.3 },
    { size: [1.2, 1.9], speed: 0.06,  depth: 26, share: 0.1 }
  ];

  function rand(a, b) { return a + Math.random() * (b - a); }

  function build() {
    stars = [];
    var total = Math.round(Math.min(750, Math.max(180, (W * H) / 1900)));
    LAYERS.forEach(function (L, li) {
      var n = Math.round(total * L.share);
      for (var i = 0; i < n; i++) {
        stars.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: rand(L.size[0], L.size[1]),
          a: rand(0.35, 0.95),
          tw: rand(0.6, 2.2),            // twinkle speed
          ph: Math.random() * Math.PI * 2,
          c: COLORS[(Math.random() * COLORS.length) | 0],
          layer: li
        });
      }
    });
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    build();
  }

  function spawnShot(now) {
    var fromLeft = Math.random() < 0.5;
    shooting.push({
      x: fromLeft ? rand(0.05, 0.5) * W : rand(0.5, 0.95) * W,
      y: rand(0.02, 0.35) * H,
      vx: (fromLeft ? 1 : -1) * rand(9, 13),
      vy: rand(3.5, 5.5),
      life: 0,
      max: rand(45, 70)
    });
    nextShot = now + rand(3500, 8500);
  }

  function draw(now, animate) {
    ctx.clearRect(0, 0, W, H);
    var t = now / 1000;
    var scrollY = window.scrollY || 0;
    smoothX += (mouseX - smoothX) * 0.04;
    smoothY += (mouseY - smoothY) * 0.04;

    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var L = LAYERS[s.layer];
      if (animate) {
        s.x -= L.speed;
        if (s.x < -4) s.x += W + 8;
      }
      var px = s.x + smoothX * L.depth;
      var py = s.y + smoothY * L.depth - scrollY * L.depth * 0.004;
      py = ((py % H) + H) % H;
      var alpha = animate ? s.a * (0.55 + 0.45 * Math.sin(t * s.tw + s.ph)) : s.a;
      ctx.fillStyle = 'rgba(' + s.c + ',' + alpha.toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(px, py, s.r, 0, Math.PI * 2);
      ctx.fill();
      if (s.r > 1.5) {   // a soft glow on the biggest stars
        ctx.fillStyle = 'rgba(' + s.c + ',' + (alpha * 0.12).toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(px, py, s.r * 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (!animate) return;
    if (constellationOn) {
      if (!figure && now > nextFigure) spawnFigure(now);
      if (figure) drawFigure(now);
    }
    if (now > nextShot) spawnShot(now);
    for (var k = shooting.length - 1; k >= 0; k--) {
      var m = shooting[k];
      m.life++;
      m.x += m.vx;
      m.y += m.vy;
      var fade = 1 - m.life / m.max;
      var tail = 14;
      var g = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * tail, m.y - m.vy * tail);
      g.addColorStop(0, 'rgba(255,255,255,' + (0.9 * fade).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(m.x, m.y);
      ctx.lineTo(m.x - m.vx * tail, m.y - m.vy * tail);
      ctx.stroke();
      if (m.life >= m.max) shooting.splice(k, 1);
    }
  }

  function frame(now) {
    draw(now, true);
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (raf || reduce || document.hidden) return;
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = null;
  }

  resize();
  nextShot = performance.now() + 1800;
  nextFigure = performance.now() + 7000;
  draw(performance.now(), false);
  start();

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { resize(); if (reduce) draw(performance.now(), false); }, 150);
  });
  window.addEventListener('pointermove', function (e) {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    mouseX = (e.clientX / W - 0.5) * 2;   // -1 .. 1
    mouseY = (e.clientY / H - 0.5) * 2;
  }, { passive: true });
  if (reduce) window.addEventListener('scroll', function () { draw(performance.now(), false); }, { passive: true });
  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
})();
