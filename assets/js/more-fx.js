/* More effects, each switched on/off in _config.yml → effects:
   marker_highlight, aurora, scroll_line, tilt_cards, blur_load. */
(function () {
  'use strict';

  var root = document.documentElement;
  var fx = (root.getAttribute('data-fx') || '').split(/\s+/);
  var has = function (n) { return fx.indexOf(n) !== -1; };
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var D = {};
  try { D = JSON.parse((document.getElementById('egg-data') || {}).textContent || '{}') || {}; } catch (e) { D = {}; }

  /* ---------- Highlighter: a few key terms on the CV get a marker stroke as they scroll in ---------- */
  var cvBody = document.querySelector('.cv-body');
  if (has('marker') && cvBody && (D.highlights || []).length) {
    var esc = function (t) { return t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); };
    var re = new RegExp('(' + D.highlights.map(esc).join('|') + ')', 'g');
    var walker = document.createTreeWalker(cvBody, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        return n.parentNode.closest('mark, code, script, button, .visually-hidden') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
    });
    var nodes = [];
    while (walker.nextNode()) if (re.test(walker.currentNode.nodeValue)) nodes.push(walker.currentNode);
    var used = {};                                  // highlight each term only the first time it appears
    nodes.forEach(function (n) {
      re.lastIndex = 0;
      var frag = document.createDocumentFragment(), text = n.nodeValue, at = 0, m;
      while ((m = re.exec(text))) {
        if (used[m[0]]) continue;
        used[m[0]] = true;
        if (m.index > at) frag.appendChild(document.createTextNode(text.slice(at, m.index)));
        var mk = document.createElement('mark');
        mk.className = 'hl';
        mk.textContent = m[0];
        frag.appendChild(mk);
        at = m.index + m[0].length;
      }
      if (at < text.length) frag.appendChild(document.createTextNode(text.slice(at)));
      n.parentNode.replaceChild(frag, n);
    });
    var marks = cvBody.querySelectorAll('mark.hl');
    if (reduceMotion || !('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(marks, function (m) { m.classList.add('is-on'); });
    } else {
      var mio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add('is-on');
          mio.unobserve(e.target);
        });
      }, { rootMargin: '0px 0px -15% 0px' });
      Array.prototype.forEach.call(marks, function (m) { mio.observe(m); });
    }
  }

  /* ---------- Aurora: slow colored light behind the name on the home page ---------- */
  var intro = document.querySelector('.intro');
  if (has('aurora') && intro) {
    var au = document.createElement('div');
    au.className = 'aurora';
    au.setAttribute('aria-hidden', 'true');
    au.innerHTML = '<span class="au a1"></span><span class="au a2"></span><span class="au a3"></span>';
    intro.insertBefore(au, intro.firstChild);
  }

  /* ---------- Scroll line: a hand-drawn line down the home page that draws itself as you scroll ---------- */
  var main = document.querySelector('main');
  if (has('scrollline') && intro && main) {
    var stops = Array.prototype.filter.call(
      document.querySelectorAll('.intro-about .section-title, .research-wrap, .stat-strip, .home-news .section-title, .ask .section-title'),
      Boolean);
    if (stops.length > 1) {
      var NS = 'http://www.w3.org/2000/svg';
      var svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('class', 'scroll-line');
      svg.setAttribute('aria-hidden', 'true');
      var ghost = document.createElementNS(NS, 'path');
      ghost.setAttribute('class', 'sl-ghost');
      var path = document.createElementNS(NS, 'path');
      path.setAttribute('class', 'sl-path');
      svg.appendChild(ghost);
      svg.appendChild(path);
      var dots = stops.map(function () {
        var c = document.createElementNS(NS, 'circle');
        c.setAttribute('r', '5');
        c.setAttribute('class', 'sl-dot');
        svg.appendChild(c);
        return c;
      });
      main.style.position = 'relative';
      main.appendChild(svg);
      var len = 0, pts = [];
      var layout = function () {
        var mb = main.getBoundingClientRect();
        var container = intro.getBoundingClientRect();
        var x0 = container.left - mb.left - 34;
        if (x0 < 8) { svg.style.display = 'none'; return; }       // no room on narrow screens
        svg.style.display = '';
        svg.setAttribute('width', mb.width);
        svg.setAttribute('height', mb.height);
        pts = stops.map(function (el, k) {
          var r = el.getBoundingClientRect();
          return { x: x0 + (k % 2 ? 10 : -6), y: r.top - mb.top + Math.min(24, r.height / 2) };
        });
        var d = 'M' + pts[0].x + ' ' + pts[0].y;
        for (var k = 1; k < pts.length; k++) {
          var a = pts[k - 1], b = pts[k], my = (a.y + b.y) / 2;
          d += ' C' + (a.x + 26) + ' ' + my + ', ' + (b.x - 26) + ' ' + my + ', ' + b.x + ' ' + b.y;
        }
        ghost.setAttribute('d', d);
        path.setAttribute('d', d);
        len = path.getTotalLength();
        path.style.strokeDasharray = len;
        dots.forEach(function (c, k) { c.setAttribute('cx', pts[k].x); c.setAttribute('cy', pts[k].y); });
        draw();
      };
      var draw = function () {
        if (!len) return;
        var mb = main.getBoundingClientRect();
        var reach = window.innerHeight * 0.7 - mb.top;               // how far down the line should be drawn
        var first = pts[0].y, last = pts[pts.length - 1].y;
        var t = reduceMotion ? 1 : Math.max(0, Math.min(1, (reach - first) / (last - first)));
        path.style.strokeDashoffset = (len * (1 - t)).toFixed(1);
        dots.forEach(function (c, k) { c.classList.toggle('is-on', reduceMotion || reach >= pts[k].y); });
      };
      var tick = false;
      window.addEventListener('scroll', function () {
        if (!tick) { tick = true; requestAnimationFrame(function () { tick = false; draw(); }); }
      }, { passive: true });
      window.addEventListener('resize', layout);
      window.addEventListener('load', layout);
      setTimeout(layout, 300);
      setTimeout(layout, 2500);                                         // again after fonts and reveals settle
    }
  }

  /* ---------- 3D tilt cards: News items, place cards and CV entries tilt toward the mouse ---------- */
  if (has('tilt') && finePointer && !reduceMotion) {
    var bindTilt = function (el, max) {
      var glare = document.createElement('span');
      glare.className = 'tilt-glare';
      glare.setAttribute('aria-hidden', 'true');
      el.appendChild(glare);
      el.addEventListener('pointermove', function (e) {
        if (root.classList.contains('lite')) return;
        var b = el.getBoundingClientRect();
        var px = (e.clientX - b.left) / b.width, py = (e.clientY - b.top) / b.height;
        el.style.transform = 'perspective(900px) rotateX(' + ((0.5 - py) * max).toFixed(2) + 'deg) rotateY(' + ((px - 0.5) * max).toFixed(2) + 'deg) translateY(-3px)';
        glare.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
        glare.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
        el.classList.add('is-tilting');
      });
      el.addEventListener('pointerleave', function () {
        el.style.transform = '';
        el.classList.remove('is-tilting');
      });
    };
    Array.prototype.forEach.call(document.querySelectorAll('.place-card'), function (el) { bindTilt(el, 10); });
    Array.prototype.forEach.call(document.querySelectorAll('.news li'), function (el) { bindTilt(el, 4); });
    Array.prototype.forEach.call(document.querySelectorAll('.cv-section .entry'), function (el) { bindTilt(el, 3); });
  }

  /* ---------- Blur-up images: photos come into focus as they load ---------- */
  if (has('blurload') && !reduceMotion) {
    var SEL = '.photo img, .place-media img, .polaroid img, .media-grid img, .tip-img';
    var prep = function (img) {
      if (img.dataset.blurDone) return;
      img.dataset.blurDone = '1';
      if (img.complete && img.naturalWidth) return;                  // already there: nothing to animate
      img.classList.add('blur-load');
      var done = function () { img.classList.add('is-loaded'); };
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true });
    };
    Array.prototype.forEach.call(document.querySelectorAll(SEL), prep);
    if ('MutationObserver' in window) {
      new MutationObserver(function (list) {
        list.forEach(function (m) {
          Array.prototype.forEach.call(m.addedNodes, function (n) {
            if (n.nodeType !== 1) return;
            if (n.matches && n.matches(SEL)) prep(n);
            if (n.querySelectorAll) Array.prototype.forEach.call(n.querySelectorAll(SEL), prep);
          });
        });
      }).observe(document.body, { childList: true, subtree: true });
    }
  }
})();
