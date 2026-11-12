---
name: run
description: Run someone else's design skill on an idea, filed with its claims tagged so a belief and a finding never look the same.
disable-model-invocation: true
argument-hint: "<job in plain words> [idea] [--skill pack:skill]"
---

Runs a third-party skill, such as MC Dean's form design, as if it kept the UX-OS contract. It says which skill it picked and which it passed over, gives the skill the idea's brief, models, evidence and house rules, files the output untouched, lists every claim the output rests on with one tag each, and has an independent auditor check that list.

Read `${CLAUDE_PLUGIN_ROOT}/shared/contract.md`: steps 1 to 4 of "Start a run", "Tags", "Evidence links" and "Running a third-party skill", including how it reads the arguments. Each step below carries the same number as the step it follows in that section, and its rules hold throughout. `$SHARED` means that folder.

## Steps

1. **Start.** Follow step 1.
   Done when you have said which idea folder this run files into, it holds a `brief.md` and a `.gitignore` with `inbox/` and `evidence/`, and you know what is being designed.

2. **Pick.** Follow step 2.
   Done when you have one job id, or a `--skill` the person named.

3. **Brief.** Follow step 3. The pick line is the first thing you say about the skill, before you read any of its files.
   Done when `brief.mjs` has exited 0 and you have read every file it lists. If it exits 1, say what it printed and stop.

4. **Run the skill.** Follow step 4.
   Done when the skill's own steps are finished and you hold its output.

5. **File it.** Follow step 5.
   Done when the work file holds the title and header as the briefing printed them, no template comments, and the output word for word.

6. **Claims.** Follow step 6.
   Done when the table holds a row for each claim you drafted, each with one Basis that keeps those rules.

7. **Second pass.** Follow step 7.
   Done when every decision in the output has been asked what would have to be true, each answer has a row, and so the table holds a row for every claim the output rests on.

8. **Gate.** Follow step 8.
   Done when the check exits 0.

9. **Audit.** Follow step 9. Start `ux-os:claims-auditor` with the Agent tool, passing only three absolute paths: the work file, the idea folder, and `$SHARED` written out in full. On an open audit, revise the Claims table only, run the gate again, and start a fresh audit, two audits at most.
   Done when the audit is closed and the check exits 0, or two audits have run and the rows still open are listed, or the Agent tool or agent type was not available and the run is `not audited`.

10. **Report.** Follow step 10. The first line says how the audit ended. The run ends here, with no render.
