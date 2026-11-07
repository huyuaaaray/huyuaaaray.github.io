/* Home page background: a slow, faint "neural network" of drifting points.
   Points near each other are linked; the mouse gently attracts nearby points.
   With the "network_pulse" effect on, clicking the background fires a signal
   that travels outward along the links, node to node, and the network also
   fires on its own now and then while idle.
   Pauses when the tab is hidden; draws one still frame for reduced motion. */
(function () {
  'use strict';

  var canvas = document.querySelector('.bg-network');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');

  var reduceQuery = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  var pulsesOn = (document.documentElement.getAttribute('data-fx') || '').split(/\s+/).indexOf('pulse') !== -1;

  var LINK = 140;         // max distance for a link between points (px)
  var MOUSE = 180;        // mouse influence radius (px)
  var W = 0, H = 0, dpr = 1;
  var nodes = [];
  var rgb = '0, 33, 165';
  var mouse = { x: 0, y: 0, active: false };
  var raf = null;

  // Signal pulses
  var PULSE_RGB = '250, 70, 22';
  var MAX_HOPS = 5;
  var pulses = [];        // { a, b, t, hop, wave }
  var lastInput = 0;
  var nextIdle = 0;
  var waveId = 0;

  function readColor() {
    var cs = getComputedStyle(document.documentElement);
    var v = cs.getPropertyValue('--net-rgb').trim();
    if (v) rgb = v;
    PULSE_RGB = document.documentElement.getAttribute('data-theme') === 'dark' ? '255, 138, 92' : '250, 70, 22';
  }

  function makeNode() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.3 + 1,
      flash: 0,
      wave: -1
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

  // Send the signal from node i to its nearest linked neighbours.
  function fanOut(i, hop, wave) {
    var a = nodes[i];
    a.flash = 1;
    a.wave = wave;
    if (hop >= MAX_HOPS) return;
    var near = [];
    for (var j = 0; j < nodes.length; j++) {
      if (j === i || nodes[j].wave === wave) continue;
      var dx = nodes[j].x - a.x, dy = nodes[j].y - a.y, d2 = dx * dx + dy * dy;
      if (d2 < LINK * LINK) near.push({ j: j, d2: d2 });
    }
    near.sort(function (p, q) { return p.d2 - q.d2; });
    near.slice(0, hop === 0 ? 4 : 2).forEach(function (n) {
      if (pulses.length > 140) return;
      nodes[n.j].wave = wave;   // claim it so two signals don't race to the same node
      pulses.push({ a: i, b: n.j, t: 0, hop: hop + 1, wave: wave });
    });
  }

  function fireAt(x, y) {
    if (!nodes.length) return;
    var best = 0, bestD = Infinity;
    for (var i = 0; i < nodes.length; i++) {
      var dx = nodes[i].x - x, dy = nodes[i].y - y, d2 = dx * dx + dy * dy;
      if (d2 < bestD) { bestD = d2; best = i; }
    }
    fanOut(best, 0, ++waveId);
  }

  function updatePulses(now) {
    for (var k = pulses.length - 1; k >= 0; k--) {
      var p = pulses[k];
      p.t += 0.05;
      if (p.t >= 1) {
        pulses.splice(k, 1);
        fanOut(p.b, p.hop, p.wave);
      }
    }
    for (var i = 0; i < nodes.length; i++) if (nodes[i].flash > 0) nodes[i].flash = Math.max(0, nodes[i].flash - 0.025);
    // Fire on its own every so often when nobody is interacting.
    if (now > nextIdle && now - lastInput > 4000) {
      var n = nodes[(Math.random() * nodes.length) | 0];
      if (n && n.x > 0 && n.x < W && n.y > 0 && n.y < H) fireAt(n.x, n.y);
      nextIdle = now + 6000 + Math.random() * 6000;
    }
  }

  function drawPulses() {
    var i, p, a, b, x, y;
    ctx.lineWidth = 1.6;
    for (i = 0; i < pulses.length; i++) {
      p = pulses[i]; a = nodes[p.a]; b = nodes[p.b];
      x = a.x + (b.x - a.x) * p.t; y = a.y + (b.y - a.y) * p.t;
      var fade = 1 - (p.hop - 1) / (MAX_HOPS + 1);
      ctx.strokeStyle = 'rgba(' + PULSE_RGB + ',' + (0.45 * fade).toFixed(3) + ')';
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(x, y); ctx.stroke();
      ctx.fillStyle = 'rgba(' + PULSE_RGB + ',' + (0.18 * fade).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(' + PULSE_RGB + ',' + (0.95 * fade).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(x, y, 2.4, 0, Math.PI * 2); ctx.fill();
    }
    for (i = 0; i < nodes.length; i++) {
      a = nodes[i];
      if (!a.flash) continue;
      ctx.fillStyle = 'rgba(' + PULSE_RGB + ',' + (0.22 * a.flash).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r + 9 * a.flash, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(' + PULSE_RGB + ',' + (0.9 * a.flash).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r + 1.4, 0, Math.PI * 2); ctx.fill();
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

    if (pulsesOn) drawPulses();
  }

  function frame(now) {
    update();
    if (pulsesOn) updatePulses(now || performance.now());
    draw();
    raf = requestAnimationFrame(frame);
  }

  var isLite = function () { return document.documentElement.classList.contains('lite'); };

  function start() {
    if (isLite()) { draw(); return; }
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
    lastInput = performance.now();
    if (e.pointerType && e.pointerType !== 'mouse') return;
    mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true;
  }, { passive: true });

  // Click on the background (not on a link, button, photo, map, ...) to fire a signal.
  var NOT_BACKGROUND = 'a, button, input, textarea, select, label, summary, [role="button"], .photo, .display-name, .research-banner, .site-header';
  if (pulsesOn) {
    document.addEventListener('pointerdown', function (e) {
      lastInput = performance.now();
      if (e.button !== 0 || !raf) return;
      if (e.target.closest && e.target.closest(NOT_BACKGROUND)) return;
      fireAt(e.clientX, e.clientY);
    });
    nextIdle = performance.now() + 3500;
  }
  document.addEventListener('pointerleave', function () { mouse.active = false; });
  window.addEventListener('blur', function () { mouse.active = false; });
  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
  // "Reduce animations": hold one still frame
  window.addEventListener('litechange', function () { if (isLite()) { stop(); draw(); } else start(); });

  // Re-read the colors when the light/dark theme changes (toggle button or system setting).
  window.addEventListener('themechange', function () { readColor(); draw(); });
  if (reduceQuery) {
    var onReduce = function () { if (reduceQuery.matches) { stop(); draw(); } else { start(); } };
    if (reduceQuery.addEventListener) reduceQuery.addEventListener('change', onReduce);
    else if (reduceQuery.addListener) reduceQuery.addListener(onReduce);
  }
})();
