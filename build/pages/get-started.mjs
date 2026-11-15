import { page, linker, esc, plural, word, Word, codeBlock, UXOS_INSTALL } from '../shell.mjs';
import { loadout } from '../loadout.mjs';

// Install once, then set up each project. Every command's description comes from its registry entry,
// and the file order from project-files.json, so the page follows the data.
export function getStarted(ctx) {
  const path = 'get-started/';
  const L = linker(path);
  const lo = loadout(ctx.plugins, ctx.entries);
  const on = lo.public.filter((p) => p.on);
  const entry = (ref) => ctx.byId.get(ctx.resolve(ref));
  const summary = (ref) => esc(entry(ref)?.summary || '');
  const more = (ref, label) => {
    const e = entry(ref);
    return e ? `<p><a class="link" href="${L(`registry/${e.id}/`)}">${esc(label)}</a></p>` : '';
  };
  const files = ctx.projectFiles.filter((f) => f.build).sort((a, b) => a.build.order - b.build.order);

  const step = (title, text, cmds) => `<li class="gs-step">
  <div class="gs-text">
    <h3 class="gs-h">${title}</h3>
    ${text}
  </div>
  <div class="setup-cmds">
${cmds}
  </div>
</li>`;

  const install = [
    step(
      'Just UX-OS',
      `<p>The ux-os plugin: my research commands and the commands that set up a project. Enough for everything below.</p>`,
      `    <p class="pre-label">Once, in Claude Code</p>
    ${codeBlock(UXOS_INSTALL)}`,
    ),
    step(
      'Everything I run',
      `<p>My whole loadout: the ${plural(on.length, 'plugin')} I keep on, ux-os among them, from ${word(lo.marketplaceAdds.length)} marketplaces, and the settings that keep the rest to run by name.</p>`,
      `    <p class="pre-label">Once, from the Loadout page</p>
    <p><a class="btn" href="${L('loadout/')}">Copy my loadout</a></p>`,
    ),
  ];

  const project = [
    step(
      '1. Write the project files',
      `<p>${summary('ux-os:create-project-files')}</p>
    <p><a class="link" href="${L('project-files/')}">What each file is for, and which skills read it</a></p>`,
      `    <p class="pre-label">In the project</p>
    ${codeBlock('/ux-os:create-project-files')}`,
    ),
    step(
      '2. Fill each one by interview',
      `<p>Each file has its own command. It reads the code and the other files first, asks in rounds with a recommended answer to each question, and writes nothing until you agree a summary. A file that already exists is never changed: the new copy goes to <code>.scratch/project-files/</code> for you to compare.</p>
    <p class="small">Start with ${esc(files[0].file)}: every other file defers to it.</p>`,
      `    <p class="pre-label">In this order</p>
    <ol class="gs-order">
${files.map((f) => `      <li><a href="${L(`project-files/${f.id}/#build`)}">${esc(f.file)}</a> <code>/${esc(f.build.command)}</code></li>`).join('\n')}
    </ol>`,
    ),
    step(
      '3. Connect your design system',
      `<p>${summary('ux-os:init')}</p>`,
      `    <p class="pre-label">Once per project</p>
    ${codeBlock('/ux-os:init')}`,
    ),
    step(
      '4. Start on an idea',
      `<p>${summary('ux-os:research-next')} Give the idea a short name, and its work collects in <code>ux-os/&lt;idea&gt;/</code>.</p>
    <p><a class="link" href="${L('jobs/')}">Or find the skill for a job</a></p>`,
      `    <p class="pre-label">Whenever you are not sure what to do next</p>
    ${codeBlock('/ux-os:research-next <idea>')}`,
    ),
  ];

  const body = `
<header class="page-head">
  <p class="kicker">Install once · then each project</p>
  <h1>Get started</h1>
  <p class="lede">Install UX-OS once in Claude Code, then set up each project so every skill starts from the same facts. You need Claude Code, and Node for the checking scripts.</p>
</header>

<section class="gs-part" aria-labelledby="install-h">
  <div class="sec-head"><h2 class="big-2" id="install-h">Install</h2><p class="n">${Word(install.length)} ways, pick one</p></div>
  <ul class="gs-steps">
${install.join('\n')}
  </ul>
</section>

<section class="gs-part" aria-labelledby="project-h">
  <div class="sec-head"><h2 class="big-2" id="project-h">Start a new project</h2><p class="n">${Word(project.length)} steps, in order</p></div>
  <ol class="gs-steps">
${project.join('\n')}
  </ol>
</section>
`;

  return page({
    path,
    current: 'get-started',
    title: 'Get started: UX-OS',
    description: 'Install UX-OS in Claude Code, then set up a new project: the project files, your design system and your first idea.',
    body,
    ctx,
  });
}
