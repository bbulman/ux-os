import { page, linker, note, esc, fmt, date, plural, Word, word, REPO } from '../shell.mjs';

// The method, as the first skill taught it. Ported from the first version of this site.
const STEPS = [
  ['Check what already exists', 'Search the registry and the installed skills first. The information-architecture skill started because two public skills with the same name could not be installed together.'],
  ['Decide how to get it', 'Adopt a good skill as it is, combine several when each covers part of the job, or write one when nothing fits.'],
  ['Check the licence', 'Without an open licence I rewrite and never copy.'],
  ['Write the skill and its tests together', '<code>SKILL.md</code> holds the method, <code>references/</code> holds long material such as methodology, templates and a rubric, and <code>evals/</code> holds realistic test cases.'],
  ['Test it against no skill at all', 'Run each case with and without the skill using skill-creator, grade both, fix what failed and run it again. Record the score and the cost.'],
  ['Test the real name', 'Ask a fresh session to quote the skill\'s entry in its list. With this many skills installed, most appear by name only, so the name has to say what the skill is for and rewriting the description changes nothing. Test with the real name, because the tuning tool in skill-creator uses a copy with a temporary name, which can lose to a competing skill for that reason alone.'],
  ['Check Claude can reach it', 'Confirm no <code>skillOverrides</code> entry hides it and no installed skill with the same name competes with it.'],
  ['Register it', 'Add a row to the registry and write down how it was built.'],
];

// The four jobs of the OS, with the numbers the first version of this site published.
const JOBS = [
  ['36 of 505', "Roughly, in one project of mine: skills that get a description in Claude's list", 'Decide what loads.', "With that many installed, the rest show up as a bare name, so a better description changes nothing. So each entry gets a decision, made in Claude Code's own settings: load it, keep it for when I call it by name, or switch it off. ON, BY NAME and OFF in the registry are those decisions. To see yours, ask a fresh session to quote its skill list."],
  ['9 of 10', 'requests chosen under its real name. Under a temporary test name: 0 of 10', 'Settle who wins.', 'Two skills can claim the same job. With a temporary test name, mine won none of ten requests and a rival took nine. Under its real name, Claude chose it nine times out of ten, and on none of ten near-misses. The name is the interface.'],
  ['28 vs 19', 'of 29 checks in the latest round, with the skill and without', 'Make each skill earn its place.', 'After that first round I fixed what failed and sharpened the checks. The gap has held for two rounds since, and every grade is public.'],
  ['+49%', 'longer runs in the latest round, and about 19% more tokens', 'Put the cost beside the score.', "Better answers aren't free. When the number's written down, you get to decide when it's worth paying."],
];

// Where each third-party author's work lives, and what it is, from the first version of this site.
const KNOWN = {
  'MC Dean': ['https://github.com/Owl-Listener/designer-skills', 'Designer Skills'],
  'Emil Kowalski': ['https://github.com/emilkowalski/skills', 'Motion skills'],
  Leonxlnx: ['https://github.com/Leonxlnx/taste-skill', 'Taste skills'],
  'Matt Pocock': ['https://github.com/mattpocock/skills', 'prototype'],
  'Paul Bakaus': ['https://impeccable.style', 'impeccable'],
};

