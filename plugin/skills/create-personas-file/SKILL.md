---
name: create-personas-file
description: Write or revise a project's PERSONAS.md by interview, as labelled beliefs about who the product is for.
disable-model-invocation: true
argument-hint: "[project path]"
---

Answers: who do we believe the product is for, how do they differ in what they do, and how would we know we are wrong? `/ux-os:create-personas` builds personas inside an idea folder, and in real mode from what people did. This skill writes the project-level file the other files and agents read.

Read `${CLAUDE_PLUGIN_ROOT}/shared/project-file-interview.md` and follow its steps, with `<NAME>` as `PERSONAS.md`. Its "Belief and taste files" section applies throughout. What follows is particular to this file.

## Sources

`PRODUCT.md`, `.research-profile.md` and the research folder, any `personas.md` a research run wrote, and any analytics tool the profile names, read only.

## Topics

1. **The variable.** The one behaviour that most changes what someone needs, with its low and high ends. Never an age or a job title.
2. **Who sits where.** At most four personas, each placed from 0 to 100 on the variable, and whether they use it, buy it, or both. In revise mode, place the current personas on the variable and ask whether to keep, merge or drop each.
3. **The primary persona.** Whose needs win when they conflict, and why.
4. **Each persona.** Ask what would make them refuse the product and what would overcome it, the least evidenced claim, and what would show the persona is wrong. Draft the other subsections from the sources and the current file, marked as drafts in the summary. The opening quote stays out unless a real person said it in the project's research.

## Checks

- At most four personas, separated by a behaviour.
- Any opening quote is a real person's words from the research folder, under 15 words, and the notes say where it is.
- Each "How we would know this is wrong" names something a study could test.
- The Evidence cells and the banner follow the shared rules.
