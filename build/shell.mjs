// The page frame and the components every page shares: nav, footer, frames, the grease circle, lab notes.
import { esc } from './md.mjs';

export { esc };
export const SITE = 'https://bbulman.github.io/ux-os/';
export const REPO = 'https://github.com/bbulman/ux-os';
export const blob = (path) => `${REPO}/blob/main/${path}`;
export const DESIGNER_MARKETPLACE = '/plugin marketplace add Owl-Listener/designer-skills';
export const UXOS_INSTALL = ['/plugin marketplace add bbulman/ux-os', '/plugin install ux-os@ux-os'];

export const TYPE = { skill: 'Skill', pack: 'Skill pack', agent: 'Agent', command: 'Command', mcp: 'MCP server' };
export const TYPE_PLURAL = { skill: 'Skills', pack: 'Skill packs', agent: 'Agents', command: 'Commands', mcp: 'MCP servers' };
export const LOADS = { available: 'ON', name: 'BY NAME', off: 'OFF' };
export const LOADS_WORDS = {
  available: 'Loads on its own',
  name: 'Runs when you type it',
  off: 'Installed and switched off',
};
export const ORIGIN = { built: 'Mine', combined: 'Combined', third: 'Third-party' };
export const SCOPE = { any: 'Any project', workshopr: 'Workshopr only' };
export const STAGE = { trial: 'On trial', adopted: 'Adopted', retired: 'Retired' };

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const date = (iso) => {
  const [y, m, d] = String(iso).split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};
export const fmt = (n) => Number(n).toLocaleString('en-GB');
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
export const word = (n) => WORDS[n] ?? fmt(n);
export const Word = (n) => { const w = word(n); return w[0].toUpperCase() + w.slice(1); };
export const plural = (n, one, many = `${one}s`) => `${fmt(n)} ${n === 1 ? one : many}`;
export const slug = (s) => String(s).toLowerCase().replace(/&/g, ' and ').replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// What a count means for this kind of entry.
export const runs = (e) => (e.type === 'mcp' ? plural(e.usage.total, 'call') : plural(e.usage.total, 'run'));
export const runsShort = (e) => (e.usage.total ? runs(e) : 'never run');

// How someone starts it, in one line.
export function runLine(e) {
  if (e.type === 'skill' || e.type === 'command') return e.invoke ? `/${e.invoke}` : '';
  if (e.type === 'agent') return e.invoke ? `agent: ${e.invoke}` : '';
  if (e.type === 'mcp') return e.invoke ? `MCP: ${e.invoke}` : '';
  return e.invoke ? `pack: ${e.invoke}` : `pack: ${e.name}`;
}

