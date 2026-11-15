import { page, linker, esc, plural, runsShort, runLine, statusChip } from '../shell.mjs';

const pad = (n) => String(n).padStart(2, '0');

// One row per step: its number, what happens, the skill that does it (or a person), and the note.
function step(st, k, L, ctx) {
  const noteHtml = st.note ? `<p class="step-note">${esc(st.note)}</p>` : '';
  const e = st.entry;
  const use = e
    ? `<a href="${L(`registry/${e.id}/`)}">${esc(e.name)}</a>${runLine(e) ? ` <code>${esc(runLine(e))}</code>` : ''} ${statusChip(e)} <span class="small">${esc(runsShort(e))}</span>${ctx.isPick(e) ? ' <b class="tick-ink">✓ pick</b>' : ''}`
    : '<span class="tag-person">PERSON</span> <span class="small">A person, no skill</span>';
  return `<li class="step-row${e ? '' : ' step-row--person'}">
<span class="step-n">${pad(k + 1)}</span>
<div>
<p class="step-label">${esc(st.label)}</p>
<p class="step-use">${use}</p>${noteHtml}
</div>
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
  <ol class="steps">
${w.steps.map((st, k) => step(st, k, L, ctx)).join('\n')}
  </ol>
</section>`);

  const people = ctx.workflows.reduce((n, w) => n + w.steps.filter((s) => !s.entry).length, 0);
  const body = `
<header class="page-head">
  <p class="kicker">${plural(ctx.workflows.length, 'workflow')} · ${plural(ctx.workflows.reduce((n, w) => n + w.steps.length, 0), 'step')}</p>
  <h1>Workflows</h1>
  <p class="lede">Skills that run in order, each step reading what the last one wrote. A step marked PERSON is done by a person, not a skill: ${plural(people, 'step')} across these ${plural(ctx.workflows.length, 'workflow')}.</p>
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
