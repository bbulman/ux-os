// Builds docs/ and README.md from data/registry.json. Run: node build.mjs
// Every count on the site is derived here, so adding a registry row and rebuilding keeps them true.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const { asOfLabel, sets } = JSON.parse(readFileSync(join(root, 'data/registry.json'), 'utf8'));

const SITE = 'https://bbulman.github.io/ux-os/';
const REPO = 'https://github.com/bbulman/ux-os';
const MARKETPLACE = '/plugin marketplace add Owl-Listener/designer-skills';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const STATES = {
  available: { cls: 'on', label: 'Loads on its own' },
  name: { cls: 'name', label: 'Run by name' },
  off: { cls: 'off', label: 'Off' },
};
const ORDER = ['available', 'name', 'off'];

const all = sets.flatMap((s) => s.entries);
const by = (list, key, value) => list.filter((e) => e[key] === value).length;
const total = all.length;
const loaded = by(all, 'status', 'available');
const onCall = by(all, 'status', 'name');
const off = by(all, 'status', 'off');
const built = by(all, 'origin', 'built');
const combined = by(all, 'origin', 'combined');
const third = by(all, 'origin', 'third');
const dean = by(all, 'author', 'MC Dean');
const named = sets.filter((s) => !s.proposed);
const proposed = sets.filter((s) => s.proposed);
const nothingBuilt = sets.filter((s) => s.entries.every((e) => e.origin === 'third')).length;

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const word = (n) => WORDS[n] ?? String(n);
const Word = (n) => word(n)[0].toUpperCase() + word(n).slice(1);

