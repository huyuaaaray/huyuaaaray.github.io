/* Home page background: a slow, faint "neural network" of drifting points.
   Points near each other are linked; the mouse gently attracts nearby points.
   Pauses when the tab is hidden; draws one still frame for reduced motion. */
(function () {
  'use strict';

  var canvas = document.querySelector('.bg-network');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');

  var reduceQuery = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  var schemeQuery = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');

  var LINK = 140;         // max distance for a link between points (px)
  var MOUSE = 180;        // mouse influence radius (px)
  var W = 0, H = 0, dpr = 1;
  var nodes = [];
  var rgb = '0, 33, 165';
  var mouse = { x: 0, y: 0, active: false };
  var raf = null;

  function readColor() {
    var v = getComputedStyle(document.documentElement).getPropertyValue('--net-rgb').trim();
    if (v) rgb = v;
  }

  function makeNode() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.3 + 1
    };
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var target = Math.round(Math.min(110, Math.max(24, (W * H) / 14000)));
    while (nodes.length < target) nodes.push(makeNode());
    nodes.length = target;
  }

  function update() {
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (mouse.active) {
        var dx = mouse.x - n.x, dy = mouse.y - n.y;
        var d2 = dx * dx + dy * dy;
        if (d2 < MOUSE * MOUSE && d2 > 1) {
          var pull = (1 - Math.sqrt(d2) / MOUSE) * 0.0009;
          n.vx += dx * pull;
          n.vy += dy * pull;
        }
      }
      n.vx *= 0.99;
      n.vy *= 0.99;
      var speed = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
      if (speed < 0.08) { n.vx += (Math.random() - 0.5) * 0.04; n.vy += (Math.random() - 0.5) * 0.04; }
      if (speed > 1.1) { n.vx *= 1.1 / speed; n.vy *= 1.1 / speed; }
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < -20) n.x = W + 20; else if (n.x > W + 20) n.x = -20;
      if (n.y < -20) n.y = H + 20; else if (n.y > H + 20) n.y = -20;
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    var i, j, a, b, dx, dy, d2, alpha;

    ctx.lineWidth = 1;
    for (i = 0; i < nodes.length; i++) {
      a = nodes[i];
      for (j = i + 1; j < nodes.length; j++) {
        b = nodes[j];
        dx = a.x - b.x; dy = a.y - b.y;
        d2 = dx * dx + dy * dy;
        if (d2 < LINK * LINK) {
          alpha = (1 - Math.sqrt(d2) / LINK) * 0.16;
          ctx.strokeStyle = 'rgba(' + rgb + ',' + alpha.toFixed(3) + ')';
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    if (mouse.active) {
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        dx = a.x - mouse.x; dy = a.y - mouse.y;
        d2 = dx * dx + dy * dy;
        if (d2 < MOUSE * MOUSE) {
          alpha = (1 - Math.sqrt(d2) / MOUSE) * 0.32;
          ctx.strokeStyle = 'rgba(' + rgb + ',' + alpha.toFixed(3) + ')';
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }
    }

    ctx.fillStyle = 'rgba(' + rgb + ',0.38)';
    for (i = 0; i < nodes.length; i++) {
      a = nodes[i];
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function frame() {
    update();
    draw();
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (raf || document.hidden || (reduceQuery && reduceQuery.matches)) return;
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = null;
  }

  readColor();
  resize();
  draw();
  start();

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { resize(); draw(); }, 150);
  });
  window.addEventListener('pointermove', function (e) {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true;
  }, { passive: true });
  document.addEventListener('pointerleave', function () { mouse.active = false; });
  window.addEventListener('blur', function () { mouse.active = false; });
  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });

  function onScheme() { readColor(); draw(); }
  if (schemeQuery) {
    if (schemeQuery.addEventListener) schemeQuery.addEventListener('change', onScheme);
    else if (schemeQuery.addListener) schemeQuery.addListener(onScheme);
  }
  if (reduceQuery) {
    var onReduce = function () { if (reduceQuery.matches) { stop(); draw(); } else { start(); } };
    if (reduceQuery.addEventListener) reduceQuery.addEventListener('change', onReduce);
    else if (reduceQuery.addListener) reduceQuery.addListener(onReduce);
  }
})();