// Relative links, so the site works under /ux-os/ and from the file system.
// `from` is the page's folder relative to docs/ ('' for home, 'registry/findability/' for an entry).
export function linker(from) {
  const depth = from.split('/').filter(Boolean).length;
  const up = '../'.repeat(depth);
  return (to = '') => {
    if (/^https?:\/\//.test(to)) return to;
    if (to === '' || to.startsWith('#')) return to ? `${up || './'}${to}` : up || './';
    return up + to;
  };
}

const NAV = [
  ['jobs', 'jobs/', 'Jobs'],
  ['registry', 'registry/', 'Registry'],
  ['disciplines', 'disciplines/', 'Disciplines'],
  ['workflows', 'workflows/', 'Workflows'],
  ['project-files', 'project-files/', 'Project files'],
  ['get-started', 'get-started/', 'Get started'],
];

const FONTS = 'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=IBM+Plex+Mono:wght@400;500&family=Public+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap';

export function page({ path, title, description, body, current = '', scripts = [], ctx }) {
  const L = linker(path);
  const nav = NAV.map(([key, href, label]) => `<a href="${L(href)}"${key === current ? ' aria-current="page"' : ''}>${label}</a>`).join('');
  const full = `${SITE}${path}`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(full)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(full)}">
<meta name="color-scheme" content="light dark">
<link rel="icon" href="${L('assets/icon.svg')}" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<link rel="stylesheet" href="${L('assets/site.css')}">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<div class="wrap">
<header class="top">
  <a class="mark" href="${L('')}">UX-OS</a>
  <nav class="nav" aria-label="Main">${nav}<a href="${REPO}">GitHub</a></nav>
</header>
<main id="main" tabindex="-1">
${body}
</main>
<footer class="foot">
  <p><a href="${L('changelog/')}">Changelog</a><span aria-hidden="true"> · </span>Made by <a href="https://workshopr.io">Workshopr.io</a><span aria-hidden="true"> · </span>Every pack keeps its author's licence.</p>
  <p>Registry as of ${date(ctx.asOf)}. Usage counted from Claude Code transcripts since ${date(ctx.usage.since)}.</p>
</footer>
</div>
${scripts.map((s) => `<script src="${L(s)}" defer></script>`).join('\n')}
</body>
</html>
`;
}

// One hand-drawn grease-pencil circle. The seed only wobbles the path, so two circles never match.
export function grease(seed = 1) {
  const r = (n) => +(Math.sin(seed * 9.1 + n) * 3).toFixed(1);
  const d = `M40 ${3 + r(1)} C 110 ${-3 + r(2)}, 180 ${r(3)}, ${194 + r(11)} 12 C 204 ${34 + r(4)}, 202 ${96 + r(5)}, ${192 + r(12)} 114 C 150 ${124 + r(6)}, 50 ${122 + r(7)}, 10 114 C ${r(13)} 96, ${-2 + r(14)} 26, 8 ${8 + r(8)} C 22 ${r(9)}, 60 ${-2 + r(10)}, 104 4`;
  return `<svg class="grease" viewBox="0 0 200 120" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path pathLength="1" d="${d.replace(/-?\d+\.\d+/g, (n) => String(+(+n).toFixed(1)))}"/></svg>`;
}

const pad = (n) => String(n).padStart(2, '0');
// The author's mark on the edge row: initials for mine, the name for third parties unless it will not fit.
const initials = (name) => name.split(/\s+/).map((w) => `${w[0].toUpperCase()}.`).join('');
const mark = (e) => (e.origin !== 'third' ? 'B.B.' : e.author.length > 9 && /\s/.test(e.author) ? initials(e.author) : e.author);

// A frame on the contact sheet. The whole frame links to the entry.
// opts: n (frame number), L (linker), pick (bool), circle (bool), attrs (data attributes), setName (slug to name)
export function frame(e, { n, L, pick = false, circle = false, attrs = '', setName, link = true, showRuns = true }) {
  const label = [
    `${e.name}: ${TYPE[e.type].toLowerCase()}, ${setName[e.set]}`,
    LOADS_WORDS[e.status].toLowerCase(),
    showRuns ? runsShort(e) : '',
    pick ? 'a pick for a job' : '',
  ].filter(Boolean).join('. ');
  return `<li class="frame${circle ? ' is-circled' : ''}"${attrs}>
${link ? `<a class="frame-link" href="${L(`registry/${e.id}/`)}" aria-label="${esc(label)}">` : '<div class="frame-link">'}
<span class="edge" aria-hidden="true"><span>${pad(n)}</span>${pick ? '<b class="tick">✓ pick</b>' : `<span>${pad(n)}A</span>`}<span class="who">${esc(mark(e))}</span></span>
<span class="shot"><span class="fname">${esc(e.name)}</span><span class="fmeta">${esc(setName[e.set])} · ${TYPE[e.type]}</span></span>
<span class="edge edge--b" aria-hidden="true"><span class="st st--${e.status}">${LOADS[e.status]}</span>${showRuns ? `<span>${esc(runsShort(e))}</span>` : ''}</span>
${link ? '</a>' : '</div>'}${circle ? grease(n + 1) : ''}
</li>`;
}

// A ruled lab-notebook note with a red margin rule.
export const note = (html, cls = '') => `<div class="note${cls ? ` ${cls}` : ''}">${html}</div>`;

export const codeBlock = (lines, label = '') => `<pre class="cmd"${label ? ` aria-label="${esc(label)}"` : ''}><code>${esc([].concat(lines).join('\n'))}</code></pre>`;

// Inline `code` in plain data strings (the set runIt copy uses backticks).
export const withCode = (text) => esc(text).replace(/`([^`]+)`/g, '<code>$1</code>');

export const statusChip = (e) => `<span class="chip chip--${e.status}">${LOADS[e.status]}</span>`;
