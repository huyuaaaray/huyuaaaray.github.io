/* More easter eggs, each with a switch and texts in _config.yml → eggs.
   Previews: ?egg=friday, ?egg=aprilfools, ?egg=piday, ?egg=longread */
(function () {
  'use strict';

  var D = {};
  try { D = JSON.parse((document.getElementById('egg-data') || {}).textContent || '{}') || {}; } catch (e) { return; }
  var E = D.eggs || {};
  var on = function (k) { return E[k] && E[k].show !== false; };
  var root = document.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var preview = (location.search.match(/[?&]egg=([a-z]+)/) || [])[1] || '';
  var toast = function (t, ms) { if (window.siteToast) window.siteToast(t, ms); };
  var once = function (key) {
    try { if (sessionStorage.getItem(key)) return false; sessionStorage.setItem(key, '1'); } catch (e) { /* ignore */ }
    return true;
  };
  var today = new Date();
  var md = String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

  /* ---------- Typed words: "hire" and "chomp" ---------- */
  var words = {};
  if (on('hire')) words[String(E.hire.word || 'hire').toLowerCase()] = hireCard;
  if (on('chomp')) words[String(E.chomp.word || 'chomp').toLowerCase()] = chompPage;
  var typed = '';
  window.addEventListener('keydown', function (e) {
    if (!e.key || e.key.length !== 1) return;
    if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    typed = (typed + e.key.toLowerCase()).slice(-12);
    Object.keys(words).forEach(function (w) { if (typed.slice(-w.length) === w) { typed = ''; words[w](); } });
  });

  function hireCard() {
    if (document.querySelector('.egg-hire')) return;
    var h = E.hire, c = document.createElement('div');
    c.className = 'egg-hire';
    c.setAttribute('role', 'dialog');
    c.setAttribute('aria-label', h.title || '');
    c.innerHTML = '<button type="button" class="eh-close" aria-label="Close">&times;</button><p class="eh-title"></p><p class="eh-text"></p>' +
      '<div class="eh-actions"><a class="btn btn-primary" href="/resume.pdf" download></a><a class="btn" href="mailto:' + (D.email || '') + '"></a></div>';
    c.querySelector('.eh-title').textContent = h.title || '';
    c.querySelector('.eh-text').textContent = h.text || '';
    c.querySelector('.btn-primary').textContent = h.cv_label || 'CV';
    c.querySelector('.eh-actions .btn:not(.btn-primary)').textContent = h.email_label || 'Email';
    var close = function () { c.classList.remove('is-shown'); setTimeout(function () { c.remove(); }, 400); };
    c.querySelector('.eh-close').addEventListener('click', close);
    document.body.appendChild(c);
    requestAnimationFrame(function () { requestAnimationFrame(function () { c.classList.add('is-shown'); }); });
    if (window.siteConfetti && !reduceMotion) window.siteConfetti();
  }

  function chompPage() {
    var targets = document.querySelectorAll('.photo, .place-card, .news li, .ask-box, .research-banner, .cv-section .entry, .stat-strip li');
    Array.prototype.forEach.call(targets, function (el, i) {
      setTimeout(function () {
        if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
        el.classList.add('is-bitten');
        // cracks around the bite, and a few crumbs falling off
        var crack = document.createElement('span');
        crack.className = 'bite-crack';
        crack.setAttribute('aria-hidden', 'true');
        el.appendChild(crack);
        var w = el.getBoundingClientRect().width, size = Math.min(160, w * 0.6);
        for (var c = 0; c < 6; c++) {
          var cr = document.createElement('span');
          cr.className = 'bite-crumb';
          cr.setAttribute('aria-hidden', 'true');
          cr.style.right = (size * (0.15 + Math.random() * 0.5)).toFixed(0) + 'px';
          cr.style.top = (size * (0.1 + Math.random() * 0.45)).toFixed(0) + 'px';
          cr.style.setProperty('--cx', ((Math.random() - 0.5) * 40).toFixed(0) + 'px');
          el.appendChild(cr);
          setTimeout(function (n) { return function () { n.remove(); }; }(cr), 950);
        }
        setTimeout(function () { el.classList.remove('is-bitten'); crack.remove(); }, 3200);
      }, i * 70);
    });
    toast('CHOMP! 🐊', 2000);
  }

  /* ---------- Time machine: click the year in the footer twice ---------- */
  if (on('time_machine')) {
    var yearEl = document.querySelector('.site-footer .footer-left > span:first-child');
    var tmClicks = 0, tmTimer = null;
    var exitRetro = function () {
      root.classList.remove('retro');
      var b = document.querySelector('.retro-banner');
      if (b) b.remove();
    };
    if (yearEl) {
      yearEl.classList.add('tm-year');
      yearEl.addEventListener('click', function () {
        tmClicks++;
        clearTimeout(tmTimer);
        tmTimer = setTimeout(function () { tmClicks = 0; }, 1200);
        if (tmClicks < Number(E.time_machine.clicks || 2)) return;
        tmClicks = 0;
        if (root.classList.contains('retro')) { exitRetro(); return; }
        root.classList.add('retro');
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'retro-banner';
        b.textContent = E.time_machine.text || '1999';
        b.addEventListener('click', exitRetro);
        document.body.insertBefore(b, document.body.firstChild);
        window.scrollTo(0, 0);
      });
    }
    window.addEventListener('keydown', function (e) { if (e.key === 'Escape' && root.classList.contains('retro')) exitRetro(); });
  }

  /* ---------- Draw circles with the mouse: a whirlpool and a spinning gator ----------
     Counts how far the mouse's direction of travel has turned in the last two seconds:
     every full circle turns it by 360°, whatever its size or position. */
  if (on('circle') && !reduceMotion) {
    var needTurn = Number(E.circle.circles || 2) * Math.PI * 2 * 0.9;
    var turns = [], prev = null, heading = null, cool = 0;
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      var now = performance.now();
      if (prev) {
        var dx = e.clientX - prev.x, dy = e.clientY - prev.y;
        if (dx * dx + dy * dy < 9) return;                       // ignore tiny jitters
        var h = Math.atan2(dy, dx);
        if (heading !== null) {
          var d = h - heading;
          if (d > Math.PI) d -= Math.PI * 2;
          if (d < -Math.PI) d += Math.PI * 2;
          turns.push({ d: d, t: now, x: e.clientX, y: e.clientY });
        }
        heading = h;
      }
      prev = { x: e.clientX, y: e.clientY };
      while (turns.length && now - turns[0].t > 2000) turns.shift();
      if (now < cool || turns.length < 10) return;
      var sum = 0, minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
      turns.forEach(function (q) { sum += q.d; minX = Math.min(minX, q.x); maxX = Math.max(maxX, q.x); minY = Math.min(minY, q.y); maxY = Math.max(maxY, q.y); });
      var size = Math.max(maxX - minX, maxY - minY);
      if (Math.abs(sum) >= needTurn && size > 50 && size < 600) {
        turns = []; cool = now + 4000;
        var w = document.createElement('div');
        w.className = 'egg-whirl';
        w.setAttribute('aria-hidden', 'true');
        w.innerHTML = '<span class="ew-swirl"></span><span class="ew-gator">🐊</span>';
        document.body.appendChild(w);
        setTimeout(function () { w.remove(); }, 2600);
        if (E.circle.text) toast(E.circle.text, 2000);
      }
    }, { passive: true });
  }

  /* ---------- Copying text: a gentle reminder to cite (the copied text isn't changed) ---------- */
  if (on('copy_note')) {
    var lastCopy = 0;
    document.addEventListener('copy', function () {
      if (Date.now() - lastCopy < 10000) return;
      lastCopy = Date.now();
      toast(E.copy_note.text || '', 2800);
    });
  }

  /* ---------- Printing: a thank-you line at the bottom of the paper ---------- */
  if (on('print_note')) {
    var pn = document.createElement('p');
    pn.className = 'print-thanks';
    pn.textContent = E.print_note.text || '';
    document.body.appendChild(pn);
  }

  /* ---------- Friday (visitor's own calendar) ---------- */
  if (on('friday') && (today.getDay() === 5 || preview === 'friday') && (once('fridayShown') || preview === 'friday')) {
    setTimeout(function () {
      var f = document.createElement('div');
      f.className = 'egg-badge';
      f.setAttribute('role', 'status');
      f.textContent = E.friday.text || '';
      document.body.appendChild(f);
      requestAnimationFrame(function () { requestAnimationFrame(function () { f.classList.add('is-shown'); }); });
      setTimeout(function () { f.classList.remove('is-shown'); setTimeout(function () { f.remove(); }, 500); }, 7000);
    }, 1800);
  }

  /* ---------- Rainy day in Gainesville: a little gator with an umbrella walks along the footer ---------- */
  var footer = document.querySelector('.site-footer');
  if (on('rain_gator') && footer) {
    var rg = document.createElement('span');
    rg.className = 'rain-gator';
    rg.setAttribute('aria-hidden', 'true');
    rg.innerHTML = '<span class="rg-umbrella">☂️</span><span class="rg-gator">🐊</span>';
    footer.appendChild(rg);
  }

  /* ---------- Click the sun in the footer: a gator in sunglasses ---------- */
  if (on('sun_click') && footer) {
    footer.addEventListener('click', function (e) {
      if (!e.target.closest || !e.target.closest('.fs-glow')) return;
      var s = document.createElement('span');
      s.className = 'sun-gator';
      s.innerHTML = '<span class="sg-face">😎🐊</span><span class="sg-text"></span>';
      s.querySelector('.sg-text').textContent = E.sun_click.text || '';
      var r = e.target.getBoundingClientRect(), fr = footer.getBoundingClientRect();
      s.style.right = Math.max(8, fr.right - r.left + 10) + 'px';
      footer.appendChild(s);
      setTimeout(function () { s.remove(); }, 3200);
    });
  }

  /* ---------- Reading for a while: a coffee ---------- */
  if (on('long_read')) {
    var need = Math.max(1, Number(E.long_read.minutes || 5)) * 60, seen = 0;
    if (preview === 'longread') need = 2;
    var timer = setInterval(function () {
      if (document.hidden) return;
      if (++seen >= need) {
        clearInterval(timer);
        if (once('coffeeShown') || preview === 'longread') toast(E.long_read.text || '', 5000);
      }
    }, 1000);
  }

  /* ---------- Ask about Yu: a hidden question after all the others ---------- */
  if (on('ask_joke')) {
    var jokeChip = document.querySelector('.ask-chip[data-q="joke"]');
    var chips = document.querySelectorAll('.ask-chip:not([data-q="joke"])');
    if (jokeChip && chips.length) {
      Array.prototype.forEach.call(chips, function (c) {
        c.addEventListener('click', function () {
          setTimeout(function () {
            var all = Array.prototype.every.call(chips, function (x) { return x.classList.contains('is-asked'); });
            if (all && jokeChip.hidden) { jokeChip.hidden = false; jokeChip.classList.add('is-new'); }
          }, 50);
        });
      });
    }
  }

  /* ---------- "HiPerGator" in the About text: a gator hugging a hot GPU ---------- */
  if (on('hipergator')) {
    var word = E.hipergator.word || 'HiPerGator';
    var prose = document.querySelectorAll('.intro-about .prose p');
    Array.prototype.forEach.call(prose, function (p) {
      var walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT), hit = null;
      while (walker.nextNode()) { if (walker.currentNode.nodeValue.indexOf(word) !== -1) { hit = walker.currentNode; break; } }
      if (!hit) return;
      var at = hit.nodeValue.indexOf(word);
      var after = hit.splitText(at);
      after.splitText(word.length);
      var span = document.createElement('span');
      span.className = 'hpg';
      span.setAttribute('data-tip', E.hipergator.text || '');
      span.setAttribute('tabindex', '0');
      after.parentNode.replaceChild(span, after);
      span.appendChild(after);
    });
  }

  /* ---------- 404 page: a random alligator fact ---------- */
  var nf = document.querySelector('.not-found');
  if (on('gator_facts') && nf && (E.gator_facts.facts || []).length) {
    var facts = E.gator_facts.facts;
    var fp = document.createElement('p');
    fp.className = 'gator-fact';
    fp.innerHTML = '<strong></strong> <span></span>';
    fp.querySelector('strong').textContent = '🐊 ' + (E.gator_facts.label || '') + ':';
    fp.querySelector('span').textContent = facts[(Math.random() * facts.length) | 0];
    var firstP = nf.querySelector('p');
    if (firstP) firstP.parentNode.insertBefore(fp, firstP.nextSibling); else nf.appendChild(fp);
  }

  /* ---------- Sleeping tab icon while the visitor is away ---------- */
  if (on('sleepy_icon')) {
    var links = Array.prototype.slice.call(document.querySelectorAll('link[rel~="icon"]'));
    var originals = links.map(function (l) { return l.href; });
    var sleepy = null;
    var makeSleepy = function (done) {
      var img = new Image();
      img.onload = function () {
        var c = document.createElement('canvas'); c.width = c.height = 64;
        var x = c.getContext('2d');
        x.globalAlpha = 0.55;
        x.drawImage(img, 0, 8, 64, 48);
        x.globalAlpha = 1;
        x.font = 'bold 30px sans-serif';
        x.fillStyle = '#4a6cf7';
        x.fillText('z', 40, 26);
        x.font = 'bold 20px sans-serif';
        x.fillText('z', 28, 14);
        sleepy = c.toDataURL('image/png');
        done();
      };
      img.src = '/favicon-32.png';
    };
    var setIcons = function (href) { links.forEach(function (l, i) { l.href = href || originals[i]; }); };
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { if (sleepy) setIcons(sleepy); else makeSleepy(function () { if (document.hidden) setIcons(sleepy); }); }
      else setIcons(null);
    });
  }

  /* ---------- April Fools' Day (visitor's own calendar) ---------- */
  if (on('april_fools') && (md === '04-01' || preview === 'aprilfools') && !reduceMotion) {
    setTimeout(function () {
      root.classList.add('upside-down');
      setTimeout(function () {
        root.classList.remove('upside-down');
        toast(E.april_fools.text || '', 3500);
      }, 3000);
    }, 600);
  }

  /* ---------- Pi Day: digits of π scroll by, and a π joins the stats ---------- */
  if (on('pi_day') && (md === '03-14' || preview === 'piday')) {
    var digits = String(E.pi_day.digits || '3.14159');
    var chunks = [digits.slice(0, 7)];
    for (var i = 7; i < digits.length; i += 10) chunks.push(digits.slice(i, i + 10));
    Array.prototype.forEach.call(document.querySelectorAll('.marquee-list'), function (ul) {
      ul.innerHTML = '';
      chunks.forEach(function (ch) { var li = document.createElement('li'); li.textContent = ch; ul.appendChild(li); });
    });
    var strip = document.querySelector('.stat-strip');
    if (strip) {
      var pi = document.createElement('li');
      pi.className = 'pi-stat';
      pi.innerHTML = '<span class="stat-num">π</span><span class="stat-label">Happy Pi Day!</span>';
      strip.appendChild(pi);
    }
  }
})();
