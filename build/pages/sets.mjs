import { page, linker, frame, note, esc, plural, date, codeBlock, withCode, Word, DESIGNER_MARKETPLACE } from '../shell.mjs';
import { jobItem } from './jobs.mjs';
import { facetAttrs } from './registry.mjs';

const counts = (ctx, s) => {
  const list = ctx.entries.filter((e) => e.set === s.slug);
  return {
    list,
    n: list.length,
    on: list.filter((e) => e.status === 'available').length,
    mine: list.filter((e) => e.origin !== 'third').length,
    jobs: ctx.jobsBySet.get(s.slug).length,
  };
};

export function disciplines(ctx) {
  const path = 'disciplines/';
  const L = linker(path);
  const named = ctx.sets.filter((s) => !s.proposed);
  const proposed = ctx.sets.filter((s) => s.proposed);
  const row = (s) => {
    const c = counts(ctx, s);
    return `<li class="disc-card">
  <h3><a class="stretch" href="${L(`${s.slug}/`)}">${esc(s.name)}</a></h3>
  <p class="covers">${esc(s.covers)}</p>
  <p class="dn">${plural(c.n, 'entry', 'entries')} · ${c.on} on · ${c.mine} mine${c.jobs ? ` · ${plural(c.jobs, 'job')}` : ''}</p>
</li>`;
  };
  const body = `
<header class="page-head">
  <p class="kicker">${plural(ctx.sets.length, 'set')} · ${proposed.length} proposed</p>
  <h1>Disciplines</h1>
  <p class="lede">The registry in ${word(ctx.sets.length)} sets. Each set says what it covers, why it matters, and what is still missing.</p>
</header>
<section aria-labelledby="named-h">
  <h2 class="vh" id="named-h">Sets</h2>
  <ol class="disc-cards">
${named.map(row).join('\n')}
  </ol>
</section>
<section aria-labelledby="proposed-h" class="sec-tight">
  <h2 class="big-2" id="proposed-h">Proposed</h2>
  <p class="lede">Still to be kept, renamed or dropped.</p>
  <ol class="disc-cards">
${proposed.map(row).join('\n')}
  </ol>
</section>
`;
  return page({
    path,
    current: 'disciplines',
    title: 'Disciplines: UX-OS',
    description: `The ${word(ctx.sets.length)} sets of UX-OS, from ${ctx.sets[0].name.toLowerCase()} to ${ctx.sets.at(-1).name.toLowerCase()}, with what each covers and what is missing.`,
    body,
    ctx,
  });
}

const word = (n) => Word(n).toLowerCase();

function runIt(r) {
  return `<section class="run-it" aria-labelledby="run-it-h">
  <h2 class="big-2" id="run-it-h">How to run it</h2>
  ${r.install ? `<p>${withCode(r.installIntro)}</p>\n  ${codeBlock(r.install)}` : ''}
  ${r.intro.map((text) => `<p>${withCode(text)}</p>`).join('\n  ')}
  <h3>Example prompts</h3>
  <p>${withCode(r.promptsNote)}</p>
  <ul class="prompts">
${r.prompts.map(([when, prompt]) => `    <li><p>${esc(when)}</p>${codeBlock(prompt)}</li>`).join('\n')}
  </ul>
</section>`;
}

export function setPage(s, i, ctx) {
  const path = `${s.slug}/`;
  const L = linker(path);
  const c = counts(ctx, s);
  const sorted = [...c.list].sort(ctx.byUsage);
  const circled = sorted.find(ctx.isPick);
  const jobs = ctx.jobsBySet.get(s.slug);
  const needsMarket = c.list.some((e) => e.marketplace);
  const prev = ctx.sets[(i - 1 + ctx.sets.length) % ctx.sets.length];
  const next = ctx.sets[(i + 1) % ctx.sets.length];

  const frames = sorted.map((e, k) => frame(e, { n: k + 1, L, pick: ctx.isPick(e), circle: e === circled, attrs: facetAttrs(e), setName: ctx.setName })).join('\n');

  const body = `
<nav class="crumb" aria-label="Breadcrumb"><a href="${L('disciplines/')}">Disciplines</a></nav>
<header class="page-head set-head">
  <p class="kicker">${plural(c.n, 'entry', 'entries')} · ${c.on} on · ${c.mine} mine${c.jobs ? ` · ${plural(c.jobs, 'job')}` : ''}</p>
  <h1>${esc(s.name)}</h1>
  ${s.proposed ? '<p class="tag">Proposed set: may be kept, renamed or dropped</p>' : ''}
  <p class="lede">${esc(s.covers)}</p>
  <p class="why">${esc(s.why)}</p>
  ${note(`<p><span class="note-k">What's missing:</span> ${esc(s.missing)}</p>`, 'note--wide')}
</header>

${s.runIt ? runIt(s.runIt) : ''}

${jobs.length ? `<section class="sec-tight" aria-labelledby="jobs-h">
  <h2 class="big-2" id="jobs-h">Jobs</h2>
  <p class="lede">What I hand to which skill in ${esc(s.name.toLowerCase())}. <a href="${L(`jobs/#${s.slug}`)}">All the jobs</a></p>
  <ol class="jobs">
${jobs.map((j) => jobItem(j, L, { withId: false })).join('\n')}
  </ol>
</section>` : ''}

<section class="sec-tight" aria-labelledby="sheet-h">
  <h2 class="big-2" id="sheet-h">The sheet</h2>
  <p class="lede">Every entry in the set, most used first.${circled ? ` Circled: ${esc(circled.name)}, the most used pick here.` : ''}</p>
  ${needsMarket ? `<div class="first-step"><p>Installing the ${esc([...new Set(c.list.filter((e) => e.marketplace).map((e) => e.author))].join(' and '))} packs here needs this once:</p>${codeBlock(DESIGNER_MARKETPLACE)}</div>` : ''}
  <ol class="sheet sheet--light sheet--five">
${frames}
  </ol>
  <p class="caption">The states are from my setup on ${date(ctx.asOf)}. Yours start from whatever you install.</p>
</section>

<nav class="turn" aria-label="Other sets">
  <a class="prev" href="${L(`${prev.slug}/`)}"><small>Previous set</small>${esc(prev.name)}</a>
  <a class="next" href="${L(`${next.slug}/`)}"><small>Next set</small>${esc(next.name)}</a>
</nav>
`;
  return page({
    path,
    current: 'disciplines',
    title: `${s.name}: UX-OS`,
    description: `${s.covers} The skills, packs and agents I use for ${s.name.toLowerCase()}, which one wins each job, and how to install them.`,
    body,
    ctx,
  });
}