export function method(ctx) {
  const path = 'method/';
  const L = linker(path);
  const t = ctx.totals;
  const mineAuthor = ctx.entries.find((e) => e.origin !== 'third')?.author;

  const credits = ctx.thirdAuthors.map(({ name, n }) => {
    const theirs = ctx.entries.filter((e) => e.author === name);
    const [url, what] = KNOWN[name] || [theirs.find((e) => e.source)?.source, theirs.map((e) => e.name).join(', ')];
    const nameHtml = url ? `<a href="${esc(url)}">${esc(name)}</a>` : esc(name);
    return `<li><span class="who">${nameHtml}</span><span class="what">${esc(what)}</span><span class="n">${plural(n, 'entry', 'entries')}</span></li>`;
  });
  const dean = ctx.thirdAuthors[0];

  const body = `
<header class="page-head">
  <p class="kicker">Method</p>
  <h1>How a skill gets built</h1>
  <p class="lede">This is the method so far. It comes from building the information-architecture skill, the first one to go through full testing. Steps 1 to 5 are what I did on that skill. Steps 6 to 8 are what it showed I should add.</p>
</header>

<ol class="method">
${STEPS.map(([title, text]) => `  <li><h2>${esc(title)}</h2><p>${text}</p></li>`).join('\n')}
</ol>

<section class="sec prose-wide" aria-labelledby="first-h">
  <h2 class="big" id="first-h">What testing showed on the first skill</h2>
  <div class="prose">
    <p>The first round scored 24 of 25 with the skill and 23 of 25 without, which is almost no benefit. After fixes and sharper checks, the second round scored 29 of 29 with the skill and 22 of 29 without. The third round, on the published version, scored 28 of 29 against 19 of 29. In those last two rounds the skill made runs 49% to 73% longer and used 19% to 26% more tokens, so the cost belongs in the record beside the score.</p>
    <p><a href="https://github.com/bbulman/information-architecture-skill">The skill, its test cases and every grade are on GitHub.</a></p>
    <p>Trigger testing then showed how much the name matters. The tuning tool in skill-creator scored 0 of 10, with a rival skill winning 9, but its test copy carries a temporary name. With the real name, Claude chose the skill on 9 of 10 requests and on none of 10 near-misses.</p>
    <h3>When a skill changes</h3>
    <p>Rerun its evals after any edit instead of changing it ad hoc.</p>
  </div>
</section>

<section class="sec" aria-labelledby="os-h">
  <h2 class="big" id="os-h">A pile of skills is not a system</h2>
  <div class="prose">
    <p>On 24 October I built an information-architecture skill, because two public ones shared a name and couldn't be installed together. Then I tested it against no skill at all. With the skill: 24 out of 25. Without it: 23.</p>
    <p>One point. Installing a skill told me nothing about whether it helped, or whether Claude would ever open it. An operating system answers those questions for programs: what's loaded, who gets priority, what each one costs. UX-OS answers them for skills. It's four jobs you do on whatever you've got, and the record of how they came out.</p>
  </div>
  <ol class="os-jobs">
${JOBS.map(([stat, label, title, text]) => `    <li>
      <div class="os-stat"><p class="stat">${esc(stat)}</p><p class="stat-label">${esc(label)}</p></div>
      <div><h3>${esc(title)}</h3><p>${esc(text)}</p></div>
    </li>`).join('\n')}
  </ol>
  ${note('<p>One skill, three test cases, and I wrote both the skill and the checks. That\'s a field note, not a study.</p><p>The case against all this: skills are cheap, so install everything and let Claude sort it out. Fair. That\'s how I got to 505. Then I asked Claude to show me what it could actually see.</p>', 'note--wide')}
</section>

<section class="sec" aria-labelledby="true-h">
  <h2 class="big" id="true-h">How this registry stays true</h2>
  <div class="prose">
    <p>One registry file holds every entry. The counts the site prints around it, on every page, are worked out from the data each time the site is built.</p>
    <h3>Whether it loads</h3>
    <p>ON, BY NAME and OFF come from <code>scripts/scan.mjs</code>. It reads what is installed on this machine and whether Claude can load it, then checks the registry against that. Run with <code>--write</code>, it sets each entry's status to what the machine says. What it reads stays on the machine.</p>
    <h3>How often I use it</h3>
    <p>Usage comes from <code>scripts/usage.mjs</code>. It counts three things in Claude Code transcripts: skills Claude started itself, commands typed by name, and agents handed work. An MCP server counts its tool calls. Only registry ids and numbers are written down: no paths, prompts or project names. The current count starts on ${date(ctx.usage.since)} and covers one machine.</p>
    <h3>What the build refuses</h3>
    <p><code>build/load.mjs</code> stops the build on an unknown set, type, origin, status, scope or stage, on a job or workflow step that names something not in the registry, on a story or template file that does not exist, and on any published string that holds a local path or an email address. It reports every problem in one run, then refuses to write a page.</p>
    <p>After the build, <code>scripts/check-links.mjs</code> follows every link between pages and fails if one is broken or an entry page is missing from the registry.</p>
  </div>
  ${note(`<p>As of ${date(ctx.asOf)}: ${plural(t.entries, 'entry', 'entries')}, ${fmt(t.on)} ON, ${fmt(t.byName)} BY NAME and ${fmt(t.off)} OFF. ${fmt(t.used)} have been used since ${date(ctx.usage.since)}, and ${fmt(t.withProof)} have a test result written down. <a href="${L('changelog/')}">What changed, and when</a>.</p>`, 'note--wide')}
</section>

<section class="sec" aria-labelledby="credit-h">
  <h2 class="big" id="credit-h">Credits</h2>
  <div class="prose">
    <p>${Word(t.third)} of the ${fmt(t.entries)} entries are third-party${dean ? `, and ${esc(dean.name)} wrote ${word(dean.n)} of them` : ''}. ${mineAuthor ? `With Claude, I built ${word(t.built)} and rewrote ${word(t.combined)} from public sources.` : ''} What I'm adding is the filing, the testing and the decisions about what stays on. Every pack keeps its author's licence.</p>
  </div>
  <ul class="people">
${credits.join('\n')}
  </ul>
  <p class="caption">Source for this site: <a href="${REPO}">${REPO.replace('https://', '')}</a>.</p>
</section>
`;

  return page({
    path,
    current: 'method',
    title: 'Method: how a skill gets built, UX-OS',
    description: 'The eight-step method for bringing a skill into UX-OS, what testing showed on the first one, and how the registry stays true.',
    body,
    ctx,
  });
}
