/* Travel page: map markers, hover previews, and the photo/video panel.
   Places come from _data/travel.yml (rendered into #travel-data). */
(function () {
  'use strict';

  var dataEl = document.getElementById('travel-data');
  var mapEl = document.getElementById('map');
  if (!dataEl || !mapEl) return;

  var places = [];
  try { places = JSON.parse(dataEl.textContent || '[]') || []; } catch (e) { places = []; }

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

  /* ---------- Map ---------- */
  var map = null;
  var markers = [];
  var activeIndex = -1;

  if (typeof L !== 'undefined') {
    map = L.map(mapEl, { scrollWheelZoom: false, worldCopyJump: true });

    var attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
    var darkQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    var tileUrl = function (isDark) {
      return 'https://{s}.basemaps.cartocdn.com/' + (isDark ? 'dark_all' : 'light_all') + '/{z}/{x}/{y}{r}.png';
    };
    var tiles = L.tileLayer(tileUrl(darkQuery && darkQuery.matches), {
      attribution: attribution, subdomains: 'abcd', maxZoom: 19
    }).addTo(map);
    if (darkQuery) {
      var onScheme = function (e) { tiles.setUrl(tileUrl(e.matches)); };
      if (darkQuery.addEventListener) darkQuery.addEventListener('change', onScheme);
      else if (darkQuery.addListener) darkQuery.addListener(onScheme);
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

      var tip = (p.cover ? '<img class="tip-img" src="' + esc(p.cover) + '" alt="">' : '') +
        '<span class="tip-body">' +
        '<span class="tip-title">' + esc(p.name) + '</span>' +
        '<span class="tip-meta">' + esc(metaText(p)) + '</span>' +
        (p.summary ? '<span class="tip-summary">' + esc(p.summary) + '</span>' : '') +
        '<span class="tip-cta">Click for photos and videos</span>' +
        '</span>';
      m.bindTooltip(tip, { direction: 'top', className: 'place-tip', opacity: 1, offset: [0, -14] });
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
  }

  // Highlight a marker and its card together.
  function setActive(i) {
    if (activeIndex === i) return;
    if (activeIndex > -1) {
      var oldEl = markers[activeIndex] && markers[activeIndex].getElement();
      if (oldEl) oldEl.classList.remove('is-active');
      if (cards[activeIndex]) cards[activeIndex].classList.remove('is-active');
    }
    activeIndex = i;
    if (i > -1) {
      var el = markers[i] && markers[i].getElement();
      if (el) el.classList.add('is-active');
      if (cards[i]) cards[i].classList.add('is-active');
    }
  }

  /* ---------- Detail panel ---------- */
  function openPlace(i) {
    var p = places[i];
    if (!p || !dialog) return;
    setActive(i);

    if (map && markers[i]) {
      map.flyTo(markers[i].getLatLng(), Math.max(map.getZoom(), 5), { duration: 0.8 });
    }

    titleEl.textContent = p.name || '';
    metaEl.textContent = metaText(p);

    var html = p.summary ? '<p>' + esc(p.summary) + '</p>' : '';
    var media = '';

    var photos = (p.photos || []).filter(function (ph) { return typeof ph === 'string' ? ph : ph && ph.src; });
    photos.forEach(function (ph) {
      var src = typeof ph === 'string' ? ph : ph.src;
      var cap = (ph && ph.caption) || '';
      // A single photo (or the odd one out at the end) spans the full width.
      var wide = photos.length % 2 === 1 && ph === photos[photos.length - 1];
      media += '<figure' + (wide ? ' class="wide"' : '') + '><a href="' + esc(src) + '" target="_blank" rel="noopener">' +
        '<img src="' + esc(src) + '" alt="' + esc(cap || p.name) + '" loading="lazy"></a>' +
        (cap ? '<figcaption>' + esc(cap) + '</figcaption>' : '') + '</figure>';
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
    dialog.addEventListener('close', function () { bodyEl.innerHTML = ''; setActive(-1); });
  }

  cards.forEach(function (card) {
    var i = Number(card.getAttribute('data-index'));
    card.addEventListener('click', function () { openPlace(i); });
    card.addEventListener('mouseenter', function () { setActive(i); });
    card.addEventListener('mouseleave', function () { if (!dialog || !dialog.open) setActive(-1); });
  });
})();
