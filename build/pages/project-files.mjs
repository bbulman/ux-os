import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { page, linker, esc, plural, codeBlock, blob, UXOS_INSTALL } from '../shell.mjs';
import { md } from '../md.mjs';

const GROUPS = [['core', 'Core'], ['research', 'Research'], ['craft', 'Craft']];

function readers(f, L) {
  if (!f.readers.length) return '<p>No skill reads it by name yet.</p>';
  return `<ul class="readers">${f.readers.map(({ ref, entry }) => (entry
    ? `<li><a href="${L(`registry/${entry.id}/`)}">${esc(entry.name)}</a></li>`
    : `<li><code>${esc(ref)}</code></li>`)).join('')}</ul>`;
}

const setupBlock = (setup) => `<div class="setup setup--compact">
  <div>
    <p class="kicker">One command</p>
    <p>${esc(setup.summary)}</p>
  </div>
  <div class="setup-cmds">
    <p class="pre-label">Once, in Claude Code</p>
    ${codeBlock(UXOS_INSTALL)}
    <p class="pre-label">Then, in each project</p>
    ${codeBlock('/ux-os:create-project-files')}
    <p class="pre-label">Then fill each file by interview, PRODUCT.md first</p>
    ${codeBlock('/ux-os:create-product-file')}
  </div>
</div>`;

// How the create-<file>-file command for one file runs. The interview is the same for all nine;
// the belief and taste files ask open first, so the file holds the person's words.
function buildBlock(f) {
  const b = f.build;
  if (!b) return '';
  const ask = b.open
    ? 'It asks in rounds, and each question comes open: it offers its own draft only after you answer or say you have no view, because this file has to hold what you believe, not what it guessed.'
    : 'It asks in rounds: every question it can ask yet, numbered, each with its recommended answer and the reason, worded so that "yes" accepts it.';
  return `<section class="sec-tight" id="build" aria-labelledby="build-h">
  <div class="sec-head"><h2 class="big-2" id="build-h">Build one by interview</h2></div>
  <p class="lede">One command interviews you and writes ${esc(f.file)}. The interview works the way <code>/grill-me</code> does: it settles every decision the file rests on, one round of questions at a time, until nothing is left assumed. ${esc(b.when)}</p>
  ${codeBlock(`/${b.command}`)}
  <div class="pf-cols">
    <div><p class="aside-k">It reads first</p><p>${esc(b.reads)}</p></div>
    <div><p class="aside-k">Then it asks about</p><ol class="sections">${b.asks.map((a) => `<li>${esc(a)}</li>`).join('')}</ol></div>
  </div>
  <p class="aside-k">How it runs</p>
  <ol class="sections">
    <li>It looks up every fact it can before asking anything, and in a file that already exists it tests each claim against the code.</li>
    <li>${esc(ask)}</li>
    <li>It shows a summary of the new file, section by section, and writes nothing until you say yes.</li>
    <li>A missing file, or one still the unfilled template, is written at the project root. A file that already exists is never changed: the new copy goes to <code>.scratch/project-files/${esc(f.file)}</code>, with the facts it corrected and any citations into the old file that would break, for you to compare.</li>
  </ol>
</section>`;
}

