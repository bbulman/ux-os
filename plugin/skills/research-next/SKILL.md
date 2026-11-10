---
name: research-next
description: See where a research idea stands and the one thing to run next.
disable-model-invocation: true
argument-hint: "[idea]"
---

Says where an idea stands and names one thing to do now. It changes nothing: no brief, no intake, no book.

In `${CLAUDE_PLUGIN_ROOT}/shared/contract.md`, read steps 1 and 2 of "Start a run", which say how to find the project root and the idea folder, and "Choosing a study". Do not follow the rest of "Start a run". `$SHARED` means that folder.

## Steps

1. **Find the folder.** A named idea with no folder yet is fine, because the script reports that. With no idea named and no folder holding a `brief.md`, say nothing is on file yet, point to `/ux-os:research-discover <idea>` and stop. Create nothing.
   Done when you have a folder path, and have said which idea if you chose it yourself.

2. **Read the state.** Run `node $SHARED/status.mjs <folder>`.
   Done when it exits 0.

3. **Settle the study.** If `Now:` says to choose a study, read the belief under `Test first:` and pick from "Choosing a study". If `Now:` says to run a study on file or carry on with one, check that study can test that belief, and if it cannot, name the study that can. If `Now:` is already a command, keep it.
   Done when Now is one command or one action.

4. **Say what can be skipped.** Read `brief.md` and name the skills or studies its decision does not need, and why. With no `brief.md`, say nothing can be ruled out until there is a decision.
   Done when you have one line.

5. **Report.** Give exactly this, and nothing else:
   - **Where it stands:** the stage and the decision, in one line.
   - **Now:** the command, ready to type, and why.
   - **Then:** the commands from `Then:`, if it lists any.
   - **Skip:** your one line.
   - **Waiting:** what the script lists under `Waiting in inbox:`, `Needs a transcript:` and `Out of date:`, only if it lists any.
   - **Note:** the script's `Note:` line, only if it prints one.
   - **Beliefs:** the `Beliefs:` lines as a table, with the one to test first at the top, only if there are any.

Credit: the one-command-now shape comes from MC Dean's `start-here` command in the Designer Skills Pack (MIT).