function page({ title, description, depth, body }) {
  const up = '../'.repeat(depth);
  const home = up || './';
  const hash = (id) => (depth ? `${home}#${id}` : `#${id}`);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Ccircle cx='8' cy='8' r='6' fill='%23E54D4D'/%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${up}style.css">
</head>
<body>
<div class="wrap">
  <header class="top">
    <a class="mark" href="${home}">UX-OS</a>
    <nav aria-label="Main">
      <a href="${hash('sets')}">Sets</a>
      <a class="optional" href="${hash('why')}">Why it matters</a>
      <a href="${up}method/">Method</a>
      <a href="${REPO}">GitHub</a>
    </nav>
  </header>
${body}
  <footer>
    Made by <a href="https://workshopr.io">Workshopr.io</a>. Every pack keeps its author's licence. <a href="${REPO}">Source on GitHub</a>.
  </footer>
</div>
</body>
</html>
`;
}

let dotIndex = 0;
function dots(entries) {
  const sorted = [...entries].sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status));
  const parts = ORDER.map((s) => [by(entries, 'status', s), STATES[s].label.toLowerCase()]).filter(([n]) => n);
  const label = `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}: ${parts.map(([n, l]) => `${n} ${l}`).join(', ')}`;
  const marks = sorted.map((e) => `<i class="dot ${STATES[e.status].cls}" style="--i:${dotIndex++}"></i>`).join('');
  return `<span class="row-dots dots" role="img" aria-label="${esc(label)}">${marks}</span>`;
}

const row = (s) => `      <li><a class="row" href="${s.slug}/">
        <span class="row-name">${esc(s.name)}</span>
        <span class="row-covers">${esc(s.covers)}</span>
        ${dots(s.entries)}
        <span class="row-go" aria-hidden="true">&rarr;</span>
      </a></li>`;

const legend = `<span class="legend">
        <span><i class="dot on"></i>loads on its own</span>
        <span><i class="dot name"></i>run by name</span>
        <span><i class="dot off"></i>off</span>
      </span>`;

const STEPS = [
  ['Check what already exists', 'Search the registry and the installed skills first.', 'Search the registry and the installed skills first. The information-architecture skill started because two public skills with the same name could not be installed together.'],
  ['Decide how to get it', 'Adopt one, combine several, or write it.', 'Adopt a good skill as it is, combine several when each covers part of the job, or write one when nothing fits.'],
  ['Check the licence', 'No open licence means rewrite, never copy.', 'Without an open licence I rewrite and never copy. Every source is credited at the bottom of <code>SKILL.md</code>.'],
  ['Write the skill and its tests together', 'Method, reference material and realistic cases.', '<code>SKILL.md</code> holds the method, <code>references/</code> holds long material such as methodology, templates and a rubric, and <code>evals/</code> holds realistic test cases.'],
  ['Test it against no skill at all', 'Run each case both ways. Record score and cost.', 'Run each case with and without the skill using skill-creator, grade both, fix what failed and run it again. Record the score and the cost.'],
  ['Test the real name', 'Most skills reach Claude by name alone.', 'Ask a fresh session to quote the skill\'s entry in its list. With this many skills installed, most appear by name only, so the name has to say what the skill is for and rewriting the description changes nothing. Test with the real name, because the tuning tool in skill-creator uses a copy with a temporary name, which can lose to a competing skill for that reason alone.'],
  ['Check Claude can reach it', 'Nothing hides it, and nothing shares its name.', 'Confirm no <code>skillOverrides</code> entry hides it and no installed skill with the same name competes with it.'],
  ['Register it', 'One row, with how it was built.', 'Add a row to the registry and write down how it was built.'],
];

const authors = [
  ['MC Dean', 'https://github.com/Owl-Listener/designer-skills', 'Designer Skills'],
  ['Emil Kowalski', 'https://github.com/emilkowalski/skills', 'Motion skills'],
  ['Leonxlnx', 'https://github.com/Leonxlnx/taste-skill', 'Taste skills'],
  ['Matt Pocock', 'https://github.com/mattpocock/skills', 'prototype'],
  ['Paul Bakaus', 'https://impeccable.style', 'impeccable'],
];

const JOBS = [
  ['36 of 505', "Roughly, in one project of mine: skills that get a description in Claude's list", 'Decide what loads.', "With that many installed, the rest show up as a bare name, so a better description changes nothing. So each entry gets a decision, made in Claude Code's own settings: load it, keep it for when I call it by name, or switch it off. The marks above are those decisions. To see yours, ask a fresh session to quote its skill list."],
  ['9 of 10', 'requests chosen under its real name. Under a temporary test name: 0 of 10', 'Settle who wins.', 'Two skills can claim the same job. With a temporary test name, mine won none of ten requests and a rival took nine. Under its real name, Claude chose it nine times out of ten, and on none of ten near-misses. The name is the interface.'],
  ['28 vs 19', 'of 29 checks in the latest round, with the skill and without', 'Make each skill earn its place.', 'After that first round I fixed what failed and sharpened the checks. The gap has held for two rounds since, and every grade is public.'],
  ['+49%', 'longer runs in the latest round, and about 19% more tokens', 'Put the cost beside the score.', "Better answers aren't free. When the number's written down, you get to decide when it's worth paying."],
];

const landing = page({
  title: 'UX-OS: UX skills for Claude, run like an operating system',
  description: `${Word(sets.length)} sets of Claude skills for UX work, from research to prototyping, with a record of what loads, who wrote it and what testing showed.`,
  depth: 0,
  body: `
  <main>
    <div class="hero">
      <h1>UX skills for Claude, run like an operating system.</h1>
      <p class="lede">Free written methods for Claude Code, in ${word(sets.length)} sets. One record of what loads, who wrote it and what testing showed.</p>
      <div class="actions">
        <a class="button" href="#sets">Pick a discipline</a>
        <a href="method/">See how a skill gets tested</a>
      </div>
    </div>

    <div id="sets" class="boot">
      <div class="status">
        <span>ux-os: ${sets.length} sets, ${total} entries, ${loaded} loaded, ${onCall} by name, ${off} off</span>
        ${legend}
      </div>
      <nav aria-label="Skill sets">
      <ol class="monitor">
${named.map(row).join('\n')}
      </ol>
      <p class="group">Proposed: still to be kept, renamed or dropped</p>
      <ol class="monitor">
${proposed.map(row).join('\n')}
      </ol>
      </nav>
      <p class="caption">The states are from my setup on ${asOfLabel}. Yours start from whatever you install.</p>
    </div>

    <section id="why" aria-labelledby="why-h">
      <h2 id="why-h">A pile of skills is not a system.</h2>
      <p class="intro">On 24 October I built an information-architecture skill, because two public ones shared a name and couldn't be installed together. Then I tested it against no skill at all. With the skill: 24 out of 25. Without it: 23.</p>
      <p class="intro">One point. Installing a skill told me nothing about whether it helped, or whether Claude would ever open it. An operating system answers those questions for programs: what's loaded, who gets priority, what each one costs. UX-OS answers them for skills. There's no package to install. It's four jobs you do on whatever you've got, and the record of how they came out.</p>
      <ol class="jobs">
