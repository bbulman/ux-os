(function () {
'use strict';
var BOOK = window.BOOK || {};
var NAMES = ['overview', 'summary', 'affinity', 'cardsort', 'empathy', 'personas', 'jobs', 'journeys', 'interview', 'usability', 'diary', 'survey', 'sources'];
var LABEL = { overview: 'Overview', summary: 'Summary', affinity: 'Affinity', cardsort: 'Card sort', empathy: 'Empathy', personas: 'Personas', jobs: 'Jobs', journeys: 'Journeys', interview: 'Interview', usability: 'Usability', diary: 'Diary', survey: 'Survey', sources: 'Sources' };
var SKILL = {
  summary: '/ux-os:summarize-research',
  affinity: '/ux-os:affinity-diagram', cardsort: '/ux-os:analyze-card-sort', empathy: '/ux-os:create-empathy-map',
  jobs: '/ux-os:create-jtbd', personas: '/ux-os:create-personas', journeys: '/ux-os:create-journey-map',
  interview: '/ux-os:create-interview-script', usability: '/ux-os:create-usability-plan', diary: '/ux-os:create-diary-study', survey: '/ux-os:create-survey'
};
/* the navigation: only views with content appear. A group with one view is just that view, not a menu. */
var GROUPS = [
  { id: 'start', views: ['overview', 'summary'], flat: true },
  { id: 'data', name: 'Data', views: ['affinity', 'cardsort'] },
  { id: 'people', name: 'People', views: ['empathy', 'personas', 'jobs', 'journeys'] },
  { id: 'testing', name: 'Testing', views: ['interview', 'usability', 'diary', 'survey'] },
  { id: 'sources', views: ['sources'], flat: true }
];
var PLANS = ['interview', 'usability', 'diary', 'survey'];
var MAKES = {
  overview: 'The idea, the decision it feeds, and how much of it rests on evidence.',
  summary: 'The short version: what was found, how strongly, how many people stand behind it, who said the opposite, and what to do about it.',
  affinity: 'What your notes group into: themes first, then each cluster as a wall of notes with the people behind it, and the outliers set apart.',
  cardsort: 'How people group your cards: a similarity map, the groups that form with a suggested label, the cards with no clear home, and the labels people used.',
  empathy: 'What one kind of person says, does, thinks and feels in one moment, and where what they say and what they do come apart.',
  jobs: 'The job people are trying to get done, the stages it passes through, and the outcomes today’s tools leave underserved.',
  personas: 'Up to four people worth designing for separately, placed on the one behaviour that splits them, each showing what is known and what is guessed.',
  journeys: 'What happens step by step for one person in one scenario, how it feels along the way, and where it hurts. A future journey proposes what could change.',
  interview: 'A guide to read from during an interview: who to talk to, what to ask, what to listen for, and which belief each question tests.',
  usability: 'Tasks to give people, what success, partial success and failure look like, and the pass lines that decide the result.',
  diary: 'How a diary study runs: its shape, the prompts people answer, and the day-by-day schedule for them and for you.',
  survey: 'Who the survey reaches and how many, what number changes what decision, and the questionnaire itself.',
  sources: 'Every source behind the book, and notes on your own studies.'
};
var SAYS = {
  '/ux-os:create-jtbd': 'Writes the job people are trying to get done and the outcomes today’s tools leave underserved.',
  '/ux-os:create-personas': 'Splits people on one behaviour and writes each persona with what is known and what is guessed.',
  '/ux-os:create-journey-map': 'Maps what happens step by step for each primary persona, and where it hurts, and can propose a future journey.',
  '/ux-os:create-empathy-map': 'Maps what one kind of person says, does, thinks and feels in one moment, and where the words and the actions part.',
  '/ux-os:affinity-diagram': 'Groups the notes from your interviews into clusters and themes, with the people behind each.',
  '/ux-os:analyze-card-sort': 'Turns card sort results into groups, a similarity map, and the cards with no clear home.',
  '/ux-os:summarize-research': 'Writes the short version: what was found, how strongly, and who disagreed.',
  '/ux-os:create-interview-script': 'Writes an interview guide that tests the beliefs that matter most.',
  '/ux-os:create-usability-plan': 'Plans a usability test: the tasks, what counts as success, and the pass lines.',
  '/ux-os:create-diary-study': 'Plans a diary study: the prompts, the schedule and how to keep people in.',
  '/ux-os:create-survey': 'Writes a survey with an analysis plan, so each question feeds a decision.',
  '/ux-os:create-research-repository': 'Keeps every study and insight in one searchable place.'
};
var ST = {
  evidenced: { n: 'Found', g: 'e', say: 'Found in sources.' },
  inference: { n: 'Reasoned', g: 'r', say: 'Reasoned from the sources, not stated by them.' },
  backed: { n: 'Believed, backed', g: 'e', say: 'The founder’s belief. The evidence backs it.' },
  mixed: { n: 'Believed, mixed', g: 'a', say: 'The founder’s belief. The evidence points both ways.' },
  untested: { n: 'Believed, untested', g: 'a', say: 'The founder’s belief. Nothing found either way.' },
  contradicted: { n: 'Contradicted', g: 'a', say: 'The founder’s belief. The evidence says otherwise.' },
  confirmed: { n: 'Confirmed', g: 'e', say: 'The founder’s belief, confirmed by interviews.' },
  proposed: { n: 'Proposed', g: 'p', say: 'A proposal, not a finding. It says what could change, and has not been tried.' },
  gap: { n: 'Not known', g: 'a', say: 'Looked for, not found.' }
};
var STATE_ORDER = ['confirmed', 'evidenced', 'inference', 'backed', 'mixed', 'untested', 'contradicted', 'proposed', 'gap'];
var CAP = {
  all: '',
  found: 'Ink only: what was found in sources, backed, or confirmed.',
  reasoned: 'Thin ink only: what we reasoned from the sources.',
  assume: 'Pencil only: beliefs, gaps and anything the evidence contradicts.',
  proposed: 'Sketched only: what is proposed. None of it has been found or tried.'
};
var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

var cur = null, curName = 'overview', mode = 'all', kindFilter = 'all';
var openUnit = null, openEl = null, openCell = null, lastCell = null, openMore = {};
var R = {};

function $(s, r) { return (r || document).querySelector(s); }
function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function C(id) { return cur.cl[id]; }
function plural(n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); }
function cap1(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

function fmtDate(d) {
  if (!d || d === 'unknown') return 'undated';
  var m = String(d).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return Number(m[3]) + ' ' + MON[Number(m[2]) - 1] + ' ' + m[1];
  m = String(d).match(/^(\d{4})-(\d{2})$/);
  if (m) return MON[Number(m[2]) - 1] + ' ' + m[1];
  return d;
}
function host(u) { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } }
function isUrl(u) { return /^https?:\/\//i.test(u); }

/* ---------- glyphs: the form of each state, readable without colour ---------- */
function glyph(s, extra) {
  var b = '<svg class="g' + (extra ? ' ' + extra : '') + '" viewBox="0 0 14 14" aria-hidden="true" focusable="false">';
  var m = {
    evidenced: '<circle cx="7" cy="7" r="5" class="f-ink"/>',
    inference: '<circle cx="7" cy="7" r="5" fill="none" stroke-width="1" class="s-ink"/><circle cx="7" cy="7" r="1.8" class="f-ink"/>',
    backed: '<circle cx="7" cy="7" r="5" fill="none" stroke-width="1.5" class="s-ink"/><path d="M4.4 7.3l1.9 1.8 3.4-4" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="s-ink"/>',
    mixed: '<circle cx="7" cy="7" r="5" fill="none" stroke-width="1.5" class="s-ink"/><path d="M4.2 7h5.6" fill="none" stroke-width="1.5" stroke-linecap="round" class="s-ink"/>',
    untested: '<circle cx="7" cy="7" r="5" fill="none" stroke-width="1.5" stroke-dasharray="2.2 2" class="s-pen"/>',
    contradicted: '<circle cx="7" cy="7" r="5" fill="none" stroke-width="1.5" class="s-red"/><path d="M3.3 10.7L10.7 3.3" stroke-width="1.5" stroke-linecap="round" class="s-red"/>',
    gap: '<rect x="2.5" y="2.5" width="9" height="9" fill="none" stroke-width="1.5" stroke-dasharray="2.2 2" class="s-pen"/>',
    proposed: '<path d="M7 1.8L12.2 7 7 12.2 1.8 7z" fill="none" stroke-width="1.5" stroke-linejoin="round" stroke-dasharray="0.1 2.6" stroke-linecap="round" class="s-ink"/><path d="M5.2 7h3.6M7.6 5.4L9.2 7 7.6 8.6" fill="none" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" class="s-pen"/>',
    confirmed: '<circle cx="7" cy="7" r="6" class="f-ink"/><circle cx="7" cy="7" r="3.4" fill="none" stroke-width="1.2" class="f-paper"/>'
  };
  return b + m[s] + '</svg>';
}

/* ---------- claims: every line is one of these ---------- */
function btn(id, inner) {
  var c = C(id);
  return '<button type="button" class="cl" aria-expanded="false">' + glyph(c.s) +
    '<span class="t"><span class="sr">' + ST[c.s].n + '. </span><span class="u">' + inner + '</span>' + (c.m ? '<span class="mk">' + esc(c.m) + '</span>' : '') + (c.s === 'gap' ? '<span class="sr"> (not known)</span>' : '') + '</span></button>';
}
function ln(id, o) {
  o = o || {};
  var c = C(id);
  var inner = (o.label ? '<b class="lab">' + esc(o.label) + '</b> ' : '') + esc(o.text != null ? o.text : c.t);
  return '<li class="ln' + (o.cls ? ' ' + o.cls : '') + '" data-s="' + c.s + '" data-c="' + id + '"' + (o.pin ? ' data-pin' : '') + '>' + btn(id, inner) + (o.after || '') + '</li>';
}
function list(items, o) {
  if (!items || !items.length) return '';
  return '<ul class="lines' + (o && o.cls ? ' ' + o.cls : '') + '"' + (o && o.fold ? ' data-fold="' + o.fold + '"' : '') + '>' + items.map(function (it) {
    var id = typeof it === 'number' ? it : it.c;
    return ln(id, { label: it.label, text: it.text, cls: o && o.lineCls, pin: o && o.pin });
  }).join('') + '</ul>';
}
function moreFor(keys) {
  if (!cur || !cur.more) return '';
  var items = cur.more.filter(function (m) { return keys.indexOf(m.sub ? m.sec + '>' + m.sub : m.sec) >= 0; });
  if (!items.length) return '';
  items.forEach(function (m) { m.used = true; });
  return '<ul class="lines notes" data-fold="3">' + items.map(function (m) { return ln(m.c, { label: m.label }); }).join('') + '</ul>';
}
function leftover(accept) {
  if (!cur || !cur.more) return '';
  var items = cur.more.filter(function (m) { return !m.used && (!accept || accept(m)); });
  if (!items.length) return '';
  items.forEach(function (m) { m.used = true; });
  return '<section class="grp" data-g><div class="gh"><h2>More from the file</h2></div><ul class="lines notes" data-fold="4">' + items.map(function (m) { return ln(m.c, { label: m.label }); }).join('') + '</ul></section>';
}
function sec(title, conf, inner, cls, keys) {
  var extra = moreFor(keys || [title]);
  if (!inner && !extra) return '';
  return '<section class="grp' + (cls ? ' ' + cls : '') + '" data-g><div class="gh"><h2>' + esc(title) + '</h2>' +
    (conf ? '<span class="conf">Confidence: ' + esc(conf) + '</span>' : '') + '</div>' + (inner || '') + (extra ? '<h3 class="mini">Also in the file</h3>' + extra : '') + '</section>';
}
function head(title, sub, o) {
  o = o || {};
  return '<header class="vh"><h1 class="h1' + (o.cls ? ' ' + o.cls : '') + '" tabindex="-1">' + esc(title) + '</h1>' + (sub ? '<p class="sub">' + sub + '</p>' : '') + '</header>';
}
function quiet(text) { return '<p class="quiet">' + text + '</p>'; }
function cmd(command, label, value) {
  return '<div class="cmd"><code>' + esc(command) + '</code><button type="button" class="copy" data-copy="' + esc(value || command) + '" data-label="' + esc(label || 'Copy') + '">' + esc(label || 'Copy') + '</button></div>';
}
function nextSkill(skill, lead, note, cls) {
  return '<section class="cta-block' + (cls ? ' ' + cls : '') + '"><h2>' + esc(lead || 'Next step') + '</h2><p class="ctal">Run <b>' + esc(skill) + '</b>.</p><p>' + esc(SAYS[skill] || '') + '</p>' + (note ? '<p class="cap">' + esc(note) + '</p>' : '') + cmd(skill, 'Copy ' + skill) + '</section>';
}
function noMatch() { return '<p class="nomatch" hidden>Nothing in this view matches the filter.</p>'; }

/* ---------- stacked bar of states, drawn to scale ---------- */
function stateBar(counts, label) {
  var total = 0;
  STATE_ORDER.forEach(function (s) { total += counts[s] || 0; });
  if (!total) return '';
  var segs = STATE_ORDER.filter(function (s) { return counts[s]; }).map(function (s) {
    return '<span class="sg" data-st="' + s + '" style="flex:' + counts[s] + '" title="' + ST[s].n + ': ' + counts[s] + '"></span>';
  }).join('');
  var leg = STATE_ORDER.filter(function (s) { return counts[s]; }).map(function (s) {
    return '<li>' + glyph(s) + '<b>' + counts[s] + '</b> ' + ST[s].n.toLowerCase() + '</li>';
  }).join('');
  return '<div class="sbar" role="img" aria-label="' + esc(label + ': ' + STATE_ORDER.filter(function (s) { return counts[s]; }).map(function (s) { return counts[s] + ' ' + ST[s].n.toLowerCase(); }).join(', ')) + '">' + segs + '</div><ul class="sleg">' + leg + '</ul>';
}

/* ---------- empty state ---------- */
function emptyView(v) {
  var skill = SKILL[v];
  var h = head(LABEL[v], null);
  h += '<div class="empty"><p class="eh">Nothing here yet.</p><p>This view will hold: ' + esc(MAKES[v].charAt(0).toLowerCase() + MAKES[v].slice(1)) + '</p>';
  if (v === 'overview') h += '<p>The first research skill you run creates the brief this page is built from.</p>' + cmd('/ux-os:create-personas', 'Copy /ux-os:create-personas');
  else if (skill) h += '<p>' + esc(SAYS[skill]) + '</p><p class="ctal">Run <b>' + esc(skill) + '</b> to fill it.</p>' + cmd(skill, 'Copy ' + skill);
  else h += '<p>Any research skill adds sources here. Start with <b>/ux-os:create-personas</b>.</p>' + cmd('/ux-os:create-personas', 'Copy /ux-os:create-personas');
  return h + '</div>';
}

/* ---------- the note: a source, opened in place ---------- */
function noteHTML(c, d) {
  var st = ST[c.s];
  var h = '<p class="st">' + glyph(c.s) + '<b>' + st.n + '</b></p>';
  h += '<p class="def">' + (c.u ? 'No evidence tag on this line, so it counts as an assumption.' : st.say) + '</p>';

  if (c.c) h += '<p class="m cite">As cited in the file: ' + esc(c.c) + '.</p>';
  if (c.cmp) h += '<p class="m cmp">Component: ' + esc(c.cmp) + '</p>';
  var seen = {}, srcOrder = [], pOrder = [], seenP = {}, body = '';
  c.g.forEach(function (t) {
    (t.s || []).forEach(function (x) { if (!seen[x]) { seen[x] = 1; srcOrder.push(x); } });
    (t.p || []).forEach(function (x) { if (!seenP[x]) { seenP[x] = 1; pOrder.push(x); } });
    if (t.k === 'b') {
      var b = d.bel[t.b];
      body += '<div class="nb"><p class="bt"><span class="id">' + esc(t.b) + '</span> ' + (b ? '<i>' + esc(b.t) + '</i>' : 'The belief text is not in beliefs.md.') + '</p><p class="m">' +
        ['Verdict: ' + esc(t.v) + (t.th ? ' (met a threshold set in advance)' : ''), b && b.certainty ? 'Certainty: ' + esc(b.certainty) : '', b && b.basis ? 'Basis: ' + esc(b.basis) : '',
         b && b.drop ? 'Would drop it if: ' + esc(b.drop) : '', b && b.origin ? 'Asked by ' + esc(b.origin) : '', b && b.recorded ? 'Recorded ' + esc(fmtDate(b.recorded)) : ''].filter(Boolean).join(' · ') + '</p></div>';
    } else if (t.k === 'i' && t.s && t.s.length) {
      body += '<p class="m inf">Reasoned from ' + t.s.map(esc).join(', ') + '. The sources do not state it.</p>';
    } else if (t.k === 'r') {
      body += '<p class="m inf">General practice a third-party skill asserts. Nothing in this folder backs it.</p>';
    } else if (t.k === 'g') {
      body += '<p class="m inf">Marked as a gap in the file: looked for, not found.</p>';
    } else if (t.k === 'p') {
      body += '<p class="m inf">' + (t.s && t.s.length ? 'A proposal. What motivates it: ' + t.s.map(esc).join(', ') + '. Those sources do not say it would work.' : 'A proposal with nothing behind it yet.') + '</p>';
    }
  });
  h += body;
  if (srcOrder.length) {
    h += '<ul class="src">' + srcOrder.map(function (id) {
      var s = d.src[id];
      if (!s) return '<li><cite>' + esc(id) + '</cite><span class="m">Not in the ledger.</span></li>';
      if (s.k === 'first-party') return '<li><cite>' + esc(s.t) + '</cite><span class="m">' + esc(id) + ' \u00b7 own research</span></li>';
      var link = isUrl(s.u) ? '<a href="' + esc(s.u) + '" target="_blank" rel="noopener">' + esc(host(s.u)) + '</a>' : 'saved in ' + esc(s.u);
      return '<li><cite>' + esc(s.t) + '</cite><span class="m">' + esc(id) + ' · ' + esc(s.k) + ' · ' + esc(s.p) + ' · ' + esc(fmtDate(s.d)) + ' · <span class="' + (s.v === 'verified' ? 'ver' : 'unver') + '">' + esc(s.v) + '</span> · ' + link + '</span></li>';
    }).join('') + '</ul>';
  }
  if (pOrder.length) {
    var cited = {};
    c.g.forEach(function (t) { if (t.a) cited[t.a] = 1; });
    h += '<ul class="src ppl">' + pOrder.map(function (id) {
      var p = d.ptc[id];
      if (!p) return '<li><cite>' + esc(id) + '</cite></li>';
      var who = [p.role, p.segment].filter(Boolean).join(', ');
      var all = p.ex || [];
      var mine = all.filter(function (e) { return e.a && cited[e.a]; });
      var rest = all.filter(function (e) { return !(e.a && cited[e.a]); });
      var ex = mine.concat(rest).slice(0, Math.max(3, mine.length)).map(function (e) {
        var isCited = e.a && cited[e.a];
        return '<blockquote class="ex' + (isCited ? ' is-cited' : '') + '">“' + esc(e.v) + '”<span class="m">' + [isCited ? 'Cited here' : '', e.code, e.theme, e.grade, e.prompted === 'yes' ? 'prompted' : e.prompted === 'no' ? 'not prompted' : '', e.b ? 'bears on ' + e.b : ''].filter(Boolean).map(esc).join(' · ') + '</span></blockquote>';
      }).join('');
      return '<li><cite>' + esc(id) + (who ? ', ' + esc(who) : '') + '</cite>' + ex + '</li>';
    }).join('') + '</ul>';
  }
  if (!srcOrder.length && !pOrder.length && !c.g.some(function (t) { return t.k === 'b' || t.k === 'p'; })) h += '<p class="none">No source is cited for this line.</p>';
  return h + '<button type="button" class="close">Close</button>';
}

function closeNote(refocus) {
  if (openEl) { openEl.remove(); openEl = null; }
  if (openUnit) {
    var b = $('.cl', openUnit);
    if (b) { b.setAttribute('aria-expanded', 'false'); if (refocus) b.focus(); }
    openUnit.classList.remove('is-open');
  }
  openUnit = null; openCell = null;
}

function place(unit, note) {
  var root = $('#v-' + curName);
  var slot = unit.getAttribute('data-slot');
  if (slot) { var s = $(slot, root); if (s) { s.appendChild(note); return note; } }
  if (unit.classList.contains('stage')) {
    var wide = window.matchMedia('(min-width: 56rem)').matches;
    var cell = lastCell && unit.contains(lastCell) ? lastCell : null;
    if (wide) {
      note.style.gridRow = String(cell ? Number(cell.getAttribute('data-row')) + 1 : 2);
      unit.parentNode.appendChild(note);
    } else {
      var after = cell || $('.head', unit);
      after.parentNode.insertBefore(note, after.nextSibling);
    }
    return note;
  }
  var tr = unit.closest('tr');
  if (tr) {
    var nr = document.createElement('tr'); nr.className = 'noterow';
    var td = document.createElement('td'); td.colSpan = tr.children.length; td.appendChild(note); nr.appendChild(td);
    tr.parentNode.insertBefore(nr, tr.nextSibling);
    return nr;
  }
  unit.appendChild(note);
  return note;
}

function openNote(unit) {
  var stage = unit.classList.contains('stage');
  var target = stage ? lastCell : null;
  var toggleOff = openUnit === unit && (!stage || target === openCell);
  closeNote(false);
  if (toggleOff) return;
  var id = Number(unit.getAttribute('data-c'));
  var c = C(id);
  if (!c) return;
  var note = document.createElement('aside');
  note.className = 'note s-' + c.s;
  note.setAttribute('role', 'note');
  note.setAttribute('aria-label', 'Source for this line');
  note.innerHTML = noteHTML(c, cur);
  openEl = place(unit, note);
  openUnit = unit; openCell = target;
  unit.classList.add('is-open');
  var b = $('.cl', unit); if (b) b.setAttribute('aria-expanded', 'true');
  $('.close', note).addEventListener('click', function () { closeNote(true); });
}

document.addEventListener('click', function (e) {
  var t = e.target;
  if (t.closest('a, .note')) return;
  var cp = t.closest('.copy');
  if (cp) { copy(cp); return; }
  var jp = t.closest('[data-scroll]');
  if (jp) { var target = $('#' + jp.getAttribute('data-scroll')); if (target) target.scrollIntoView({ block: 'start' }); return; }
  var u = t.closest('[data-c]:not([data-mirror])');
  if (!u || !$('#main').contains(u)) return;
  lastCell = t.closest('.jcell');
  openNote(u);
});
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && openUnit) closeNote(true);
});

