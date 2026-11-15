---
name: create-design-file
description: Write or revise a project's DESIGN.md by interview, settling the rules a check could enforce for how the product looks, reads and behaves.
disable-model-invocation: true
argument-hint: "[project path]"
---

Answers: what are the rules for how this product looks and behaves, and where does each live in the code? A rule here is one a check could enforce. Judgment goes to `taste.md`.

Read `${CLAUDE_PLUGIN_ROOT}/shared/project-file-interview.md` and follow its steps, with `<NAME>` as `DESIGN.md`. What follows is particular to this file.

## Sources

The token files (CSS custom properties, a tokens JSON or a theme file), the component catalogue and its demos, the design-system docs, any design linter or enforcer and its configuration, the shared form components, accessibility tests, and `.research-profile.md` if it names the design system.

## Topics

1. **The brand in one line.** What someone should feel in the first five seconds, and what they must never feel.
2. **Colour.** Map each role in the template's table to the token the code uses, from the token files. Ask only where two tokens claim one role, or a role has no token.
3. **Type.** The fonts and the scale come from the code. Ask only about a rule the code cannot show, such as where the display font may appear.
4. **Spacing, layout, radii, elevation and icons.** The scales come from the code. Ask about the rules: the widest a line of text may run, which radius goes on what, whether depth comes from shadows or borders, and the smallest icon allowed.
5. **UX principles.** Five to ten, written for this product, each with what it rules out. Draft them from the current file and from findings that recur in the project's reviews or critiques, and ask the person to keep, rewrite or cut each.
6. **Components.** The catalogue and token paths come from the code. Ask how a new component gets added, if the project's process does not say.
7. **Forms.** Label position, required and optional fields, when validation runs, where errors appear, and button order. Look at the shared form components first and ask only what they leave open.
8. **Accessibility.** The floor: the contrast ratio, the smallest touch target, focus visibility, reduced motion, and what a screen reader must hear.
9. **Words on screen.** One line pointing at `VOICE.md`, which owns button labels, message shapes and case. Any wording rule in the current file is listed in the report for `VOICE.md`.

## Checks

- Every rule about colour, type, spacing, radii, elevation, icons or components names its token or component.
- Each value in the colour table matches its token's value in the token files.
- If the current file carries machine-readable frontmatter, such as tokens in YAML, the copy keeps it and its values match the token files.
