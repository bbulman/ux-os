---
name: research-discover
description: Turn what you believe about a new idea into first models and the one belief to test first.
disable-model-invocation: true
argument-hint: "<idea>"
---

Takes a new idea from nothing to a labelled set of assumptions and a clear first test, in one sitting. Everything it writes is proto, in pencil, until people have been asked.

Read `${CLAUDE_PLUGIN_ROOT}/shared/contract.md` and keep to it throughout, including "Chains". `$SHARED` means that folder. Your outputs are `jobs.md`, `personas.md` and `journeys.md` in the idea folder.

## Steps

1. **Start.** Follow "Start a run" in the contract. Then run `node $SHARED/status.mjs <folder>`. If it says `Real mode: ready`, say this idea already has enough evidence, point to `/ux-os:research-synthesize` and stop.
   Done when the brief names a decision and the intake has reported.

2. **Interview once.** Follow the Ask and Record parts of `$SHARED/belief-interview.md`, before reading any research. Topics:
   - who you picture using this, how those people differ in what they do, and the last real one you met
   - what they are trying to get done, and what a good result looks like to them
   - what sets it off
   - the steps people go through today, and who else gets involved
   - the worst moment, and how it ends
   - what they use or have tried, and why they would stop
   - the habits and worries that keep them where they are, and what would stop them
   - why nobody has solved this already

   Done when every topic has a belief or a recorded "no view".

3. **Check once.** Follow the Check part of `$SHARED/belief-interview.md`. The verdict a belief gets here is the one it carries in every file.
   Done when every belief except a "no view" has a verdict.

4. **Build the models.** Read each `SKILL.md` below and follow it in proto mode, skipping its Start, Choose the mode, interview and Finish steps. Build them in this order, because each reads the one before:
   1. `${CLAUDE_PLUGIN_ROOT}/skills/create-jtbd/SKILL.md`
   2. `${CLAUDE_PLUGIN_ROOT}/skills/create-personas/SKILL.md`
   3. `${CLAUDE_PLUGIN_ROOT}/skills/create-journey-map/SKILL.md`, for the current journey

   Done when all three files exist, each with its banner and its run notes.

5. **Finish.** Follow "Finish once" under "Chains" in the contract.
   Done when the check exits 0 and the book is rendered.

6. **Name the first test.** Run `node $SHARED/status.mjs <folder>`. Take the belief under `Test first:` and pick its study from "Choosing a study" in the contract.
   Done when you have one belief and one study.

7. **Report.** Follow step 5 of "Finish a run", then the "Tell the person" part of `$SHARED/belief-interview.md`. Close with the belief to test first and the command to type for its study.

Credit: chaining models into one discovery command comes from MC Dean's `discover` command in the Designer Skills Pack (MIT).
