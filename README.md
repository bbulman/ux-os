# UX-OS

Every UX skill I run with Claude Code, and which one wins each job.

135 entries in 12 sets: 90 skills, 26 skill packs, 10 agents, 8 commands and 1 MCP server. 94 are mine and 41 are third-party. 67 load on their own, 59 run by name and 9 are off. 48 jobs name the skill I hand each need to, 13 of them with the rival that lost. 91 entries have never been used since 22 July 2026.

**[Open the site](https://bbulman.github.io/ux-os/)**

## What's on the site

- [Jobs](https://bbulman.github.io/ux-os/jobs/): say what you need, get the skill I hand it to, its rival and why.
- [Registry](https://bbulman.github.io/ux-os/registry/): all 135 entries, filterable, each with its own page: how to run it, how to install it, how often I use it and what testing showed.
- [Workflows](https://bbulman.github.io/ux-os/workflows/): 7 chains of skills that run in order.
- [Project files](https://bbulman.github.io/ux-os/project-files/): 9 files a project keeps, which skills read each one, a template and Workshopr's own copy as an example.
- [Method](https://bbulman.github.io/ux-os/method/): how a skill gets built and tested, and how this registry stays true.

## The sets

| Set | What it covers | Entries | Jobs |
| --- | --- | --- | --- |
| [Research](https://bbulman.github.io/ux-os/research/) | Interviews, surveys, usability tests, diary studies, card sorts, affinity diagrams, empathy maps, personas, journey maps, jobs to be done and research repositories. | 24 | 8 |
| [Design systems](https://bbulman.github.io/ux-os/design-systems/) | Tokens, components, naming, governance and documentation. | 23 | 6 |
| [Information architecture](https://bbulman.github.io/ux-os/information-architecture/) | Content inventories, card sorts, taxonomies, labels, sitemaps, navigation, URL rules, content models, redirects, tree tests and findability. | 15 | 6 |
| [Interaction design](https://bbulman.github.io/ux-os/interaction-design/) | States, forms, feedback, errors, navigation patterns, UX laws and motion. | 20 | 7 |
| [Visual design](https://bbulman.github.io/ux-os/visual-design/) | Hierarchy, colour, type, layout, visual critique and page craft. | 6 | 3 |
| [Content](https://bbulman.github.io/ux-os/content/) | UX writing, voice and tone, microcopy, editing and content strategy. | 5 | 4 |
| [Prototyping](https://bbulman.github.io/ux-os/prototyping/) | Wireframes, user flows, concept selection, prototype strategy, test plans and heuristic evaluation. | 9 | 5 |
| [UX strategy](https://bbulman.github.io/ux-os/ux-strategy/) | Problem framing, briefs, vision, opportunities and metrics. | 11 | 3 |
| [AI-XD](https://bbulman.github.io/ux-os/ai-xd/) | AI experience design: conversation, trust, guardrails and agent handoffs. | 6 | 0 |
| [Accessibility and inclusion](https://bbulman.github.io/ux-os/accessibility-and-inclusion/) (proposed) | Inclusive personas, cognitive access, accessible content and adaptive interfaces. | 6 | 1 |
| [Design ops and communication](https://bbulman.github.io/ux-os/design-ops-and-communication/) (proposed) | Handoff, critique process, sprints, rationale and case studies. | 3 | 0 |
| [Orchestration](https://bbulman.github.io/ux-os/orchestration/) (proposed) | Running the other sets against a real target until it meets a bar. | 7 | 5 |

## The ux-os plugin

The research skills and `/ux-os:create-project-files` install from this repo:

```
/plugin marketplace add bbulman/ux-os
/plugin install ux-os@ux-os
```

Then, in a project, `/ux-os:create-project-files` writes whichever of the 9 project files it is missing.

## How the site is built

The site is static HTML in `docs/`, which GitHub Pages serves from `main`. Everything on it comes from `data/`:

- `data/registry.json`: the sets and every entry.
- `data/jobs.json`, `data/workflows.json`, `data/project-files.json`, `data/changes.json`: jobs, workflows, project files and the changelog.
- `data/usage.json`: how often each entry has run, written by `scripts/usage.mjs`.
- `data/stories/`: how each skill was built, in markdown.

`node build.mjs` (Node 22, no dependencies) checks the data with `build/load.mjs` and stops on any problem, including a local path, a private address or an email address in anything it would publish. Then it writes every page in place, removes whatever in `docs/` it did not write, checks every link between pages, and rewrites this README and `data/notion-manifest.json`. A broken link fails the build. The page code lives in `build/`, with its CSS and JavaScript in `build/assets/`.

## Publish

1. `node scripts/scan.mjs --write` sets each entry's status from this machine's settings.
2. `node scripts/usage.mjs` recounts usage from Claude Code transcripts.
3. `node build.mjs` rebuilds the site and checks every link.
4. Commit and push. The site updates when `main` does.

## Credit

41 of the 135 entries are third-party, and MC Dean wrote 33 of them. Every pack keeps its author's licence, and each entry's page links to its source. [The credits](https://bbulman.github.io/ux-os/method/#credit-h) list every author.

Made by [Workshopr.io](https://workshopr.io). Source: https://github.com/bbulman/ux-os.
