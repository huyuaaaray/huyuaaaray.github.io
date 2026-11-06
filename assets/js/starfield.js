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
