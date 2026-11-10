/* Holiday themes. Every year the dates are worked out automatically from today's
   date in Gainesville: fixed dates, "nth weekday" holidays, Easter, the Chinese
   lunar calendar (via the browser's built-in Chinese calendar), and the Qingming
   and Winter Solstice solar terms. Texts, animations and on/off switches are in
   _config.yml → holidays. Preview one with ?holiday=<name>, e.g. ?holiday=mid_autumn,
   or a whole day with ?date=2027-02-06. */
(function () {
  'use strict';

  var dataEl = document.getElementById('holiday-data');
  if (!dataEl) return;
  var cfg = {};
  try { cfg = JSON.parse(dataEl.textContent) || {}; } catch (e) { return; }
  var H = cfg.h || {};
  if (H.enabled === false) return;

  var root = document.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isLite = function () { return root.classList.contains('lite'); };

  /* ---------- Dates ---------- */
  var today;
  try {
    today = new Intl.DateTimeFormat('en-CA', { timeZone: cfg.tz || 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  } catch (e) {
    var n0 = new Date();
    today = n0.getFullYear() + '-' + String(n0.getMonth() + 1).padStart(2, '0') + '-' + String(n0.getDate()).padStart(2, '0');
  }
  // Preview any day: ?date=2027-02-06
  var forced = (location.search.match(/[?&]date=(\d{4}-\d{2}-\d{2})/) || [])[1];
  if (forced) today = forced;
  var DAY = 86400000;
  var toDate = function (s) { return new Date(s + 'T12:00:00Z'); };
  var toStr = function (d) { return d.toISOString().slice(0, 10); };
  var shift = function (s, n) { return toStr(new Date(toDate(s).getTime() + n * DAY)); };
  var Y = Number(today.slice(0, 4)), M = Number(today.slice(5, 7)), Dd = Number(today.slice(8, 10));
  var md = today.slice(5);

  // n-th <weekday> of a month (n = -1 for the last one), as a day of the month
  function nthWeekday(month, wd, n) {
    if (n > 0) {
      var first = new Date(Date.UTC(Y, month - 1, 1, 12)).getUTCDay();
      return 1 + ((wd - first + 7) % 7) + (n - 1) * 7;
    }
    var lastDay = new Date(Date.UTC(Y, month, 0, 12));
    return lastDay.getUTCDate() - ((lastDay.getUTCDay() - wd + 7) % 7);
  }
  var isNth = function (month, wd, n) { return M === month && Dd === nthWeekday(month, wd, n); };

  // Easter Sunday (Anonymous Gregorian algorithm)
  function easter(y) {
    var a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
    var f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
    var i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
    var m = Math.floor((a + 11 * h + 22 * l) / 451);
    var month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
    return String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0');
  }

  // Solar terms for 2001–2099: [Y × 0.2422 + C] − [Y / 4], Y = last two digits of the year
  function solarDay(c) { var y = Y % 100; return Math.floor(y * 0.2422 + c) - Math.floor(y / 4); }

  // Official dates of the Chinese festivals and the two solar terms for 2026–2060
  // (from the published Chinese calendar). The browser's own Chinese calendar is
  // used after 2060; it is right almost every year but is off by a day for a few
  // Lunar New Years (2027 and 2030), which is why this table exists.
  var TABLE = {"spring":"20260217 20270206 20280126 20290213 20300203 20310123 20320211 20330131 20340219 20350208 20360128 20370215 20380204 20390124 20400212 20410201 20420122 20430210 20440130 20450217 20460206 20470126 20480214 20490202 20500123 20510211 20520201 20530219 20540208 20550128 20560215 20570204 20580124 20590212 20600202","lantern":"20260303 20270220 20280209 20290227 20300217 20310206 20320225 20330214 20340305 20350222 20360211 20370301 20380218 20390207 20400226 20410215 20420205 20430224 20440213 20450303 20460220 20470209 20480228 20490216 20500206 20510225 20520215 20530305 20540222 20550211 20560229 20570218 20580207 20590226 20600216","dragon":"20260619 20270609 20280528 20290616 20300605 20310624 20320612 20330601 20340620 20350610 20360530 20370618 20380607 20390527 20400614 20410603 20420622 20430611 20440531 20450619 20460608 20470529 20480615 20490604 20500623 20510613 20520601 20530620 20540610 20550530 20560617 20570606 20580625 20590614 20600603","qixi":"20260819 20270808 20280826 20290816 20300805 20310824 20320812 20330801 20340820 20350810 20360828 20370817 20380807 20390826 20400814 20410803 20420822 20430811 20440731 20450819 20460808 20470827 20480816 20490805 20500823 20510812 20520801 20530820 20540810 20550829 20560817 20570806 20580825 20590814 20600802","midautumn":"20260925 20270915 20281003 20290922 20300912 20311001 20320919 20330908 20340927 20350916 20361004 20370924 20380913 20391002 20400920 20410910 20420928 20430917 20441005 20450925 20460915 20471004 20480922 20490911 20500930 20510919 20520907 20530926 20540916 20551005 20560924 20570913 20581002 20590921 20600909","doubleninth":"20261018 20271008 20281026 20291016 20301005 20311024 20321012 20331001 20341020 20351009 20361027 20371017 20381007 20391026 20401014 20411003 20421022 20431011 20441029 20451018 20461008 20471027 20481016 20491005 20501024 20511013 20521030 20531020 20541009 20551028 20561017 20571007 20581025 20591014 20601002","laba":"20270115 20280104 20290122 20300111 20310101 20320120 20330108 20340127 20350116 20360105 20370123 20380112 20390102 20400121 20410110 20411230 20430118 20440107 20450125 20460114 20470103 20480122 20490111 20500101 20510120 20520109 20530127 20540116 20550105 20560124 20570112 20580102 20590121 20600111 20601230","qingming":"20260405 20270405 20280404 20290404 20300405 20310405 20320404 20330404 20340405 20350405 20360404 20370404 20380405 20390405 20400404 20410404 20420404 20430405 20440404 20450404 20460404 20470405 20480404 20490404 20500404 20510405 20520404 20530404 20540404 20550405 20560404 20570404 20580404 20590405 20600404","dongzhi":"20261222 20271222 20281221 20291221 20301222 20311222 20321221 20331221 20341222 20351222 20361221 20371221 20381222 20391222 20401221 20411221 20421222 20431222 20441221 20451221 20461222 20471222 20481221 20491221 20501222 20511222 20521221 20531221 20541222 20551222 20561221 20571221 20581221 20591222 20601221"};
  var tableOn = Y >= 2026 && Y <= 2060;
  var dayNo = function (iso) { return Math.round(toDate(iso).getTime() / DAY); };
  var todayNo = dayNo(today);
  // days from the nearest listed date to today (positive = after), or null if none within a month
  function since(key) {
    var best = null;
    (TABLE[key] || '').split(' ').forEach(function (c) {
      if (!c) return;
      var diff = todayNo - dayNo(c.slice(0, 4) + '-' + c.slice(4, 6) + '-' + c.slice(6, 8));
      if (Math.abs(diff) <= 30 && (best === null || Math.abs(diff) < Math.abs(best))) best = diff;
    });
    return best;
  }
  var on = function (key, from, to) { var d = since(key); return d !== null && d >= (from || 0) && d <= (to || 0); };

  // Chinese lunar date of a day: { m, d, leap } (null if the browser can't tell)
  var lunarFmt = null;
  try { lunarFmt = new Intl.DateTimeFormat('en-u-ca-chinese', { timeZone: 'UTC', month: 'numeric', day: 'numeric' }); } catch (e) { lunarFmt = null; }
  function lunar(s) {
    if (!lunarFmt || !lunarFmt.formatToParts) return null;
    var parts = lunarFmt.formatToParts(toDate(s)), m = '', d = '';
    parts.forEach(function (p) { if (p.type === 'month') m = p.value; if (p.type === 'day') d = p.value; });
    var mm = parseInt(m, 10), dd = parseInt(d, 10);
    if (isNaN(mm) || isNaN(dd)) return null;
    return { m: mm, d: dd, leap: /bis|\D$/.test(m) && !/^\d+$/.test(m) };
  }
  var L = tableOn ? null : lunar(today), Ltomorrow = tableOn ? null : lunar(shift(today, 1));
  var lunarIs = function (m, d) { return L && !L.leap && L.m === m && L.d === d; };
  var isEve = tableOn ? on('spring', -1, -1) : !!(Ltomorrow && !Ltomorrow.leap && Ltomorrow.m === 1 && Ltomorrow.d === 1);
  var isNewYearDay = tableOn ? on('spring', 0, 0) : lunarIs(1, 1);
  // Lunar New Year's Eve through the Lantern Festival (lantern decorations)
  var inLanternSeason = tableOn ? (on('spring', -1, 14)) : (isEve || (L && !L.leap && L.m === 1 && L.d <= 15));

  // The 24 solar terms: day of the month of each term, January to December (two per month).
  // Official dates for 2026–2060; the standard formula after that.
  var TERMS = ["052004180520052005210521072307230723082307220722","052004190621052006210621072308230823082307220722","062004190520041905200521062207220722082307220621","052003180520042005210521072207230723082307220721","052004180520052005210521072307230723082307220722","052004190621052006210621072308230823082307220722","062004190520041905200521062207220722082307220621","052003180520042005210521072207230723082307220721","052004180520052005210521072307230723082307220722","052004190621052005210621072307230823082307220722","062004190520041905200521062207220722082307220621","052003180520042005210521072207230723082307220721","052004180520052005210521072307230723082307220722","052004190621052005210621072307230823082307220722","062004190520041905200521062207220722082307220621","052003180520042005200521072207230722082307220721","052004180520042005210521072307230723082307220722","052004190621052005210621072307230823082307220722","062004190520041905200521062207220722072307220621","052003180520041905200521072207230722082307220721","052004180520042005210521072207230723082307220722","052004190621052005210621072307230823082307220722","062004190520041905200520062207220722072307210621","051903180520041905200521062207220722082307220721","052003180520042005210521072207230723082307220722","052004190520052005210621072307230723082307220722","052004190520041905200520062207220722072307210621","051903180520041905200521062207220722082307220721","052003180520042005210521072207230723082307220722","052004190520052005210521072307230723082307220722","052004190520041905200520062207220722072307210621","051903180520041905200521062207220722082307220621","052003180520042005210521072207230723082307220721","052004190520052005210521072307230723082307220722","052004190520041905200520062207220722072206210621"];
  var TERM_C = [5.4055, 20.12, 3.87, 18.73, 5.63, 20.646, 4.81, 20.1, 5.52, 21.04, 5.678, 21.37,
                7.108, 22.83, 7.5, 23.13, 7.646, 23.042, 8.318, 23.438, 7.438, 22.36, 7.18, 21.94];
  function termToday() {
    for (var t = (M - 1) * 2; t < (M - 1) * 2 + 2; t++) {
      var day;
      if (Y >= 2026 && Y <= 2060) day = Number(TERMS[Y - 2026].slice(t * 2, t * 2 + 2));
      else { var yy = Y % 100; day = Math.floor(yy * 0.2422 + TERM_C[t]) - (t < 4 ? Math.floor((yy - 1) / 4) : Math.floor(yy / 4)); }
      if (day === Dd) return t;
    }
    return -1;
  }
  var TERM_ICONS = ['🧤', '⛄', '🌱', '🌧️', '⚡', '🌸', '🌿', '🌾', '🍃', '🌾', '🌾', '☀️',
                    '🍉', '🔥', '🍂', '🌾', '💧', '🍁', '🍂', '❄️', '🧣', '🌨️', '❄️', '🥟'];
  var TERM_FX = { 3: 'rain', 7: 'rain', 18: 'leaves', 19: 'leaves', 14: 'leaves', 21: 'snow', 22: 'snow', 0: 'snow', 1: 'snow', 5: 'flowers', 2: 'flowers' };

  var RULES = {
    new_year: function () { return md === '12-31' || md === '01-01' || md === '01-02'; },
    mlk_day: function () { return isNth(1, 1, 3); },
    valentines: function () { return md === '02-14'; },
    presidents_day: function () { return isNth(2, 1, 3); },
    st_patricks: function () { return md === '03-17'; },
    easter: function () { return md === easter(Y); },
    mothers_day: function () { return isNth(5, 0, 2); },
    memorial_day: function () { return isNth(5, 1, -1); },
    fathers_day: function () { return isNth(6, 0, 3); },
    juneteenth: function () { return md === '06-19'; },
    independence_day: function () { return md === '07-04'; },
    labor_day: function () { return isNth(9, 1, 1); },
    columbus_day: function () { return isNth(10, 1, 2); },
    halloween: function () { return md >= '10-29' && md <= '10-31'; },
    veterans_day: function () { return md === '11-11'; },
    thanksgiving: function () { var t = nthWeekday(11, 4, 4); return M === 11 && Dd >= t && Dd <= t + 3; },
    christmas: function () { return md === '12-24' || md === '12-25'; },
    winter_snow: function () { return md >= '12-01' && md <= '12-26'; },
    spring_festival: function () { return tableOn ? on('spring', -1, 6) : (isEve || (L && !L.leap && L.m === 1 && L.d <= 7)); },
    lantern_festival: function () { return tableOn ? on('lantern') : lunarIs(1, 15); },
    qingming: function () { return tableOn ? on('qingming') : (M === 4 && Dd === solarDay(4.81)); },
    dragon_boat: function () { return tableOn ? on('dragon') : lunarIs(5, 5); },
    qixi: function () { return tableOn ? on('qixi') : lunarIs(7, 7); },
    mid_autumn: function () { return tableOn ? on('midautumn', -1, 1) : (L && !L.leap && L.m === 8 && L.d >= 14 && L.d <= 16); },
    double_ninth: function () { return tableOn ? on('doubleninth') : lunarIs(9, 9); },
    dongzhi: function () { return tableOn ? on('dongzhi') : (M === 12 && Dd === solarDay(21.94)); },
    laba: function () { return tableOn ? on('laba') : lunarIs(12, 8); }
  };
  var CHINESE = ['spring_festival', 'lantern_festival', 'qingming', 'dragon_boat', 'qixi', 'mid_autumn', 'double_ninth', 'dongzhi', 'laba'];

  // Preview: ?holiday=mid_autumn (older short names still work)
  var preview = (location.search.match(/[?&]holiday=([a-z_0-9]+)/) || [])[1] || '';
  preview = { snow: 'winter_snow', newyear: 'new_year', lunar: 'spring_festival' }[preview] || preview;

  var termIdx = H.solar_terms ? termToday() : -1;
  var tp = preview.match(/^term_(\d+)$/);
  if (preview) termIdx = tp ? Number(tp[1]) : (preview === 'solar_term' ? 2 : -1);

  var active = [];
  Object.keys(RULES).forEach(function (id) {
    var h = H[id];
    if (!h || h.show === false) return;
    var on = preview ? preview === id : RULES[id]();
    if (on) active.push({ id: id, text: h.text || '', effect: h.effect || 'none' });
  });

  // Yu's birthday (from _config.yml → eggs → birthday)
  var B = cfg.bday || {};
  var isBirthday = B.show !== false && B.date && (preview ? preview === 'birthday' : md === String(B.date));
  if (isBirthday) active.push({ id: 'birthday', text: B.text || '', effect: 'none' });

  // Game days (from the schedule in the config)
  var game = null;
  if (H.game_day) {
    (H.game_days || []).forEach(function (g) { if (String(g.date).slice(0, 10) === today) game = g; });
    if (preview === 'gameday') game = game || (H.game_days || [])[0] || { text: 'Game day! Go Gators!' };
    if (preview && preview !== 'gameday') game = null;
  }

  /* ---------- Banners under the header ---------- */
  function banner(id, text, group) {
    var key = 'banner-closed:' + id + ':' + today;
    try { if (!preview && !forced && localStorage.getItem(key)) return; } catch (e) { /* ignore */ }
    var b = document.createElement('div');
    b.className = 'holiday-banner hb-' + group;
    b.setAttribute('data-h', id);
    b.setAttribute('role', 'status');
    b.innerHTML = '<div class="container hb-inner"><span class="hb-icon" aria-hidden="true"></span><span class="hb-text"></span>' +
      '<button type="button" class="hb-close" aria-label="Close">&times;</button></div>';
    b.querySelector('.hb-text').textContent = text;
    b.querySelector('.hb-close').addEventListener('click', function () {
      b.classList.add('is-leaving');
      try { localStorage.setItem(key, '1'); } catch (e) { /* ignore */ }
      setTimeout(function () { b.remove(); }, 350);
    });
    var header = document.querySelector('.site-header');
    var after = header;
    while (after && after.nextElementSibling && after.nextElementSibling.classList.contains('holiday-banner')) after = after.nextElementSibling;
    if (after && after.parentNode) after.parentNode.insertBefore(b, after.nextSibling);
  }
  if (game) banner('gameday', game.text, 'gameday');
  active.forEach(function (a) {
    if (a.text) banner(a.id, a.text, a.id === 'birthday' ? 'bday' : CHINESE.indexOf(a.id) !== -1 ? 'cn' : 'us');
  });
  if (isBirthday && window.siteConfetti && !reduceMotion) setTimeout(window.siteConfetti, 900);
  var termDup = active.some(function (a) { return a.id === 'qingming' || a.id === 'dongzhi'; });
  if (termIdx >= 0 && !termDup && (H.solar_term_names || [])[termIdx]) {
    banner('term', (H.solar_term_label ? H.solar_term_label + ' · ' : '') + H.solar_term_names[termIdx], 'term');
    var tb = document.querySelector('.holiday-banner[data-h="term"] .hb-icon');
    if (tb) tb.textContent = TERM_ICONS[termIdx];
  }

  /* ---------- Holiday colors for the line under the header ---------- */
  if ((' ' + (root.getAttribute('data-fx') || '') + ' ').indexOf(' holidaycolors ') !== -1) {
    var PAL = {
      christmas: ['#c92a2a', '#2b8a3e', '#f8f9fa', '#c92a2a'], winter_snow: ['#74c0fc', '#e7f5ff', '#a5d8ff', '#74c0fc'],
      halloween: ['#f76707', '#212529', '#7048e8', '#f76707'], thanksgiving: ['#d9480f', '#b8860b', '#8c4a12', '#d9480f'],
      valentines: ['#e64980', '#ffdeeb', '#c2255c', '#e64980'], qixi: ['#e64980', '#9775fa', '#ffdeeb', '#e64980'],
      st_patricks: ['#2b8a3e', '#69db7c', '#fcc419', '#2b8a3e'], easter: ['#b197fc', '#ffc9de', '#a5d8ff', '#b197fc'],
      mothers_day: ['#f783ac', '#ffc9de', '#b197fc', '#f783ac'], new_year: ['#fcc419', '#7048e8', '#f8f9fa', '#fcc419'],
      mid_autumn: ['#f2c35b', '#1c2541', '#ffe8a3', '#f2c35b'], birthday: ['#f06595', '#ff922b', '#fcc419', '#f06595'],
      gameday: ['#0021a5', '#fa4616', '#0021a5', '#fa4616']
    };
    var US_FLAG = ['#b22234', '#f8f9fa', '#3c3b6e', '#b22234'], CN_RED = ['#c92a2a', '#fcc419', '#c92a2a', '#fcc419'], TERM = ['#2f6b5a', '#8aa36b', '#cfe8c8', '#2f6b5a'];
    var firstId = game ? 'gameday' : active.length ? active[0].id : (termIdx >= 0 ? 'term' : '');
    var pal = PAL[firstId] || (CHINESE.indexOf(firstId) !== -1 ? CN_RED : firstId === 'term' ? TERM : firstId ? US_FLAG : null);
    if (pal) root.style.setProperty('--hdr-line', 'linear-gradient(90deg, transparent, ' + pal.join(', ') + ', transparent)');
  }

  /* ---------- Decorations ---------- */
  var effects = {};
  active.forEach(function (a) { effects[a.effect] = true; });
  // Lunar New Year: lanterns from New Year's Eve to the Lantern Festival, fireworks on the eve and first day
  if (inLanternSeason && H.spring_festival && H.spring_festival.show !== false && !preview) effects.lanterns = true;
  if ((isEve || isNewYearDay) && H.spring_festival && H.spring_festival.show !== false && !preview) effects.fireworks = true;
  if (preview === 'spring_festival') effects.fireworks = true;

  if (termIdx >= 0 && !termDup && TERM_FX[termIdx]) effects[TERM_FX[termIdx]] = true;

  /* ---------- A small decoration for every holiday ---------- */
  var ZODIAC = ['🐀', '🐂', '🐅', '🐇', '🐉', '🐍', '🐎', '🐐', '🐒', '🐓', '🐕', '🐖'];
  var DECOR = {
    new_year: [['corner', '🥂', 'clink'], ['fly', '🎈', 'float']],
    mlk_day: [['fly', '🕊️', 'glide']],
    valentines: [['corner', '💝', 'beat'], ['fly', '💘', 'glide']],
    presidents_day: [['flag'], ['corner', '🎩', 'bob']],
    st_patricks: [['rainbow'], ['corner', '🍀', 'spin']],
    easter: [['walk', '🐇', 'hop'], ['corner', '🐣', 'bob']],
    mothers_day: [['corner', '💐', 'sway'], ['fly', '🦋', 'flutter']],
    memorial_day: [['flag']],
    fathers_day: [['corner', '👔', 'swing']],
    juneteenth: [['corner', '⭐', 'glow']],
    independence_day: [['flag'], ['fly', '🎆', 'glide']],
    labor_day: [['corner', '🛠️', 'bob'], ['corner', '🌭', 'bob']],
    columbus_day: [['corner', '🧭', 'spin']],
    halloween: [['spider'], ['corner', '🎃', 'flicker'], ['fly', '🧹', 'witch']],
    veterans_day: [['flag'], ['corner', '🎖️', 'swing']],
    thanksgiving: [['walk', '🦃', 'waddle'], ['corner', '🥧', 'bob']],
    christmas: [['tree'], ['fly', '🦌🦌🛷🎅', 'sleigh'], ['corner', '🎁', 'bob']],
    winter_snow: [['corner', '⛄', 'bob']],
    spring_festival: [['corner', ZODIAC[(((Y - 4) % 12) + 12) % 12], 'bob'], ['corner', '🧧', 'swing']],
    lantern_festival: [['corner', '🍡', 'bob'], ['fx', 'skylanterns']],
    qingming: [['willow']],
    dragon_boat: [['walk', '🐉🛶', 'row'], ['corner', '🍙', 'bob']],
    qixi: [['fly', '🐦 🐦', 'flutter'], ['corner', '💞', 'beat']],
    mid_autumn: [['rabbit'], ['corner', '🥮', 'bob']],
    double_ninth: [['corner', '🌼', 'sway'], ['corner', '⛰️', 'none']],
    dongzhi: [['corner', '🥟', 'steam']],
    laba: [['corner', '🥣', 'steam']],
    birthday: [['corner', '🎂', 'bob'], ['fly', '🎈', 'float'], ['corner', '🎁', 'swing']]
  };
  var cornerN = 0;
  function deco(cls, html) {
    var d = document.createElement('div');
    d.className = 'hd ' + cls;
    d.setAttribute('aria-hidden', 'true');
    d.innerHTML = html;
    document.body.appendChild(d);
    return d;
  }
  if (H.decorations !== false) {
    active.forEach(function (a) {
      (DECOR[a.id] || []).forEach(function (item) {
        var kind = item[0], glyph = item[1], anim = item[2] || 'bob';
        if (kind === 'fx') { effects[glyph] = true; return; }
        if (kind === 'corner') {
          var c = deco('hd-corner hd-' + anim, '<span class="hd-glyph">' + glyph + '</span>' +
            (anim === 'steam' ? '<i class="hd-steam s1"></i><i class="hd-steam s2"></i><i class="hd-steam s3"></i>' : ''));
          c.style.setProperty('--slot', cornerN++);
        } else if (kind === 'walk') {
          deco('hd-walk hd-' + anim, '<span class="hd-glyph">' + glyph + '</span>');
        } else if (kind === 'fly') {
          deco('hd-fly hd-' + anim, '<span class="hd-glyph">' + glyph + '</span>');
        } else if (kind === 'flag') {
          deco('hd-flag-wrap', '<span class="hd-pole"></span><span class="hd-flag"></span>').style.setProperty('--slot', cornerN++);
        } else if (kind === 'rainbow') {
          deco('hd-rainbow', '<span class="hd-arc"></span><span class="hd-gold">🪙</span>').style.setProperty('--slot', cornerN++);
          cornerN++;
        } else if (kind === 'tree') {
          var lights = '';
          for (var i = 0; i < 12; i++) lights += '<i class="hd-light" style="--i:' + i + '"></i>';
          deco('hd-tree', '<span class="hd-star">⭐</span><span class="hd-leaves"></span>' + lights + '<span class="hd-trunk"></span>').style.setProperty('--slot', cornerN++);
          cornerN++;
        } else if (kind === 'spider') {
          deco('hd-spider', '<span class="hd-thread"></span><span class="hd-glyph">🕷️</span>');
        } else if (kind === 'willow') {
          var strands = '';
          [0, 1, 2, 3].forEach(function (k) { strands += '<span class="hd-strand" style="--k:' + k + '"><span class="hd-glyph">🌿</span></span>'; });
          deco('hd-willow', strands);
        } else if (kind === 'rabbit') {
          deco('hd-rabbit', '<span class="hd-glyph">🐇</span>');
        }
      });
    });
  }

  if (effects.lanterns) {
    ['left', 'right'].forEach(function (side) {
      var l = document.createElement('div');
      l.className = 'lantern lantern-' + side;
      l.setAttribute('aria-hidden', 'true');
      l.innerHTML = '<span class="lantern-string"></span><span class="lantern-body"><span class="lantern-char">福</span></span><span class="lantern-tassel"></span>';
      document.body.appendChild(l);
    });
  }
  if (effects.moon) {
    var moon = document.createElement('div');
    moon.className = 'holiday-moon';
    moon.setAttribute('aria-hidden', 'true');
    document.body.appendChild(moon);
  }

  /* ---------- Particles: fireworks, snow, and drifting emoji ---------- */
  var EMOJI = {
    hearts: { chars: ['💗', '💕', '❤️'], dir: -1 },     // float up
    spooky: { chars: ['🦇', '🎃', '👻'], dir: -1 },
    leaves: { chars: ['🍁', '🍂'], dir: 1 },            // fall down
    clovers: { chars: ['☘️', '🍀'], dir: 1 },
    flowers: { chars: ['🌸', '🌷', '🌼'], dir: 1 }
  };
  var kinds = Object.keys(EMOJI).filter(function (k) { return effects[k]; });
  if (!(effects.snow || effects.fireworks || effects.rain || effects.skylanterns || kinds.length) || reduceMotion) return;

  var canvas = document.createElement('canvas');
  canvas.className = 'holiday-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.insertBefore(canvas, document.body.firstChild);
  var ctx = canvas.getContext('2d');
  var W = 0, Hh = 0, dpr = 1;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; Hh = window.innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(Hh * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  var flakes = [];
  if (effects.snow) {
    var nf = Math.min(130, Math.round((W * Hh) / 12000));
    for (var i = 0; i < nf; i++) {
      flakes.push({ x: Math.random() * W, y: Math.random() * Hh, r: Math.random() * 2.2 + 0.8,
                    vy: Math.random() * 0.6 + 0.35, sway: Math.random() * Math.PI * 2, sp: Math.random() * 0.015 + 0.005 });
    }
  }
  var drifters = [];
  kinds.forEach(function (k) {
    var spec = EMOJI[k];
    var count = Math.round(20 / kinds.length);
    for (var j = 0; j < count; j++) {
      drifters.push({ ch: spec.chars[j % spec.chars.length], dir: spec.dir, x: Math.random() * W, y: Math.random() * Hh,
                      size: 16 + Math.random() * 14, v: 0.35 + Math.random() * 0.5, sway: Math.random() * 6.28,
                      rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.02 });
    }
  });
  var drops = [];
  if (effects.rain) {
    for (var r = 0; r < 70; r++) drops.push({ x: Math.random() * W, y: Math.random() * Hh, len: 10 + Math.random() * 12, v: 6 + Math.random() * 4 });
  }
  var skyl = [];
  if (effects.skylanterns) {
    for (var q = 0; q < 14; q++) skyl.push({ x: Math.random() * W, y: Hh * (0.3 + Math.random() * 0.9), s: 10 + Math.random() * 10, v: 0.25 + Math.random() * 0.35, ph: Math.random() * 6.28 });
  }
  var sparks = [];
  var nextBurst = 0;
  var showUntil = performance.now() + 25000;           // fireworks for the first 25 seconds
  var COLORS = ['250,70,22', '255,170,60', '74,108,247', '255,215,120', '255,255,255', '220,40,60'];
  function burst() {
    var x = W * (0.15 + Math.random() * 0.7), y = Hh * (0.12 + Math.random() * 0.35);
    var c = COLORS[(Math.random() * COLORS.length) | 0];
    var count = 46 + ((Math.random() * 20) | 0);
    for (var k = 0; k < count; k++) {
      var a = (k / count) * Math.PI * 2, sp = 2.2 + Math.random() * 2.4;
      sparks.push({ x: x, y: y, px: x, py: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, c: c });
    }
  }

  var raf = null;
  var dark = function () { return root.getAttribute('data-theme') === 'dark' || root.classList.contains('theme-night'); };
  function frame(now) {
    raf = null;
    ctx.clearRect(0, 0, W, Hh);
    if (flakes.length) {
      ctx.fillStyle = dark() ? 'rgba(255,255,255,0.85)' : 'rgba(150,170,215,0.75)';
      flakes.forEach(function (f) {
        f.sway += f.sp; f.y += f.vy; f.x += Math.sin(f.sway) * 0.4;
        if (f.y > Hh + 5) { f.y = -5; f.x = Math.random() * W; }
        ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2); ctx.fill();
      });
    }
    if (drops.length) {
      ctx.strokeStyle = dark() ? 'rgba(190,205,255,0.35)' : 'rgba(90,110,160,0.28)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      drops.forEach(function (d) {
        d.y += d.v; d.x -= d.v * 0.18;
        if (d.y > Hh + 20) { d.y = -20; d.x = Math.random() * (W + 100); }
        ctx.moveTo(d.x, d.y); ctx.lineTo(d.x + d.len * 0.18, d.y - d.len);
      });
      ctx.stroke();
    }
    if (skyl.length) {
      skyl.forEach(function (l) {
        l.y -= l.v; l.ph += 0.03; l.x += Math.sin(l.ph) * 0.25;
        if (l.y < -40) { l.y = Hh + 30; l.x = Math.random() * W; }
        var flick = 0.85 + 0.15 * Math.sin(l.ph * 3);
        var g = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.s * 2.2);
        g.addColorStop(0, 'rgba(255,200,110,' + (0.55 * flick).toFixed(3) + ')');
        g.addColorStop(1, 'rgba(255,140,60,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(l.x, l.y, l.s * 2.2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,170,80,' + (0.9 * flick).toFixed(3) + ')';
        ctx.beginPath(); ctx.ellipse(l.x, l.y, l.s * 0.55, l.s * 0.75, 0, 0, Math.PI * 2); ctx.fill();
      });
    }
    if (drifters.length) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = 0.8;
      drifters.forEach(function (p) {
        p.sway += 0.012; p.rot += p.vr;
        p.y += p.v * p.dir; p.x += Math.sin(p.sway) * 0.5;
        if (p.dir > 0 && p.y > Hh + 30) { p.y = -30; p.x = Math.random() * W; }
        if (p.dir < 0 && p.y < -30) { p.y = Hh + 30; p.x = Math.random() * W; }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.dir > 0 ? p.rot : Math.sin(p.sway) * 0.25);
        ctx.font = Math.round(p.size) + 'px serif';
        ctx.fillText(p.ch, 0, 0);
        ctx.restore();
      });
      ctx.globalAlpha = 1;
    }
    if (effects.fireworks) {
      if (now < showUntil && now > nextBurst) { burst(); nextBurst = now + 700 + Math.random() * 900; }
      for (var k = sparks.length - 1; k >= 0; k--) {
        var s = sparks[k];
        s.px = s.x; s.py = s.y;
        s.vx *= 0.985; s.vy = s.vy * 0.985 + 0.045;
        s.x += s.vx; s.y += s.vy;
        s.life -= 0.012;
        if (s.life <= 0) { sparks.splice(k, 1); continue; }
        ctx.strokeStyle = 'rgba(' + s.c + ',' + s.life.toFixed(3) + ')';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(s.px, s.py); ctx.lineTo(s.x, s.y); ctx.stroke();
      }
    }
    var more = flakes.length || drifters.length || drops.length || skyl.length || sparks.length || (effects.fireworks && now < showUntil);
    if (more && !document.hidden && !isLite()) raf = requestAnimationFrame(frame);
  }
  function start() { if (!raf && !isLite()) raf = requestAnimationFrame(frame); }
  start();
  document.addEventListener('visibilitychange', function () { if (!document.hidden) start(); });
  window.addEventListener('litechange', function () {
    if (isLite()) { if (raf) cancelAnimationFrame(raf); raf = null; ctx.clearRect(0, 0, W, Hh); }
    else start();
  });
})();
