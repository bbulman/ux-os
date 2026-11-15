import { page, linker, frame, esc, fmt, plural, TYPE_PLURAL, LOADS, ORIGIN, SCOPE } from '../shell.mjs';
import { TYPES, ORIGINS, STATUSES, SCOPES } from '../load.mjs';

const LOAD_KEY = { available: 'on', name: 'name', off: 'off' };
export const loadKey = (e) => LOAD_KEY[e.status];

// Two rows of five at full width.
const MOST_USED = 10;

// The facet attributes the registry script filters on.
export const facetAttrs = (e) =>
  ` data-set="${e.set}" data-type="${e.type}" data-origin="${e.origin}" data-loads="${loadKey(e)}" data-scope="${e.scope}"`;

export function registry(ctx) {
  const path = 'registry/';
  const L = linker(path);
  const t = ctx.totals;
  const n = (k, v) => ctx.count((e) => e[k] === v);

  const facets = [
    ['set', 'Discipline', ctx.sets.map((s) => [s.slug, s.name, n('set', s.slug)])],
    ['type', 'Type', TYPES.map((v) => [v, TYPE_PLURAL[v], n('type', v)])],
    ['origin', 'Who made it', ORIGINS.map((v) => [v, ORIGIN[v], n('origin', v)])],
    ['loads', 'Loads', STATUSES.map((v) => [LOAD_KEY[v], LOADS[v], n('status', v)])],
    ['scope', 'Scope', SCOPES.map((v) => [v, SCOPE[v], n('scope', v)])],
  ];

  // Each panel follows its toggle in the DOM, so Tab goes from a toggle into its open panel and on to the
  // next toggle. The stylesheet draws every panel below the row of toggles.
  const bar = facets.map(([key, label, values]) => `<button type="button" class="facet-toggle" aria-expanded="false" aria-controls="facet-${key}" data-toggle="${key}">${esc(label)} <b class="cur" data-cur="${key}">all</b></button>
<div class="facet-panel" id="facet-${key}" role="group" aria-label="${esc(label)}" data-panel="${key}" hidden>
  ${values.filter(([, , c]) => c).map(([v, name, c]) => `<button type="button" class="facet-btn" aria-pressed="false" data-facet="${key}" data-value="${esc(v)}" data-label="${esc(name)}">${esc(name)} <span class="c">${fmt(c)}</span></button>`).join('')}
</div>`).join('\n');

  const frames = (list) => list.map((e, i) => frame(e, { n: i + 1, L, pick: ctx.isPick(e), attrs: facetAttrs(e), setName: ctx.setName, showRuns: false })).join('\n');
  const most = ctx.sorted.filter((e) => e.usage.total > 0).slice(0, MOST_USED);

  // data-group-count is rewritten by the registry script as the filters change.
  const group = (id, title, list, key) => `<section class="reg-group" id="${id}" aria-labelledby="h-${id}" data-group>
  <div class="reg-group-head"><h2 class="big-2" id="h-${id}">${esc(title)}</h2><p class="n" data-group-count>${plural(list.length, 'entry', 'entries')}</p></div>
  <ol class="sheet sheet--light sheet--five" data-sheet="${key}">
${frames(list)}
  </ol>
</section>`;

  const body = `
<header class="page-head">
  <p class="kicker">${plural(t.entries, 'entry', 'entries')} · ${fmt(t.on)} on · ${fmt(t.byName)} by name · ${fmt(t.off)} off</p>
  <h1>Registry</h1>
  <p class="lede">Each frame is one skill, pack, agent or tool. The ${MOST_USED} I use most come first, then every entry, most used first. A red tick marks a pick: the skill a job sends you to.</p>
</header>

<div class="filters" data-filters hidden>
  <div class="facet-bar"><span class="facet-k" aria-hidden="true">Filter</span>${bar}</div>
</div>

<div class="countbar">
  <p class="count" role="status" aria-live="polite" data-count>Showing ${fmt(t.entries)} of ${fmt(t.entries)}</p>
  <button type="button" class="clear" data-clear hidden>Clear filters</button>
</div>

<p class="legend"><b>ON</b> loads on its own. <b>BY NAME</b> runs when you type it. <b>OFF</b> is installed and switched off. <b class="tick-ink">✓ pick</b> is the skill a job sends you to.</p>

${most.length ? group('most-used', 'Most used', most, 'most') : ''}

${group('all', 'All', ctx.sorted, 'all')}
<p class="empty" data-empty hidden>Nothing matches those filters. <button type="button" class="clear" data-clear>Clear filters</button></p>
`;

  return page({
    path,
    current: 'registry',
    title: 'Registry: UX-OS',
    description: `All ${fmt(t.entries)} skills, packs, agents, commands and tools in UX-OS: who made each one, whether it loads, and how often I use it.`,
    body,
    scripts: ['assets/registry.js'],
    ctx,
  });
}
