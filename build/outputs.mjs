// The two files the build writes outside docs/: README.md and data/notion-manifest.json.
import { SITE, REPO, UXOS_INSTALL, date, fmt, plural, Word } from './shell.mjs';

const NOTION = {
  Type: { pack: 'Skill pack', skill: 'Skill', agent: 'Agent', command: 'Command', mcp: 'MCP server' },
  Origin: { built: 'Built by us', combined: 'Combined and rewritten', third: 'Third-party' },
  Status: { available: 'Available', name: 'Slash only', off: 'Off' },
  Scope: { any: 'Any project', workshopr: 'Workshopr only' },
  Stage: { trial: 'Trial', adopted: 'Adopted', retired: 'Retired' },
};

// One record per entry, with values ready for the Notion database's properties.
export function notionManifest(ctx) {
  return ctx.entries.map((e) => ({
    Name: e.name,
    Type: NOTION.Type[e.type],
    Set: ctx.setName[e.set],
    Origin: NOTION.Origin[e.origin],
    Status: NOTION.Status[e.status],
    Scope: NOTION.Scope[e.scope],
    Author: e.author,
    Summary: e.summary,
    Testing: e.proof || '',
    Source: e.source || '',
    Usage: e.usage.band,
    Reads: e.reads.map((id) => ctx.pfById.get(id)?.file).filter(Boolean),
    Stage: NOTION.Stage[e.stage],
    Invoke: e.invoke || '',
    Site: `${SITE}registry/${e.id}/`,
  }));
}

export function readme(ctx) {
  const t = ctx.totals;
  const NOUN = { skill: ['skill', 'skills'], pack: ['skill pack', 'skill packs'], agent: ['agent', 'agents'], command: ['command', 'commands'], mcp: ['MCP server', 'MCP servers'] };
  const typeCounts = Object.keys(NOUN).map((k) => [k, ctx.count((e) => e.type === k)]).filter(([, n]) => n);
  const typeList = typeCounts.map(([k, n]) => `${n} ${NOUN[k][n === 1 ? 0 : 1]}`);
  const typePhrase = typeList.length > 1 ? `${typeList.slice(0, -1).join(', ')} and ${typeList.at(-1)}` : typeList[0];
  const named = ctx.sets.filter((s) => !s.proposed);
  const proposed = ctx.sets.filter((s) => s.proposed);
  const row = (s, tag = '') => `| [${s.name}](${SITE}${s.slug}/)${tag} | ${s.covers} | ${ctx.count((e) => e.set === s.slug)} | ${ctx.jobsBySet.get(s.slug).length} |`;
  const dean = ctx.thirdAuthors[0];

  return `# UX-OS

Every UX skill I run with Claude Code, and which one wins each job.

${fmt(t.entries)} entries in ${t.sets} sets: ${typePhrase}. ${fmt(t.mine)} are mine and ${fmt(t.third)} are third-party. ${fmt(t.on)} load on their own, ${fmt(t.byName)} run by name and ${fmt(t.off)} are off. ${fmt(t.jobs)} jobs name the skill I hand each need to, ${fmt(t.rivals)} of them with the rival that lost. ${fmt(t.unused)} entries have never been used since ${date(ctx.usage.since)}.

**[Open the site](${SITE})**

## What's on the site

- [Jobs](${SITE}jobs/): say what you need, get the skill I hand it to, its rival and why.
- [Registry](${SITE}registry/): all ${fmt(t.entries)} entries, filterable, each with its own page: how to run it, how to install it, how often I use it and what testing showed.
- [Workflows](${SITE}workflows/): ${plural(t.workflows, 'chain')} of skills that run in order.
- [Project files](${SITE}project-files/): ${t.projectFiles} files a project keeps, which skills read each one, a template and Workshopr's own copy as an example.
- [Method](${SITE}method/): how a skill gets built and tested, and how this registry stays true.

## The sets

| Set | What it covers | Entries | Jobs |
| --- | --- | --- | --- |
${named.map((s) => row(s)).join('\n')}
${proposed.map((s) => row(s, ' (proposed)')).join('\n')}

## The ux-os plugin

The research skills and \`/ux-os:create-project-files\` install from this repo:

\`\`\`
${UXOS_INSTALL.join('\n')}
\`\`\`

Then, in a project, \`/ux-os:create-project-files\` writes whichever of the ${t.projectFiles} project files it is missing.

## How the site is built

The site is static HTML in \`docs/\`, which GitHub Pages serves from \`main\`. Everything on it comes from \`data/\`:

- \`data/registry.json\`: the sets and every entry.
- \`data/jobs.json\`, \`data/workflows.json\`, \`data/project-files.json\`, \`data/changes.json\`: jobs, workflows, project files and the changelog.
- \`data/usage.json\`: how often each entry has run, written by \`scripts/usage.mjs\`.
- \`data/plugins.json\`: which plugin each entry runs through, and where each plugin is installed from. The [loadout](${SITE}loadout/) is built from it.
- \`data/stories/\`: how each skill was built, in markdown.

\`node build.mjs\` (Node 22, no dependencies) checks the data with \`build/load.mjs\` and stops on any problem, including a local path, a private address or an email address in anything it would publish. Then it writes every page in place, removes whatever in \`docs/\` it did not write, checks every link between pages, and rewrites this README and \`data/notion-manifest.json\`. A broken link fails the build. The page code lives in \`build/\`, with its CSS and JavaScript in \`build/assets/\`.

## Publish

1. \`node scripts/scan.mjs --write\` sets each entry's status from this machine's settings.
2. \`node scripts/usage.mjs\` recounts usage from Claude Code transcripts.
3. \`node build.mjs\` rebuilds the site and checks every link.
4. Commit and push. The site updates when \`main\` does.

Once a quarter, after step 2, run \`node scripts/prune.mjs\`. It lists the third-party entries that are switched on, have never run and that no job depends on, with the setting that would switch each one off. It only reports; deciding, and editing settings, is mine.

## Credit

${Word(t.third)} of the ${fmt(t.entries)} entries are third-party${dean ? `, and ${dean.name} wrote ${dean.n} of them` : ''}. Every pack keeps its author's licence, and each entry's page links to its source. [The credits](${SITE}method/#credit-h) list every author.

Made by [Workshopr.io](https://workshopr.io). Source: ${REPO}.
`;
}
