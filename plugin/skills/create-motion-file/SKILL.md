---
name: create-motion-file
description: Write or revise a project's motion.md by interview, settling how motion feels, its values as tokens, the patterns allowed and what reduced motion does.
disable-model-invocation: true
argument-hint: "[project path]"
---

Answers: how should things move here, with what values, and what happens when someone asks for less motion? Describe the feel and the numbers, and let the code do the rest.

Read `${CLAUDE_PLUGIN_ROOT}/shared/project-file-interview.md` and follow its steps, with `<NAME>` as `motion.md`. What follows is particular to this file.

## Sources

The motion tokens in the code (easing and duration custom properties or theme constants), the animation code itself, any motion docs in the design system, and every place the code handles reduced motion, found by searching for `prefers-reduced-motion` or the platform's equivalent.

## Topics

1. **Motion language.** Three words for how motion should feel, each with what it rules out.
2. **Standard values.** These come from the tokens in the code. Ask only where the code and the current file disagree, or where a use has no token.
3. **Patterns.** Five or fewer, each with when to use it and its values. In revise mode, put the current file's patterns to the person to cut down to five. The rest are cut, or listed in the report for the design system's motion docs if it has them.
4. **Never.** What motion must not do here.
5. **Reduced motion.** What changes when someone asks the system for less motion.
6. **Stack.** What implements motion here, and what is ruled out.

## Checks

- Every value that has a token in the code names that token, and the two agree. A value with no token says so.
- There are five patterns or fewer.
- The reduced-motion rule matches what the code does, checked by the search in Sources.
