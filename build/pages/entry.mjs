import { page, linker, frame, note, esc, fmt, date, plural, codeBlock, TYPE, LOADS, LOADS_WORDS, SCOPE, STAGE, DESIGNER_MARKETPLACE } from '../shell.mjs';
import { md } from '../md.mjs';

const times = (n) => (n === 1 ? 'once' : n === 2 ? 'twice' : `${fmt(n)} times`);
const MADE = {
  built: (e) => `Built by ${e.author}`,
  combined: (e) => `Combined from public sources and rewritten by ${e.author}`,
  third: (e) => `Third-party, by ${e.author}`,
};

function howToRun(e) {
  const out = [];
  if (e.type === 'skill' || e.type === 'command') {
    if (e.invoke) {
      out.push(`<p>Type it in Claude Code${e.status === 'available' ? ', or let Claude pick it on its own' : ''}:</p>`, codeBlock(`/${e.invoke}`));
    }
  } else if (e.type === 'agent') {
    out.push('<p>An agent. Claude hands it work by this name:</p>', codeBlock(e.invoke));
  } else if (e.type === 'mcp') {
    out.push('<p>An MCP server. Claude calls its tools while it works. The server name:</p>', codeBlock(e.invoke));
  } else if (e.type === 'pack') {
    if (e.invoke && e.match === 'prefix') out.push(`<p>A pack of skills. Each one runs as <code>/${esc(e.invoke)}:</code> followed by the skill's name.</p>`);
    else out.push('<p>A pack of skills, installed together.</p>');
  }
  if (e.status === 'off') out.push('<p>It is switched off in my setup, so it will not run until it is switched back on.</p>');
  if (e.prompts?.length) out.push('<h3>Example prompts</h3>', codeBlock(e.prompts));
  return out.join('\n');
}

function install(e) {
  const lines = [...(e.marketplace ? [DESIGNER_MARKETPLACE] : []), ...(e.install || [])];
  const out = [];
  if (lines.length) out.push(codeBlock(lines));
  if (e.marketplace) out.push(`<p class="small">The first line adds ${esc(e.author)}'s marketplace. You only need it once.</p>`);
  if (e.installNote) out.push(`<p>${esc(e.installNote)}</p>`);
  if (!lines.length && !e.installNote) {
    if (e.scope === 'workshopr') out.push('<p>Runs only on Workshopr, so there is nothing to install.</p>');
    else if (e.privateRepo) out.push('<p>The source is private for now, so there is nothing to install yet.</p>');
    else if (!e.source && e.origin !== 'third') out.push('<p>Not published yet.</p>');
    else out.push('<p>No install line recorded here. See the source.</p>');
  }
  return out.join('\n');
}

function usage(e, ctx) {
  const u = e.usage;
  const since = date(ctx.usage.since);
  if (e.type === 'mcp') return u.total ? `<p>${plural(u.total, 'tool call')} since ${since}.</p>` : `<p>No tool calls since ${since}.</p>`;
  if (!u.total) return `<p>Not used once since ${since}.</p>`;
  const parts = [
    u.model && `Claude chose it ${times(u.model)}`,
    u.typed && `typed by name ${times(u.typed)}`,
    u.agent && `handed work as an agent ${times(u.agent)}`,
  ].filter(Boolean);
  const head = parts.length === 1
    ? `${parts[0][0].toUpperCase()}${parts[0].slice(1)} since ${since}.`
    : `Used ${times(u.total)} since ${since}: ${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}.`;
  return `<p>${head}</p><p class="small">Usage band: ${esc(ctx.BANDS[u.band].toLowerCase())}.</p>`;
}

function source(e) {
  if (e.source) {
    const shown = e.source.replace(/^https:\/\/(www\.)?/, '').replace(/\/$/, '');
    return `<p><a class="ext" href="${esc(e.source)}">${esc(shown)}</a></p>`;
  }
  if (e.privateRepo) return '<p>The source is private for now.</p>';
  if (e.scope === 'workshopr') return '<p>No public source: it runs only on Workshopr.</p>';
  return e.origin === 'third' ? '<p>No source link recorded.</p>' : '<p>No public source yet.</p>';
}