${JOBS.map(([stat, label, title, text]) => `        <li class="job">
          <div><p class="stat">${esc(stat)}</p><p class="stat-label">${esc(label)}</p></div>
          <div><h3>${esc(title)}</h3><p class="body">${esc(text)}</p></div>
        </li>`).join('\n')}
      </ol>
      <div class="proof">
        <p>One skill, three test cases, and I wrote both the skill and the checks. That's a field note, not a study.</p>
        <p>The case against all this: skills are cheap, so install everything and let Claude sort it out. Fair. That's how I got to 505. Then I asked Claude to show me what it could actually see.</p>
      </div>
    </section>

    <section aria-labelledby="credit">
      <h2 id="credit">Most of this is other people's work.</h2>
      <p class="intro">${Word(third)} of the ${total} entries are third-party, and MC Dean wrote ${dean} of them. I built ${word(built)} and rewrote ${word(combined)} from public sources. What I'm adding is the filing, the testing and the decisions about what stays on.</p>
      <ul class="people">
${authors.map(([name, url, what]) => { const n = by(all, 'author', name); return `        <li><a href="${url}">${esc(name)}</a><span>${esc(what)}, ${n} ${n === 1 ? 'entry' : 'entries'}</span></li>`; }).join('\n')}
      </ul>
      <p class="start">One command adds the marketplace behind ${dean} of the ${total}.</p>
      <pre><code>${esc(MARKETPLACE)}</code></pre>
      <p class="caption">That makes the packs installable. Deciding which ones stay on is the system. Each set page has the install commands.</p>
    </section>

    <section aria-labelledby="method-h">
      <h2 id="method-h">Eight steps. So far, one skill has had the full test.</h2>
      <p class="intro">${Word(nothingBuilt)} sets have nothing I built. ${Word(proposed.length)} are still proposals. Most of the registry has never been tested against anything. This is the method for anything new.</p>
      <ol class="steps">
${STEPS.map(([t, short]) => `        <li><h3>${esc(t)}</h3><p>${esc(short)}</p></li>`).join('\n')}
      </ol>
      <a href="method/">Read the whole method</a>
    </section>

    <section class="close" aria-labelledby="close-h">
      <h2 id="close-h">Pick one discipline. Test it against nothing.</h2>
      <p class="intro">Install one set. Run your next real task with it and without it. If you get 24 to 23, you'll want to know.</p>
      <a class="button" href="#sets">Pick a discipline</a>
    </section>
  </main>
`,
});

function entry(e) {
  const state = STATES[e.status];
  const title = e.source ? `<a href="${esc(e.source)}">${esc(e.name)}</a>` : esc(e.name);
  const notes = [];
  if (e.scope === 'workshopr') notes.push('Runs only on Workshopr, so there is nothing to install.');
  else if (!e.source) notes.push('Not published yet.');
  if (e.installNote) notes.push(e.installNote);
  return `      <article class="entry">
        <div>
          <h2>${title}</h2>
          <p class="byline">${esc(e.type)} by ${esc(e.author)}</p>
          <p class="summary">${esc(e.summary)}</p>
${e.proof ? `          <p class="tested"><b>Testing:</b> ${esc(e.proof)}</p>\n` : ''}${notes.length ? `          <p class="note">${esc(notes.join(' '))}</p>\n` : ''}${e.install ? `          <pre><code>${esc(e.install.join('\n'))}</code></pre>\n` : ''}        </div>
        <span class="state"><i class="dot ${state.cls}"></i>${state.label}</span>
      </article>`;
}

function setPage(s, i) {
  const next = sets[(i + 1) % sets.length];
  const prev = sets[(i - 1 + sets.length) % sets.length];
  const needsMarket = s.entries.some((e) => e.marketplace);
  return page({
    title: `${s.name}: UX-OS`,
    description: `${s.covers} The Claude skills UX-OS uses for ${s.name.toLowerCase()}, with authors and install commands.`,
    depth: 1,
    body: `
  <main>
    <p class="crumb"><a href="../">UX-OS</a> / ${esc(s.name)}</p>
    <div class="page-head">
      <h1>${esc(s.name)}</h1>
      ${s.proposed ? '<p class="tag">Proposed set: may be kept, renamed or dropped</p>' : ''}
      <p class="lede">${esc(s.covers)}</p>
      <p class="why">${esc(s.why)}</p>
      <p class="gap"><b>What's missing:</b> ${esc(s.missing)}</p>
    </div>
    <div class="entries">