function copy(b) {
  var text = b.getAttribute('data-copy');
  var label = b.getAttribute('data-label');
  function done(ok) { b.textContent = ok ? 'Copied' : 'Select the text and copy'; setTimeout(function () { b.textContent = label; }, 2200); }
  function fallback() {
    try {
      var code = b.parentNode.querySelector('code');
      var r = document.createRange(); r.selectNodeContents(code);
      var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
    } catch (e) { /* nothing to select */ }
    done(false);
  }
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { done(true); }, fallback);
    else fallback();
  } catch (e) { fallback(); }
}

/* ---------- filter ---------- */
function units(root) {
  return $$('[data-s]', root).filter(function (u) { return !u.hasAttribute('data-m') && !u.hasAttribute('data-pin') && !u.hasAttribute('data-mirror'); });
}
function grpOf(el) { return ST[el.getAttribute('data-s')].g; }
function passes(g) {
  return mode === 'all' || (mode === 'found' && g === 'e') || (mode === 'reasoned' && g === 'r') || (mode === 'assume' && g === 'a') || (mode === 'proposed' && g === 'p');
}
function applyFilter() {
  var root = $('#v-' + curName); if (!root || !BOOK[curName]) return;
  closeNote(false);
  var us = units(root), c = { e: 0, r: 0, a: 0, p: 0 };
  us.forEach(function (u) { c[grpOf(u)]++; });
  us.forEach(function (u) { u.hidden = !passes(grpOf(u)); });
  /* layers: long lists open with their first few lines, unless a filter is on */
  $$('[data-fold]', root).forEach(function (box) {
    var lim = Number(box.getAttribute('data-fold'));
    var sel = box.getAttribute('data-foldsel');
    var fid = box.getAttribute('data-fid');
    var items = sel ? $$(sel, box) : units(box);
    var collapsed = mode === 'all' && !openMore[fid];
    items.forEach(function (it, i) {
      if (i >= lim && collapsed) { it.hidden = true; it.setAttribute('data-foldhide', ''); }
      else { it.removeAttribute('data-foldhide'); if (!it.hasAttribute('data-s')) it.hidden = false; }
    });
    var more = box.__more;
    if (more) {
      more.hidden = mode !== 'all';
      more.textContent = openMore[fid] ? 'Show fewer' : 'Show all ' + items.length;
      more.setAttribute('aria-expanded', String(!!openMore[fid]));
    }
  });
  $$('[data-mirror]', root).forEach(function (m) {
    var t = $('[data-c="' + m.getAttribute('data-mirror') + '"]:not([data-mirror])', root);
    m.classList.toggle('off', !!(t && t.hidden));
  });
  $$('[data-g]', root).forEach(function (g) {
    var inner = units(g);
    g.hidden = g.hasAttribute('data-foldhide') || (inner.length > 0 && inner.every(function (u) { return u.hidden; }));
  });
  var nm = $('.nomatch', root);
  if (nm) nm.hidden = !(us.length && us.every(function (u) { return u.hidden; }));
  var counts = { all: us.length, found: c.e, reasoned: c.r, assume: c.a, proposed: c.p };
  $$('#bar .seg button').forEach(function (b) {
    var f = b.getAttribute('data-f');
    b.setAttribute('aria-pressed', String(f === mode));
    $('.n', b).textContent = counts[f];
    b.hidden = f !== 'all' && f !== mode && !counts[f];
  });
  var cap = $('#cap'); if (cap) cap.textContent = CAP[mode];
}

