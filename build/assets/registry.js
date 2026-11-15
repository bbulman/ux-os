// Registry facets. Values within a facet widen the view (OR); facets narrow it (AND).
// The filter lives in the URL hash, so a filtered view can be linked: #set=research&loads=on,name
// Without this script the bar stays hidden and the whole sheet shows.
(function () {
  var root = document.querySelector('[data-filters]');
  var sheet = document.querySelector('[data-sheet]');
  if (!root || !sheet) return;

  var KEYS = ['set', 'type', 'origin', 'loads', 'scope'];
  var all = function (sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); };
  var frames = Array.prototype.slice.call(sheet.children);
  var buttons = all('[data-facet]', root);
  var toggles = all('[data-toggle]', root);
  var panels = all('[data-panel]', root);
  var count = document.querySelector('[data-count]');
  var clears = all('[data-clear]');
  var empty = document.querySelector('[data-empty]');

  var valid = {};
  var labels = {};
  buttons.forEach(function (b) {
    var k = b.getAttribute('data-facet');
    var v = b.getAttribute('data-value');
    (valid[k] = valid[k] || {})[v] = true;
    labels[k + '=' + v] = b.getAttribute('data-label');
  });

  var state = {};

  // A hash with no "=" is an ordinary anchor (the skip link's #main), not a filter: null leaves the
  // filters as they are.
  function parse() {
    var s = {};
    var hash = location.hash.replace(/^#/, '');
    if (hash.indexOf('=') < 0) return null;
    try { hash = decodeURIComponent(hash); } catch (e) { return s; }
    hash.split('&').forEach(function (part) {
      var kv = part.split('=');
      var k = kv[0];
      if (KEYS.indexOf(k) < 0 || !kv[1]) return;
      kv[1].split(',').forEach(function (v) {
        if (valid[k] && valid[k][v]) (s[k] = s[k] || {})[v] = true;
      });
    });
    return s;
  }

  function values(k) { return state[k] ? Object.keys(state[k]) : []; }
  function anyActive() { return KEYS.some(function (k) { return values(k).length; }); }

  function serialize() {
    return KEYS.filter(function (k) { return values(k).length; })
      .map(function (k) { return k + '=' + values(k).join(','); }).join('&');
  }

  function current(k) {
    var vs = values(k);
    if (!vs.length) return 'all';
    var first = labels[k + '=' + vs[0]];
    return vs.length === 1 ? first : first + ' +' + (vs.length - 1);
  }

  function apply() {
    var shown = 0;
    frames.forEach(function (f) {
      var ok = KEYS.every(function (k) {
        var vs = values(k);
        return !vs.length || vs.indexOf(f.getAttribute('data-' + k)) >= 0;
      });
      f.hidden = !ok;
      if (ok) shown++;
    });
    buttons.forEach(function (b) {
      var on = !!(state[b.getAttribute('data-facet')] || {})[b.getAttribute('data-value')];
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    toggles.forEach(function (t) {
      var k = t.getAttribute('data-toggle');
      t.querySelector('[data-cur]').textContent = current(k);
      t.classList.toggle('is-set', values(k).length > 0);
    });
    var any = anyActive();
    count.textContent = 'Showing ' + shown + ' of ' + frames.length;
    clears.forEach(function (c) { c.hidden = !any; });
    empty.hidden = shown !== 0;
  }

  function write() {
    var h = serialize();
    try { history.replaceState(null, '', h ? '#' + h : location.pathname + location.search); }
    catch (e) { location.hash = h; }
  }

  function open(key) {
    toggles.forEach(function (t) { t.setAttribute('aria-expanded', t.getAttribute('data-toggle') === key ? 'true' : 'false'); });
    panels.forEach(function (p) { p.hidden = p.getAttribute('data-panel') !== key; });
  }

  toggles.forEach(function (t) {
    t.addEventListener('click', function () {
      open(t.getAttribute('aria-expanded') === 'true' ? null : t.getAttribute('data-toggle'));
    });
    t.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Escape' || t.getAttribute('aria-expanded') !== 'true') return;
      ev.preventDefault();
      open(null);
    });
  });

  panels.forEach(function (p) {
    p.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Escape') return;
      var key = p.getAttribute('data-panel');
      open(null);
      root.querySelector('[data-toggle="' + key + '"]').focus();
    });
  });

  buttons.forEach(function (b) {
    b.addEventListener('click', function () {
      var k = b.getAttribute('data-facet');
      var v = b.getAttribute('data-value');
      state[k] = state[k] || {};
      if (state[k][v]) delete state[k][v]; else state[k][v] = true;
      write();
      apply();
    });
  });

  clears.forEach(function (c) {
    c.addEventListener('click', function () {
      state = {};
      write();
      apply();
      open(null);
      toggles[0].focus();
    });
  });

  window.addEventListener('hashchange', function () {
    var s = parse();
    if (!s) return;
    state = s;
    apply();
  });

  state = parse() || {};
  root.hidden = false;
  apply();
})();
