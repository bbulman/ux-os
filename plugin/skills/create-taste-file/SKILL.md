---
name: create-taste-file
description: Write or revise a project's taste.md by interview, in the owner's own words, settling the judgment no check can enforce.
disable-model-invocation: true
argument-hint: "[project path]"
---

Answers: what does good mean here, beyond anything a rule can catch? `DESIGN.md` says what is allowed; `taste.md` says what is good. A screen can pass every rule and still fail here.

Read `${CLAUDE_PLUGIN_ROOT}/shared/project-file-interview.md` and follow its steps, with `<NAME>` as `taste.md`. Its "Belief and taste files" section applies throughout: ask open first, and offer a draft only after the owner answers. What follows is particular to this file.

## Sources

`DESIGN.md`, to know what is already a rule; any critiques, review notes or design-loop learnings the project keeps; and the current file's history or dated notes.

## Topics

Before the first round, ask whose taste this file records. If it is not the person you are talking to, ask whether to go on.

1. **The root.** What good means here in two to five words, and what that means for a screen.
2. **Reference anchors.** Real products, people or works to reason toward and away from. Each needs its specific quality: when a name comes without one, ask what about it.
3. **The cut test.** How a feature, section or element earns its place.
4. **Soul.** The kind of delight allowed, and how much of it a screen can carry.
5. **What reads as machine-made.** The visual and writing tells that make work look generated.
6. **The kill list.** Things that are never good here, whatever the rules allow.
7. **Open questions.** Taste that is not settled yet.

In revise mode, put every topic to the owner, even where the current file already answers it: ask whether its lines still hold, have changed or have gone, and what has changed since the last dated note. This replaces the shared rule that carries settled content over without a question, because taste drifts without anything in the code showing it.

## Checks

- Every line in quotation marks is the owner's own words.
- Each reference anchor names its specific quality.
