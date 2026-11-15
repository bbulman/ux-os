---
name: create-jtbd-file
description: Write or revise a project's JTBD.md by interview, as labelled beliefs about the progress people are trying to make and what they hire for it today.
disable-model-invocation: true
argument-hint: "[project path]"
---

Answers: what are people trying to get done, apart from any product, what do they hire for it today, and why would they switch? `/ux-os:create-jtbd` builds a jobs model inside an idea folder, and in real mode from what people did. This skill writes the project-level file.

Read `${CLAUDE_PLUGIN_ROOT}/shared/project-file-interview.md` and follow its steps, with `<NAME>` as `JTBD.md`. Its "Belief and taste files" section applies throughout. What follows is particular to this file.

## Sources

`PRODUCT.md`, `PERSONAS.md`, `JOURNEYS.md`, `.research-profile.md` and the research folder, and any `jobs.md` a research run wrote. If there is no `PERSONAS.md`, the job statements by segment wait, and the report recommends `/ux-os:create-personas-file`.

## Topics

1. **The core job.** "When I..., I want to..., so I can...", as a customer would say it, naming no product, then the trigger that sets it off.
2. **The three dimensions.** What has to get done, how customers want to feel, and how they want to be seen.
3. **The job map.** Four to eight stages named for this job, from the moment it begins to the moment the customer knows it is done, with where each one hurts.
4. **What gets hired today.** Always doing nothing, doing it by hand and hiring someone, then the named products. For each, what it is hired for, why it gets fired, and why people stay anyway.
5. **Underserved outcomes.** Each written as a direction, a measure and an object, naming no solution, such as "Minimise the time it takes to...", with importance and satisfaction from 1 to 5. A score is a guess unless customers were asked, and stays labelled `belief`.
6. **Job statements by segment.** One per persona in `PERSONAS.md`.
7. **Design implications.** One line per underserved outcome, saying what it asks of the product.

## Checks

- The core job and every outcome name no product or solution.
- "What gets hired today" includes doing nothing, doing it by hand and hiring someone.
- The outcomes are sorted by the gap between importance and satisfaction.
- Each underserved outcome has a design implication.
- The Evidence cells and the banner follow the shared rules.
