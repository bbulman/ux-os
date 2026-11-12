---
name: record-decision
description: Record what you decided because of the research, what the decision rests on, and what would reverse it.
disable-model-invocation: true
argument-hint: "<idea> [the decision]"
---

Keeps the decisions an idea's research led to, each beside the evidence or the belief it stands on. A decision made on a belief says so, so nobody later reads it as something the research proved.

Read `${CLAUDE_PLUGIN_ROOT}/shared/contract.md` and keep to it throughout: steps 1 to 4 of "Start a run", "Tags", "Evidence links" and "Running a third-party skill" for what counts as pencil and ink. `$SHARED` means that folder. Your output is `decisions.md` in the idea folder. It is a log: you add rows, and never remove or reword one.

## Steps

1. **Start.** Follow steps 1 to 4 of "Start a run". Skip the intake.
   Done when you have said which idea folder this is and it holds a `brief.md`.

2. **Get the decision.** If the person has not given it, ask for it in one sentence: what will now be done, or not done. Then ask what would have to be seen to reverse it. Ask one question at a time, and never suggest the decision yourself.
   Done when you have the decision and what would reverse it, in the person's words.

3. **Find what it rests on.** Read every file on file: `summary.md`, `affinity.md`, `cardsort.md`, the models, `beliefs.md`, `primary.md` and `sources.md`. Ask the person what the decision rests on, then find it there.
   - Copy each tag from the file that holds it. A belief carries the verdict the folder gives it, and the `Outcome` in `beliefs.md` when there is one. A first-party citation is copied with its link from `primary.md`, one link per person.
   - Use a citation only where what the source or the person said supports this decision.
   - What the person reasoned from several sources is `[inference ...]`.
   - What rests on nothing on file is `[gap]`. Never supply a basis the files do not hold.
   - A decision is never `[proposed]` or `[practice]`.

   Done when every basis the person named has a tag from the files, or a `[gap]`.

4. **Say how firm it is, before writing.** Tell the person which parts of the basis are in ink and which in pencil. If any of it is pencil, name the study from "Choosing a study" that would settle it. The person may still decide: a decision on a belief is allowed, and is recorded as one.
   Done when the person has heard it and confirmed the row.

5. **Write.** Use `$SHARED/templates/decisions.md` the first time. Add one row at the bottom of `Decisions`, numbered one more than the last, dated today. If this decision reverses an earlier one, its Decision cell says so: `Replaces 2: ...`. The earlier row stays as it was. Under `Still open`, list what the brief's decision still needs and nobody has settled, each tagged `[gap]` or with the belief it waits on, and leave the section out when nothing is open.
   Done when the row is on file.

6. **Check.** Run `node $SHARED/check.mjs <folder>`, then `node $SHARED/map.mjs <folder>`. There is no verifying agent and no render: the file adds no sources, and the book does not show it.
   Done when the check exits 0.

7. **Report.** Give the decision, what it rests on, and how many of the decisions on file rest on pencil, which `node $SHARED/status.mjs <folder>` prints on its `Decisions:` line. Close with the study that would settle the weakest basis, if there is one.