function setupFolds(root) {
  var n = 0;
  $$('[data-fold]', root).forEach(function (box) {
    var lim = Number(box.getAttribute('data-fold'));
    var sel = box.getAttribute('data-foldsel');
    var items = sel ? $$(sel, box) : units(box);
    if (items.length < lim + 2) { box.removeAttribute('data-fold'); return; }
    var id = curName + '-' + (n++);
    box.setAttribute('data-fid', id);
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'more'; b.setAttribute('aria-expanded', 'false'); b.setAttribute('data-more', id);
    (box.closest('.scroll') || box).insertAdjacentElement('afterend', b);
    box.__more = b;
  });
}
document.addEventListener('click', function (e) {
  var m = e.target.closest('[data-more]');
  if (!m) return;
  var id = m.getAttribute('data-more');
  if (id === 'sources') { openMore.sources = !openMore.sources; applySourceFilter(); return; }
  openMore[id] = !openMore[id];
  applyFilter();
});

function renderBar(v) {
  var bar = $('#bar'), inner = $('#barin');
  var d = BOOK[v];
  if (!d) { bar.hidden = true; return; }
  bar.hidden = v === 'overview';
  if (v === 'overview') return;
  if (v === 'sources') {
    var kinds = {};
    d.rows.forEach(function (r) { kinds[r.k] = (kinds[r.k] || 0) + 1; });
    var ks = ['all'].concat(Object.keys(kinds).sort());
    inner.innerHTML = '<div class="seg kinds" role="group" aria-label="Filter sources by kind">' + ks.map(function (k) {
      return '<button type="button" data-k="' + esc(k) + '" aria-pressed="' + (k === kindFilter) + '">' + (k === 'all' ? 'All' : esc(cap1(k))) + ' <span class="n">' + (k === 'all' ? d.rows.length : kinds[k]) + '</span></button>';
    }).join('') + '</div>';
    return;
  }
  inner.innerHTML = '<div class="seg" role="group" aria-label="Show">' +
    '<button type="button" data-f="all" aria-pressed="true"><span class="l">All</span> <span class="n"></span></button>' +
    '<button type="button" data-f="found" aria-pressed="false"><span class="l">Found</span> <span class="n"></span></button>' +
    '<button type="button" data-f="reasoned" aria-pressed="false"><span class="l">Reasoned</span> <span class="n"></span></button>' +
    '<button type="button" data-f="assume" aria-pressed="false"><span class="l">Assumptions</span> <span class="n"></span></button>' +
    '<button type="button" data-f="proposed" aria-pressed="false"><span class="l">Proposed</span> <span class="n"></span></button></div><p class="cap" id="cap" aria-live="polite"></p>';
}
document.addEventListener('click', function (e) {
  var b = e.target.closest('#bar .seg button');
  if (!b) return;
  if (b.hasAttribute('data-f')) { mode = b.getAttribute('data-f'); applyFilter(); }
  else if (b.hasAttribute('data-k')) {
    kindFilter = b.getAttribute('data-k');
    $$('#bar .seg button').forEach(function (x) { x.setAttribute('aria-pressed', String(x.getAttribute('data-k') === kindFilter)); });
    applySourceFilter();
  }
});
function applySourceFilter() {
  var root = $('#v-sources');
  var open = !!openMore.sources, i = 0, total = 0;
  $$('.srow', root).forEach(function (r) {
    total++;
    var match = kindFilter === 'all' || r.getAttribute('data-k') === kindFilter;
    var folded = kindFilter === 'all' && !open && i >= 14;
    if (match) i++;
    r.hidden = !match || folded;
  });
  var more = $('[data-more="sources"]', root);
  if (more) { more.hidden = kindFilter !== 'all'; more.textContent = open ? 'Show fewer' : 'Show all ' + total; }
}

/* ---------- the key ---------- */
function keyHTML() {
  var samples = {
    evidenced: 'Found in sources', inference: 'Thin ink, reasoned from them', backed: 'Believed and backed', mixed: 'Believed, evidence split',
    untested: 'Believed, nothing found', contradicted: 'Believed, then contradicted', confirmed: 'Confirmed by interview', proposed: 'A sketched proposal', gap: 'Not known'
  };
  return '<ul class="keylist">' + STATE_ORDER.map(function (s) {
    return '<li data-s="' + s + '">' + glyph(s) + '<span class="kn">' + ST[s].n + '</span><span class="kd">' + esc(ST[s].say) + '</span><span class="t"><span class="u">' + samples[s] + '</span></span></li>';
  }).join('') + '</ul><p class="keynote">Each form works without colour. The red mark is used for contradicted beliefs and nothing else. A dotted diamond is a proposal: it is not a finding, and it is neither found nor reasoned. Tap any line to see its source.</p>';
}

/* ---------- shared bits for beliefs in a persona or journey ---------- */
function beliefTally(ids, who, banner) {
  if (banner && banner.real) return '<div class="status col">' + bannerHTML(banner) + '</div>';
  var map = {};
  ids.forEach(function (id) {
    C(id).g.forEach(function (t) {
      if (t.k !== 'b') return;
      var s = t.v === 'supported' ? 'backed' : (t.v === 'contradicted' || t.v === 'refuted') ? 'contradicted' : t.v === 'confirmed' ? 'confirmed' : t.v === 'mixed' ? 'mixed' : 'untested';
      var rank = ['contradicted', 'mixed', 'untested', 'confirmed', 'backed'];
      if (!map[t.b] || rank.indexOf(s) < rank.indexOf(map[t.b])) map[t.b] = s;
    });
  });
  var bs = Object.keys(map).sort(function (a, b) { return Number(a.slice(1)) - Number(b.slice(1)); });
  var counts = {};
  ids.forEach(function (id) { var s = C(id).s; counts[s] = (counts[s] || 0) + 1; });
  var h = '<div class="status col">' + bannerHTML(banner);
  if (bs.length) {
    h += '<p class="cap">' + (banner ? 'That count is for the whole file' + (banner.m ? ', ' + banner.m + ' beliefs' : '') + '. ' : '') + 'Each mark below is one of the ' + bs.length + ' beliefs ' + esc(who) + ' rest' + (/^(this|the)/i.test(who) ? 's' : '') + ' on, and how the evidence stands on it.</p>' +
      '<ol class="tally" aria-label="Beliefs by state">' + bs.map(function (b) {
        return '<li title="' + esc(b) + ': ' + ST[map[b]].n + '">' + glyph(map[b]) + esc(b) + '</li>';
      }).join('') + '</ol>';
  }
  h += '<h3 class="mini">All ' + ids.length + ' lines, by state</h3>' + stateBar(counts, 'Lines about ' + who);
  return h + '</div>';
}

function bannerHTML(b) {
  if (!b) return '';
  return '<p class="proto' + (b.real ? ' real' : '') + '">' + esc(b.text) + '</p>';
}

function beliefMeta(x) {
  var files = x.files.map(function (f) { return '<a href="#' + f + '">' + LABEL[f] + '</a>'; }).join(', ');
  return ['<span class="id">' + esc(x.b) + '</span>', x.certainty ? 'The founder was ' + esc(x.certainty) : '', files ? 'seen in ' + files : ''].filter(Boolean).join(' · ');
}

/* ================= views ================= */

/* ---------- overview ---------- */
R.overview = function (d) {
  var b = d.beliefs, total = d.claims.total, n = d.next;
  var h = '<header class="vh ovh"><h1 class="h1 idea" tabindex="-1">' + esc(d.idea || d.name) + '</h1>';
  var facts = [];
  if (d.forWho) facts.push('<span>For</span> ' + esc(d.forWho.replace(/\.$/, '')));
  if (d.market) facts.push('<span>Market</span> ' + esc(d.market.replace(/\.$/, '')));
  if (facts.length) h += '<p class="facts1">' + facts.join(' · ') + '</p>';
  if (d.decision) h += '<p class="dec"><span>The decision</span> ' + esc(d.decision) + '</p>';
  h += '</header>';

  var left = '';
  if (total) left += '<h2 class="h2s">What the book rests on</h2><p class="cap">All ' + total + ' lines across the views, by state.</p>' + stateBar(d.claims.states, 'Lines in the book');
  if (b.total) {
    left += '<p class="stat"><span class="statn">' + b.confirmed + '</span> of ' + b.total + ' beliefs validated.</p>' +
      stateBar({ confirmed: b.confirmed, backed: b.backed, mixed: b.mixed, untested: b.untested, contradicted: b.contradicted + b.refuted }, 'Beliefs') +
      '<p class="cap">Only a belief that interviews or a pre-set threshold confirmed counts as validated. Desk research never does.</p>';
  } else if (b.recorded) left += quiet(plural(b.recorded, 'belief') + ' recorded, none with an outcome yet.');
  else left += quiet(d.hasPrimary ? 'No beliefs were recorded. This book rests on what people did and said.' : 'No beliefs have been recorded yet. The proto skills ask for them.');

  var right;
  if (n.k === 'test') {
    right = '<section class="cta-block compact"><h2>Test this first</h2><ul class="lines tf">' + ln(n.c, { pin: true, cls: 'big' }) + '</ul><p class="m">' + beliefMeta(n) + '</p>' +
      (n.drop ? '<p class="why"><span>Would drop it if</span> ' + esc(n.drop) + '</p>' : '') + '<p class="cap">' + esc(n.outcome || ST[C(n.c).s].say) + '</p></section>';
  } else right = '';
  right += runNext(d.suggest, n.k === 'test' ? 'Then run' : 'Run next');
  h += '<div class="ovtop"><div class="ovl">' + left + '</div><div class="ovr">' + right + '</div></div>';

  var w;
  if (d.contradicted.length) {
    w = '<ul class="lines wrong">' + d.contradicted.map(function (x) {
      var cl = d.cl[x.c], sid = null;
      cl.g.forEach(function (t) { if (!sid && t.s && t.s.length) sid = t.s[0]; });
      var src = sid && d.src[sid];
      var found = x.seen[0] ? '<p class="evi"><span>What the research found</span> ' + esc(x.seen[0].t) + '</p>' : '';
      var from = src && src.k === 'first-party' ? '<p class="evi"><span>Source</span> ' + esc(src.t) + ', own research</p>' : src ? '<p class="evi"><span>Source</span> ' + esc(src.t) + ', ' + esc(src.p) + ', ' + esc(fmtDate(src.d)) + (src.k !== 'first-party' && isUrl(src.u) ? ' · <a href="' + esc(src.u) + '" target="_blank" rel="noopener">' + esc(host(src.u)) + '</a>' : '') + '</p>' : '';
      return ln(x.c, { cls: 'big', after: '<p class="m">' + beliefMeta(x) + '</p>' + found + from });
    }).join('') + '</ul>';
  } else w = quiet('No belief has been contradicted yet.');
  h += sec('Where your beliefs were wrong', null, w || '');

  var ct = d.contents.length ? '<ul class="contents">' + d.contents.map(function (x) {
    if (x.plan) return '<li><a class="cn" href="#' + x.v + '">' + LABEL[x.v] + '</a><span class="cm">Study plan, a working document</span></li>';
    var bar = stateBar(x.states, LABEL[x.v]).replace(/<ul class="sleg">[\s\S]*<\/ul>/, '');
    var ban = x.banner ? ' \u00b7 ' + esc(x.banner.text.replace(/\. Every line.*$/, '').replace(/\.$/, '')) : '';
    return '<li><a class="cn" href="#' + x.v + '">' + LABEL[x.v] + '</a><span class="cm">' + plural(x.n, 'line') + ban + '</span>' + bar + '</li>';
  }).join('') + '</ul>' : '';
  if (ct) h += sec('What is in the book', null, ct);
  return h;
};

