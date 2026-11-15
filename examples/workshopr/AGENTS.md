# AGENTS.md (Workshopr example)

An excerpt from Workshopr's own AGENTS.md, trimmed to show the shape. Sections left out are marked.

---

**The guide for any AI coding agent in this repo is `CLAUDE.md`. Read it. This file is a pointer plus the few things that must not be missed if you do not.**

*[Section left out: why this file is a pointer and no longer a full copy of the main guide.]*

---

## Read these

| File | When |
| --- | --- |
| `CLAUDE.md` | **First, and before touching anything.** Architecture, conventions, tests, the changelog rule. |
| `PRODUCT.md` | Before any product decision: what exists, who it is for, what is gated. |
| `DESIGN.md` | Before any UI, copy or visual work. |
| `motion.md` | Before any animation or transition work. |
| The design system's machine-readable definition | Before any UI change: tokens, components, rules. |
| The native design guide | Before changing a native app (Back Pocket, Field Guide, Workshopr Planner for Mac): the token contract, the check, and how to build and run each one. |
| `Conventions.md` | Naming and code conventions. |
| The writing style guide | Before writing any content or copy. |

---

## The guardrails

*[Section left out: operational guardrails specific to the codebase.]*

**Never introduce a frontend framework.** Vanilla JS and CSS only, no React, no Vue, no bundler, unless a human explicitly asks.

**Every UI change uses the design system.** Reach for an existing component before writing HTML. Colours, spacing, type, radii and shadows come from the tokens, never a hex or pixel value where a token exists, and the fonts are Fraunces for headlines and Inter for body. Before calling UI work done, run the design-system check and load the page.

---

## Definition of done

Exercise the change; do not just make it compile. Load the affected page or hit the endpoint, run the relevant test, and for a bug fix add or update one. For any UI change the design-system check must pass **and** the page must render correctly.

*[Section left out: the block of shell commands for the dev server, tests, lint and design-system checks.]*

Every code change gets a changelog entry.
