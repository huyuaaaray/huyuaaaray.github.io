/* More effects, each switched on/off in _config.yml (effects):
   intro, title_letters, local_weather, cv_timeline, copy_citation. */
(function () {
  'use strict';

  var root = document.documentElement;
  var fx = (root.getAttribute('data-fx') || '').split(/\s+/);
  var has = function (name) { return fx.indexOf(name) !== -1; };
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- First-visit intro ----------
     head.html decides whether to play it (adds the "intro" class before the page paints).
     The drawing and the curtain are CSS animations; this just tidies up afterwards. */
  if (root.classList.contains('intro')) {
    try { localStorage.setItem('introSeen', '1'); } catch (e) { /* storage blocked */ }
    var introDone = false;
    var finishIntro = function () {
      if (introDone) return;
      introDone = true;
      root.classList.remove('intro', 'intro-skip');
      window.dispatchEvent(new CustomEvent('introdone'));
    };
    var skipIntro = function () {
      if (introDone || root.classList.contains('intro-skip')) return;
      root.classList.add('intro-skip');          // quick fade instead of the full sequence
      setTimeout(finishIntro, 450);
    };
    setTimeout(finishIntro, 2900);
    window.addEventListener('keydown', skipIntro, { once: true });
    window.addEventListener('pointerdown', skipIntro, { once: true });
    window.addEventListener('wheel', skipIntro, { once: true, passive: true });
  }

  /* ---------- Section titles appear letter by letter ---------- */
  if (has('letters') && !reduceMotion && 'IntersectionObserver' in window) {
    var titles = document.querySelectorAll('.section-title, .cv-section > h2, .page-head h1');
    var titleIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        titleIO.unobserve(e.target);
      });
    }, { threshold: 0.6 });

    Array.prototype.forEach.call(titles, function (h) {
      var text = h.textContent.replace(/\s+/g, ' ').trim();
      if (!text) return;
      h.textContent = '';
      var sr = document.createElement('span');
      sr.className = 'visually-hidden';
      sr.textContent = text;
      h.appendChild(sr);
      var shown = document.createElement('span');
      shown.setAttribute('aria-hidden', 'true');
      var n = 0;
      text.split(' ').forEach(function (word, wi) {
        if (wi > 0) shown.appendChild(document.createTextNode(' '));
        var w = document.createElement('span');
        w.className = 'tl-word';                 // keeps each word together when the line wraps
        Array.prototype.forEach.call(word, function (ch) {
          var c = document.createElement('span');
          c.className = 'tl-ch';
          c.style.setProperty('--i', n++);
          c.textContent = ch;
          w.appendChild(c);
        });
        shown.appendChild(w);
      });
      h.appendChild(shown);
      h.classList.add('split-title');
      titleIO.observe(h);
    });
  }

  /* ---------- Footer: local time and weather ---------- */
  var now = document.querySelector('.local-now');
  if (now && has('weather')) {
    var tz = now.getAttribute('data-tz') || 'America/New_York';
    var timeEl = now.querySelector('.ln-time');
    var weatherEl = now.querySelector('.ln-weather');
    var labels = {};
    try { labels = JSON.parse(now.getAttribute('data-labels') || '{}') || {}; } catch (e) { labels = {}; }
    var fmt = null;
    try { fmt = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: tz }); } catch (e) { fmt = null; }

    var tick = function () {
      if (!fmt) return;
      timeEl.textContent = fmt.format(new Date());
      now.hidden = false;
    };
    tick();
    // update right after each minute changes
    setTimeout(function () { tick(); setInterval(tick, 60000); }, 60000 - (Date.now() % 60000) + 50);

    // WMO weather codes from Open-Meteo, grouped into a few kinds
    var kindOf = function (code) {
      if (code === 0) return 'clear';
      if (code === 1 || code === 2) return 'partly';
      if (code === 3) return 'cloudy';
      if (code === 45 || code === 48) return 'fog';
      if (code >= 51 && code <= 57) return 'drizzle';
      if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
      if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
      if (code >= 95) return 'storm';
      return 'cloudy';
    };
    var ICONS = { clear: '\u2600\uFE0F', partly: '\u26C5', cloudy: '\u2601\uFE0F', fog: '\uD83C\uDF2B\uFE0F',
                  drizzle: '\uD83C\uDF26\uFE0F', rain: '\uD83C\uDF27\uFE0F', snow: '\u2744\uFE0F', storm: '\u26C8\uFE0F' };
    var showWeather = function (w) {
      var kind = kindOf(w.code);
      var icon = kind === 'clear' && !w.day ? '\uD83C\uDF19' : ICONS[kind];
      var unit = (now.getAttribute('data-unit') || 'F').toUpperCase() === 'C' ? 'C' : 'F';
      weatherEl.textContent = icon + ' ' + (labels[kind] || '') + ' ' + Math.round(w.temp) + '\u00B0' + unit;
      weatherEl.title = labels[kind] || '';
      now.classList.add('has-weather');
    };

    // Ask Open-Meteo (free, no key) at most every 15 minutes per visitor.
    var CACHE = 'weather:' + now.getAttribute('data-lat') + ',' + now.getAttribute('data-lng');
    var cached = null;
    try { cached = JSON.parse(sessionStorage.getItem(CACHE) || 'null'); } catch (e) { cached = null; }
    if (cached && Date.now() - cached.t < 15 * 60000) {
      showWeather(cached);
    } else if (window.fetch) {
      var unitParam = (now.getAttribute('data-unit') || 'F').toUpperCase() === 'C' ? 'celsius' : 'fahrenheit';
      var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + encodeURIComponent(now.getAttribute('data-lat')) +
        '&longitude=' + encodeURIComponent(now.getAttribute('data-lng')) +
        '&current=temperature_2m,weather_code,is_day&temperature_unit=' + unitParam;
      fetch(url)
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) {
          if (!d || !d.current) return;
          var w = { t: Date.now(), temp: d.current.temperature_2m, code: d.current.weather_code, day: d.current.is_day === 1 };
          try { sessionStorage.setItem(CACHE, JSON.stringify(w)); } catch (e) { /* ignore */ }
          showWeather(w);
        })
        .catch(function () { /* the time still shows without weather */ });
    }
  }

  /* ---------- CV: a timeline line that grows as you scroll ---------- */
  var timelines = has('timeline') ? document.querySelectorAll('[data-timeline]') : [];
  if (timelines.length) {
    var lines = [];
    Array.prototype.forEach.call(timelines, function (tl) {
      tl.classList.add('has-timeline');
      var track = document.createElement('span');
      track.className = 'tl-track';
      track.setAttribute('aria-hidden', 'true');
      var fill = document.createElement('span');
      fill.className = 'tl-fill';
      track.appendChild(fill);
      tl.insertBefore(track, tl.firstChild);
      var dots = Array.prototype.map.call(tl.querySelectorAll(':scope > .entry'), function (entry) {
        var d = document.createElement('span');
        d.className = 'tl-dot';
        d.setAttribute('aria-hidden', 'true');
        entry.insertBefore(d, entry.firstChild);
        return d;
      });
      lines.push({ el: tl, fill: fill, dots: dots });
    });

    var updateLines = function () {
      var line = window.innerHeight * 0.62;            // the line grows down to here on screen
      lines.forEach(function (t) {
        var r = t.el.getBoundingClientRect();
        var reach = reduceMotion ? r.height : Math.max(0, Math.min(r.height, line - r.top));
        t.fill.style.transform = 'scaleY(' + (r.height ? reach / r.height : 0).toFixed(4) + ')';
        t.dots.forEach(function (d) {
          var y = d.getBoundingClientRect().top + 5 - r.top;
          d.classList.toggle('is-on', y <= reach);
        });
      });
    };
    var lineTick = false;
    window.addEventListener('scroll', function () {
      if (!lineTick) { lineTick = true; requestAnimationFrame(function () { lineTick = false; updateLines(); }); }
    }, { passive: true });
    window.addEventListener('resize', updateLines);
    updateLines();
  }

  /* ---------- CV: copy a publication's citation ---------- */
  if (has('cite')) {
    var copyText = function (text) {
      if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
      return new Promise(function (resolve, reject) {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
        document.body.appendChild(ta);
        ta.select();
        var ok = false;
        try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
        ta.remove();
        if (ok) resolve(); else reject(new Error('copy failed'));
      });
    };
    Array.prototype.forEach.call(document.querySelectorAll('.cite-btn'), function (btn) {
      var label = btn.querySelector('.cite-label');
      var original = label ? label.textContent : '';
      var timer = null;
      btn.addEventListener('click', function () {
        copyText(btn.getAttribute('data-cite') || '').then(function () {
          btn.classList.add('is-copied');
          if (label) label.textContent = btn.getAttribute('data-copied') || original;
          clearTimeout(timer);
          timer = setTimeout(function () {
            btn.classList.remove('is-copied');
            if (label) label.textContent = original;
          }, 1800);
        }).catch(function () { /* nothing to do: the citation is still on the page */ });
      });
    });
  }
})();
