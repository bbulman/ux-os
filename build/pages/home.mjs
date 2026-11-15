import { page, linker, frame, note, esc, fmt, plural, Word, codeBlock, UXOS_INSTALL } from '../shell.mjs';

export function home(ctx) {
  const path = '';
  const L = linker(path);
  const t = ctx.totals;

  // The six most used, and the most used pick always among them, circled.
  const six = ctx.sorted.slice(0, 6);
  const circled = ctx.topPick;
  if (circled && !six.includes(circled)) six[5] = circled;
  const strip = six.map((e, i) => frame(e, { n: i + 1, L, pick: ctx.isPick(e), circle: e === circled, setName: ctx.setName, showRuns: false })).join('\n');

  const others = ctx.thirdAuthors;
  const restBy = others.length > 1 ? `the rest are ${others[0].name}'s and others'` : others.length ? `the rest are ${others[0].name}'s` : '';
  const sub = `${fmt(t.entries)} skills, agents and tools for Claude Code, from research to prototyping. ${fmt(t.mine)} are mine${restBy ? `, ${restBy}` : ''}. Which load, which I use, and the files they read.`;

  let labNote = '';
  if (circled) {
    const jobs = ctx.picks.get(circled.id);
    const forWhat = jobs.length === 1 ? `the pick for “${esc(jobs[0].need)}”` : `the pick for ${plural(jobs.length, 'job')}`;
    const most = circled === ctx.sorted[0] ? 'my most used entry' : 'my most used pick';
    labNote = note(`<p><span class="note-k">Circled:</span> ${forWhat}. <a href="${L(`registry/${circled.id}/`)}">${esc(circled.name)}</a> is ${most}.</p>
<p><span class="note-k">Testing:</span> ${circled.proof ? esc(circled.proof) : 'No test result recorded yet.'}</p>`);
  }

  const pf = ctx.projectFiles;
  const layers = [
    ['jobs/', 'Jobs', `${plural(t.jobs, 'job')}`, 'Say what you need. Get the skill I hand it to, its rival, and why.'],
    ['registry/', 'Registry', `${plural(t.entries, 'entry', 'entries')}`, 'Every skill, pack, agent and tool: who wrote it, whether it loads, how often I use it.'],
    ['workflows/', 'Workflows', `${plural(t.workflows, 'workflow')}`, 'Skills that run in order, each step reading what the last one wrote.'],
    ['project-files/', 'Project files', `${plural(t.projectFiles, 'file')}`, `${pf.slice(0, 3).map((f) => f.file).join(', ')} and the rest: the files a project keeps, and which skills read each one.`],
  ];

  const setup = ctx.byId.get(ctx.resolve('ux-os:create-project-files'));
  const named = ctx.sets.filter((s) => !s.proposed);
  const proposed = ctx.sets.filter((s) => s.proposed);
  const discItem = (s) => {
    const n = ctx.count((e) => e.set === s.slug);
    const j = ctx.jobsBySet.get(s.slug).length;
    return `<li><a href="${L(`${s.slug}/`)}"><span class="dname">${esc(s.name)}</span><span class="dn">${plural(n, 'entry', 'entries')}${j ? ` · ${plural(j, 'job')}` : ''}${s.proposed ? ' · proposed' : ''}</span></a></li>`;
  };

  const body = `
<section class="hero" aria-labelledby="hero-h">
  <div class="hero-text">
    <h1 id="hero-h">Every UX skill I run, and <em>which one wins</em> each job.</h1>
    <p class="lede">${esc(sub)}</p>
    <div class="cta"><a class="btn" href="${L('jobs/')}">Find the skill for a job</a><a class="link" href="${L('registry/')}">See all ${fmt(t.entries)} in the registry</a></div>
  </div>
  <div class="hero-sheet">
    <h2 class="vh">The six I use most</h2>
    <ol class="strip sheet--light">
${strip}
    </ol>
    ${labNote}
  </div>
</section>

<ul class="layers">
${layers.map(([href, h, n, p]) => `  <li><span class="n">${esc(n)}</span><h2><a class="stretch" href="${L(href)}">${h}</a></h2><p>${esc(p)}</p></li>`).join('\n')}
</ul>

<section class="setup" aria-labelledby="setup-h">
  <div>
    <p class="kicker">One command</p>
    <h2 class="big" id="setup-h">Set up a project</h2>
    ${setup ? `<p class="lede">${esc(setup.summary)}</p>` : ''}
    <p><a class="link" href="${L('get-started/')}">Every step, in order: get started</a></p>
    <p><a class="link" href="${L('project-files/')}">See the ${plural(t.projectFiles, 'file')} and who reads them</a></p>
    <p><a class="link" href="${L('loadout/')}">Or copy my whole loadout: the plugins and settings that decide what Claude loads</a></p>
  </div>
  <div class="setup-cmds">
    <p class="pre-label">Once, in Claude Code</p>
    ${codeBlock(UXOS_INSTALL)}
    <p class="pre-label">Then, in each project</p>
    ${codeBlock('/ux-os:create-project-files')}
  </div>
</section>

<section class="sec" aria-labelledby="disc-h">
  <h2 class="big" id="disc-h">Disciplines</h2>
  <p class="lede">${Word(t.sets)} sets, from ${esc(ctx.sets[0].name.toLowerCase())} to ${esc(ctx.sets.at(-1).name.toLowerCase())}. ${Word(proposed.length)} ${proposed.length === 1 ? 'is a proposal' : 'are proposals'}, still to be kept, renamed or dropped.</p>
  <ul class="disc-list">
${named.map(discItem).join('\n')}
${proposed.map(discItem).join('\n')}
  </ul>
</section>
`;

  return page({
    path,
    title: 'UX-OS: every UX skill I run, and which one wins each job',
    description: sub,
    body,
    ctx,
  });
}
