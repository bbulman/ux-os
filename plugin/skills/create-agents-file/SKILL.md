---
name: create-agents-file
description: Write or revise a project's AGENTS.md by interview, settling the pointer to the guide, the guardrails an agent must not miss and what "done" means.
disable-model-invocation: true
argument-hint: "[project path]"
---

Answers: if an AI agent reads only one file here, what must it not get wrong? `AGENTS.md` is a pointer and a handful of guardrails, never a second copy of the guide, because two copies drift and the stale one answers confidently and wrongly.

Read `${CLAUDE_PLUGIN_ROOT}/shared/project-file-interview.md` and follow its steps, with `<NAME>` as `AGENTS.md`. What follows is particular to this file. Do it after the other project files, because it points at them.

## Sources

The agent guide (`CLAUDE.md` or its equivalent), other agent instruction files (`GEMINI.md`, `.cursorrules`, `.github/copilot-instructions.md`), the CI configuration, the deploy scripts, the environment example file, any agent hooks, and the test commands in the package manifest.

## Topics

1. **The guide.** Which file is the guide, looked up. If `CLAUDE.md` exists it is the guide. If there is no guide, the template's first line becomes: `**This file is the guide for any AI agent working here.** It points at the files that hold the detail, and states the rules that must not be missed.`
2. **Read these.** The table lists only the project files that exist, looked up. Ask whether any other file is one an agent must read, and when.
3. **Guardrails.** Draft candidates from the guide, the hooks and the deploy setup: data that is live, anything that deploys on a push, frameworks ruled out, secrets. Put each to the person to keep or cut. The bar is a mistake that is expensive or hard to undo. Aim for a handful, one line each and then why.
4. **Definition of done.** The commands that prove a change works here come from the code. Ask what "finished" means beyond them.

## Checks

- No paragraph repeats the guide beyond one line per guardrail. Everything else is a link.
- The report names any other agent instruction file that copies the guide instead of pointing at it.
