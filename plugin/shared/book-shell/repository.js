(function () {
'use strict';
var D = (window.BOOK || {}).repository;
var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
var strength = 'all', tag = 'all', query = '';

function $(s) { return document.querySelector(s); }
function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function plural(n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); }
function cap1(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

/* dates as the files write them: 2026-11-09 or 2026-11 */
function parts(d) {
  var m = String(d || '').match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
  return m ? { y: Number(m[1]), m: Number(m[2]), d: m[3] ? Number(m[3]) : null } : null;
}
function endOf(d) {
  var p = parts(d); if (!p) return null;
  return new Date(p.y, p.m - 1, p.d || new Date(p.y, p.m, 0).getDate(), 23, 59, 59);
}
function fmt(d) {
  var p = parts(d); if (!p) return d || 'undated';
  return (p.d ? p.d + ' ' : '') + MON[p.m - 1] + ' ' + p.y;
}
function age(d) {
  var p = parts(d); if (!p) return { text: 'not dated', old: false };
  var now = new Date();
  var months = (now.getFullYear() - p.y) * 12 + (now.getMonth() + 1 - p.m);
  if (months < 1) return { text: 'checked this month', old: false };
  if (months < 12) return { text: 'checked ' + plural(months, 'month') + ' ago', old: months >= 9 };
  var y = Math.floor(months / 12);
  return { text: 'checked ' + plural(y, 'year') + ' ago', old: true };
}
function late(d) { var e = endOf(d); return !!e && e < new Date(); }
function fig(n, one, many) {
  if (n == null) return '<span class="fig unk">unknown</span> ' + (many || one + 's');
  return '<b class="fig">' + esc(n) + '</b> ' + (n === 1 ? one : (many || one + 's'));
}
function meter(s) {
  var n = { strong: 3, some: 2, hint: 1 }[s] || 0;
  var bars = [1, 2, 3].map(function (i) { return '<i class="' + (i <= n ? 'on' : '') + '" style="height:' + (6 + i * 5) + 'px"></i>'; }).join('');
  return '<div class="fstr' + (n ? '' : ' none') + '" role="img" aria-label="Strength: ' + (s || 'not rated') + '"><span class="mtr" aria-hidden="true">' + bars + '</span><span class="sw">' + (s ? cap1(s) : 'Not rated') + '</span></div>';
}

function matches(i) {
  if (strength !== 'all' && i.strength !== strength) return false;
  if (tag !== 'all' && i.tags.indexOf(tag) < 0) return false;
  if (query) {
    var hay = [i.insight, i.idea, i.tags.join(' '), i.source].join(' ').toLowerCase();
    var words = query.toLowerCase().split(/\s+/).filter(Boolean);
    for (var k = 0; k < words.length; k++) if (hay.indexOf(words[k]) < 0) return false;
  }
  return true;
}

function insightsHTML(list) {
  if (!list.length) return '<p class="nomatch">No insight matches. Clear the search or choose All.</p>';
  return '<ul class="ins">' + list.map(function (i) {
    var a = age(i.checked);
    return '<li class="in">' + meter(i.strength) + '<div><h3>' + esc(i.insight) + '</h3><p class="inm"><span>' + fig(i.people, 'person', 'people') + '</span><span>' + fig(i.orgs, 'organisation') + '</span><span class="' + (a.old ? 'old' : '') + '">' + esc(a.text) + (a.old ? ', check it again' : '') + '</span>' +
      (i.idea ? '<span>' + esc(i.idea) + '</span>' : '') + '</p>' +
      (i.tags.length ? '<ul class="chips">' + i.tags.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' : '') +
      (i.source ? '<p class="m">Source: ' + esc(i.source) + '</p>' : '') + '</div></li>';
  }).join('') + '</ul>';
}

function draw() {
  var shown = D.insights.filter(matches);
  $('#ilist').innerHTML = insightsHTML(shown);
  $('#rcount').textContent = 'Showing ' + shown.length + ' of ' + D.insights.length + '.';
  var sb = document.querySelectorAll('#rbar [data-s]');
  for (var k = 0; k < sb.length; k++) sb[k].setAttribute('aria-pressed', String(sb[k].getAttribute('data-s') === strength));
  var tb = document.querySelectorAll('#rbar [data-t]');
  for (var j = 0; j < tb.length; j++) tb[j].setAttribute('aria-pressed', String(tb[j].getAttribute('data-t') === tag));
}

function render() {
  if (!D) return '<div class="empty"><p class="eh">Nothing here yet.</p><p>This page will hold every study and insight the team has gathered. Run <b>/ux-os:create-research-repository</b> to fill it.</p></div>';
  var tags = {}, nStrength = { strong: 0, some: 0, hint: 0 };
  D.insights.forEach(function (i) { i.tags.forEach(function (t) { tags[t] = (tags[t] || 0) + 1; }); if (nStrength[i.strength] != null) nStrength[i.strength]++; });
  var tagNames = Object.keys(tags).sort();
  var overdue = D.studies.filter(function (s) { return late(s.review); }).length;
  var h = '<header class="vh"><h1 class="h1" tabindex="-1">' + esc(D.name) + '</h1><p class="sub">Every study and insight on file, how strong each one is, how many people stand behind it, and how old it is.</p>' +
    '<p class="rcount">' + plural(D.insights.length, 'insight') + ' from ' + plural(D.studies.length, 'study', 'studies') + (overdue ? ', ' + overdue + ' past ' + (overdue === 1 ? 'its' : 'their') + ' review date' : '') + '.</p></header>';
  if (D.how.length) h += '<details class="key"><summary><span>How this works</span> <span class="keyhint">Open</span></summary><ul class="pl">' + D.how.map(function (x) { return '<li class="d0">' + (x.label ? '<b class="lab">' + esc(x.label) + '</b> ' : '') + esc(x.text) + '</li>'; }).join('') + '</ul></details>';

  h += '<section class="grp"><div class="gh"><h2>Insights</h2></div><div class="rbar" id="rbar"><div class="rsearch"><input type="search" id="q" placeholder="Search insights, ideas and tags" aria-label="Search insights">' +
    '<div class="seg" role="group" aria-label="Strength"><button type="button" data-s="all" aria-pressed="true">All <span class="n">' + D.insights.length + '</span></button>' +
    ['strong', 'some', 'hint'].map(function (s) { return '<button type="button" data-s="' + s + '" aria-pressed="false">' + cap1(s) + ' <span class="n">' + nStrength[s] + '</span></button>'; }).join('') + '</div></div>';
  if (tagNames.length) h += '<div class="rtags" role="group" aria-label="Tag"><button type="button" data-t="all" aria-pressed="true">All tags</button>' + tagNames.map(function (t) { return '<button type="button" data-t="' + esc(t) + '" aria-pressed="false">' + esc(t) + ' <span class="n">' + tags[t] + '</span></button>'; }).join('') + '</div>';
  h += '<p class="rcount" id="rcount" aria-live="polite"></p></div><div id="ilist"></div></section>';

  if (D.studies.length) h += '<section class="grp"><div class="gh"><h2>Studies</h2><span class="conf">' + plural(D.studies.length, 'study', 'studies') + '</span></div><ul class="studies2">' + D.studies.map(function (s) {
    var l = late(s.review);
    return '<li class="st2"><div><h3>' + esc(s.study) + '</h3><p>' + esc([s.idea, s.method].filter(Boolean).join(' · ')) + '</p></div><div><p>' + [s.people ? esc(s.people) + ' people' : '', s.orgs ? esc(s.orgs) + ' organisations' : ''].filter(Boolean).join(', ') + '</p><p>' + esc(s.when ? fmt(s.when) : '') + (s.where ? ' · ' + esc(s.where) : '') + '</p></div><div><small>Review by</small><p class="due' + (l ? ' late' : '') + '">' + esc(fmt(s.review)) + '</p></div></li>';
  }).join('') + '</ul></section>';

  if (D.questions.length) h += '<section class="grp"><div class="gh"><h2>Open questions</h2><span class="conf">' + plural(D.questions.length, 'question') + '</span></div><ul class="oq">' + D.questions.map(function (q) {
    var imp = /^(high|medium|low)$/.test(q.impact) ? q.impact : '';
    return '<li><div><p>' + esc(q.question) + '</p><p class="m">' + esc([q.idea, q.source ? 'Source: ' + q.source : ''].filter(Boolean).join(' · ')) + '</p></div>' + (imp ? '<span class="impact ' + imp + '">' + cap1(imp) + ' impact</span>' : '') + '</li>';
  }).join('') + '</ul></section>';

  if (D.consent.length) h += '<section class="grp"><div class="gh"><h2>Consent and retention</h2></div><ul class="retain">' + D.consent.map(function (c) {
    var l = late(c.until);
    return '<li class="rt2"><div><b>' + esc(c.study) + '</b></div><div><small>Participants agreed to</small>' + esc(c.agreed) + '</div><div><small>Raw files kept until</small><span class="due' + (l ? ' late' : '') + '">' + esc(fmt(c.until)) + '</span></div><div><small>Status</small>' + esc(c.status) + '</div></li>';
  }).join('') + '</ul></section>';

  if (D.tags.length) h += '<section class="grp"><div class="gh"><h2>What the tags mean</h2></div><ul class="pl">' + D.tags.map(function (t) { return '<li class="d0"><b class="lab">' + esc(t.tag) + '</b> ' + esc(t.means) + '</li>'; }).join('') + '</ul></section>';
  return h;
}

$('#v-repository').innerHTML = render();
if (D) {
  draw();
  $('#q').addEventListener('input', function () { query = (this.value || '').trim(); draw(); });
  document.addEventListener('click', function (e) {
    var b = e.target.closest('#rbar button');
    if (!b) return;
    if (b.hasAttribute('data-s')) strength = b.getAttribute('data-s');
    else if (b.hasAttribute('data-t')) tag = b.getAttribute('data-t');
    draw();
  });
}
})();
