---
name: create-empathy-map
description: Map what one person says, does, thinks and feels in one moment, from your beliefs or from real research.
disable-model-invocation: true
argument-hint: "<idea> [proto|real] [--evidence <path>]"
---

Shows one person in one specific moment, and where what they say and what they do come apart.

Read `${CLAUDE_PLUGIN_ROOT}/shared/contract.md` and keep to it throughout. `$SHARED` means that folder. Your output is `empathy.md` in the idea folder.

## Steps

1. **Start.** Follow "Start a run" in the contract.
   Done when the brief names a decision and the intake has reported.

2. **Choose the mode.** Follow "Proto or real" in the contract.
   Done when you have said which mode this run uses and why.

3. **Proto only: interview.** Follow the Ask, Record and Check parts of `$SHARED/belief-interview.md`. Topics: who this person is, the last time you saw them in this situation, what they said out loud, what they did about it, and what you think they were worried about.
   Done when every belief this skill uses has a verdict.

4. **Pick the person and the moment.** A map of someone's whole life says nothing. Choose one kind of person in one specific situation: the minute a patient cancels, the evening before a launch. Make one map for each moment the decision depends on, and no more than 3.
   Done when each map names a person and a moment.

5. **Fill it, with the right kind of evidence in each box.** **Says** and **Does** hold only what was said or done: in real mode, reported or observed excerpts; in proto mode, beliefs with their verdicts. **Thinks** and **Feels** are read between the lines, so they are tagged as inferences unless the person stated them outright.
   Done when every box has at least 2 lines, or a `[gap]`.

6. **Find the say-do gaps.** This is what the map is for. Name each place where what people say and what they do come apart, and what that might mean. If you find none, say so, and treat that as a sign the data is thin.
   Done when Say-do gaps has at least one line, or a `[gap]` explaining why none could be seen.

7. **Write.** Fill `$SHARED/templates/empathy.md`, with the banner the mode calls for.
   Done when every section has its claims or a `[gap]`.

8. **Finish.** Follow "Finish a run" in the contract. In proto mode, also follow the "Tell the person" part of `$SHARED/belief-interview.md`. The next skill is `/ux-os:create-personas`.
