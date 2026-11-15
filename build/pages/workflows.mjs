import { page, linker, esc, plural, LOADS, TYPE, runsShort } from '../shell.mjs';

const pad = (n) => String(n).padStart(2, '0');

function step(st, k, total, L, ctx) {
  const last = k === total - 1;
  const arrow = last ? '' : '<span class="arrow" aria-hidden="true">→</span>';
  const noteHtml = st.note ? `<p class="step-note">${esc(st.note)}</p>` : '';
  if (!st.entry) {
    return `<li class="step step--person">
<div class="frame-blank">
<span class="edge" aria-hidden="true"><span>${pad(k + 1)}</span><span>PERSON</span></span>
<span class="shot shot--blank"><span class="fname">${esc(st.label)}</span><span class="fmeta">A person, no skill</span></span>
<span class="edge edge--b" aria-hidden="true"><span>&nbsp;</span></span>
</div>${noteHtml}${arrow}
</li>`;
  }
  const e = st.entry;
  const label = `Step ${k + 1}: ${st.label}. Uses ${e.name}, ${TYPE[e.type].toLowerCase()}.`;
  return `<li class="step">
<a class="frame-link" href="${L(`registry/${e.id}/`)}" aria-label="${esc(label)}">
<span class="edge" aria-hidden="true"><span>${pad(k + 1)}</span>${ctx.isPick(e) ? '<b class="tick">✓ pick</b>' : `<span>${pad(k + 1)}A</span>`}</span>
<span class="shot"><span class="fname">${esc(st.label)}</span><span class="fmeta">${esc(e.name)} · ${TYPE[e.type]}</span></span>
<span class="edge edge--b" aria-hidden="true"><span class="st st--${e.status}">${LOADS[e.status]}</span><span>${esc(runsShort(e))}</span></span>
</a>${noteHtml}${arrow}
</li>`;
}

export function workflows(ctx) {
  const path = 'workflows/';
  const L = linker(path);
  const sections = ctx.workflows.map((w) => `<section class="flow" id="${w.slug}" aria-labelledby="h-${w.slug}">
  <div class="flow-head">
    <h2 class="big-2" id="h-${w.slug}">${esc(w.name)}</h2>
    <p class="n">${plural(w.steps.length, 'step')} · ${w.sets.map((s) => `<a href="${L(`${s}/`)}">${esc(ctx.setName[s])}</a>`).join(', ')}</p>
  </div>
  <p class="lede">${esc(w.summary)}</p>
  <ol class="film">
${w.steps.map((st, k) => step(st, k, w.steps.length, L, ctx)).join('\n')}
  </ol>
</section>`);

  const people = ctx.workflows.reduce((n, w) => n + w.steps.filter((s) => !s.entry).length, 0);
  const body = `
<header class="page-head">
  <p class="kicker">${plural(ctx.workflows.length, 'workflow')} · ${plural(ctx.workflows.reduce((n, w) => n + w.steps.length, 0), 'step')}</p>
  <h1>Workflows</h1>
  <p class="lede">Skills that run in order, each step reading what the last one wrote. A dashed frame is a step for a person, not a skill: ${plural(people, 'step')} across these ${plural(ctx.workflows.length, 'workflow')}.</p>
</header>
<nav class="toc" aria-label="Workflows on this page">
${ctx.workflows.map((w) => `  <a href="#${w.slug}">${esc(w.name)}</a>`).join('\n')}
</nav>
${sections.join('\n\n')}
`;
  return page({
    path,
    current: 'workflows',
    title: 'Workflows: UX-OS',
    description: `${plural(ctx.workflows.length, 'chain')} of skills that run in order: ${ctx.workflows.slice(0, 2).map((w) => w.name.toLowerCase()).join(', ')}, and more.`,
    body,
    ctx,
  });
}