${needsMarket ? `      <div class="first-step">
        <p>The <code>@designer-skills</code> commands below need this once.</p>
        <pre><code>${esc(MARKETPLACE)}</code></pre>
      </div>\n` : ''}${s.entries.map(entry).join('\n')}
    </div>
    <p class="caption">The states are from my setup on ${asOfLabel}. Yours start from whatever you install.</p>
    <div class="turn">
      <a class="prev" href="../${prev.slug}/">Previous: ${esc(prev.name)}</a>
      <a class="next" href="../${next.slug}/"><small>Next set</small>${esc(next.name)}&nbsp;&rarr;</a>
    </div>
  </main>
`,
  });
}

const method = page({
  title: 'How a skill gets built: UX-OS',
  description: 'The eight-step method for bringing a skill into UX-OS, and what testing showed on the first one.',
  depth: 1,
  body: `
  <main>
    <p class="crumb"><a href="../">UX-OS</a> / Method</p>
    <div class="page-head">
      <h1>How a skill gets built.</h1>
      <p class="lede">This is the method so far. It comes from building the information-architecture skill, the first one to go through full testing. Steps 1 to 5 are what I did on that skill. Steps 6 to 8 are what it showed I should add.</p>
    </div>
    <ol class="method">
${STEPS.map(([t, , long]) => `      <li><div><h2>${esc(t)}</h2><p>${long}</p></div></li>`).join('\n')}
    </ol>
    <div class="prose">
      <h2>What testing showed on the first skill.</h2>
      <p>The first round scored 24 of 25 with the skill and 23 of 25 without, which is almost no benefit. After fixes and sharper checks, the second round scored 29 of 29 with the skill and 22 of 29 without. The third round, on the published version, scored 28 of 29 against 19 of 29. In those last two rounds the skill made runs 49% to 73% longer and used 19% to 26% more tokens, so the cost belongs in the record beside the score.</p>
      <p><a href="https://github.com/bbulman/information-architecture-skill">The skill, its test cases and every grade are on GitHub.</a></p>
      <p>Trigger testing then showed how much the name matters. The tuning tool in skill-creator scored 0 of 10, with a rival skill winning 9, but its test copy carries a temporary name. With the real name, Claude chose the skill on 9 of 10 requests and on none of 10 near-misses.</p>
      <h2>When a skill changes.</h2>
      <p>Rerun its evals after any edit instead of changing it ad hoc.</p>
      <p><a href="../#sets">Back to the sets</a></p>
    </div>
  </main>
`,
});

const readme = `# UX-OS

UX skills for Claude, run like an operating system.

${Word(sets.length)} sets, from research to prototyping, and one record of what loads, who wrote it and what testing showed.

**[Open the site](${SITE})**

## The sets

| Set | What it covers | Entries |
| --- | --- | --- |
${named.map((s) => `| [${s.name}](${SITE}${s.slug}/) | ${s.covers} | ${s.entries.length} |`).join('\n')}
${proposed.map((s) => `| [${s.name}](${SITE}${s.slug}/) (proposed) | ${s.covers} | ${s.entries.length} |`).join('\n')}

## Why it matters

A pile of skills is not a system. On 24 October I built an information-architecture skill and tested it against no skill at all. It scored 24 of 25. Claude with no skill scored 23.

An operating system decides what's loaded, who gets priority and what each program costs. UX-OS does that for skills. There's no package to install. It's four jobs you do on whatever you've got, and the record of how they came out:

- **Decide what loads.** In one project of mine, about 36 of roughly 505 skills get a description in Claude's list. The rest show up as a bare name.
- **Settle who wins.** Under a temporary test name, my skill won 0 of 10 requests. Under its real name, 9 of 10.
- **Make each skill earn its place.** After fixes and sharper checks, the latest round scored 28 of 29 with the skill and 19 of 29 without.
- **Put the cost beside the score.** In that round the skill made runs about 49% longer and used about 19% more tokens.

One skill, three test cases, and I wrote both the skill and the checks. That's a field note, not a study. [Read the method](${SITE}method/).

## Credit

${Word(third)} of the ${total} entries are third-party, and MC Dean wrote ${dean} of them. Every pack keeps its author's licence, and each set page links to its source.

The site is generated from \`data/registry.json\`. To change it, edit that file and run \`node build.mjs\`.
`;

const out = (rel, text) => {
  const file = join(root, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, text);
};

out('docs/index.html', landing);
sets.forEach((s, i) => out(`docs/${s.slug}/index.html`, setPage(s, i)));
out('docs/method/index.html', method);
out('README.md', readme);

console.log(`Built ${sets.length} set pages. ${total} entries: ${loaded} loaded, ${onCall} by name, ${off} off. Built ${built}, combined ${combined}, third-party ${third}, MC Dean ${dean}.`);