export function projectFiles(ctx) {
  const path = 'project-files/';
  const L = linker(path);
  const setup = ctx.byId.get(ctx.resolve('ux-os:create-project-files'));
  const groups = GROUPS.map(([g, name]) => {
    const files = ctx.projectFiles.filter((f) => f.group === g);
    if (!files.length) return '';
    return `<section class="pf-group" id="${g}" aria-labelledby="h-${g}">
  <h2 class="big-2" id="h-${g}">${name}</h2>
  <ol class="pf-list">
${files.map((f) => `    <li class="pf" id="${f.id}">
      <h3><a href="${L(`project-files/${f.id}/`)}">${esc(f.file)}</a></h3>
      <p>${esc(f.purpose)}</p>
      <div class="pf-cols">
        <div><p class="aside-k">Sections</p><ol class="sections">${(f.sections || []).map((s) => `<li>${esc(s)}</li>`).join('')}</ol></div>
        <div><p class="aside-k">Read by</p>${readers(f, L)}${f.readNote ? `<p class="small">${esc(f.readNote)}</p>` : ''}</div>
      </div>
      <p class="pf-links">${f.build ? `<a href="${L(`project-files/${f.id}/#build`)}">Build one by interview</a><span aria-hidden="true"> · </span>` : ''}<a href="${L(`project-files/${f.id}/#template`)}">The template</a><span aria-hidden="true"> · </span><a href="${L(`project-files/${f.id}/#example`)}">Workshopr's example</a><span aria-hidden="true"> · </span><a class="ext" href="${blob(f.template)}">Template on GitHub</a></p>
    </li>`).join('\n')}
  </ol>
</section>`;
  });

  const body = `
<header class="page-head">
  <p class="kicker">${plural(ctx.projectFiles.length, 'file')} · ${GROUPS.map(([, n]) => n.toLowerCase()).join(', ')}</p>
  <h1>Project files</h1>
  <p class="lede">The files a project keeps, so the skills that read them start from the same facts: what the product is, who it is for, and how it should look, move and sound. Each one lists the skills and agents that read it.</p>
</header>
${setup ? setupBlock(setup) : ''}
${groups.join('\n')}
`;
  return page({
    path,
    current: 'project-files',
    title: 'Project files: UX-OS',
    description: `${ctx.projectFiles.map((f) => f.file).join(', ')}: the files a project keeps, which skills read each one, and a template for each.`,
    body,
    ctx,
  });
}

export function projectFile(f, i, ctx, root) {
  const path = `project-files/${f.id}/`;
  const L = linker(path);
  const template = readFileSync(join(root, f.template), 'utf8');
  const example = f.example ? readFileSync(join(root, f.example), 'utf8') : '';
  const all = ctx.projectFiles;
  const prev = all[(i - 1 + all.length) % all.length];
  const next = all[(i + 1) % all.length];
  const group = GROUPS.find(([g]) => g === f.group)?.[1] || f.group;

  const body = `
<nav class="crumb" aria-label="Breadcrumb"><a href="${L('project-files/')}">Project files</a><span aria-hidden="true"> / </span><a href="${L(`project-files/#${f.group}`)}">${esc(group)}</a></nav>
<header class="page-head">
  <p class="kicker">${esc(group)} file</p>
  <h1 class="h1-id">${esc(f.file)}</h1>
  <p class="lede">${esc(f.purpose)}</p>
</header>
<div class="pf-cols pf-cols--head">
  <div><p class="aside-k">Sections</p><ol class="sections">${(f.sections || []).map((s) => `<li>${esc(s)}</li>`).join('')}</ol></div>
  <div><p class="aside-k">Read by</p>${readers(f, L)}${f.readNote ? `<p class="small">${esc(f.readNote)}</p>` : ''}</div>
</div>

${buildBlock(f)}

<section class="sec-tight" id="template" aria-labelledby="template-h">
  <div class="sec-head"><h2 class="big-2" id="template-h">The template</h2><a class="ext" href="${blob(f.template)}">${esc(f.template)} on GitHub</a></div>
  <p class="lede">What <code>/ux-os:create-project-files</code> writes, word for word. Its comments say what each part is for.</p>
  <pre class="template"><code>${esc(template)}</code></pre>
</section>

${example ? `<section class="sec-tight" id="example" aria-labelledby="example-h">
  <div class="sec-head"><h2 class="big-2" id="example-h">Workshopr's example</h2><a class="ext" href="${blob(f.example)}">${esc(f.example)} on GitHub</a></div>
  <div class="example prose">
${md(example, { minLevel: 3 })}
  </div>
</section>` : ''}

<nav class="turn" aria-label="Other project files">
  <a class="prev" href="${L(`project-files/${prev.id}/`)}"><small>Previous file</small>${esc(prev.file)}</a>
  <a class="next" href="${L(`project-files/${next.id}/`)}"><small>Next file</small>${esc(next.file)}</a>
</nav>
`;
  return page({
    path,
    current: 'project-files',
    title: `${f.file}: project file, UX-OS`,
    description: f.purpose,
    body,
    ctx,
  });
}
