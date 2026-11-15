---
name: create-journeys-file
description: Write or revise a project's JOURNEYS.md by interview, as labelled beliefs about how each primary persona gets the job done today.
disable-model-invocation: true
argument-hint: "[project path]"
---

Answers: how does each primary persona get the job done today, where does it hurt, and which moments decide whether it works? `/ux-os:create-journey-map` builds a journey inside an idea folder, and in real mode from what people did. This skill writes the project-level file.

Read `${CLAUDE_PLUGIN_ROOT}/shared/project-file-interview.md` and follow its steps, with `<NAME>` as `JOURNEYS.md`. Its "Belief and taste files" section applies throughout. What follows is particular to this file.

## Sources

`PERSONAS.md`, `PRODUCT.md`, `.research-profile.md` and the research folder, and any `journeys.md` a research run wrote. If there is no `PERSONAS.md`, say so and recommend `/ux-os:create-personas-file` first. Go on only if the person says to, and then ask who each journey is for.

## Topics

1. **Which journeys.** One per primary persona. Paths that never meet get separate journeys, never one averaged row. In revise mode, ask which current maps stay.
2. **Each journey.** Ask for the scenario, where it starts, and where it ends, which is when the user learns whether it worked. Then ask for the stages, five to seven, with a painful wait or handoff as its own row. Ask for the emotion at each stage, from 1 at the worst to 5 at the best, or unknown. Draft the other cells from the sources and the current file, marked as drafts in the summary.
3. **Moments that matter.** Two or three per journey: what happens if it goes well, if it goes badly, and what users do if they quit.
4. **A future journey.** Whether to include one. If so, the stages and what has to be true, with the riskiest line first.

## Checks

- Each journey has five to seven stages.
- Every emotion score is 1 to 5 or unknown. A score carried over from another scale is converted, and the report states the conversion.
- Each moment that matters starts with its phase in bold.
- The Evidence cells and the banner follow the shared rules.
