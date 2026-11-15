---
name: create-product-file
description: Write or revise a project's PRODUCT.md by interview, settling what the product is, who it is for and how you will know it is working.
disable-model-invocation: true
argument-hint: "[project path]"
---

Answers: what is this product, who is it for, and how will we know it is working? Every other project file defers to `PRODUCT.md` on those three, so it comes first.

Read `${CLAUDE_PLUGIN_ROOT}/shared/project-file-interview.md` and follow its steps, with `<NAME>` as `PRODUCT.md`. What follows is particular to this file.

## Sources

The README, the package manifest, the routes or app entry points, any plan, pricing or feature-flag configuration, the specs or PRD folders, recent commit subjects, and any analytics tool the project or its research profile names, read only.

## Topics

1. **What it is.** Two or three sentences, the first in the template's shape: what it does, for whom, in what situation. Then the products people confuse it with, and how it differs from each.
2. **Who it is for.** The primary user, in a situation, with what they need most; who else uses or buys it; and who it says no to, and why. If `PERSONAS.md` exists, name the primary persona and leave the detail there.
3. **The problem.** What people do today without it, and what that costs them. The detail belongs in `JTBD.md`.
4. **How success is measured.** Three to five measures, behaviour over vanity counts. For each, the decision it informs and where it is measured. Read today's value yourself where a tool can. Ask which cannot be measured yet.
5. **What exists.** Build the list from the code and routes, not from the person. Ask only what the code cannot show: a part flagged off, redirected, behind a waitlist, or being retired.
6. **Product principles.** Four to seven, each written as "When X and Y conflict, X wins, because...". Draft each from a real past decision found in the current file, a spec or the commit history, and ask the person to rule on it.
7. **Not part of the product.** What people ask for that will not be built, and why.
8. **Open questions.** What is undecided. Agents ask about these and never settle them.

## Checks

- The first sentence under "What it is" names a situation, and a competitor could not sign it unchanged.
- Each measure says how it is measured and gives today's value or "not measured yet".
- Each part under "What exists" was checked against the code, and any part flagged off, redirected or waitlisted says so.
- Each principle names the two things it rules between.
