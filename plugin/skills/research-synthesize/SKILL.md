---
name: research-synthesize
description: Once enough evidence is in, sort it, summarise it and rebuild your proto models on what people did.
disable-model-invocation: true
argument-hint: "<idea> [--evidence <path>]"
---

Turns gathered evidence into something the team can rely on. Models are rebuilt on what people did, and each belief gets a recorded outcome.

Read `${CLAUDE_PLUGIN_ROOT}/shared/contract.md` and keep to it throughout, including "Chains". `$SHARED` means that folder. Your outputs are `affinity.md`, `summary.md`, an `Outcome` column in `beliefs.md` and a real-mode rewrite of the models that need one, in the idea folder, and `repository.md` in the research root.

## Steps

1. **Start.** Before anything else, look for data in `inbox/`, `--evidence` and `primary.md`. With none, say what this needs and stop, creating nothing. Then follow "Start a run" in the contract.
   Done when the brief names a decision and the intake has reported.

2. **Sort and summarise.** Read each `SKILL.md` below and follow it, skipping its Start and Finish steps:
   1. `${CLAUDE_PLUGIN_ROOT}/skills/affinity-diagram/SKILL.md`. If it stops for too few notes, carry on without it and say so in the report.
   2. `${CLAUDE_PLUGIN_ROOT}/skills/summarize-research/SKILL.md`, scoped to everything in the folder

   Done when `summary.md` exists with its run notes, and `affinity.md` exists or the report will say why not.

3. **Settle the beliefs.** With no `beliefs.md`, skip this step. Otherwise read it now, after the sorting, so it cannot steer the themes. For any excerpt whose Beliefs column says `none`, do step 2 of `${CLAUDE_PLUGIN_ROOT}/skills/research-debrief/SKILL.md`. Then read the excerpts naming each belief and write its outcome, as the "Validation bar" section of the contract sets out.
   Done when every belief except a `No view:` has an outcome.

4. **Rebuild the models.** Run `node $SHARED/status.mjs <folder>`. If `Real mode:` says more organisations are needed, skip to step 5. Otherwise take every model that `Models:` marks as proto or `Out of date:` lists, in the order `jobs.md`, `personas.md`, `journeys.md`, `empathy.md`. For each, read its skill's `SKILL.md` (`create-jtbd`, `create-personas`, `create-journey-map`, `create-empathy-map`) and follow it in real mode, skipping its Start, Choose the mode and Finish steps. For `journeys.md`, make the current journey. A future journey already in that file was written before this evidence, so it stays only in the superseded copy.
   Done when no model is left proto or out of date.

5. **Finish.** Follow "Finish once" and "Verify every time" under "Chains" in the contract, giving the verifying agent `beliefs.md` as well.
   Done when the check exits 0 and the book is rendered.

6. **Keep it.** If step 4 rebuilt the models, read `${CLAUDE_PLUGIN_ROOT}/skills/create-research-repository/SKILL.md` and follow its Build section through its own Finish step, because the repository has its own page. Use the `Outcome` column in `beliefs.md` wherever it asks for belief verdicts. Otherwise skip this.
   Done when the repository is written, or the report says why it was skipped.

7. **Report.** Run `node $SHARED/status.mjs <folder>`. Follow step 5 of "Finish a run". Then:
   - Lead with what the evidence overturned: name any belief the person was `sure` of whose outcome is `refuted` or `mixed`.
   - If step 4 was skipped, say how many more organisations real mode needs.
   - Name the superseded copies, and say if a future journey is now only in one of them.
   - Close with the next step from `Now:`, ready to type.

Credit: chaining synthesis steps into one command comes from MC Dean's `synthesize` command in the Designer Skills Pack (MIT).