export function entry(e, ctx) {
  const path = `registry/${e.id}/`;
  const L = linker(path);
  const set = ctx.setBySlug.get(e.set);
  const picks = ctx.picks.get(e.id) || [];
  const lost = ctx.lost.get(e.id) || [];
  const flows = ctx.inWorkflows.get(e.id) || [];
  const reads = e.reads.map((id) => ctx.pfById.get(id)).filter(Boolean);
  const storyKey = e.story ? e.story.replace(/^stories\//, '').replace(/\.md$/, '') : null;
  const story = storyKey ? ctx.stories[storyKey] : '';

  const circleNote = picks.length
    ? note(`<p><span class="note-k">Circled:</span> the pick for ${picks.map((j) => `“<a href="${L(`jobs/#${j.anchor}`)}">${esc(j.need)}</a>”`).join(' and ')}.</p>`)
    : '';

  const jobsHtml = [
    picks.length ? `<p class="aside-k">The pick for</p><ul class="plain">${picks.map((j) => `<li><a href="${L(`jobs/#${j.anchor}`)}">${esc(j.need)}</a></li>`).join('')}</ul>` : '<p>Not the pick for any job yet.</p>',
    lost.length ? `<p class="aside-k">Lost</p><ul class="plain lost">${lost.map((j) => `<li><a href="${L(`jobs/#${j.anchor}`)}">${esc(j.need)}</a>: the pick is <a href="${L(`registry/${j.pick.id}/`)}">${esc(j.pick.name)}</a>, because <s>${esc(j.rival.label)}</s> ${esc(j.rival.why)}${/[.!?]$/.test(j.rival.why) ? '' : '.'}</li>`).join('')}</ul>` : '',
  ].join('\n');

  const flowsHtml = flows.length
    ? `<ul class="plain">${flows.map(({ workflow, labels }) => `<li><a href="${L(`workflows/#${workflow.slug}`)}">${esc(workflow.name)}</a><span class="small"> ${labels.map((l) => esc(l)).join('; ')}</span></li>`).join('')}</ul>`
    : '<p>Not part of a workflow yet.</p>';

  const readsHtml = reads.length
    ? `<ul class="plain files">${reads.map((f) => `<li><a href="${L(`project-files/${f.id}/`)}"><code>${esc(f.file)}</code></a></li>`).join('')}</ul>`
    : '<p>No project file lists it as a reader.</p>';

  const facts = [
    ['Loads', `<span class="chip chip--${e.status}" aria-hidden="true">${LOADS[e.status]}</span> ${LOADS_WORDS[e.status]}.`],
    ['Made by', `${esc(MADE[e.origin](e))}.`],
    ['Scope', `${SCOPE[e.scope]}.`],
    ['Stage', `${STAGE[e.stage]}.`],
    ...(e.pack ? [['Part of', `<code>${esc(e.pack)}</code>`]] : []),
    ...(e.credit ? [['Credit', esc(e.credit)]] : []),
  ];

  const body = `
<nav class="crumb" aria-label="Breadcrumb"><a href="${L('registry/')}">Registry</a><span aria-hidden="true"> / </span><a href="${L(`${set.slug}/`)}">${esc(set.name)}</a></nav>
<div class="entry-head">
  <div>
    <p class="kicker">${TYPE[e.type]} · ${esc(set.name)}</p>
    <h1 class="h1-id">${esc(e.name)}</h1>
    <p class="lede">${esc(e.summary)}</p>
    <dl class="facts">
${facts.map(([k, v]) => `      <div><dt>${k}</dt><dd>${v}</dd></div>`).join('\n')}
    </dl>
  </div>
  <div class="print">
    <ol class="strip strip--one sheet--light" aria-hidden="true">
${frame(e, { n: 1, L, pick: picks.length > 0, circle: picks.length > 0, setName: ctx.setName, link: false, showRuns: false })}
    </ol>
    ${circleNote}
  </div>
</div>

<div class="entry-body">
  <div class="entry-main">
    <section aria-labelledby="run-h"><h2 id="run-h">How to run it</h2>
${howToRun(e)}
    </section>
    <section aria-labelledby="install-h"><h2 id="install-h">Install</h2>
${install(e)}
    </section>
    <section aria-labelledby="test-h"><h2 id="test-h">Testing</h2>
${e.proof ? note(`<p>${esc(e.proof)}</p>`) : '<p>No test result recorded yet.</p>'}
    </section>
${story ? `    <section class="story" aria-labelledby="story-h"><h2 id="story-h">Build story</h2>
<div class="prose">
${md(story, { minLevel: 3, unlink: ctx.isPrivateLink })}
</div>
    </section>` : ''}
  </div>
  <aside class="entry-aside" aria-label="Where it fits">
    <section aria-labelledby="usage-h"><h2 id="usage-h">Usage</h2>${usage(e, ctx)}</section>
    <section aria-labelledby="jobs-h"><h2 id="jobs-h">Jobs</h2>${jobsHtml}</section>
    <section aria-labelledby="flows-h"><h2 id="flows-h">Workflows</h2>${flowsHtml}</section>
    <section aria-labelledby="reads-h"><h2 id="reads-h">Project files it reads</h2>${readsHtml}</section>
    <section aria-labelledby="src-h"><h2 id="src-h">Source</h2>${source(e)}</section>
  </aside>
</div>
<p class="back"><a href="${L('registry/')}">Back to the registry</a></p>
`;

  return page({
    path,
    current: 'registry',
    title: `${e.name}: ${TYPE[e.type].toLowerCase()} for ${set.name.toLowerCase()}, UX-OS`,
    description: e.summary,
    body,
    ctx,
  });
}
