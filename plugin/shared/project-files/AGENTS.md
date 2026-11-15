# AGENTS.md

<!--
UX-OS project file. Delete this comment once the file is filled in.
For: the first file an AI coding agent reads in this repo. It points at the guides that hold the detail and states the few rules that must not be missed even if nothing else is read.
Read by: most coding agents look for AGENTS.md by convention. Claude Code reads CLAUDE.md, so have one point at the other. /ux-os:init reads what this file points to when it gathers house rules.
Good looks like: short. A pointer and a handful of guardrails, never a second copy of the guide: two copies drift, and the stale one answers confidently and wrongly.
-->

**The guide for any AI agent working here is [`<GUIDE FILE>`](./<GUIDE FILE>). Read it first.** This file is a pointer, plus the rules that must not be missed if you don't.

## Read these

| File | When |
|---|---|
| [`PRODUCT.md`](./PRODUCT.md) | Before any product decision: what exists, who it is for, how success is measured |
| [`DESIGN.md`](./DESIGN.md) | Before any UI, layout or visual work |
| [`taste.md`](./taste.md) | Before designing or judging a screen |
| [`motion.md`](./motion.md) | Before any animation or transition |
| [`VOICE.md`](./VOICE.md) | Before writing words a user will read |
| [`PERSONAS.md`](./PERSONAS.md), [`JOURNEYS.md`](./JOURNEYS.md), [`JTBD.md`](./JTBD.md) | Before deciding who a feature is for. They are beliefs until research backs them, so never cite them as evidence |

## Guardrails
<!-- Only the rules where a mistake is expensive or hard to undo: data that is live, things that deploy, frameworks ruled out, secrets. One line each, then why. -->
- **<rule>.** <why it matters here>
- **Use the design system.** Reach for an existing component before writing markup, and a token before writing a value. DESIGN.md says where both live.

## Definition of done
<!-- What "finished" means here. -->
Run the change, don't just make it compile: load the page or hit the endpoint, run the relevant test, and check any UI change against DESIGN.md.
