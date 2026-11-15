import { page, date, plural } from '../shell.mjs';
import { inline } from '../md.mjs';

export function changelog(ctx) {
  const path = 'changelog/';
  const items = ctx.changes.reduce((n, c) => n + c.items.length, 0);
  const body = `
<header class="page-head">
  <p class="kicker">${plural(ctx.changes.length, 'date')} · ${plural(items, 'change')}</p>
  <h1>Changelog</h1>
  <p class="lede">What changed in UX-OS, newest first.</p>
</header>
<ol class="log">
${ctx.changes.map((c) => `  <li id="d-${c.date}">
    <h2><time datetime="${c.date}">${date(c.date)}</time></h2>
    <ul>${c.items.map((it) => `<li>${inline(it)}</li>`).join('')}</ul>
  </li>`).join('\n')}
</ol>
`;
  return page({ path, title: 'Changelog: UX-OS', description: 'What changed in UX-OS, newest first.', body, ctx });
}
