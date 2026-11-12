# UX-OS

UX skills for Claude, run like an operating system.

Eleven sets, from research to prototyping, and one record of what loads, who wrote it and what testing showed.

**[Open the site](https://bbulman.github.io/ux-os/)**

## The sets

| Set | What it covers | Entries |
| --- | --- | --- |
| [Research](https://bbulman.github.io/ux-os/research/) | Interviews, surveys, usability tests, diary studies, card sorts, affinity diagrams, empathy maps, personas, journey maps, jobs to be done and research repositories. | 19 |
| [Design systems](https://bbulman.github.io/ux-os/design-systems/) | Tokens, components, naming, governance and documentation. | 3 |
| [Information architecture](https://bbulman.github.io/ux-os/information-architecture/) | Content inventories, card sorts, taxonomies, labels, sitemaps, navigation, URL rules, content models, redirects, tree tests and findability. | 12 |
| [Interaction design](https://bbulman.github.io/ux-os/interaction-design/) | States, forms, feedback, errors, navigation patterns, UX laws and motion. | 2 |
| [Visual design](https://bbulman.github.io/ux-os/visual-design/) | Hierarchy, colour, type, layout, visual critique and page craft. | 5 |
| [Prototyping](https://bbulman.github.io/ux-os/prototyping/) | Wireframes, user flows, concept selection, prototype strategy, test plans and heuristic evaluation. | 2 |
| [UX strategy](https://bbulman.github.io/ux-os/ux-strategy/) | Problem framing, briefs, vision, opportunities and metrics. | 2 |
| [AI-XD](https://bbulman.github.io/ux-os/ai-xd/) | AI experience design: conversation, trust, guardrails and agent handoffs. | 6 |
| [Accessibility and inclusion](https://bbulman.github.io/ux-os/accessibility-and-inclusion/) (proposed) | Inclusive personas, cognitive access, accessible content and adaptive interfaces. | 6 |
| [Design ops and communication](https://bbulman.github.io/ux-os/design-ops-and-communication/) (proposed) | Handoff, critique process, sprints, rationale and case studies. | 3 |
| [Orchestration](https://bbulman.github.io/ux-os/orchestration/) (proposed) | Running the other sets against a real target until it meets a bar. | 4 |

## Why it matters

A pile of skills is not a system. On 24 October I built an information-architecture skill and tested it against no skill at all. It scored 24 of 25. Claude with no skill scored 23.

An operating system decides what's loaded, who gets priority and what each program costs. UX-OS does that for skills. There's no single package to install. It's four jobs you do on whatever you've got, and the record of how they came out:

- **Decide what loads.** In one project of mine, about 36 of roughly 505 skills get a description in Claude's list. The rest show up as a bare name.
- **Settle who wins.** Under a temporary test name, my skill won 0 of 10 requests. Under its real name, 9 of 10.
- **Make each skill earn its place.** After fixes and sharper checks, the latest round scored 28 of 29 with the skill and 19 of 29 without.
- **Put the cost beside the score.** In that round the skill made runs about 49% longer and used about 19% more tokens.

One skill, three test cases, and I wrote both the skill and the checks. That's a field note, not a study. [Read the method](https://bbulman.github.io/ux-os/method/).

## Credit

26 of the 64 entries are third-party, and MC Dean wrote 22 of them. Every pack keeps its author's licence, and each set page links to its source.

The site is generated from `data/registry.json`. To change it, edit that file and run `node build.mjs`.
