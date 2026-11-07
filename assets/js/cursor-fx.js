/* Cursor and click effects. Each one is switched on/off in _config.yml
   (effects: cursor_tail, cursor_spotlight, ripple); hover glow is pure CSS.
   Cursor effects only run with a mouse; nothing animates with "reduce motion". */
(function () {
  'use strict';

  var fx = (document.documentElement.getAttribute('data-fx') || '').split(/\s+/);
  var has = function (name) { return fx.indexOf(name) !== -1; };
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (reduceMotion) return;

  /* ---------- Cursor spotlight ---------- */
  if (has('spotlight') && finePointer) {
    var spot = document.createElement('div');
    spot.className = 'cursor-spot';
    spot.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(spot, document.body.firstChild);
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      spot.style.setProperty('--cx', e.clientX + 'px');
      spot.style.setProperty('--cy', e.clientY + 'px');
      spot.classList.add('is-on');
    }, { passive: true });
    document.documentElement.addEventListener('mouseleave', function () { spot.classList.remove('is-on'); });
  }

  /* ---------- Cursor tail ---------- */
  if (has('tail') && finePointer) {
    var canvas = document.createElement('canvas');
    canvas.className = 'cursor-tail';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    var dpr = 1, W = 0, H = 0;
    var points = [];
    var LIFE = 420;       // ms a point stays visible
    var running = false;
    var night = document.documentElement.classList.contains('theme-night');

    var resize = function () {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    var draw = function (now) {
      ctx.clearRect(0, 0, W, H);
      while (points.length && now - points[0].t > LIFE) points.shift();
      if (points.length > 1) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        for (var i = 1; i < points.length; i++) {
          var p0 = points[i - 1], p1 = points[i];
          var k = i / points.length;                    // 0 = oldest, 1 = newest
          var fade = 1 - (now - p1.t) / LIFE;
          // orange near the cursor, blue toward the end of the tail
          var r = Math.round(0 + (250 - 0) * k), g = Math.round(33 + (70 - 33) * k), b = Math.round(165 + (22 - 165) * k);
          if (night) { r = Math.round(140 + 115 * k); g = Math.round(170 + 30 * k); b = 255 - Math.round(120 * k); }
          ctx.strokeStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + (0.75 * fade * k).toFixed(3) + ')';
          ctx.lineWidth = 1 + 5 * k * fade;
          ctx.beginPath();
          ctx.moveTo(p0.x, p0.y);
          ctx.lineTo(p1.x, p1.y);
          ctx.stroke();
        }
      }
      if (points.length) {
        requestAnimationFrame(draw);
      } else {
        running = false;
        ctx.clearRect(0, 0, W, H);
      }
    };

    window.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      // Browsers merge fast mouse moves into one event per frame; use every merged position for a smooth tail.
      var list = (e.getCoalescedEvents && e.getCoalescedEvents()) || [];
      if (!list.length) list = [e];
      var now = performance.now();
      for (var j = 0; j < list.length; j++) points.push({ x: list[j].clientX, y: list[j].clientY, t: now });
      while (points.length > 60) points.shift();
      if (!running) { running = true; requestAnimationFrame(draw); }
    }, { passive: true });
  }

  /* ---------- Ripple ---------- */
  if (has('ripple')) {
    var HOSTS = '.btn, .icon-btn, .tab, .place-card, .to-top, .lb-btn, .dialog-close, .cite-btn';
    var INTERACTIVE = 'a, button, input, textarea, select, label, summary, [role="button"], .leaflet-container, .research-banner';
    document.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      var host = e.target.closest && e.target.closest(HOSTS);
      if (host) {
        var b = host.getBoundingClientRect();
        var size = Math.max(b.width, b.height) * 2.2;
        var wave = document.createElement('span');
        wave.className = 'ripple';
        wave.style.width = wave.style.height = size + 'px';
        wave.style.left = (e.clientX - b.left) + 'px';
        wave.style.top = (e.clientY - b.top) + 'px';
        host.appendChild(wave);
        wave.addEventListener('animationend', function () { wave.remove(); });
        return;
      }
      if (e.target.closest && e.target.closest(INTERACTIVE)) return;
      var ring = document.createElement('span');
      ring.className = 'click-ring';
      ring.setAttribute('aria-hidden', 'true');
      ring.style.left = e.clientX + 'px';
      ring.style.top = e.clientY + 'px';
      document.body.appendChild(ring);
      ring.addEventListener('animationend', function () { ring.remove(); });
    });
  }
})();
