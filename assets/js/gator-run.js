/* 404 page mini game: the gator runs along and jumps over bugs.
   Space / arrow up / click / tap to jump (and to start or restart).
   The best score is kept in this browser. Texts come from _config.yml (not_found). */
(function () {
  'use strict';

  var box = document.querySelector('[data-runner]');
  if (!box) return;
  var canvas = box.querySelector('canvas');
  var ctx = canvas.getContext && canvas.getContext('2d');
  if (!ctx) return;

  var T = {
    hint: box.getAttribute('data-hint') || 'Press space to play',
    over: box.getAttribute('data-over') || 'Game over',
    score: box.getAttribute('data-score') || 'Score',
    best: box.getAttribute('data-best') || 'Best'
  };

  var W = 0, H = 200, dpr = 1, GROUND = 0;
  var colors = {};
  var sprite = new Image();
  sprite.src = '/images/header-icon.png';

  // Easter egg: beat the target score once and the gator turns gold for good
  var gold = { on: false, score: 20, text: 'Golden gator unlocked!', flashUntil: 0 };
  try {
    var ge = (JSON.parse((document.getElementById('egg-data') || {}).textContent || '{}') || {}).eggs || {};
    if (ge.gold_gator && ge.gold_gator.show !== false) {
      gold.enabled = true;
      gold.score = Number(ge.gold_gator.score || 20);
      gold.text = ge.gold_gator.text || gold.text;
      gold.on = localStorage.getItem('gatorGold') === '1';
    }
  } catch (e) { /* storage blocked */ }

  var state = 'ready';            // ready | running | over
  var gator, obstacles, speed, score, best, spawnIn, groundShift, last;
  try { best = Number(localStorage.getItem('gatorRunBest')) || 0; } catch (e) { best = 0; }

  function readColors() {
    var cs = getComputedStyle(document.documentElement);
    colors = {
      text: cs.getPropertyValue('--text').trim() || '#342e2b',
      muted: cs.getPropertyValue('--muted').trim() || '#777',
      line: cs.getPropertyValue('--line').trim() || 'rgba(0,0,0,.12)',
      mark: cs.getPropertyValue('--mark').trim() || '#fa4616',
      accent: cs.getPropertyValue('--accent').trim() || '#0021a5',
      sans: cs.getPropertyValue('--sans').trim() || 'sans-serif'
    };
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.min(box.clientWidth || 600, 760);
    H = W < 420 ? 170 : 200;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    GROUND = H - 28;
    if (gator) gator.y = Math.min(gator.y, GROUND - gator.h);
    draw();
  }

  function reset() {
    gator = { x: 40, y: 0, w: 46, h: 45, vy: 0, onGround: true };
    gator.y = GROUND - gator.h;
    obstacles = [];
    speed = 0.32;                  // px per ms
    score = 0;
    spawnIn = 700;
    groundShift = 0;
  }

  function jump() {
    if (state !== 'running') { start(); return; }
    if (gator.onGround) { gator.vy = -0.78; gator.onGround = false; }
  }

  function start() {
    reset();
    state = 'running';
    last = performance.now();
    requestAnimationFrame(loop);
  }

  function spawn() {
    var tall = Math.random() < 0.35;
    var w = 16 + Math.random() * 14;
    var h = tall ? 40 + Math.random() * 12 : 22 + Math.random() * 12;
    obstacles.push({ x: W + 10, w: w, h: h });
    // more room at higher speeds so it stays fair
    spawnIn = 650 + Math.random() * 900 - Math.min(250, speed * 300);
  }

  function hit(o) {
    var pad = 8;                    // forgiving hit box
    var gx1 = gator.x + pad, gx2 = gator.x + gator.w - pad;
    var gy2 = gator.y + gator.h - 4;
    return gx2 > o.x && gx1 < o.x + o.w && gy2 > GROUND - o.h;
  }

  function update(dt) {
    speed = Math.min(0.75, speed + dt * 0.000012);
    score += dt * speed * 0.05;
    if (gold.enabled && !gold.on && score > gold.score) {
      gold.on = true;
      gold.flashUntil = performance.now() + 2600;
      try { localStorage.setItem('gatorGold', '1'); } catch (e) { /* ignore */ }
    }
    groundShift = (groundShift + dt * speed) % 24;

    gator.vy += 0.0024 * dt;        // gravity
    gator.y += gator.vy * dt;
    if (gator.y >= GROUND - gator.h) { gator.y = GROUND - gator.h; gator.vy = 0; gator.onGround = true; }

    spawnIn -= dt;
    if (spawnIn <= 0) spawn();
    for (var i = obstacles.length - 1; i >= 0; i--) {
      var o = obstacles[i];
      o.x -= speed * dt;
      if (o.x + o.w < -10) { obstacles.splice(i, 1); continue; }
      if (hit(o)) { gameOver(); return; }
    }
  }

  function gameOver() {
    state = 'over';
    var s = Math.floor(score);
    if (s > best) {
      best = s;
      try { localStorage.setItem('gatorRunBest', String(best)); } catch (e) { /* ignore */ }
    }
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawBug(o) {
    // a little "bug": rounded body with legs and two antennae
    var x = o.x, y = GROUND - o.h;
    ctx.fillStyle = colors.mark;
    roundRect(x, y, o.w, o.h, Math.min(8, o.w / 2));
    ctx.fill();
    ctx.strokeStyle = colors.mark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + o.w * 0.3, y); ctx.lineTo(x + o.w * 0.15, y - 7);
    ctx.moveTo(x + o.w * 0.7, y); ctx.lineTo(x + o.w * 0.85, y - 7);
    for (var k = 1; k <= 2; k++) {
      var ly = y + o.h * (k / 3);
      ctx.moveTo(x, ly); ctx.lineTo(x - 5, ly + 3);
      ctx.moveTo(x + o.w, ly); ctx.lineTo(x + o.w + 5, ly + 3);
    }
    ctx.stroke();
  }

  function draw() {
    if (!gator) reset();
    ctx.clearRect(0, 0, W, H);

    // ground
    ctx.strokeStyle = colors.muted;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, GROUND + 0.5); ctx.lineTo(W, GROUND + 0.5); ctx.stroke();
    ctx.fillStyle = colors.line;
    for (var gx = -groundShift; gx < W; gx += 24) ctx.fillRect(gx, GROUND + 8, 10, 2);

    obstacles.forEach(drawBug);

    // the gator (a little bob while running)
    var bob = state === 'running' && gator.onGround ? Math.sin(performance.now() / 70) * 1.5 : 0;
    if (sprite.complete && sprite.naturalWidth) {
      if (gold.on) {
        ctx.save();
        ctx.filter = 'sepia(1) saturate(5) hue-rotate(-12deg) brightness(1.15)';
        ctx.shadowColor = 'rgba(255, 200, 60, 0.9)';
        ctx.shadowBlur = 14;
      }
      ctx.drawImage(sprite, gator.x, gator.y + bob, gator.w, gator.h);
      if (gold.on) ctx.restore();
    }
    else { ctx.fillStyle = '#0a7a3c'; roundRect(gator.x, gator.y, gator.w, gator.h, 10); ctx.fill(); }

    // score
    ctx.fillStyle = colors.muted;
    ctx.font = '600 14px ' + colors.sans;
    ctx.textAlign = 'right';
    ctx.fillText(T.best + ' ' + best + '   ' + T.score + ' ' + Math.floor(score || 0), W - 12, 22);

    if (performance.now() < gold.flashUntil) {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#d4a017';
      ctx.font = '700 ' + (W < 420 ? 15 : 18) + 'px ' + colors.sans;
      ctx.fillText(gold.text, W / 2, 30);
    }

    if (state !== 'running') {
      ctx.textAlign = 'center';
      ctx.fillStyle = state === 'over' ? colors.mark : colors.text;
      ctx.font = '600 ' + (W < 420 ? 15 : 17) + 'px ' + colors.sans;
      ctx.fillText(state === 'over' ? T.over : T.hint, W / 2, H / 2 - 6);
    }
  }

  function loop(now) {
    if (state !== 'running') { draw(); return; }
    var dt = Math.min(50, now - last);   // a long pause (hidden tab) doesn't teleport anything
    last = now;
    update(dt);
    draw();
    if (state === 'running') requestAnimationFrame(loop);
  }

  // Controls: space / arrow up anywhere on the page, or click / tap the game.
  window.addEventListener('keydown', function (e) {
    if (e.code !== 'Space' && e.key !== ' ' && e.key !== 'ArrowUp') return;
    var t = e.target;
    if (t && t !== canvas && /^(A|BUTTON|INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
    e.preventDefault();
    jump();
  });
  canvas.addEventListener('pointerdown', function (e) { e.preventDefault(); canvas.focus({ preventScroll: true }); jump(); });

  sprite.addEventListener('load', draw);
  window.addEventListener('themechange', function () { readColors(); draw(); });
  window.addEventListener('resize', resize);
  readColors();
  resize();
})();
