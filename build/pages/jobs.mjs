import { page, linker, esc, plural, runLine, LOADS, LOADS_WORDS } from '../shell.mjs';

export const chip = (e) => `<span class="chip chip--${e.status}"><span aria-hidden="true">${LOADS[e.status]}</span><span class="vh">${LOADS_WORDS[e.status]}</span></span>`;

// One job: the need, the pick and why, and the rival struck through with why it lost.
export function jobItem(j, L, { headingLevel = 3, withId = true } = {}) {
  const h = `h${headingLevel}`;
  const e = j.pick;
  const r = j.rival;
  let rival = '';
  if (r) {
    const name = r.entry ? `<a href="${L(`registry/${r.entry.id}/`)}"><s>${esc(r.label)}</s></a>` : `<s>${esc(r.label)}</s>`;
    const from = !r.entry && r.pack ? ` <span class="from">It is in the <a href="${L(`registry/${r.pack.id}/`)}">${esc(r.pack.name)}</a> pack.</span>` : '';
    rival = `<p class="rival"><span class="label">Rival</span> ${name} ${esc(r.why)}${/[.!?]$/.test(r.why) ? '' : '.'}${from}</p>`;
  }
  const search = [j.need, j.why, e.name, e.invoke, r?.label, r?.why].filter(Boolean).join(' ').toLowerCase();
  return `<li class="job"${withId ? ` id="${j.anchor}"` : ''} data-search="${esc(search)}">
<${h} class="need">${esc(j.need)}</${h}>
<p class="pick"><span class="label">Pick</span> <a href="${L(`registry/${e.id}/`)}">${esc(e.name)}</a> ${runLine(e) ? `<code>${esc(runLine(e))}</code>` : ''} ${chip(e)}</p>
<p class="why">${esc(j.why)}</p>
${rival}
</li>`;
}

export function jobs(ctx) {
  const path = 'jobs/';
  const L = linker(path);
  const t = ctx.totals;
  const sets = ctx.sets.filter((s) => ctx.jobsBySet.get(s.slug).length);
  const shortest = [...ctx.jobs].sort((a, b) => a.need.length - b.need.length)[0];
  const hint = shortest ? shortest.need[0].toLowerCase() + shortest.need.slice(1) : '';

  const groups = sets.map((s) => {
    const list = ctx.jobsBySet.get(s.slug);
    return `<section class="job-set" id="${s.slug}" aria-labelledby="h-${s.slug}" data-group>
  <div class="job-set-head"><h2 class="big-2" id="h-${s.slug}">${esc(s.name)}</h2><p class="n"><span data-group-count>${plural(list.length, 'job')}</span> · <a href="${L(`${s.slug}/`)}">the ${esc(s.name.toLowerCase())} set</a></p></div>
  <ol class="jobs">
${list.map((j) => jobItem(j, L)).join('\n')}
  </ol>
</section>`;
  });

  const body = `
<header class="page-head">
  <h1>Jobs</h1>
  <p class="lede">Say what you need. Each job names the skill I hand it to, and why. Where two could do it, the one that lost is struck through, with the reason.</p>
</header>

<div class="finder" data-finder hidden>
  <label for="q">I need to…</label>
  <input id="q" type="search" autocomplete="off" spellcheck="false" placeholder="try: ${esc(hint)}" data-q>
  <p class="count" role="status" aria-live="polite" data-count>Showing ${t.jobs} of ${t.jobs} jobs</p>
</div>

<nav class="toc" aria-label="Disciplines on this page">
${sets.map((s) => `  <a href="#${s.slug}">${esc(s.name)}</a>`).join('\n')}
</nav>

${groups.join('\n\n')}

<p class="empty" data-empty hidden>No job matches that. Try fewer words, or <a href="${L('registry/')}">browse the registry</a>.</p>
`;

  return page({
    path,
    current: 'jobs',
    title: 'Jobs: UX-OS',
    description: `${plural(t.jobs, 'UX job')}, each with the skill I hand it to, why, and the rival that lost.`,
    body,
    scripts: ['assets/jobs.js'],
    ctx,
  });
}
