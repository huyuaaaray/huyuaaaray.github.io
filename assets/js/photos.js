/* Photo wall: filter by place, and a simple full-screen viewer (arrow keys, swipe, Esc). */
(function () {
  'use strict';

  var grid = document.querySelector('.pw-grid');
  if (!grid) return;
  var items = Array.prototype.slice.call(grid.querySelectorAll('.pw-item'));
  if (!items.length) {
    var empty = document.createElement('p');
    empty.className = 'pw-empty';
    empty.textContent = grid.getAttribute('data-empty') || '';
    grid.appendChild(empty);
    return;
  }

  // Filter chips: "All places" plus one per place that has photos
  var bar = document.querySelector('.pw-filters');
  var names = [];
  items.forEach(function (it) { var n = it.getAttribute('data-place'); if (names.indexOf(n) === -1) names.push(n); });
  var current = '';
  var chip = function (label, value) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'pw-chip' + (value === '' ? ' is-on' : '');
    b.setAttribute('aria-pressed', value === '' ? 'true' : 'false');
    b.textContent = label;
    b.addEventListener('click', function () {
      current = value;
      Array.prototype.forEach.call(bar.children, function (c) { c.classList.toggle('is-on', c === b); c.setAttribute('aria-pressed', c === b ? 'true' : 'false'); });
      items.forEach(function (it) { it.hidden = !!value && it.getAttribute('data-place') !== value; });
    });
    bar.appendChild(b);
  };
  chip(bar.getAttribute('data-all') || 'All', '');
  if (names.length > 1) names.forEach(function (n) { chip(n, n); });

  // Viewer
  var lb = document.querySelector('.pw-lightbox');
  var img = lb.querySelector('img'), cap = lb.querySelector('figcaption'), at = 0, list = [];
  var show = function (k) {
    at = (k + list.length) % list.length;
    var it = list[at];
    img.src = it.querySelector('a').getAttribute('href');
    img.alt = it.querySelector('img').alt;
    cap.textContent = it.querySelector('figcaption').textContent;
  };
  var open = function (it) {
    list = items.filter(function (x) { return !x.hidden; });
    show(list.indexOf(it));
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    lb.querySelector('.pw-close').focus();
  };
  var close = function () { lb.hidden = true; document.body.style.overflow = ''; };
  items.forEach(function (it) {
    it.querySelector('a').addEventListener('click', function (e) { e.preventDefault(); open(it); });
  });
  lb.querySelector('.pw-close').addEventListener('click', close);
  lb.querySelector('.pw-prev').addEventListener('click', function () { show(at - 1); });
  lb.querySelector('.pw-next').addEventListener('click', function () { show(at + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
  window.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(at - 1);
    if (e.key === 'ArrowRight') show(at + 1);
  });
  var sx = null;
  lb.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (sx === null) return;
    var dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 40) show(at + (dx < 0 ? 1 : -1));
    sx = null;
  });
})();