/* ---------- jobs ---------- */
R.jobs = function (d) {
  var h = head('Jobs', esc(MAKES.jobs)) + bannerHTML(d.banner);
  if (d.core) {
    var c = C(d.core.c);
    var parts = c.t.match(/^(When .+?),\s*(I want .+?),\s*(so I can .+?)\.?\s*$/);
    var txt = parts ? '<span class="cp">' + esc(parts[1]) + ',</span> <span class="cp">' + esc(parts[2]) + ',</span> <span class="cp">' + esc(parts[3]) + '.</span>' : esc(c.t);
    h += '<section class="grp corejob" data-g><div class="gh"><h2>The core job</h2>' + (d.core.conf ? '<span class="conf">Confidence: ' + esc(d.core.conf) + '</span>' : '') + '</div>' +
      '<ul class="lines"><li class="ln job" data-s="' + c.s + '" data-c="' + d.core.c + '">' + btn(d.core.c, txt) + '</li></ul>' + (d.triggers.length ? '<h3 class="mini">What sets it off</h3>' + list(d.triggers, { fold: 3 }) : '') + '</section>';
  }
  if (d.map.rows.length) {
    var nst = d.map.rows.length;
    var strip = '<ol class="strip" style="--ns:' + (nst > 6 ? Math.ceil(nst / 2) : nst) + '" aria-label="The ' + nst + ' stages of the job">' + d.map.rows.map(function (r, i) {
      return '<li><button type="button" class="seg8" data-scroll="jm' + i + '" data-s="' + C(r.c).s + '" data-mirror="' + r.c + '">' + glyph(C(r.c).s) + '<span class="n8">' + (i + 1) + '</span><span class="s8">' + esc(r.stage) + '</span></button></li>';
    }).join('') + '</ol>';
    var rows = '<ol class="stages" data-fold="4">' + d.map.rows.map(function (r, i) {
      return '<li class="row stg" id="jm' + i + '" data-s="' + C(r.c).s + '" data-c="' + r.c + '"><h3>' + btn(r.c, '<span class="sn">' + (i + 1) + '</span>' + esc(r.stage)) + '</h3>' +
        '<div class="two"><p><span class="k">What they do</span>' + esc(r.does) + '</p><p><span class="k">Where it hurts</span>' + esc(r.hurts) + '</p></div></li>';
    }).join('') + '</ol>';
    h += sec('The job map', d.map.conf, strip + rows);
  }
  if (d.outcomes.rows.length) {
    var rated = d.outcomes.rows.filter(function (r) { return r.gap != null; });
    var unrated = d.outcomes.rows.filter(function (r) { return r.gap == null; });
    var axis = '<div class="oaxis" aria-hidden="true"><span></span><div>' + [1, 2, 3, 4, 5].map(function (n) { return '<i style="left:' + ((n - 1) / 4 * 100) + '%">' + n + '</i>'; }).join('') + '</div></div>';
    var body = '<p class="cap">Ranked by the gap between how much it matters and how well it is served today. A long line is a large unmet need.</p>' +
      '<p class="okey"><span class="k imp"></span> Importance <span class="k sat"></span> Satisfaction</p>' + axis +
      '<ol class="outs" data-fold="5">' + rated.map(function (r) {
        var x = function (v) { return ((v - 1) / 4 * 100).toFixed(1) + '%'; };
        var lo = Math.min(r.imp, r.sat), hi = Math.max(r.imp, r.sat);
        return '<li class="row out" data-s="' + C(r.c).s + '" data-c="' + r.c + '">' + btn(r.c, esc(r.outcome)) + '<div class="otrack" aria-label="Importance ' + r.imp + ', satisfaction ' + r.sat + '"><span class="oline" style="left:' + x(lo) + ';width:' + ((hi - lo) / 4 * 100).toFixed(1) + '%"></span><span class="odot imp" style="left:' + x(r.imp) + '"></span><span class="odot sat" style="left:' + x(r.sat) + '"></span></div><span class="ogap">' + (r.gap > 0 ? 'gap ' + r.gap : r.gap === 0 ? 'no gap' : 'served: ' + (-r.gap)) + '</span></li>';
      }).join('') + '</ol>';
    if (unrated.length) body += '<h3 class="mini">Not rated</h3>' + list(unrated.map(function (r) { return { c: r.c, text: r.outcome + '. Not rated.' }; }), { fold: 2 });
    if (d.outcomes.notes.length) body += '<h3 class="mini">How the ratings were set</h3>' + list(d.outcomes.notes, { fold: 2 });
    h += sec('Top underserved outcomes', d.outcomes.conf, body);
  }
  if (d.dims.rows.length) h += sec('The three dimensions', d.dims.conf, '<ul class="dims">' + d.dims.rows.map(function (r) {
    return '<li class="row dim" data-s="' + C(r.c).s + '" data-c="' + r.c + '"><h3>' + esc(r.dim) + '</h3>' + btn(r.c, esc(r.want)) + '</li>';
  }).join('') + '</ul>');
  if (d.hired.rows.length) h += sec('What gets hired today', d.hired.conf, hiredHTML(d.hired.rows));
  if (d.segments.rows.length) h += sec('Job statements by segment', d.segments.conf, '<ul class="lines segs" data-fold="3">' + d.segments.rows.map(function (r) {
    return ln(r.c, { label: r.segment, text: r.statement });
  }).join('') + '</ul>');
  if (d.implications.items.length) h += sec('Design implications', d.implications.conf, list(d.implications.items, { fold: 3 }));
  h += leftover();
  h += nextCta('jobs');
  return h + noMatch();
};
function hiredHTML(rows) {
  var stay = rows.some(function (r) { return r.stay; });
  return '<div class="scroll"><table class="grid hired"><thead><tr><th scope="col">Solution</th><th scope="col">Hired for</th><th scope="col">Fired because</th>' + (stay ? '<th scope="col">Why they stay</th>' : '') + '</tr></thead><tbody data-fold="4">' + rows.map(function (r) {
    return '<tr class="row" data-s="' + C(r.c).s + '" data-c="' + r.c + '"><th scope="row" data-l="Solution">' + btn(r.c, esc(r.solution)) + '</th><td data-l="Hired for">' + esc(r.for) + '</td><td data-l="Fired because">' + esc(r.fired) + '</td>' + (stay ? '<td data-l="Why they stay">' + esc(r.stay || '') + '</td>' : '') + '</tr>';
  }).join('') + '</tbody></table></div>';
}

