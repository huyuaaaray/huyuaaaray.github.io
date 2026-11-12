/* Easter eggs, round 4. Each has a switch and texts in _config.yml → eggs. */
(function () {
  'use strict';

  var D = {};
  try { D = JSON.parse((document.getElementById('egg-data') || {}).textContent || '{}') || {}; } catch (e) { return; }
  var E = D.eggs || {};
  var on = function (k) { return E[k] && E[k].show !== false; };
  var root = document.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var toast = function (t, ms) { if (window.siteToast) window.siteToast(t, ms); };
  var make = function (cls, html) {
    var el = document.createElement('div');
    el.className = cls;
    el.setAttribute('aria-hidden', 'true');
    if (html) el.innerHTML = html;
    document.body.appendChild(el);
    return el;
  };

  /* ---------- Typed words ---------- */
  var words = {};
  var add = function (key, fallback, fn) { if (on(key)) words[String(E[key].word || fallback).toLowerCase()] = fn; };
  add('sudo', 'sudo', sudo);
  add('uf_chomp', 'uf', ufChomp);
  add('matrix', 'matrix', matrix);
  add('star_now', 'star', function () { if (window.siteConstellation) window.siteConstellation(); });
  if (document.querySelector('.not-found')) add('home_word', 'home', goHome);
  var typed = '';
  window.addEventListener('keydown', function (e) {
    if (!e.key || e.key.length !== 1 || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    typed = (typed + e.key.toLowerCase()).slice(-16);
    // check longer words first, so "uf" doesn't fire in the middle of something longer
    Object.keys(words).sort(function (a, b) { return b.length - a.length; }).some(function (w) {
      if (typed.slice(-w.length) !== w) return false;
      typed = '';
      words[w]();
      return true;
    });
  });

  // sudo: a little terminal that politely refuses
  function sudo() {
    if (document.querySelector('.egg-term.is-sudo')) return;
    var t = document.createElement('div');
    t.className = 'egg-term is-sudo';
    t.setAttribute('role', 'log');
    t.innerHTML = '<div class="et-bar"><i></i><i></i><i></i><span>bash</span><button type="button" aria-label="Close">&times;</button></div><pre class="et-body"></pre>';
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('is-shown'); });
    var body = t.querySelector('.et-body'), lines = E.sudo.lines || [], li = 0, ci = 0;
    var close = function () { t.classList.remove('is-shown'); setTimeout(function () { t.remove(); }, 400); };
    t.querySelector('button').addEventListener('click', close);
    var type = function () {
      if (!t.parentNode) return;
      if (li >= lines.length) { setTimeout(close, 6000); return; }
      body.textContent += lines[li].charAt(ci++);
      if (ci >= lines[li].length) { body.textContent += '\n'; li++; ci = 0; setTimeout(type, 450); } else setTimeout(type, li === 0 ? 30 : 12);
    };
    setTimeout(type, 250);
  }

  // uf: the Gator Chomp, two arms clapping like jaws
  function ufChomp() {
    if (document.querySelector('.egg-chomp')) return;
    var c = make('egg-chomp', '<span class="ec-arm ec-top"></span><span class="ec-arm ec-bottom"></span>');
    if (E.uf_chomp.text) toast(E.uf_chomp.text, 2400);
    setTimeout(function () { c.remove(); }, 2600);
  }

  // matrix: green code raining down the whole screen
  function matrix() {
    if (document.querySelector('.egg-matrix') || reduceMotion) return;
    var wrap = make('egg-matrix', '<canvas></canvas>');
    var cv = wrap.querySelector('canvas'), x = cv.getContext('2d');
    var W = cv.width = innerWidth, H = cv.height = innerHeight, size = 16, cols = Math.ceil(W / size);
    var drops = []; for (var i = 0; i < cols; i++) drops.push(Math.random() * -40);
    var chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789GATORS';
    var t0 = performance.now();
    var step = function (now) {
      x.fillStyle = 'rgba(0, 0, 0, 0.08)';
      x.fillRect(0, 0, W, H);
      x.fillStyle = '#39ff6a';
      x.font = size + 'px monospace';
      drops.forEach(function (d, k) {
        x.fillText(chars.charAt((Math.random() * chars.length) | 0), k * size, d * size);
        drops[k] = d * size > H && Math.random() > 0.975 ? 0 : d + 1;
      });
      if (now - t0 < 5000) requestAnimationFrame(step);
      else { wrap.classList.add('is-out'); setTimeout(function () { wrap.remove(); }, 700); }
    };
    requestAnimationFrame(step);
  }

  // 404 page: type "home" to go home (with the usual page transition)
  function goHome() {
    var a = document.createElement('a');
    a.href = '/';
    document.body.appendChild(a);
    a.click();
  }

  /* ---------- Hover the header gator for a few seconds: it falls asleep ---------- */
  if (on('gator_nap')) {
    var brand = document.querySelector('.brand');
    var napTimer = null;
    if (brand) {
      brand.addEventListener('mouseenter', function () {
        napTimer = setTimeout(function () {
          brand.classList.add('is-napping');
          var z = document.createElement('span');
          z.className = 'nap-z';
          z.setAttribute('aria-hidden', 'true');
          z.textContent = 'z z z';
          brand.appendChild(z);
        }, Math.max(1, Number(E.gator_nap.seconds || 5)) * 1000);
      });
      brand.addEventListener('mouseleave', function () {
        clearTimeout(napTimer);
        brand.classList.remove('is-napping');
        Array.prototype.forEach.call(brand.querySelectorAll('.nap-z'), function (n) { n.remove(); });
      });
    }
  }

  /* ---------- Disco lights: after switching themes again and again, and when the big name is clicked ---------- */
  var disco = function () {
    if (reduceMotion || document.querySelector('.egg-disco')) return;
    var d = make('egg-disco', '<i></i><i></i><i></i><i></i><i></i><i></i>');
    setTimeout(function () { d.remove(); }, 3200);
  };
  var bigName = document.querySelector('.display-name');
  if (on('name_disco') && bigName) bigName.addEventListener('click', function (e) {
    if (!window.siteIsYuClick || window.siteIsYuClick(e)) disco();
  });
  if (on('theme_disco')) {
    var tb = document.querySelector('.theme-toggle'), hits = [];
    if (tb) tb.addEventListener('click', function () {
      var now = Date.now();
      hits.push(now);
      hits = hits.filter(function (t) { return now - t < 12000; });
      if (hits.length >= Number(E.theme_disco.toggles || 5)) {
        hits = [];
        setTimeout(function () {
          toast(E.theme_disco.text || '', 3000);
          disco();
        }, 800);
      }
    });
  }

  /* ---------- Select all (Ctrl/Cmd + A): the selection turns blue → purple → orange down the page ---------- */
  if (on('select_all')) {
    window.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'a' || e.key === 'A') && !(e.target && /^(INPUT|TEXTAREA)$/.test(e.target.tagName))) {
        root.classList.add('all-selected');
      }
    });
    document.addEventListener('selectionchange', function () {
      var sel = document.getSelection();
      if (!sel || sel.isCollapsed) root.classList.remove('all-selected');
    });
  }

  /* ---------- Make the window very narrow: a squeezed gator ---------- */
  if (on('squeeze')) {
    // only when a person drags a wide window narrow (not while the page is still loading)
    var limit = Number(E.squeeze.width || 480), wasWide = innerWidth > limit + 60, sqCool = Date.now() + 4000;
    window.addEventListener('resize', function () {
      if (innerWidth > limit + 60) { wasWide = true; return; }
      if (innerWidth < limit && wasWide && Date.now() > sqCool && !document.hidden) {
        wasWide = false; sqCool = Date.now() + 8000;
        var s = make('egg-squeeze', '<span class="sq-gator">🐊</span><span class="sq-text"></span>');
        s.querySelector('.sq-text').textContent = E.squeeze.text || '';
        setTimeout(function () { s.remove(); }, 3200);
      }
    });
  }

  /* ---------- On the hour: a chime; at midnight: a new day ---------- */
  var chime = function () {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      var ac = new AC();
      if (ac.state === 'suspended') ac.resume().catch(function () {});
      [880, 660].forEach(function (f, k) {
        var t = ac.currentTime + k * 0.5, o = ac.createOscillator(), g = ac.createGain();
        o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.18, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
        o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + 1.5);
      });
      setTimeout(function () { try { ac.close(); } catch (e) { /* ignore */ } }, 2500);
    } catch (e) { /* sound not allowed yet */ }
  };
  var nowText = function () { return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }); };
  var scheduleHour = function () {
    var d = new Date(), next = new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours() + 1, 0, 0, 200);
    setTimeout(function () {
      var midnight = new Date().getHours() === 0;
      if (midnight && on('midnight')) {
        toast(E.midnight.text || '', 5000);
        if (window.siteConfetti && !reduceMotion) window.siteConfetti();
      } else if (on('hourly_chime')) {
        toast('🔔 ' + nowText(), 3500);
      }
      if (on('hourly_chime')) chime();
      scheduleHour();
    }, next - d);
  };
  if (on('hourly_chime') || on('midnight')) scheduleHour();
  if (on('midnight') && new Date().getHours() === 0 && new Date().getMinutes() < 5) {
    try { if (!sessionStorage.getItem('midnightShown')) { sessionStorage.setItem('midnightShown', '1'); setTimeout(function () { toast(E.midnight.text || '', 5000); }, 1500); } } catch (e) { /* ignore */ }
  }
  if (/[?&]egg=chime\b/.test(location.search)) setTimeout(function () { toast('🔔 ' + nowText(), 3500); chime(); }, 1000);

  /* ---------- Footer: point at the city name and the mascot waves ---------- */
  if (on('city_wave')) {
    var city = document.querySelector('.ln-city');
    if (city) {
      city.classList.add('city-hover');
      var w = document.createElement('span');
      w.className = 'city-gator';
      w.setAttribute('aria-hidden', 'true');
      w.textContent = '🐊👋';
      city.appendChild(w);
    }
  }

  /* ---------- News: click the newest dot three times and the timeline lights up ---------- */
  if (on('news_dots')) {
    var first = document.querySelector('.news-dot.is-latest');
    var dotClicks = 0, dotTimer = null;
    if (first) {
      first.style.pointerEvents = 'auto';
      first.style.cursor = 'pointer';
      first.addEventListener('click', function (e) {
        e.stopPropagation();
        dotClicks++;
        clearTimeout(dotTimer);
        dotTimer = setTimeout(function () { dotClicks = 0; }, 900);
        if (dotClicks < Number(E.news_dots.clicks || 3)) return;
        dotClicks = 0;
        var dots = document.querySelectorAll('.news li:not([hidden]) .news-dot');
        Array.prototype.forEach.call(dots, function (d, k) {
          setTimeout(function () {
            d.classList.remove('dot-pop'); void d.offsetWidth; d.classList.add('dot-pop');
          }, k * 220);
        });
      });
    }
  }
})();
