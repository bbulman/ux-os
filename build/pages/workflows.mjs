import { page, linker, esc, plural, runLine, statusChip } from '../shell.mjs';

const pad = (n) => String(n).padStart(2, '0');

// One light card per step: its number, what happens, the skill that does it (or a person), and the note.
// The whole card links to the skill's entry page.
function step(st, k, L, ctx) {
  const noteHtml = st.note ? `<p class="wcard-note">${esc(st.note)}</p>` : '';
  const arrow = '<span class="arrow" aria-hidden="true">→</span>';
  const e = st.entry;
  if (!e) {
    return `<li class="wcard wcard--person">
<p class="wcard-edge"><span>${pad(k + 1)}</span><span class="tag-person">PERSON</span></p>
<p class="wcard-label">${esc(st.label)}</p>
<p class="wcard-use small">A person, no skill</p>${noteHtml}${arrow}
</li>`;
  }
  return `<li class="wcard">
<p class="wcard-edge"><span>${pad(k + 1)}</span>${ctx.isPick(e) ? '<b class="tick-ink">✓ pick</b>' : ''}</p>
<p class="wcard-label">${esc(st.label)}</p>
<p class="wcard-use"><a class="stretch" href="${L(`registry/${e.id}/`)}">${esc(e.name)}</a></p>
<p class="wcard-meta">${runLine(e) ? `<code>${esc(runLine(e))}</code> ` : ''}${statusChip(e)}</p>${noteHtml}${arrow}
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
  <ol class="wcards">
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