/* ---------- personas ---------- */
function switcher(items, current, view) {
  if (items.length < 2) return '';
  return '<nav class="switch" aria-label="Choose one">' + items.map(function (it, i) {
    return '<a href="#' + view + '/' + it.slug + '"' + (i === current ? ' aria-current="true"' : '') + '>' + esc(it.label) + (it.mark ? '<span class="pmark">' + it.mark + '</span>' : '') + '</a>';
  }).join('') + '</nav>';
}
function axisHTML(seg, current) {
  var rows = seg.rows.filter(function (r) { return r.pos != null; });
  if (!rows.length) return '';
  var sorted = rows.slice().sort(function (a, b) { return a.pos - b.pos; });
  var lane = 0, prev = -99;
  sorted.forEach(function (r) { lane = r.pos - prev < 17 ? 1 - lane : 0; r.lane = lane; prev = r.pos; });
  var label = rows.map(function (r) { return r.name + ' ' + r.pos; }).join(', ');
  return '<div class="axis-wrap"><div class="axis' + (sorted.some(function (r) { return r.lane; }) ? ' has-low' : '') + '" role="img" aria-label="Segmentation from 0 to 100: ' + esc(label) + '"><div class="track"></div><i class="tick" style="left:0"></i><i class="tick" style="left:100%"></i>' +
    '<span class="end e0">0</span><span class="end e1">100</span>' + sorted.map(function (r) {
      var me = r.name === current;
      return '<a class="pt' + (me ? ' me' : '') + (r.lane ? ' low' : '') + '" href="#personas/' + slugOf(r.name) + '" style="left:' + r.pos + '%" aria-label="' + esc(r.name + ', ' + r.pos) + '"><span class="n">' + esc(r.name) + '</span>' + glyph(C(r.c).s) + '<span class="v">' + r.pos + '</span></a>';
    }).join('') + '</div></div>';
}
function slugOf(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

function testFirst(title, mainId, mainLabel, secondLabel, secondId, skill, extra) {
  var h = '<section class="cta-block"><h2>' + esc(title) + '</h2>';
  if (mainLabel) h += '<p class="k2">' + esc(mainLabel) + '</p>';
  if (mainId != null) h += '<ul class="lines tf">' + ln(mainId, { pin: true, cls: 'big' }) + '</ul>';
  if (extra) h += extra;
  if (secondId != null) h += '<p class="k2">' + esc(secondLabel) + '</p><ul class="lines tf">' + ln(secondId, { pin: true }) + '</ul>';
  h += '<p class="ctal">Turn it into a test: run <b>' + esc(skill) + '</b>.</p>' + cmd(skill, 'Copy ' + skill) + '</section>';
  return h;
}

R.personas = function (d, param) {
  var ps = d.people;
  if (!ps.length) return emptyView('personas');
  var idx = 0;
  ps.forEach(function (p, i) { if (p.slug === param) idx = i; });
  var p = ps[idx];
  var h = switcher(ps.map(function (x) { return { slug: x.slug, label: x.name, mark: x.primary ? ' (primary)' : '' }; }), idx, 'personas');
  var proto = !d.banner || d.banner.proto;
  h += '<header class="vh persona-head"><h1 class="h1 display' + (proto ? ' proto' : '') + '" tabindex="-1">' + esc(p.name) + '</h1>' +
    '<p class="sub">' + (proto ? 'A proto persona' : 'A persona drawn from research') + (p.primary ? ', the primary one' : '') + '.</p></header>';
  if (p.hero) {
    var hc = C(p.hero.c);
    var gap = hc.s === 'gap';
    var by = gap ? 'No real voice found yet.' : p.hero.kind === 'participant' ? p.hero.p.map(function (c) { var x = d.ptc[c]; return c + (x && x.role ? ', ' + x.role : ''); }).join('; ') : 'A paraphrase of a public voice.' + (p.hero.note ? ' ' + cap1(p.hero.note) + '.' : '');
    h += '<ul class="lines hero ' + (gap ? 'gap' : p.hero.kind) + '"><li class="ln" data-s="' + hc.s + '" data-c="' + p.hero.c + '">' + btn(p.hero.c, p.hero.kind === 'participant' && !gap ? '<q>' + esc(p.hero.text) + '</q>' : esc(p.hero.text)) + '</li></ul><p class="herob">' + esc(by) + '</p>';
  }
  var ids = [];
  p.groups.forEach(function (g) { g.items.forEach(function (x) { ids.push(x.c); }); });
  if (p.hero) ids.push(p.hero.c);
  if (p.least) ids.push(p.least.c);
  if (p.wrong) ids.push(p.wrong.c);
  h += beliefTally(ids, p.name + '’s lines', d.banner);

  var seg = d.seg, ax = '';
  ax += '<p class="lede">' + (seg.variable ? esc(seg.variable.text) : '') + '</p>';
  ax += axisHTML(seg, p.name);
  var mine = seg.rows.filter(function (r) { return r.name === p.name; })[0];
  var axl = [];
  if (seg.low) axl.push(seg.low);
  if (seg.high) axl.push(seg.high);
  if (mine) axl.push({ c: mine.c, label: mine.pos != null ? p.name + ' at ' + mine.pos : p.name + ' (position unknown, not placed)', text: mine.why });
  if (seg.primary) axl.push(seg.primary);
  seg.rows.forEach(function (r) { if (r.pos == null && r.name !== p.name) axl.push({ c: r.c, label: r.name + ' (not placed)', text: r.why }); });
  ax += list(axl) + list(seg.notes, { fold: 3 });
  h += sec('Where ' + p.name + ' sits', seg.conf, ax, 'segs', ['Segmentation']);

  p.groups.forEach(function (g) { h += sec(g.name, null, list(g.items, { fold: 4 }), null, [p.key + '>' + g.name]); });
  h += leftover(function (m) { return m.sec.indexOf('Persona: ') !== 0 || m.sec === p.key; });
  if (p.least || p.wrong) h += testFirst('Test this first', p.least ? p.least.c : null, 'The least evidenced claim', 'How we would know this is wrong', p.wrong ? p.wrong.c : null, '/ux-os:create-interview-script');
  return h + noMatch();
};

/* ---------- journeys ---------- */
function emotionChart(stages, predicted) {
  var n = stages.length;
  if (!n) return '';
  var topPad = 20, span = 60;
  var y = function (e) { return topPad + (5 - e) / 4 * span; };
  var pts = stages.map(function (s, i) { return { x: (i + 0.5) / n * 100, y: y(s.emotion == null ? 3 : s.emotion), e: s.emotion, back: s.backed, i: i }; });
  var grid = [1, 3, 5].map(function (e) { return '<line x1="0" x2="' + (n * 100) + '" y1="' + y(e) + '" y2="' + y(e) + '" class="gl"/>'; }).join('');
  var poly = pts.map(function (p) { return (p.x * n).toFixed(1) + ',' + p.y.toFixed(1); }).join(' ');
  var ylab = [5, 3, 1].map(function (e) { return '<span class="yl" style="top:' + y(e) + '%">' + e + (e === 5 ? '<small> best</small>' : e === 1 ? '<small> worst</small>' : '') + '</span>'; }).join('');
  var dots = pts.map(function (p) {
    return '<span class="edot' + (p.back ? ' solid' : '') + '" style="left:' + p.x.toFixed(2) + '%;top:' + p.y.toFixed(2) + '%"><b>' + (p.e == null ? '?' : p.e) + '</b></span>';
  }).join('');
  var xl = pts.map(function (p) { return '<span style="left:' + p.x.toFixed(2) + '%">' + (p.i + 1) + '</span>'; }).join('');
  return '<div class="emo' + (predicted ? ' pred' : '') + '" style="--n:' + n + '" role="img" aria-label="' + (predicted ? 'Predicted emotion' : 'Emotion') + ' by stage, 1 worst to 5 best: ' + esc(stages.map(function (s, i) { return (i + 1) + ' ' + s.phase + ' ' + s.emotion; }).join(', ')) + '"><div class="ey">' + ylab + '</div><div class="ep"><svg viewBox="0 0 ' + (n * 100) + ' 100" preserveAspectRatio="none" aria-hidden="true">' + grid + '<polyline points="' + poly + '" class="curve"/></svg>' + dots + '</div><div class="ex">' + xl + '</div></div>';
}
var JR = [['doing', 'Doing', 3], ['touch', 'Touchpoints', 5], ['thinking', 'Thinking', 7], ['pain', 'Gets in the way', 9], ['opp', 'Could change', 11]];

R.journeys = function (d, param, param2) {
  var js = d.items;
  if (!js.length) return emptyView('journeys');
  var idx = 0;
  js.forEach(function (j, i) { if (j.slug === param) idx = i; });
  var j = js[idx];
  var proto = !d.banner || d.banner.proto;
  var h = switcher(js.map(function (x) { return { slug: x.slug, label: x.who }; }), idx, 'journeys');
  if (j.future && (param2 === 'future' || !j.stages.length)) return h + futureBody(d, j);
  if (j.future) h += todayFuture(j, false);
  h += '<header class="vh"><h1 class="h1 display sentence' + (proto ? ' proto' : '') + '" tabindex="-1">' + esc(j.title) + '</h1><p class="sub">' + (proto ? 'A proto journey for ' : 'A journey for ') + esc(j.who) + '.</p></header>';
  var ids = [];
  j.scenario.forEach(function (x) { ids.push(x.c); });
  j.bounds.forEach(function (x) { ids.push(x.c); });
  j.stages.forEach(function (x) { ids.push(x.c); });
  j.moments.forEach(function (x) { ids.push(x.c); });
  h += beliefTally(ids, 'this journey', d.banner);

  var n = j.stages.length;
  if (n) {
    var momentFor = {};
    j.moments.forEach(function (m) { if (m.phase) momentFor[m.phase.toLowerCase()] = m; });
    var rl = '<div class="rl r1">Stage</div>' + JR.map(function (r) { return '<div class="rl" style="grid-row:' + r[2] + '">' + r[1] + '</div>'; }).join('');
    var stages = j.stages.map(function (s, i) {
      var c = C(s.c);
      var extra = (c.a || []).filter(function (x) { return x !== c.s; }).map(function (x) { return glyph(x, 'sm'); }).join('');
      var mm = momentFor[s.phase.toLowerCase()];
      return '<article class="stage" style="--col:' + (i + 2) + '" data-s="' + c.s + '" data-c="' + s.c + '"><div class="head" data-row="1"><span class="num">' + (i + 1) + ' of ' + n + '</span><h3 class="ph">' + btn(s.c, esc(s.phase)) + extra + '</h3><p class="goal">' + esc(s.goal) + '</p>' +
        '<p class="feel">Feels ' + (s.emotion != null ? s.emotion : 'unrated') + ' of 5</p>' + (mm ? '<p class="mm">A moment that matters</p>' : '') + '</div>' +
        JR.map(function (r) { return '<div class="jcell ' + r[0] + '" data-label="' + r[1] + '" data-row="' + r[2] + '" style="grid-row:' + r[2] + '">' + esc(s[r[0]]) + '</div>'; }).join('') + '</article>';
    }).join('');
    h += sec('Stages', j.conf, emotionChart(j.stages) + '<div class="jgrid" style="--n:' + n + '">' + rl + stages + '</div><p class="cap">Emotion runs from 1, the worst, to 5, the best. The curve is drawn from the scores. Each score is an inference unless a participant’s words back it, and an open dot marks that. Tap a stage or any of its cells for the source.</p>', 'stagesec', [j.key + '>Stages']);
  }
  h += sec('Moments that matter', null, list(j.moments.map(function (m) { return { c: m.c, label: m.phase, text: m.text }; })), null, [j.key + '>Moments that matter']);
  h += sec('The scenario', null, list(j.scenario, { fold: 3 }), null, [j.key + '>Scenario']);
  h += sec('Where it starts and stops', null, list(j.bounds, { fold: 3 }), 'bounds', [j.key + '>Boundaries']);
  h += leftover(function (m) { return m.sec === j.key || (m.sec.indexOf('Journey: ') !== 0 && m.sec.indexOf('Future journey: ') !== 0); });

  if (j.low) {
    var s = j.stages[j.low.i];
    var resting = j.low.belief ? 'It rests most on belief ' + j.low.belief.id + (d.bel && d.bel[j.low.belief.id] ? ': ' + d.bel[j.low.belief.id].t : '') + ', which has ' + (j.low.belief.v === 'no evidence' ? 'no evidence' : j.low.belief.v) + '.' : 'No belief is recorded for this stage, so it rests on the sources it cites.';
    h += testFirst('Test this first', s.c, 'The emotional low point', '', null, '/ux-os:create-interview-script', '<p class="why">The lowest point is ' + esc(s.phase) + ', scored ' + s.emotion + ' of 5. ' + esc(resting) + '</p>');
  } else h += nextSkill('/ux-os:create-interview-script', 'Next step');
  return h + noMatch();
};

/* ---------- sources ---------- */
R.sources = function (d) {
  var h = head('Sources', esc(MAKES.sources));
  h += '<section class="grp" data-g><div class="gh"><h2>The ledger</h2><span class="conf">' + plural(d.rows.length, 'source') + '</span></div><div class="ledger"><div class="lh" aria-hidden="true"><span>ID</span><span>Source</span><span>Published</span><span>Kind</span><span>Status</span><span>Used in</span></div><ul>' + d.rows.map(function (r) {
    var own = r.k === 'first-party';
    var title = own ? esc(r.t) + '<span class="hostn">own research</span>' : isUrl(r.u) ? '<a href="' + esc(r.u) + '" target="_blank" rel="noopener">' + esc(r.t) + '</a><span class="hostn">' + esc(host(r.u)) + '</span>' : esc(r.t) + '<span class="hostn">saved in ' + esc(r.u) + '</span>';
    var used = (r.in || []).map(function (v) { return '<a href="#' + v + '">' + LABEL[v] + '</a>'; }).join(', ');
    return '<li class="srow" data-k="' + esc(r.k) + '"><span class="sid">' + esc(r.id) + '</span><span class="stt2">' + title + (own ? '' : '<small>' + esc(r.p) + '</small>') + '</span><span class="smeta"><span class="sd" data-l="Published">' + esc(fmtDate(r.d)) + '</span><span class="sk" data-l="Kind">' + esc(r.k) + '</span><span class="sv ' + (r.v === 'verified' ? 'ver' : 'unver') + '" data-l="Status">' + esc(r.v) + '</span><span class="su" data-l="Used in">' + (used || 'not cited') + '</span></span></li>';
  }).join('') + '</ul><button type="button" class="more" data-more="sources"></button></div></section>';
  if (d.studies.length) {
    h += '<section class="grp"><div class="gh"><h2>Study notes</h2><span class="conf">' + plural(d.people, 'participant') + ' coded</span></div><ul class="studies">' + d.studies.map(function (s) {
      var f = function (k, v) { return v ? '<div><dt>' + k + '</dt><dd>' + esc(v) + '</dd></div>' : ''; };
      return '<li><h3>' + esc(s.id) + '</h3><dl>' + f('Run by', s.by) + f('When', s.when) + f('People', s.people) + f('How they were recruited', s.recruited) + f('What was asked', s.asked) + f('Known bias', s.bias) + '</dl></li>';
    }).join('') + '</ul></section>';
  }
  return h + nextCta('sources');
};

/* ---------- the one call to action on views without their own ---------- */
function nextCta(v) {
  var ov = BOOK.overview;
  if (!ov) return '';
  var n = ov.next;
  if (n.k === 'test') {
    var cl = ov.cl[n.c];
    return '<section class="cta-block"><h2>Test this first</h2><p class="ctal">' + esc(cl.t) + '</p><p>' + esc(ST[cl.s].say) + '</p></section>';
  }
  var note = v === 'sources' && !ov.hasPrimary ? 'Interviews or notes dropped in this idea’s inbox folder are read first by every skill, and appear here set apart.' : '';
  return nextSkill(n.skill, 'Next step', note);
}


/* ---------- a future journey: a proposal, drawn as one ---------- */
var JRF = [['pain', 'Today’s pain', 3], ['changes', 'What changes', 5], ['doing', 'Doing', 7], ['thinking', 'Thinking', 9], ['risk', 'Risk', 11]];
function todayFuture(j, future) {
  var base = '#journeys/' + j.slug;
  return '<nav class="tfsw" aria-label="Today or future"><a href="' + base + '"' + (future ? '' : ' aria-current="true"') + '><span>Today</span><small>What we found</small></a><a href="' + base + '/future"' + (future ? ' aria-current="true"' : '') + '><span>Future</span><small>A proposal</small></a></nav>';
}
function futureBody(d, j) {
  var f = j.future, n = f.stages.length;
  var h = j.stages.length ? todayFuture(j, true) : '';
  h += '<header class="vh"><h1 class="h1 display sentence proposal" tabindex="-1">' + esc(f.title) + '</h1><p class="sub">A proposal for ' + esc(j.who) + ', not a finding.</p></header>';
  h += '<div class="status col proposal-note"><p>' + glyph('proposed') + '<span>Everything here is sketched. Each line says what could change, and names what stands behind the idea, if anything does. None of it has been tried.</span></p></div>';
  var todayEmo = {};
  j.stages.forEach(function (s) { if (s.emotion != null) todayEmo[s.phase.toLowerCase()] = s.emotion; });
  if (n) {
    var rl = '<div class="rl r1">Stage</div>' + JRF.map(function (r) { return '<div class="rl" style="grid-row:' + r[2] + '">' + r[1] + '</div>'; }).join('');
    var stages = f.stages.map(function (s, i) {
      var c = C(s.c);
      var now = todayEmo[s.phase.toLowerCase()];
      var move = s.emotion != null && now != null ? 'Today ' + now + ', predicted ' + s.emotion + ' of 5' : 'Predicted ' + (s.emotion != null ? s.emotion : 'unrated') + ' of 5';
      return '<article class="stage proposal" style="--col:' + (i + 2) + '" data-s="' + c.s + '" data-c="' + s.c + '"><div class="head" data-row="1"><span class="num">' + (i + 1) + ' of ' + n + '</span><h3 class="ph">' + btn(s.c, esc(s.phase)) + '</h3>' +
        '<p class="feel">' + esc(move) + '</p></div>' +
        JRF.map(function (r) { return '<div class="jcell ' + r[0] + '" data-label="' + r[1] + '" data-row="' + r[2] + '" style="grid-row:' + r[2] + '">' + esc(s[r[0]]) + '</div>'; }).join('') + '</article>';
    }).join('');
    h += sec('Stages', j.conf, emotionChart(f.stages, true) + '<div class="jgrid" style="--n:' + n + '">' + rl + stages + '</div><p class="cap">The dashed curve is predicted, not measured. Each stage sets today’s pain beside what would change. Tap a stage or any of its cells to see what stands behind it.</p>', 'stagesec', [f.key + '>Stages']);
  }
  var truths = '';
  if (f.truths.length) {
    truths = '<ul class="lines truths">' + f.truths.map(function (t) { return ln(t.c, { label: t.riskiest ? 'Riskiest' : t.label, text: t.text, cls: t.riskiest ? 'big' : '' }); }).join('') + '</ul>';
  }
  h += sec('What has to be true', null, truths, 'truthsec', [f.key + '>What has to be true']);
  h += leftover(function (m) { return m.sec === f.key; });
  var risky = f.truths.filter(function (t) { return t.riskiest; })[0] || f.truths[0];
  if (risky) h += testFirst('Test this first', risky.c, 'The riskiest line', '', null, '/ux-os:create-interview-script', '<p class="why">A proposal is only as good as the line it rests on. Test this one before building anything.</p>');
  else h += nextSkill('/ux-os:create-interview-script', 'Next step');
  return h + noMatch();
}

/* ---------- run next: one or two skills ---------- */
function runNext(list, title) {
  if (!list || !list.length) return '';
  return '<section class="cta-block compact next2"><h2>' + esc(title) + '</h2><ul class="skills">' + list.map(function (x) {
    return '<li><p class="ctal">Run <b>' + esc(x.skill) + '</b></p><p class="cap">' + esc(SAYS[x.skill] || '') + '</p>' + cmd(x.skill, 'Copy ' + x.skill) + '</li>';
  }).join('') + '</ul></section>';
}
function fig(n, one, many) {
  if (n == null) return '<span class="fig unk">unknown</span> ' + (many || one + 's');
  return '<b class="fig">' + esc(n) + '</b> ' + (n === 1 ? one : (many || one + 's'));
}

/* ---------- summary ---------- */
function meterHTML(strength) {
  var n = { strong: 3, some: 2, hint: 1 }[strength] || 0;
  var bars = [1, 2, 3].map(function (i) { return '<i class="' + (i <= n ? 'on' : '') + '" style="height:' + (6 + i * 5) + 'px"></i>'; }).join('');
  return '<div class="fstr' + (n ? '' : ' none') + '" role="img" aria-label="Strength: ' + (strength || 'not rated') + '"><span class="mtr" aria-hidden="true">' + bars + '</span><span class="sw">' + (strength ? cap1(strength) : 'Not rated') + '</span></div>';
}
R.summary = function (d) {
  var h = head('Summary', null);
  if (d.short.items.length) {
    h += '<section class="grp shortv" data-g><div class="gh"><h2>The short version</h2>' + (d.short.conf ? '<span class="conf">Confidence: ' + esc(d.short.conf) + '</span>' : '') + '</div>' +
      '<ul class="lines">' + d.short.items.map(function (it) { return ln(it.c, { label: it.label, text: it.text, cls: 'big dsp' }); }).join('') + '</ul>' + moreFor(['The short version']) + '</section>';
  }
  if (d.found.rows.length) {
    var rows = '<ol class="finds">' + d.found.rows.map(function (r) {
      var counts = '<p class="fcount">' + fig(r.people, 'person', 'people') + ' <span class="sep" aria-hidden="true">·</span> ' + fig(r.orgs, 'organisation') + '</p>';
      var ag = '<p class="against' + (r.none ? ' none' : '') + '"><span>Against</span> ' + esc(r.against || 'none found') + '</p>';
      return '<li class="row find" data-s="' + C(r.c).s + '" data-c="' + r.c + '">' + meterHTML(r.strength) + '<div class="fbody"><h3>' + btn(r.c, esc(r.finding)) + '</h3>' + counts + ag + '</div></li>';
    }).join('') + '</ol>';
    h += sec('What we found', d.found.conf, '<p class="cap">Ranked by strength. The bars show how strong: three is strong, two is some, one is a hint. Against is anyone who did or said the opposite.</p>' + rows + (d.found.notes.length ? list(d.found.notes) : ''), 'finding', ['What we found']);
  }
  if (d.disagree.items.length) h += sec('Where people disagreed', d.disagree.conf, list(d.disagree.items), 'disagree');
  var two = '';
  if (d.changes.items.length) two += '<div>' + sec('What this changes', d.changes.conf, list(d.changes.items, { fold: 4 })) + '</div>';
  if (d.unknown.items.length) two += '<div>' + sec('What we still do not know', d.unknown.conf, list(d.unknown.items, { fold: 4 })) + '</div>';
  if (two) h += '<div class="twocol">' + two + '</div>';
  h += leftover();
  h += nextCta('summary');
  return h + noMatch();
};

/* ---------- affinity ---------- */
R.affinity = function (d) {
  var h = head('Affinity', esc(MAKES.affinity));
  if (d.themes.rows.length) {
    h += sec('Themes', d.themes.conf, '<ol class="athemes">' + d.themes.rows.map(function (t, i) {
      var facts = fig(t.people, 'person', 'people') + ' <span class="sep" aria-hidden="true">·</span> ' + fig(t.orgs, 'organisation') + (t.clusters != null ? ' <span class="sep" aria-hidden="true">·</span> ' + fig(t.clusters, 'cluster') : '');
      return '<li class="row at" data-s="' + C(t.c).s + '" data-c="' + t.c + '"><div class="atl"><h3>' + btn(t.c, esc(t.theme)) + '</h3>' + (t.tells ? '<p class="say">' + esc(t.tells) + '</p>' : '') + '</div><p class="atc">' + facts + '</p></li>';
    }).join('') + '</ol>');
  }
  d.clusters.forEach(function (cl, k) {
    var meta = fig(cl.notes.length, 'note') + ' <span class="sep" aria-hidden="true">·</span> ' + (cl.people ? fig(cl.people, 'person', 'people') + ' stand' + (cl.people === 1 ? 's' : '') + ' behind it' : 'people not counted') + (cl.orgs ? ' <span class="sep" aria-hidden="true">·</span> ' + fig(cl.orgs, 'organisation') : '');
    var wall = '<ul class="wall">' + cl.notes.map(function (n) {
      return '<li class="tile" data-s="' + C(n.c).s + '" data-c="' + n.c + '" data-slot="#aw' + k + '">' + btn(n.c, esc(C(n.c).t)) + (n.who ? '<p class="who3">' + esc(n.who) + '</p>' : '') + '</li>';
    }).join('') + '</ul><div class="slot" id="aw' + k + '"></div>';
    h += '<section class="cluster" data-g><header><h2 class="csent">' + esc(cl.name) + '</h2><p class="cmeta">' + meta + (cl.conf ? ' <span class="sep" aria-hidden="true">·</span> Confidence: ' + esc(cl.conf) : '') + '</p></header>' + wall + '</section>';
  });
  if (d.outliers.rows.length) {
    h += '<section class="cluster outliers" data-g><header><h2 class="csent">Outliers</h2><p class="cmeta">Notes from one person, or that fit nowhere' + (d.outliers.conf ? ' <span class="sep" aria-hidden="true">·</span> Confidence: ' + esc(d.outliers.conf) : '') + '</p></header><ul class="wall">' + d.outliers.rows.map(function (o, i) {
      return '<li class="tile out2" data-s="' + C(o.c).s + '" data-c="' + o.c + '" data-slot="#ao">' + btn(o.c, esc(C(o.c).t)) + (o.who ? '<p class="who3">' + esc(o.who) + '</p>' : '') + (o.why ? '<p class="why3"><span>Stands apart because</span> ' + esc(o.why) + '</p>' : '') + '</li>';
    }).join('') + '</ul><div class="slot" id="ao"></div></section>';
  }
  if (d.surprised.items.length) h += sec('What surprised us', d.surprised.conf, list(d.surprised.items, { fold: 4 }));
  h += leftover();
  h += nextCta('affinity');
  return h + noMatch();
};

/* ---------- card sort ---------- */
function shortCard(c) { return c.length > 22 ? c.slice(0, 21) + '…' : c; }
function heatHTML(m) {
  var n = m.cards.length;
  var gb = function (i) { return i > 0 && m.group[i] !== m.group[i - 1]; };
  var h = '<div class="scroll"><div class="heat" role="img" aria-label="Similarity of ' + n + ' cards. A darker square means more of the people kept those two cards together. Groups read as dark blocks along the diagonal." style="--n:' + n + '"><span class="hc"></span>';
  m.cards.forEach(function (c, j) { h += '<span class="hl hcol' + (gb(j) ? ' gbl' : '') + '" title="' + esc(c) + '"><span>' + esc(shortCard(c)) + '</span></span>'; });
  m.cards.forEach(function (a, i) {
    h += '<span class="hl hrow' + (gb(i) ? ' gbt' : '') + '" title="' + esc(a) + '">' + esc(shortCard(a)) + '</span>';
    m.cards.forEach(function (b, j) {
      var v = m.matrix[i][j];
      h += '<span class="hx' + (i === j ? ' self' : '') + (gb(i) ? ' gbt' : '') + (gb(j) ? ' gbl' : '') + '" style="--v:' + v.toFixed(2) + '" title="' + esc(a + (i === j ? '' : ' and ' + b + ': ' + Math.round(v * 100) + '% of people kept them together')) + '"></span>';
    });
  });
  return h + '</div></div><div class="hleg" aria-hidden="true"><span>Never together</span><i></i><span>Always together</span></div>';
}
function pct(v) { return v == null ? '' : Math.round(v * 100) + '%'; }
R.cardsort = function (d) {
  var h = head('Card sort', esc(MAKES.cardsort));
  if (d.study.items.length) h += sec('Study', d.study.conf, list(d.study.items), 'studyb');
  if (d.map) {
    h += '<section class="grp" data-g><div class="gh"><h2>How often two cards were kept together</h2><span class="conf">' + plural(d.map.cards.length, 'card') + (d.map.participants ? ' · ' + plural(d.map.participants, 'person', 'people') : '') + '</span></div>' +
      '<p class="cap">Drawn from the sort itself, in the order that puts cards people group together side by side, so a group shows up as a dark block. Hover or tap a square for the figure. The heavier lines divide the groups.</p>' + heatHTML(d.map) + '</section>';
  } else if (d.groups.rows.length) {
    h += quiet('There is no cardsort.json beside this file, so the similarity map is not drawn. The tables below carry what the file says.');
  }
  if (d.groups.rows.length) {
    h += sec('Groups', d.groups.conf, '<div class="cgroups">' + d.groups.rows.map(function (g) {
      var ag = g.agreement != null ? '<div class="agree" role="img" aria-label="' + pct(g.agreement) + ' average share of people who put any two of these cards together"><span class="ab"><span class="af" style="width:' + (g.agreement * 100).toFixed(0) + '%"></span></span><span class="an">' + pct(g.agreement) + '</span><span class="ad">kept them together</span></div>' : '<p class="m none">Agreement not recorded</p>';
      return '<article class="cg" data-s="' + C(g.c).s + '" data-c="' + g.c + '"><p class="gk">' + (g.group ? 'Group ' + esc(g.group) : 'Group') + '</p><h3>' + btn(g.c, esc(g.label || 'Unlabelled')) + '</h3>' + ag +
        '<ul class="chips">' + g.cards.map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('') + '</ul></article>';
    }).join('') + '</div>', 'groupsec', ['Groups']);
  }
  if (d.homeless.rows.length) {
    h += sec('Cards without a clear home', d.homeless.conf, '<p class="cap">Cards that float, or are pulled towards two groups. They need a second route or a rename.</p><ul class="homeless">' + d.homeless.rows.map(function (x) {
      var meta = [x.closest ? 'Closest to ' + x.closest : '', x.share != null ? pct(x.share) + ' put them together' : ''].filter(Boolean).join(' · ');
      return '<li class="row nohome" data-s="' + C(x.c).s + '" data-c="' + x.c + '"><h3>' + btn(x.c, esc(x.card)) + '</h3>' + (meta ? '<p class="m">' + esc(meta) + '</p>' : '') + (x.todo ? '<p class="what"><span>What to do</span> ' + esc(x.todo) + '</p>' : '') + '</li>';
    }).join('') + '</ul>', 'homesec', ['Cards without a clear home']);
  }
  if (d.labels.rows.length) {
    var mx = Math.max.apply(null, [1].concat(d.labels.rows.map(function (x) { return x.people || 0; })));
    h += sec('Labels people used', d.labels.conf, '<p class="cap">The words people chose for their own groups.</p><ul class="labs" data-fold="6">' + d.labels.rows.map(function (x) {
      return '<li class="row lab2" data-s="' + C(x.c).s + '" data-c="' + x.c + '">' + btn(x.c, esc(x.label)) + '<span class="lb"><span class="lf" style="width:' + (((x.people || 0) / mx) * 100).toFixed(0) + '%"></span></span><span class="ln2">' + (x.people != null ? plural(x.people, 'person', 'people') : '') + '</span>' + (x.cards ? '<p class="m">' + esc(x.cards) + '</p>' : '') + '</li>';
    }).join('') + '</ul>');
  }
  if (d.pairs.rows.length) {
    h += sec('Pairs people keep together', d.pairs.conf, '<ul class="pairs" data-fold="6">' + d.pairs.rows.map(function (x) {
      return '<li class="row pr" data-s="' + C(x.c).s + '" data-c="' + x.c + '">' + btn(x.c, esc(x.a) + ' <span class="with">with</span> ' + esc(x.b)) + '<span class="lb"><span class="lf" style="width:' + ((x.together || 0) * 100).toFixed(0) + '%"></span></span><span class="ln2">' + (x.together != null ? pct(x.together) : '') + '</span></li>';
    }).join('') + '</ul>');
  }
  if (d.means.items.length) h += sec('What this means for the structure', d.means.conf, list(d.means.items, { cls: 'lead', fold: 4 }), 'lead');
  h += leftover();
  h += nextCta('cardsort');
  return h + noMatch();
};

/* ---------- empathy ---------- */
function quad(name, hint, items, cls) {
  return '<section class="quad ' + cls + '" data-g><h3>' + name + '<span class="qh">' + hint + '</span></h3>' + (items.length ? list(items, { fold: 5 }) : '<p class="none">Nothing recorded.</p>') + '</section>';
}
R.empathy = function (d, param) {
  var ms = d.maps;
  if (!ms.length) return emptyView('empathy');
  var idx = 0;
  ms.forEach(function (m, i) { if (m.slug === param) idx = i; });
  var m = ms[idx];
  var proto = !d.banner || d.banner.proto;
  var h = switcher(ms.map(function (x) { return { slug: x.slug, label: x.who + (ms.length > 1 && x.moment ? ': ' + (x.moment.length > 34 ? x.moment.slice(0, 33) + '…' : x.moment) : '') }; }), idx, 'empathy');
  h += '<header class="vh"><h1 class="h1 display sentence' + (proto ? ' proto' : '') + '" tabindex="-1">' + esc(m.moment || m.who) + '</h1><p class="sub">' + (proto ? 'A proto empathy map for ' : 'An empathy map for ') + esc(m.who) + '.</p></header>';
  var ids = [];
  ['says', 'does', 'thinks', 'feels', 'gaps'].forEach(function (k) { m[k].forEach(function (x) { ids.push(x.c); }); });
  h += beliefTally(ids, 'this map', d.banner);
  h += '<div class="quads">' + quad('Says', 'Their own words', m.says, 'q-says') + quad('Does', 'What they were seen doing', m.does, 'q-does') +
    quad('Thinks', 'Inferred, unless they said it', m.thinks, 'q-thinks') + quad('Feels', 'Inferred, unless they said it', m.feels, 'q-feels') + '</div>';
  var gaps = m.gaps.length
    ? '<ul class="lines">' + m.gaps.map(function (x) { return ln(x.c, { label: x.label, text: x.text, cls: 'big dsp' }); }).join('') + '</ul>'
    : '<p class="quiet">No say-do gap was recorded for this map.</p>';
  h += '<section class="grp gaps" data-g><div class="gh"><h2><span class="neq" aria-hidden="true">≠</span> Say-do gaps</h2>' + (m.conf ? '<span class="conf">Confidence: ' + esc(m.conf) + '</span>' : '') + '</div><p class="cap">Where what they say and what they do come apart, and what that might mean.</p>' + gaps + '</section>';
  h += leftover(function (x) { return x.sec.indexOf('Map: ') !== 0 || x.sec === m.key; });
  h += nextCta('empathy');
  return h + noMatch();
};

/* ---------- the four study plans: one layout, a few touches each ---------- */
var PLAN_TITLE = { interview: 'Interview script', usability: 'Usability plan', diary: 'Diary study', survey: 'Survey' };
var PLAN_FIRST = {
  interview: ['What this has to settle'],
  usability: ['What this has to settle', 'Pass lines'],
  diary: ['What this has to settle', 'The shape', 'Prompts', 'Schedule'],
  survey: ['What this has to settle', 'Who and how many', 'Analysis plan', 'Questions']
};
var PLAN_NEXT = { interview: '/ux-os:affinity-diagram', usability: '/ux-os:summarize-research', diary: '/ux-os:affinity-diagram', survey: '/ux-os:summarize-research' };
var PLAN_AFTER = {
  '/ux-os:affinity-diagram': 'Run the sessions, drop the notes or recordings in the idea’s inbox folder, then run it. It groups what people said into clusters.',
  '/ux-os:summarize-research': 'Once the results are in, put them in the inbox folder and run it.'
};
function colOf(t, names) {
  var at = -1;
  t.header.forEach(function (x, i) { if (at < 0 && names.indexOf(x.toLowerCase()) >= 0) at = i; });
  return at;
}
function plainList(items, cls) {
  if (!items.length) return '';
  return '<ul class="pl' + (cls ? ' ' + cls : '') + '">' + items.map(function (it) {
    return '<li class="d' + Math.min(it.depth, 2) + '">' + (it.label ? '<b class="lab">' + esc(it.label) + '</b> ' : '') + esc(it.text) + '</li>';
  }).join('') + '</ul>';
}
function plainTable(t, cls) {
  if (!t.rows.length) return '';
  return '<div class="scroll"><table class="grid ptable' + (cls ? ' ' + cls : '') + '"><thead><tr>' + t.header.map(function (x) { return '<th scope="col">' + esc(x) + '</th>'; }).join('') + '</tr></thead><tbody>' +
    t.rows.map(function (r) { return '<tr>' + r.map(function (c, i) { return '<td data-l="' + esc(t.header[i] || '') + '">' + (i === 0 ? '<b>' + esc(c) + '</b>' : esc(c)) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
}
function planDefault(s, big) {
  var h = plainList(s.items, big ? 'big' : '');
  s.tables.forEach(function (t) { h += plainTable(t); });
  s.subs.forEach(function (x) { h += '<h3 class="mini">' + esc(x.name) + '</h3>' + plainList(x.items); x.tables.forEach(function (t) { h += plainTable(t); }); });
  return h;
}
function labelled(items) {
  var o = {};
  items.forEach(function (it) { if (it.label) o[it.label.toLowerCase().replace(/:$/, '')] = it.text; });
  return o;
}
var PLAN_RENDER = {
  interview: {
    'What this has to settle': function (s) { return planDefault(s, s.items.length <= 3); },
    'Before you start': function (s) { return '<div class="sayfirst">' + planDefault(s, true) + '</div>'; },
    'Warm-up': function (s) { return planDefault(s, s.items.length <= 3); },
    'The story': function (s) {
      var t = s.tables[0];
      if (!t) return planDefault(s);
      var pi = colOf(t, ['prompt']), li = colOf(t, ['listen for']), ti = colOf(t, ['tests']);
      return '<ol class="story">' + t.rows.map(function (r, i) {
        var prompt = pi >= 0 ? r[pi] : r[0], listen = li >= 0 ? r[li] : '', tests = ti >= 0 ? r[ti] : '';
        var cut = /\bcut\b/i.test(r.join(' '));
        return '<li class="sq' + (cut ? ' cut' : '') + '"><span class="sn2">' + (i + 1) + '</span><div><p class="prompt">' + esc(prompt) + '</p>' +
          (listen ? '<p class="listen"><span>Listen for</span> ' + esc(listen) + '</p>' : '') + (tests ? '<p class="tests"><span>Tests</span> ' + esc(tests) + '</p>' : '') + (cut ? '<p class="cutm">Cut this if time runs short</p>' : '') + '</div></li>';
      }).join('') + '</ol>' + plainList(s.items);
    },
    'Probes': function (s) { return plainList(s.items, 'big probes') + s.tables.map(function (t) { return plainTable(t); }).join(''); },
    'Close': function (s) { return planDefault(s, s.items.length <= 3); }
  },
  usability: {
    'What this has to settle': function (s) { return planDefault(s, s.items.length <= 3); },
    'Pass lines': function (s) {
      var t = s.tables[0];
      if (!t) return planDefault(s);
      var mi = colOf(t, ['measure']), hi = colOf(t, ['how it is taken']), pi = colOf(t, ['pass line']), ii = colOf(t, ['if we miss it']);
      return '<ul class="passes">' + t.rows.map(function (r) {
        return '<li><p class="pk">' + esc(mi >= 0 ? r[mi] : r[0]) + '</p><p class="pv">' + esc(pi >= 0 ? r[pi] : '') + '</p>' + (hi >= 0 && r[hi] ? '<p class="ph2"><span>Taken by</span> ' + esc(r[hi]) + '</p>' : '') + (ii >= 0 && r[ii] ? '<p class="pm"><span>If we miss it</span> ' + esc(r[ii]) + '</p>' : '') + '</li>';
      }).join('') + '</ul>' + plainList(s.items);
    },
    'Tasks': function (s) {
      if (!s.subs.length) return planDefault(s);
      var OUT = [['success', 'Success', 'ok'], ['partial', 'Partial', 'half'], ['failure', 'Failure', 'no']];
      var mark = function (k) {
        var m = { ok: '<circle cx="9" cy="9" r="7.5" class="f-ink"/><path d="M5.4 9.2l2.5 2.4 4.7-5.2" fill="none" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" class="s-paper"/>', half: '<circle cx="9" cy="9" r="7.5" fill="none" stroke-width="1.5" class="s-ink"/><path d="M9 1.5a7.5 7.5 0 0 0 0 15z" class="f-ink"/>', no: '<circle cx="9" cy="9" r="7.5" fill="none" stroke-width="1.5" class="s-ink"/><path d="M6 6l6 6M12 6l-6 6" fill="none" stroke-width="1.6" stroke-linecap="round" class="s-ink"/>' };
        return '<svg class="om" viewBox="0 0 18 18" aria-hidden="true" focusable="false">' + m[k] + '</svg>';
      };
      return '<ol class="tasks">' + s.subs.map(function (x, i) {
        var mt = x.name.match(/^Task\s*(\d+)\s*:\s*(.*)$/i);
        var o = labelled(x.items);
        var rest = x.items.filter(function (it) { return !it.label || ['situation', 'starts at', 'success', 'partial', 'failure', 'stop after'].indexOf(it.label.toLowerCase().replace(/:$/, '')) < 0; });
        return '<li class="task"><div class="th"><span class="tn">' + esc(mt ? mt[1] : i + 1) + '</span><h3>' + esc(mt ? mt[2] : x.name) + '</h3></div>' +
          (o.situation ? '<blockquote class="sit"><span>Say to them</span>' + esc(o.situation) + '</blockquote>' : '') +
          (o['starts at'] ? '<p class="starts"><span>Starts at</span> ' + esc(o['starts at']) + '</p>' : '') +
          '<div class="outs3">' + OUT.map(function (k) { return '<div class="o3 o-' + k[2] + '">' + mark(k[2]) + '<p class="ok"><b>' + k[1] + '</b></p><p>' + esc(o[k[0]] || 'Not set') + '</p></div>'; }).join('') + '</div>' +
          (o['stop after'] ? '<p class="stop"><span>Stop after</span> ' + esc(o['stop after']) + '</p>' : '') + plainList(rest) + '</li>';
      }).join('') + '</ol>';
    },
    'Session plan': function (s) {
      var t = s.tables[0];
      if (!t) return planDefault(s);
      var mi = colOf(t, ['minutes']), wi = colOf(t, ['what happens']), si = colOf(t, ['moderator says']);
      return '<ol class="tl">' + t.rows.map(function (r) {
        return '<li><span class="min"><b>' + esc(mi >= 0 ? r[mi] : r[0]) + '</b><small>min</small></span><div><p>' + esc(wi >= 0 ? r[wi] : r[1] || '') + '</p>' + (si >= 0 && r[si] ? '<p class="says"><span>Moderator says</span> ' + esc(r[si]) + '</p>' : '') + '</div></li>';
      }).join('') + '</ol>' + plainList(s.items);
    },
    'Severity scale': function (s) {
      var t = s.tables[0];
      if (!t) return planDefault(s);
      return '<ol class="sev">' + t.rows.map(function (r) { return '<li><span class="lv">' + esc(r[0]) + '</span><p>' + esc(r.slice(1).join(' ')) + '</p></li>'; }).join('') + '</ol>' + plainList(s.items);
    }
  },
  diary: {
    'What this has to settle': function (s) { return planDefault(s, s.items.length <= 3); },
    'The shape': function (s) {
      var items = s.items.filter(function (it) { return it.label; });
      if (!items.length) return planDefault(s);
      return '<dl class="shape">' + items.map(function (it) { return '<div><dt>' + esc(it.label) + '</dt><dd>' + esc(it.text) + '</dd></div>'; }).join('') + '</dl>' + plainList(s.items.filter(function (it) { return !it.label; }));
    },
    'Prompts': function (s) {
      var t = s.tables[0];
      if (!t) return planDefault(s);
      var pi = colOf(t, ['prompt']), fi = colOf(t, ['format']), wi = colOf(t, ['when']), yi = colOf(t, ['why we ask']);
      return '<ol class="prompts">' + t.rows.map(function (r, i) {
        var chips = [fi >= 0 ? r[fi] : '', wi >= 0 ? r[wi] : ''].filter(Boolean).map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('');
        return '<li class="pq"><span class="pn">' + (i + 1) + '</span><div><p class="pt2">' + esc(pi >= 0 ? r[pi] : r[0]) + '</p>' + (chips ? '<ul class="chips">' + chips + '</ul>' : '') + (yi >= 0 && r[yi] ? '<p class="why"><span>Why we ask</span> ' + esc(r[yi]) + '</p>' : '') + '</div></li>';
      }).join('') + '</ol>';
    },
    'Schedule': function (s) {
      var t = s.tables[0];
      if (!t) return planDefault(s);
      var di = colOf(t, ['day']), pi = colOf(t, ['participants']), ri = colOf(t, ['researcher']);
      return '<div class="sched"><div class="sh" aria-hidden="true"><span>Day</span><span>Participants</span><span>Researcher</span></div><ol>' + t.rows.map(function (r) {
        return '<li><span class="dy"><small>Day</small><b>' + esc(di >= 0 ? r[di] : r[0]) + '</b></span><p data-l="Participants">' + esc(pi >= 0 ? r[pi] : r[1] || '') + '</p><p class="rs" data-l="Researcher">' + esc(ri >= 0 ? r[ri] : r[2] || '') + '</p></li>';
      }).join('') + '</ol></div>' + plainList(s.items);
    }
  },
  survey: {
    'What this has to settle': function (s) { return planDefault(s, s.items.length <= 3); },
    'Who and how many': function (s) { return planDefault(s, s.items.length <= 3); },
    'Analysis plan': function (s) {
      var t = s.tables[0];
      if (!t) return planDefault(s);
      var di = colOf(t, ['decision']), ni = colOf(t, ['number to look at']), ci = colOf(t, ['cut by']), ri = colOf(t, ['result that changes the decision']);
      return '<ul class="decs">' + t.rows.map(function (r) {
        return '<li><h3>' + esc(di >= 0 ? r[di] : r[0]) + '</h3><dl>' + (ni >= 0 ? '<div><dt>Look at</dt><dd>' + esc(r[ni]) + '</dd></div>' : '') + (ci >= 0 ? '<div><dt>Cut by</dt><dd>' + esc(r[ci]) + '</dd></div>' : '') +
          (ri >= 0 ? '<div class="chg"><dt>Changes the decision if</dt><dd>' + esc(r[ri]) + '</dd></div>' : '') + '</dl></li>';
      }).join('') + '</ul>' + plainList(s.items);
    },
    'Questions': function (s) {
      var t = s.tables[0];
      if (!t) return planDefault(s);
      var ni = colOf(t, ['number']), qi = colOf(t, ['question']), ti = colOf(t, ['type']), oi = colOf(t, ['options']), ki = colOf(t, ['skip logic']), fi = colOf(t, ['feeds']);
      var nothing = function (x) { return !x || /^(none|n\/a|na|-|–|unknown)$/i.test(x.trim()); };
      return '<div class="qsheet"><ol>' + t.rows.map(function (r, i) {
        var type = (ti >= 0 ? r[ti] : '').toLowerCase();
        var opts = oi >= 0 && !nothing(r[oi]) ? r[oi].split(/\s*;\s*/).length > 1 ? r[oi].split(/\s*;\s*/) : r[oi].split(/\s*,\s*/) : [];
        opts = opts.filter(Boolean);
        var kind = /multi|all that|apply|check/.test(type) ? 'multi' : /scale|rating|likert|nps|agree/.test(type) ? 'scale' : /open|text|free|comment/.test(type) || !opts.length ? 'open' : 'single';
        var say = { multi: 'Choose all that apply', scale: 'Choose one point on the scale', single: 'Choose one', open: 'Write your answer' }[kind];
        var ans;
        if (kind === 'open') ans = '<div class="ruled" aria-hidden="true"><i></i><i></i></div>';
        else if (kind === 'scale') ans = '<ul class="scalep">' + opts.map(function (o) { return '<li><span class="bx" aria-hidden="true"></span><span>' + esc(o) + '</span></li>'; }).join('') + '</ul>';
        else ans = '<ul class="choices ' + kind + '">' + opts.map(function (o) { return '<li><span class="bx" aria-hidden="true"></span><span>' + esc(o) + '</span></li>'; }).join('') + '</ul>';
        return '<li class="qn"><span class="qno">' + esc(ni >= 0 && r[ni] ? r[ni] : i + 1) + '</span><div><p class="qt">' + esc(qi >= 0 ? r[qi] : r[1] || '') + '</p><p class="qh2">' + esc(say) + (ti >= 0 && r[ti] && type.replace(/[^a-z]/g, '') !== kind ? ' <span class="sep" aria-hidden="true">·</span> ' + esc(r[ti]) : '') + '</p>' + ans +
          (ki >= 0 && !nothing(r[ki]) ? '<p class="skip"><span>Skip logic</span> ' + esc(r[ki]) + '</p>' : '') + (fi >= 0 && !nothing(r[fi]) ? '<p class="feeds"><span>Feeds</span> ' + esc(r[fi]) + '</p>' : '') + '</div></li>';
      }).join('') + '</ol></div>' + plainList(s.items);
    },
    'Before it goes out': function (s) { return plainList(s.items, 'checks') + s.tables.map(function (t) { return plainTable(t); }).join(''); }
  }
};
function planPage(v, d) {
  var first = PLAN_FIRST[v] || [];
  var secs = [];
  first.forEach(function (n) { d.sections.forEach(function (s) { if (s.name === n) secs.push(s); }); });
  d.sections.forEach(function (s) { if (secs.indexOf(s) < 0) secs.push(s); });
  var h = head(PLAN_TITLE[v], esc(MAKES[v]));
  var body = '', idx = '';
  secs.forEach(function (s, i) {
    var id = 'ps-' + v + '-' + i;
    var fn = (PLAN_RENDER[v] || {})[s.name];
    var inner = fn ? fn(s) : planDefault(s);
    if (!inner) return;
    idx += '<li><button type="button" class="pi" data-scroll="' + id + '">' + esc(s.name) + '</button></li>';
    body += '<section class="psec ps-' + slugOf(s.name) + '" id="' + id + '"><h2>' + esc(s.name) + '</h2>' + inner + '</section>';
  });
  h += '<div class="plan2"><aside class="pindex" aria-label="In this plan"><p>In this plan</p><ol>' + idx + '</ol></aside><div class="pbody">' + body + '</div></div>';
  h += leftover();
  h += nextSkill(PLAN_NEXT[v], 'After the sessions', PLAN_AFTER[PLAN_NEXT[v]]);
  return h;
}
PLANS.forEach(function (v) { R[v] = function (d) { return planPage(v, d); }; });



/* ---------- navigation: only what has content, in groups ---------- */
function have(v) { return v === 'overview' || !!BOOK[v]; }
function groupOf(v) { var id = null; GROUPS.forEach(function (g) { if (g.views.indexOf(v) >= 0) id = g.id; }); return id; }
function navHTML() {
  var h = '<ul class="navtop">';
  GROUPS.forEach(function (g) {
    var vs = g.views.filter(have);
    if (!vs.length) return;
    if (g.flat || vs.length === 1) {
      vs.forEach(function (v) { h += '<li><a href="#' + v + '" data-v="' + v + '">' + LABEL[v] + '</a></li>'; });
      return;
    }
    h += '<li class="multi"><a class="gtab" href="#' + vs[0] + '" data-g="' + g.id + '">' + g.name + '</a><div class="mob"><p class="gname">' + g.name + '</p><ul>' +
      vs.map(function (v) { return '<li><a href="#' + v + '" data-v="' + v + '">' + LABEL[v] + '</a></li>'; }).join('') + '</ul></div></li>';
  });
  return h + '</ul>';
}
function renderSubs(v) {
  var w = $('#subwrap'), box = $('#subs');
  var g = null;
  GROUPS.forEach(function (x) { if (x.views.indexOf(v) >= 0) g = x; });
  var vs = g && !g.flat ? g.views.filter(have) : [];
  if (vs.length < 2) { w.hidden = true; box.innerHTML = ''; return; }
  w.hidden = false;
  box.innerHTML = vs.map(function (x) { return '<a href="#' + x + '" data-v="' + x + '">' + LABEL[x] + '</a>'; }).join('');
}

/* ---------- router ---------- */
function show(v, param, param2) {
  closeNote(false);
  if (v !== curName) { mode = 'all'; }
  curName = v;
  NAMES.forEach(function (n) { var s = $('#v-' + n); if (s) s.hidden = n !== v; });
  $$('#nav a, #subs a').forEach(function (a) {
    var name = a.getAttribute('data-v'), gid = a.getAttribute('data-g');
    if (name ? name === v : gid === groupOf(v)) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  renderSubs(v);
  var root = $('#v-' + v);
  var d = BOOK[v];
  cur = d || null;
  if (d && d.more) d.more.forEach(function (m) { m.used = false; });
  if (!d) root.innerHTML = emptyView(v);
  else {
    try { root.innerHTML = R[v](d, param, param2); }
    catch (err) { root.innerHTML = '<div class="empty"><p class="eh">This view could not be drawn.</p><p>' + esc(String(err && err.message || err)) + '</p></div>'; }
  }
  var plan = PLANS.indexOf(v) >= 0;
  $('#key').hidden = !d || v === 'sources' || plan;
  renderBar(plan ? 'overview' : v);
  if (d && v !== 'sources' && v !== 'overview' && !plan) { setupFolds(root); applyFilter(); }
  if (d && v === 'sources') applySourceFilter();
  var navw = $('#nav'); navw.classList.remove('open'); $('#navtoggle').setAttribute('aria-expanded', 'false');
}
function route() {
  var parts = location.hash.replace(/^#/, '').split('/');
  var v = NAMES.indexOf(parts[0]) >= 0 ? parts[0] : 'overview';
  show(v, parts[1] || '', parts[2] || '');
  window.scrollTo(0, 0);
  var h1 = $('#v-' + v + ' h1');
  if (h1) { try { h1.focus({ preventScroll: true }); } catch (e) { /* older engines */ } }
}

if (window.__BOOK_TEST) { window.__BOOK_TEST.noteHTML = noteHTML; window.__BOOK_TEST.navViews = function () { return NAMES.filter(have); }; }
$('#keybody').innerHTML = keyHTML();
$('#nav').innerHTML = navHTML();
$('#navtoggle').addEventListener('click', function () {
  var nav = $('#nav'); var open = !nav.classList.contains('open');
  nav.classList.toggle('open', open); this.setAttribute('aria-expanded', String(open));
});
(function quietLegend() {
  var book = window.BOOK || {};
  var hasBeliefs = ['jobs', 'personas', 'journeys', 'empathy'].some(function (v) { return book[v] && book[v].banner && !book[v].banner.real; });
  var line = document.getElementById && document.getElementById('legend-line');
  if (line && !hasBeliefs) line.textContent = 'Ink is what was found. Thin ink is what we reasoned from it.';
})();
window.addEventListener('hashchange', route);
route();
})();
