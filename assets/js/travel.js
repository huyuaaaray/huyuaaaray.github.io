/* Travel page: map, flight routes from home, hover previews,
   the photo/video panel, and a full-screen photo viewer.
   Places come from _data/travel.yml (rendered into #travel-data). */
(function () {
  'use strict';

  var dataEl = document.getElementById('travel-data');
  var mapEl = document.getElementById('map');
  if (!dataEl || !mapEl) return;

  var places = [];
  try { places = JSON.parse(dataEl.textContent || '[]') || []; } catch (e) { places = []; }
  var text = { previewCta: 'Click for photos and videos' };
  try { text = JSON.parse(document.getElementById('travel-text').textContent) || text; } catch (e) { /* keep defaults */ }

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var dialog = document.getElementById('place-dialog');
  var titleEl = document.getElementById('dialog-title');
  var metaEl = document.getElementById('dialog-meta');
  var bodyEl = document.getElementById('dialog-body');
  var closeBtn = document.getElementById('dialog-close');
  var cards = Array.prototype.slice.call(document.querySelectorAll('.place-card'));

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function metaText(p) {
    return [p.region, p.date].filter(Boolean).join(', ');
  }

  // Accepts a YouTube/Bilibili link or a bare video ID.
  function embedUrl(v) {
    if (!v) return null;
    if (v.youtube) {
      var y = String(v.youtube).trim();
      var m = y.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/);
      var id = m ? m[1] : y;
      return /^[\w-]{11}$/.test(id) ? 'https://www.youtube-nocookie.com/embed/' + id : null;
    }
    if (v.bilibili) {
      var b = String(v.bilibili).match(/BV[0-9A-Za-z]{10}/);
      return b ? 'https://player.bilibili.com/player.html?bvid=' + b[0] + '&autoplay=0&high_quality=1' : null;
    }
    return null;
  }

  function photoList(p) {
    return (p.photos || []).map(function (ph) {
      if (typeof ph === 'string') return { src: ph, caption: '' };
      return ph && ph.src ? { src: ph.src, caption: ph.caption || '' } : null;
    }).filter(Boolean);
  }

  // The small preview card shown when hovering a marker.
  function tipHtml(p) {
    return (p.cover ? '<img class="tip-img" src="' + esc(p.cover) + '" alt="">' : '') +
      '<span class="tip-body">' +
      '<span class="tip-title">' + esc(p.name) + '</span>' +
      '<span class="tip-meta">' + esc(metaText(p)) + '</span>' +
      (p.summary ? '<span class="tip-summary">' + esc(p.summary) + '</span>' : '') +
      (text.previewCta ? '<span class="tip-cta">' + esc(text.previewCta) + '</span>' : '') +
      '</span>';
  }

  // Country names from the config, matched to the world map's names (common short forms work too).
  function wantedCountries() {
    var ALIASES = {
      'usa': 'united states of america', 'us': 'united states of america', 'u.s.': 'united states of america',
      'united states': 'united states of america', 'america': 'united states of america',
      'uk': 'united kingdom', 'england': 'united kingdom', 'scotland': 'united kingdom', 'wales': 'united kingdom',
      'great britain': 'united kingdom', 'britain': 'united kingdom',
      'korea': 'south korea', 'republic of korea': 'south korea',
      'czech republic': 'czechia', 'uae': 'united arab emirates', 'holland': 'netherlands',
      'russian federation': 'russia', 'viet nam': 'vietnam'
    };
    var wanted = {};
    places.forEach(function (p) {
      if (!p.country) return;
      var key = String(p.country).trim().toLowerCase();
      wanted[ALIASES[key] || key] = true;
    });
    return wanted;
  }

  var WORLD_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json';
  var WORLD_SRI = 'sha384-yOCJ+8ShBm8UDqtAVtAvxTDDf4gXo5edxl/YG0FmVC5OTmqVLl7utuVGBDEeZWHf';

  /* ---------- Map ---------- */
  var map = null;
  var markers = [];
  var routes = [];
  var activeIndex = -1;
  var globeApi = null;      // set when the 3D globe is in use
  var mode = mapEl.getAttribute('data-mode') || 'flat';

  function webglAvailable() {
    try {
      var c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
    } catch (e) {
      return false;
    }
  }

  if (mode === 'flat' && typeof L !== 'undefined') {
    map = L.map(mapEl, { scrollWheelZoom: false, worldCopyJump: true });

    var darkQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    // The Travel page uses the night-sky theme, so the map is always dark there.
    var isDark = function () {
      return document.documentElement.classList.contains('theme-night') || !!(darkQuery && darkQuery.matches);
    };

    // Base map: OpenFreeMap vector tiles (free, no API key), drawn by MapLibre GL.
    var OFM = 'https://tiles.openfreemap.org/styles/';
    var ofmStyle = function () { return OFM + (isDark() ? 'dark' : 'positron'); };

    if (L.maplibreGL && window.maplibregl && webglAvailable()) {
      var gl = L.maplibreGL({ style: ofmStyle(), attributionControl: false }).addTo(map);
      map.attributionControl.addAttribution(
        '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> ' +
        '&copy; <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a> ' +
        'Data from <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
      );
      if (darkQuery) {
        var onScheme = function () {
          var glMap = gl.getMaplibreMap();
          if (glMap) glMap.setStyle(ofmStyle());
        };
        if (darkQuery.addEventListener) darkQuery.addEventListener('change', onScheme);
        else if (darkQuery.addListener) darkQuery.addListener(onScheme);
      }
    } else {
      // Fallback for browsers without WebGL.
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
    }

    // Don't hijack page scrolling: wheel zoom turns on after a click on the map.
    map.on('click focus', function () { map.scrollWheelZoom.enable(); });
    map.on('mouseout blur', function () { map.scrollWheelZoom.disable(); });

    var pinIcon = L.divIcon({
      className: 'pin-wrap',
      html: '<span class="pin"></span>',
      iconSize: [22, 22],
      iconAnchor: [11, 11]
    });

    markers = places.map(function (p, i) {
      if (typeof p.lat !== 'number' || typeof p.lng !== 'number') return null;
      var m = L.marker([p.lat, p.lng], { icon: pinIcon, keyboard: true, riseOnHover: true }).addTo(map);
      var el = m.getElement();
      if (el) el.setAttribute('aria-label', p.name + (p.region ? ', ' + p.region : ''));

      // Put the preview where it fits inside the map: above, below, or beside the marker.
      m.on('mouseover', function () {
        var t = m.getTooltip();
        if (!t) return;
        var pt = map.latLngToContainerPoint(m.getLatLng());
        var size = map.getSize();
        var need = 290;
        var dir = pt.y >= need ? 'top' : (size.y - pt.y >= need ? 'bottom' : (pt.x < size.x / 2 ? 'right' : 'left'));
        var offsets = { top: [0, -14], bottom: [0, 14], right: [14, 0], left: [-14, 0] };
        t.options.direction = dir;
        t.options.offset = offsets[dir];
      });

      m.bindTooltip(tipHtml(p), { direction: 'top', className: 'place-tip', opacity: 1, offset: [0, -14] });
      m.on('click', function () { openPlace(i); });
      m.on('mouseover', function () { setActive(i); });
      m.on('mouseout', function () { if (!dialog || !dialog.open) setActive(-1); });
      return m;
    });

    var valid = markers.filter(Boolean);
    if (valid.length > 1) {
      map.fitBounds(L.featureGroup(valid).getBounds(), { padding: [56, 56], maxZoom: 6 });
    } else if (valid.length === 1) {
      map.setView(valid[0].getLatLng(), 6);
    } else {
      map.setView([25, 0], 2);
    }

    drawRoutes();
    shadeCountries();
  }

  /* ---------- 3D globe (globe.gl) ----------
     Countries are drawn as dots (visited ones in orange), arcs rise from home
     to every other place, the globe spins slowly until you touch it, and
     clicking a marker or a card flies the camera there. */
  if (mode === 'globe') {
    if (typeof window.Globe === 'function' && webglAvailable()) {
      try { globeApi = initGlobe(); } catch (e) { globeApi = null; }
    }
    if (!globeApi) {
      mapEl.innerHTML = '<p class="globe-fallback">' + esc(text.globeFallback || '') + '</p>';
    }
  }

  function initGlobe() {
    var wrap = mapEl.parentNode;
    var narrow = window.matchMedia && window.matchMedia('(max-width: 640px)').matches;
    var REST_ALT = narrow ? 2.7 : 2.0;      // camera height when idle (in globe radii)
    var FOCUS_ALT = narrow ? 1.6 : 1.25;    // camera height after flying to a place

    var valid = [];
    places.forEach(function (p, i) {
      if (typeof p.lat === 'number' && typeof p.lng === 'number') valid.push(i);
    });
    var homeIndex = -1;
    valid.forEach(function (i) { if (homeIndex < 0 && places[i].home) homeIndex = i; });
    if (homeIndex < 0 && valid.length) homeIndex = valid[0];
    var home = homeIndex >= 0 ? places[homeIndex] : null;

    var world = new window.Globe(mapEl, { rendererConfig: { antialias: true, alpha: true } })
      .width(mapEl.clientWidth)
      .height(mapEl.clientHeight)
      .backgroundColor('rgba(0,0,0,0)')
      .enablePointerInteraction(false)
      .showAtmosphere(true)
      .atmosphereColor('#7f95ff')
      .atmosphereAltitude(0.2)
      .showGraticules(true);

    var mat = world.globeMaterial();
    if (mat) {
      if (mat.color) mat.color.set('#0d1538');
      if (mat.emissive) { mat.emissive.set('#0b1236'); mat.emissiveIntensity = 0.55; }
      if ('shininess' in mat) mat.shininess = 6;
    }

    // Arcs from home to every other place: a moving dash runs along each one.
    var arcs = [];
    if (home) {
      valid.forEach(function (i) {
        if (i === homeIndex) return;
        arcs.push({ i: i, startLat: home.lat, startLng: home.lng, endLat: places[i].lat, endLng: places[i].lng });
      });
    }
    function paintArcs() {
      world
        .arcColor(function (d) {
          return d.i === activeIndex ? ['rgba(255, 190, 160, 1)', 'rgba(255, 122, 80, 1)']
                                     : ['rgba(159, 176, 255, 0.9)', 'rgba(255, 122, 80, 0.95)'];
        })
        .arcStroke(function (d) { return d.i === activeIndex ? 1.15 : 0.55; });
    }
    world
      .arcsData(arcs)
      .arcAltitudeAutoScale(0.45)
      .arcDashLength(reduceMotion ? 1 : 0.45)
      .arcDashGap(reduceMotion ? 0 : 0.2)
      .arcDashInitialGap(function (d) { return reduceMotion ? 0 : 1 + (arcs.indexOf(d) % 3) * 0.3; })
      .arcDashAnimateTime(reduceMotion ? 0 : 2800)
      .arcsTransitionDuration(0);
    paintArcs();

    // Ripples spreading out from home
    if (home && !reduceMotion) {
      world
        .ringsData([{ lat: home.lat, lng: home.lng }])
        .ringColor(function () { return function (t) { return 'rgba(255, 122, 80, ' + (1 - t).toFixed(3) + ')'; }; })
        .ringMaxRadius(4.5)
        .ringPropagationSpeed(2.2)
        .ringRepeatPeriod(1500);
    }

    // Countries drawn as dots; the ones I've been to are orange.
    if (window.topojson && window.fetch) {
      var wanted = wantedCountries();
      fetch(WORLD_URL, { integrity: WORLD_SRI })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          var land = topojson.feature(data, data.objects.countries).features
            .filter(function (f) { return f.properties.name !== 'Antarctica'; })
            .map(cleanFeature)
            .filter(Boolean);
          world
            .hexPolygonsData(land)
            .hexPolygonResolution(3)
            .hexPolygonMargin(0.42)
            .hexPolygonUseDots(true)
            .hexPolygonAltitude(0.004)
            .hexPolygonsTransitionDuration(0)
            .hexPolygonColor(function (f) {
              return wanted[String(f.properties.name).toLowerCase()] ? '#ff7a50' : 'rgba(175, 190, 255, 0.5)';
            });
        })
        .catch(function () { /* the dots are optional */ });
    }

    // The world map has a few collapsed shapes (all points the same); the dot
    // generator can't handle those, so drop them before drawing.
    function cleanFeature(f) {
      var g = f.geometry;
      if (!g) return null;
      var polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
      var ok = polys.filter(function (poly) {
        var seen = {};
        (poly[0] || []).forEach(function (pt) { seen[pt[0].toFixed(6) + ',' + pt[1].toFixed(6)] = true; });
        return Object.keys(seen).length >= 3;
      });
      if (!ok.length) return null;
      return { type: 'Feature', properties: f.properties, geometry: { type: 'MultiPolygon', coordinates: ok } };
    }

    // Markers: real buttons, so they work with the keyboard and screen readers.
    var tip = document.createElement('div');
    tip.className = 'globe-tip';
    tip.setAttribute('aria-hidden', 'true');
    wrap.appendChild(tip);
    var hoverIndex = -1;

    function showTip(i, el) {
      hoverIndex = i;
      tip.innerHTML = tipHtml(places[i]);
      var w = wrap.getBoundingClientRect(), b = el.getBoundingClientRect();
      var x = b.left + b.width / 2 - w.left, y = b.top + b.height / 2 - w.top;
      var tw = tip.offsetWidth || 260, th = tip.offsetHeight || 280, gap = 16;
      var left, top;
      if (y - th - gap >= 0) { top = y - th - gap; left = x - tw / 2; }
      else if (y + th + gap <= w.height) { top = y + gap; left = x - tw / 2; }
      else { top = Math.max(0, Math.min(w.height - th, y - th / 2)); left = x + gap + tw <= w.width ? x + gap : x - gap - tw; }
      tip.style.left = Math.max(0, Math.min(w.width - tw, left)) + 'px';
      tip.style.top = top + 'px';
      tip.classList.add('is-shown');
    }
    function hideTip() { hoverIndex = -1; tip.classList.remove('is-shown'); }

    var pinData = valid.map(function (i) { return { i: i, lat: places[i].lat, lng: places[i].lng }; });
    world
      .htmlElementsData(pinData)
      .htmlAltitude(0.012)
      .htmlTransitionDuration(0)
      .htmlElement(function (d) {
        var p = places[d.i];
        var el = document.createElement('button');
        el.type = 'button';
        el.className = 'pin-wrap globe-pin' + (d.i === homeIndex ? ' is-home' : '');
        el.innerHTML = '<span class="pin"></span>';
        el.setAttribute('aria-label', p.name + (p.region ? ', ' + p.region : ''));
        el.addEventListener('click', function (e) { e.stopPropagation(); openPlace(d.i); });
        var enter = function () { hold(); setActive(d.i); showTip(d.i, el); };
        var leave = function () { hideTip(); if (!dialog || !dialog.open) { setActive(-1); resumeSoon(1500); } };
        el.addEventListener('mouseenter', enter);
        el.addEventListener('mouseleave', leave);
        el.addEventListener('focus', enter);
        el.addEventListener('blur', leave);
        markers[d.i] = el;
        return el;
      })
      .htmlElementVisibilityModifier(function (el, visible) {
        el.classList.toggle('is-behind', !visible);
        el.tabIndex = visible ? 0 : -1;
        if (!visible && el === markers[hoverIndex]) hideTip();
      });

    // Slow spin that stops while you're interacting and resumes a few seconds later.
    var controls = world.controls();
    var resumeTimer = null;
    controls.autoRotate = !reduceMotion;
    controls.autoRotateSpeed = 0.5;
    controls.enableZoom = false;          // the mouse wheel scrolls the page until you click the globe
    controls.enablePan = false;
    controls.minDistance = 160;
    controls.maxDistance = 520;
    function hold() { clearTimeout(resumeTimer); controls.autoRotate = false; }
    function resumeSoon(ms) {
      clearTimeout(resumeTimer);
      if (reduceMotion) return;
      resumeTimer = setTimeout(function () {
        if (!(dialog && dialog.open) && hoverIndex < 0) controls.autoRotate = true;
      }, ms || 3500);
    }
    controls.addEventListener('start', function () { hold(); hideTip(); });
    controls.addEventListener('end', function () { resumeSoon(3500); });
    mapEl.addEventListener('click', function () { controls.enableZoom = true; });
    mapEl.addEventListener('mouseleave', function () { controls.enableZoom = false; });

    // Start a little farther out and glide in when the globe scrolls into view.
    var startView = home ? { lat: home.lat, lng: home.lng } : { lat: 20, lng: 0 };
    startView.lat = Math.max(-30, Math.min(40, startView.lat));
    world.pointOfView({ lat: startView.lat, lng: startView.lng, altitude: reduceMotion ? REST_ALT : REST_ALT + 1.4 }, 0);

    if ('IntersectionObserver' in window) {
      var introDone = false;
      new IntersectionObserver(function (entries) {
        var visible = entries[0].isIntersecting;
        // Save the laptop battery: stop drawing while the globe is off screen.
        if (visible) world.resumeAnimation(); else world.pauseAnimation();
        if (visible && !introDone) {
          introDone = true;
          world.pointOfView({ altitude: REST_ALT }, reduceMotion ? 0 : 1800);
        }
      }, { threshold: 0.15 }).observe(mapEl);
    } else {
      world.pointOfView({ altitude: REST_ALT }, 0);
    }

    // Keep the canvas the size of its box.
    if ('ResizeObserver' in window) {
      new ResizeObserver(function () {
        world.width(mapEl.clientWidth).height(mapEl.clientHeight);
      }).observe(mapEl);
    }

    return {
      world: world,
      refresh: paintArcs,
      focus: function (i) {
        var p = places[i];
        if (!p || typeof p.lat !== 'number') return;
        hold();
        hideTip();
        world.pointOfView({ lat: p.lat, lng: p.lng, altitude: FOCUS_ALT }, reduceMotion ? 0 : 1300);
      },
      release: function () {
        world.pointOfView({ altitude: REST_ALT }, reduceMotion ? 0 : 1100);
        resumeSoon(2500);
      }
    };
  }

  /* ---------- Countries I've been to ---------- */
  function shadeCountries() {
    if (!window.topojson || !window.fetch) return;
    var wanted = wantedCountries();
    if (!Object.keys(wanted).length) return;

    fetch(WORLD_URL, { integrity: WORLD_SRI })
      .then(function (res) { return res.json(); })
      .then(function (world) {
        var all = topojson.feature(world, world.objects.countries).features;
        var visited = all.filter(function (f) {
          return wanted[String(f.properties.name).toLowerCase()];
        });
        if (!visited.length) return;
        if (!map.getPane('countries')) {
          map.createPane('countries');
          map.getPane('countries').style.zIndex = 350;   // above the base map, below routes and markers
        }
        L.geoJSON({ type: 'FeatureCollection', features: visited }, {
          pane: 'countries',
          interactive: false,
          style: function () { return { className: 'country-visited' }; }
        }).addTo(map);
      })
      .catch(function () { /* shading is optional */ });
  }

  /* ---------- Flight routes from home ---------- */
  // A curved line between two points, bowed toward the north.
  function arc(a, b) {
    var dLng = b.lng - a.lng, dLat = b.lat - a.lat;
    var dist = Math.sqrt(dLng * dLng + dLat * dLat) || 1;
    var pLng = -dLat / dist, pLat = dLng / dist;   // perpendicular direction
    if (pLat < 0) { pLng = -pLng; pLat = -pLat; }
    var bulge = dist * 0.18;
    var pts = [];
    for (var k = 0; k <= 64; k++) {
      var t = k / 64, s = Math.sin(Math.PI * t) * bulge;
      pts.push([a.lat + dLat * t + pLat * s, a.lng + dLng * t + pLng * s]);
    }
    return pts;
  }

  function drawRoutes() {
    var homeIndex = -1;
    places.forEach(function (p, i) { if (homeIndex < 0 && p.home && markers[i]) homeIndex = i; });
    if (homeIndex < 0) homeIndex = markers.findIndex(Boolean);
    if (homeIndex < 0) return;
    var home = markers[homeIndex].getLatLng();

    var order = 0;
    places.forEach(function (p, i) {
      if (i === homeIndex || !markers[i]) return;
      var line = L.polyline(arc(home, markers[i].getLatLng()), { className: 'route', interactive: false });
      line.addTo(map);
      routes[i] = { line: line, order: order++ };
    });

    // Animate the routes drawing out, once the map scrolls into view.
    if (reduceMotion || !('IntersectionObserver' in window)) return;
    routes.forEach(function (r) {
      var path = r && r.line.getElement();
      if (!path || !path.getTotalLength) return;
      var len = path.getTotalLength();
      path.style.strokeDasharray = len;
      path.style.strokeDashoffset = len;
    });
    var io = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      routes.forEach(function (r) {
        var path = r && r.line.getElement();
        if (!path) return;
        path.style.transition = 'stroke-dashoffset 1.6s cubic-bezier(0.2, 0.7, 0.2, 1) ' + (300 + r.order * 450) + 'ms';
        requestAnimationFrame(function () { path.style.strokeDashoffset = '0'; });
        path.addEventListener('transitionend', function done(e) {
          if (e.propertyName !== 'stroke-dashoffset') return;
          path.removeEventListener('transitionend', done);
          path.style.transition = '';
          path.style.strokeDasharray = '';
          path.style.strokeDashoffset = '';
        });
      });
    }, { threshold: 0.35 });
    io.observe(mapEl);
  }

  // Highlight a marker, its card, and its route together.
  function setActive(i) {
    if (activeIndex === i) return;
    toggleActive(activeIndex, false);
    activeIndex = i;
    toggleActive(i, true);
  }

  function toggleActive(i, on) {
    if (i < 0) return;
    var m = markers[i];
    var el = m && (m.getElement ? m.getElement() : m);
    if (el) el.classList.toggle('is-active', on);
    if (cards[i]) cards[i].classList.toggle('is-active', on);
    var r = routes[i] && routes[i].line.getElement();
    if (r) r.classList.toggle('is-active', on);
    if (globeApi) globeApi.refresh();
  }

  /* ---------- Detail panel ---------- */
  function openPlace(i) {
    var p = places[i];
    if (!p || !dialog) return;
    setActive(i);

    if (map && markers[i] && markers[i].getLatLng) {
      map.flyTo(markers[i].getLatLng(), Math.max(map.getZoom(), 5), { duration: 0.8 });
    } else if (globeApi) {
      globeApi.focus(i);
    }

    titleEl.textContent = p.name || '';
    metaEl.textContent = metaText(p);

    var photos = photoList(p);
    var html = p.summary ? '<p>' + esc(p.summary) + '</p>' : '';
    var media = '';

    photos.forEach(function (ph, k) {
      // A single photo (or the odd one out at the end) spans the full width.
      var wide = photos.length % 2 === 1 && k === photos.length - 1;
      media += '<figure' + (wide ? ' class="wide"' : '') + '>' +
        '<a href="' + esc(ph.src) + '" data-photo="' + k + '" target="_blank" rel="noopener" aria-label="View photo full screen">' +
        '<img src="' + esc(ph.src) + '" alt="' + esc(ph.caption || p.name) + '" loading="lazy"></a>' +
        (ph.caption ? '<figcaption>' + esc(ph.caption) + '</figcaption>' : '') + '</figure>';
    });

    (p.videos || []).forEach(function (v) {
      var src = embedUrl(v);
      if (!src) return;
      media += '<div class="video"><iframe src="' + esc(src) + '" title="' + esc(p.name) + ' video" loading="lazy" ' +
        'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" ' +
        'referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>';
    });

    if (media) html += '<div class="media-grid">' + media + '</div>';
    bodyEl.innerHTML = html;

    Array.prototype.forEach.call(bodyEl.querySelectorAll('[data-photo]'), function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        openLightbox(photos, Number(a.getAttribute('data-photo')));
      });
    });

    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }

  function closePlace() {
    if (!dialog) return;
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
  }

  if (dialog) {
    closeBtn.addEventListener('click', closePlace);
    // Click on the dimmed backdrop closes the panel.
    dialog.addEventListener('click', function (e) { if (e.target === dialog) closePlace(); });
    // Clearing the body stops any playing video.
    dialog.addEventListener('close', function () {
      bodyEl.innerHTML = '';
      setActive(-1);
      if (globeApi) globeApi.release();
    });
  }

  cards.forEach(function (card) {
    var i = Number(card.getAttribute('data-index'));
    card.addEventListener('click', function () { openPlace(i); });
    card.addEventListener('mouseenter', function () { setActive(i); });
    card.addEventListener('mouseleave', function () { if (!dialog || !dialog.open) setActive(-1); });
  });

  /* ---------- Full-screen photo viewer ---------- */
  var lb = document.getElementById('lightbox');
  var lbImg = document.getElementById('lb-img');
  var lbCap = document.getElementById('lb-caption');
  var lbCount = document.getElementById('lb-count');
  var lbPhotos = [];
  var lbIndex = 0;

  function showPhoto(k, animate) {
    if (!lbPhotos.length) return;
    lbIndex = (k + lbPhotos.length) % lbPhotos.length;
    var ph = lbPhotos[lbIndex];
    var apply = function () {
      lbImg.src = ph.src;
      lbImg.alt = ph.caption || '';
      lbCap.textContent = ph.caption || '';
      lbCount.textContent = (lbIndex + 1) + ' / ' + lbPhotos.length;
      lbImg.classList.remove('is-switching');
    };
    if (animate && !reduceMotion) {
      lbImg.classList.add('is-switching');
      setTimeout(apply, 160);
    } else {
      apply();
    }
  }

  function openLightbox(photos, k) {
    if (!lb || !photos.length) return;
    lbPhotos = photos;
    lb.classList.toggle('is-single', photos.length < 2);
    showPhoto(k, false);
    if (typeof lb.showModal === 'function') lb.showModal();
    else lb.setAttribute('open', '');
  }

  function closeLightbox() {
    if (typeof lb.close === 'function') lb.close();
    else lb.removeAttribute('open');
  }

  if (lb) {
    document.getElementById('lb-close').addEventListener('click', closeLightbox);
    document.getElementById('lb-prev').addEventListener('click', function () { showPhoto(lbIndex - 1, true); });
    document.getElementById('lb-next').addEventListener('click', function () { showPhoto(lbIndex + 1, true); });
    var swiped = false;
    lb.addEventListener('click', function (e) {
      if (swiped) { swiped = false; return; }   // a swipe isn't a click on the backdrop
      if (e.target === lb) closeLightbox();
    });
    lb.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); showPhoto(lbIndex - 1, true); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); showPhoto(lbIndex + 1, true); }
    });
    // Swipe left/right on touch screens.
    var startX = null;
    lb.addEventListener('pointerdown', function (e) { startX = e.clientX; });
    lb.addEventListener('pointerup', function (e) {
      if (startX === null) return;
      var dx = e.clientX - startX;
      startX = null;
      if (Math.abs(dx) > 50 && lbPhotos.length > 1) {
        swiped = true;
        showPhoto(lbIndex + (dx < 0 ? 1 : -1), true);
      }
    });
  }
})();
