---
name: research-debrief
description: Take in a new interview or study and see which beliefs it bears on, without rewriting anything you built.
disable-model-invocation: true
argument-hint: "<idea> [--evidence <path>]"
---

For straight after a session. It turns new material into evidence and shows what that evidence bears on. Models keep their verdicts until their own skill runs again, so this writes no model, no run notes and no book.

Read `${CLAUDE_PLUGIN_ROOT}/shared/contract.md` and keep to it throughout. `$SHARED` means that folder. Your output is the new rows in `primary.md` and `sources.md`.

## Steps

1. **Start.** Before anything else, look for new material in `inbox/`, `--evidence` and any connected source the project profile names, and for excerpts in `primary.md` whose Beliefs column says `none`. With none of these, say what this needs and stop, creating nothing. Then follow "Start a run" in the contract.
   Done when the brief names a decision and the intake has reported.

2. **Mark what each excerpt bears on.** Take every excerpt whose Beliefs column says `none`, whichever run took it in. Compare it with every belief in `beliefs.md`, leaving out any written `No view:`. In its Beliefs column write the numbers of the beliefs it bears on, whether for or against. Leave Grade and Prompted as the intake set them, because they decide what counts. With no `beliefs.md`, skip this step and step 3, and say so.
   Done when each of those excerpts has been compared with every belief, and its Beliefs column holds numbers or `none`.

3. **Have the marks read cold.** Start a fresh agent that did not mark them, with this brief: "Read `<folder>/beliefs.md` and the Excerpts table of `<folder>/primary.md`. For each of these excerpts, <the excerpts you compared>, say whether it bears on each belief its Beliefs column names, and on any belief it does not name. Say for each belief whether these excerpts lean for it or against it. Change nothing. Return only the marks you would change, and the lean per belief." Resolve each disagreement yourself. If you cannot start an agent, say so in the report and treat the marks as unverified.
   Done when every disagreement is resolved or listed in the report.

4. **Check.** Run `node $SHARED/check.mjs <folder>`.
   Done when it exits 0.

5. **Report.** Run `node $SHARED/status.mjs <folder>`. In your final message:
   - Lead with any belief the person was `sure` of that this evidence goes against.
   - For each belief this evidence touched, say which way it leans and the count against the bar, such as "3 of 5 organisations". For a belief with a threshold in `survey.md`, report against that threshold instead.
   - List the files under `Out of date:`, because their verdicts were written before this evidence.
   - Close with the next step from `Now:`, ready to type. If it says to choose a study, pick one from "Choosing a study" in the contract.
