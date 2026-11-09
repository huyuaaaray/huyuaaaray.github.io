/* More effects, each switched on/off in _config.yml (effects):
   intro, title_letters, local_weather, cv_timeline, copy_citation,
   flap_titles, sky_tint, skill_links, and the "Ask about Yu" box. */
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

  /* ---------- Departure-board title (Travel) ----------
     Each letter sits on a tile that flips through the alphabet before landing. */
  if (has('flap')) {
    var FLAP_CHARS = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789&-';
    Array.prototype.forEach.call(document.querySelectorAll('h1[data-flap]'), function (h) {
      var text = h.textContent.replace(/\s+/g, ' ').trim();
      if (!text) return;
      var target = text.toUpperCase();
      h.textContent = '';
      h.classList.add('flap-title');
      var sr = document.createElement('span');
      sr.className = 'visually-hidden';
      sr.textContent = text;
      h.appendChild(sr);
      var board = document.createElement('span');
      board.className = 'flap-board';
      board.setAttribute('aria-hidden', 'true');
      var tiles = [];
      target.split(' ').forEach(function (word) {
        var w = document.createElement('span');
        w.className = 'flap-word';
        Array.prototype.forEach.call(word, function (ch) {
          var tile = document.createElement('span');
          tile.className = 'flap-tile';
          var face = document.createElement('span');
          face.className = 'flap-face';
          face.textContent = reduceMotion ? ch : ' ';
          tile.appendChild(face);
          w.appendChild(tile);
          tiles.push({ face: face, tile: tile, target: ch });
        });
        board.appendChild(w);
      });
      h.appendChild(board);
      if (reduceMotion) return;

      var flipping = false;
      var run = function () {
        if (flipping) return;
        flipping = true;
        var left = tiles.length;
        tiles.forEach(function (t, i) {
          var at = FLAP_CHARS.indexOf(t.target);
          if (at < 0) { t.face.textContent = t.target; left--; return; }
          var pos = (Math.random() * FLAP_CHARS.length) | 0;
          var steps = 8 + ((Math.random() * 14) | 0) + i;       // later tiles land a little later
          var tick = function () {
            pos = (pos + 1) % FLAP_CHARS.length;
            steps--;
            if (steps <= 0) pos = at;
            t.face.textContent = FLAP_CHARS.charAt(pos);
            t.tile.classList.remove('is-flip');
            void t.tile.offsetWidth;                          // restart the flip animation
            t.tile.classList.add('is-flip');
            if (pos !== at || steps > 0) setTimeout(tick, 45 + Math.random() * 25);
            else if (--left === 0) flipping = false;
          };
          setTimeout(tick, 80 + i * 20);
        });
      };
      // flip in when the page opens, and again when the mouse comes back to the title
      setTimeout(run, root.classList.contains('intro') ? 3000 : 250);
      h.addEventListener('mouseenter', run);
    });
  }

  /* ---------- Section titles appear letter by letter ---------- */
  if (has('letters') && !reduceMotion && 'IntersectionObserver' in window) {
    var titles = Array.prototype.filter.call(
      document.querySelectorAll('.section-title, .cv-section > h2, .page-head h1'),
      function (h) { return !h.classList.contains('flap-title'); });
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

  /* ---------- Background tint that follows the time of day in Gainesville ----------
     dawn (5–8): warm pink · day (8–17): clear · dusk (17–20): orange and purple · night: deep blue */
  if (has('sky') && !root.classList.contains('theme-night')) {
    var skyTz = (document.querySelector('.local-now') || {}).getAttribute ? document.querySelector('.local-now').getAttribute('data-tz') : null;
    var sky = document.createElement('div');
    sky.className = 'sky-tint';
    sky.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(sky, document.body.firstChild);
    var hourFmt = null;
    try { hourFmt = new Intl.DateTimeFormat('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone: skyTz || 'America/New_York' }); } catch (e) { hourFmt = null; }
    var paintSky = function () {
      var h = hourFmt ? parseInt(hourFmt.format(new Date()), 10) : new Date().getHours();
      var period = h >= 5 && h < 8 ? 'dawn' : h >= 8 && h < 17 ? 'day' : h >= 17 && h < 20 ? 'dusk' : 'night';
      if (/[?&]sky=(dawn|day|dusk|night)\b/.test(location.search)) period = RegExp.$1;   // preview: ?sky=dusk
      sky.setAttribute('data-period', period);
      root.setAttribute('data-sky', period);
    };
    paintSky();
    setInterval(paintSky, 5 * 60000);
  }

  /* ---------- CV: hover a skill to see where it was used ---------- */
  if (has('skills')) {
    var skillDds = document.querySelectorAll('.skills dd');
    var entries = Array.prototype.slice.call(document.querySelectorAll('#experience .entry, #projects .entry'));
    if (skillDds.length && entries.length) {
      var cvBody = document.querySelector('.cv-body');
      var entryText = entries.map(function (e) { return e.textContent; });
      var escapeRe = function (t) { return t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); };
      // "RAG/GraphRAG" -> RAG, GraphRAG; "Structured Output (JSON Schema/Pydantic)" -> Structured Output, JSON Schema, Pydantic
      var termsOf = function (skill) {
        return skill.split(/[\/()]/).map(function (t) { return t.trim(); }).filter(function (t) { return t.length > 1; });
      };
      var matchesFor = function (skill) {
        var res = termsOf(skill).map(function (t) { return new RegExp('(^|[^A-Za-z0-9])' + escapeRe(t) + '(?![A-Za-z0-9])', 'i'); });
        var out = [];
        entryText.forEach(function (txt, i) { if (res.some(function (re) { return re.test(txt); })) out.push(i); });
        return out;
      };
      var pinned = null;
      var clear = function () {
        cvBody.classList.remove('skill-focus');
        entries.forEach(function (e) { e.classList.remove('is-match'); });
      };
      var focus = function (idx) {
        clear();
        if (!idx.length) return;
        cvBody.classList.add('skill-focus');
        idx.forEach(function (i) { entries[i].classList.add('is-match'); });
      };
      // A small list under the chip: where this skill shows up (click to jump there)
      var pop = document.createElement('div');
      pop.className = 'skill-pop';
      pop.hidden = true;
      document.body.appendChild(pop);
      var hideTimer = null;
      var showPop = function (chip, idx) {
        clearTimeout(hideTimer);
        pop.innerHTML = '';
        idx.forEach(function (i) {
          var b = document.createElement('button');
          b.type = 'button';
          var h3 = entries[i].querySelector('h3');
          b.textContent = h3 ? h3.textContent : 'Entry';
          b.addEventListener('click', function () {
            entries[i].scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
            entries[i].classList.remove('is-flash');
            void entries[i].offsetWidth;
            entries[i].classList.add('is-flash');
          });
          pop.appendChild(b);
        });
        var r = chip.getBoundingClientRect();
        pop.hidden = false;
        var left = Math.min(window.innerWidth - pop.offsetWidth - 12, Math.max(12, r.left));
        pop.style.left = (left + window.scrollX) + 'px';
        pop.style.top = (r.bottom + window.scrollY + 8) + 'px';
      };
      var hidePop = function () { hideTimer = setTimeout(function () { pop.hidden = true; }, 220); };
      pop.addEventListener('mouseenter', function () { clearTimeout(hideTimer); });
      pop.addEventListener('mouseleave', function () { if (!pinned) { hidePop(); clear(); } });

      Array.prototype.forEach.call(skillDds, function (dd) {
        var skills = dd.textContent.split(',').map(function (t) { return t.trim(); }).filter(Boolean);
        dd.textContent = '';
        skills.forEach(function (skill, k) {
          var idx = matchesFor(skill);
          var chip = document.createElement('button');
          chip.type = 'button';
          chip.className = 'skill-chip' + (idx.length ? '' : ' is-quiet');
          chip.setAttribute('aria-pressed', 'false');
          chip.textContent = skill;
          if (idx.length) {
            var n = document.createElement('span');
            n.className = 'skill-n';
            n.textContent = idx.length;
            chip.appendChild(n);
          }
          chip.addEventListener('mouseenter', function () { if (!pinned) { focus(idx); if (idx.length) showPop(chip, idx); } });
          chip.addEventListener('mouseleave', function () { if (!pinned) { hidePop(); clear(); } });
          chip.addEventListener('click', function () {
            if (!idx.length) return;
            var on = pinned !== chip;
            if (pinned) pinned.setAttribute('aria-pressed', 'false');
            pinned = on ? chip : null;
            chip.setAttribute('aria-pressed', on ? 'true' : 'false');
            if (on) { focus(idx); if (idx.length) showPop(chip, idx); else pop.hidden = true; }
            else { clear(); pop.hidden = true; }
          });
          dd.appendChild(chip);
          if (k < skills.length - 1) dd.appendChild(document.createTextNode(' '));
        });
      });
      document.addEventListener('click', function (e) {
        if (!pinned || e.target.closest('.skill-chip, .skill-pop')) return;
        pinned.setAttribute('aria-pressed', 'false');
        pinned = null;
        clear();
        pop.hidden = true;
      });
    }
  }

  /* ---------- "Ask about Yu": pre-written answers, streamed like an LLM ---------- */
  var askBox = document.querySelector('.ask-box');
  if (askBox) {
    var log = askBox.querySelector('.ask-log');
    var botAvatar = log.querySelector('.msg-avatar');
    var botName = (log.querySelector('.msg-name') || {}).textContent || '';
    var busy = false;
    var scrollLog = function () { log.scrollTop = log.scrollHeight; };
    var addMsg = function (who) {
      var m = document.createElement('div');
      m.className = 'msg msg-' + who;
      if (who === 'bot' && botAvatar) m.appendChild(botAvatar.cloneNode(true));
      var bubble = document.createElement('div');
      bubble.className = 'msg-bubble';
      m.appendChild(bubble);
      log.appendChild(m);
      return bubble;
    };
    Array.prototype.forEach.call(askBox.querySelectorAll('.ask-chip'), function (chip) {
      chip.addEventListener('click', function () {
        if (busy) return;
        busy = true;
        chip.classList.add('is-asked');
        log.setAttribute('aria-busy', 'true');
        addMsg('user').textContent = chip.textContent;
        var tpl = askBox.querySelector('template[data-answer="' + chip.getAttribute('data-q') + '"]');
        var html = tpl ? tpl.innerHTML.trim() : '';
        var tmp = document.createElement('div');
        tmp.innerHTML = html;
        var plain = tmp.textContent;
        var bubble = addMsg('bot');
        if (botName) { var nm = document.createElement('span'); nm.className = 'msg-name'; nm.textContent = botName; bubble.appendChild(nm); }
        var body = document.createElement('span');
        body.className = 'msg-text';
        body.innerHTML = '<span class="thinking"><i></i><i></i><i></i></span>';
        bubble.appendChild(body);
        scrollLog();
        var finish = function () {
          body.innerHTML = html;                 // the real answer, with working links
          log.removeAttribute('aria-busy');
          scrollLog();
          busy = false;
        };
        if (reduceMotion) { setTimeout(finish, 300); return; }
        setTimeout(function () {
          // stream word by word, with a blinking cursor at the end
          var words = plain.split(/(\s+)/);
          var i = 0;
          body.textContent = '';
          var out = document.createElement('span');
          var cursor = document.createElement('span');
          cursor.className = 'stream-caret';
          body.appendChild(out);
          body.appendChild(cursor);
          var tick = function () {
            var chunk = words.slice(i, i + 2).join('');
            out.textContent += chunk;
            i += 2;
            scrollLog();
            if (i < words.length) setTimeout(tick, 28 + Math.random() * 55);
            else setTimeout(finish, 250);
          };
          tick();
        }, 700 + Math.random() * 500);
      });
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

    // Flip clock: each digit sits on a little card that flips over when it changes.
    var flip = has('flipclock') && !reduceMotion;
    var tick = function () {
      if (!fmt) return;
      var str = fmt.format(new Date());
      now.hidden = false;
      if (!flip) { timeEl.textContent = str; return; }
      timeEl.setAttribute('aria-label', str);
      if (timeEl.children.length !== str.length || timeEl.getAttribute('data-len') !== String(str.length)) {
        timeEl.textContent = '';
        timeEl.setAttribute('data-len', str.length);
        Array.prototype.forEach.call(str, function (ch) {
          var c = document.createElement('span');
          c.className = /\d/.test(ch) ? 'fc-d' : 'fc-s';
          c.setAttribute('aria-hidden', 'true');
          c.textContent = ch;
          timeEl.appendChild(c);
        });
        return;
      }
      Array.prototype.forEach.call(str, function (ch, k) {
        var c = timeEl.children[k];
        if (c.textContent === ch) return;
        c.classList.remove('is-flip'); void c.offsetWidth;
        c.classList.add('is-flip');
        setTimeout(function () { c.textContent = ch; }, 160);       // swap halfway through the flip
      });
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
    // The footer's background shows the weather: sun, clouds, mist, rain, snow, a storm, or a night sky.
    var footer = document.querySelector('.site-footer');
    var paintFooter = function (kind, day) {
      if (!footer || !has('footersky')) return;
      var sky = footer.querySelector('.footer-sky');
      if (!sky) {
        sky = document.createElement('div');
        sky.className = 'footer-sky';
        sky.setAttribute('aria-hidden', 'true');
        sky.innerHTML = '<span class="fs-glow"></span><span class="fs-stars"></span><span class="fs-moon"></span>' +
          '<span class="fs-cloud c1"></span><span class="fs-cloud c2"></span><span class="fs-cloud c3"></span>' +
          '<span class="fs-mist"></span><span class="fs-rain"></span><span class="fs-snow"></span><span class="fs-flash"></span>';
        footer.insertBefore(sky, footer.firstChild);
      }
      footer.setAttribute('data-weather', kind);
      footer.setAttribute('data-daytime', day ? 'day' : 'night');
    };
    // Preview: ?weather=rain (clear, partly, cloudy, fog, drizzle, rain, snow, storm), add &night for the night look
    var wPreview = (location.search.match(/[?&]weather=([a-z]+)/) || [])[1];
    if (wPreview) paintFooter(wPreview, !/[?&]night\b/.test(location.search));

    var showWeather = function (w) {
      var kind = kindOf(w.code);
      if (!wPreview) paintFooter(kind, w.day);
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
