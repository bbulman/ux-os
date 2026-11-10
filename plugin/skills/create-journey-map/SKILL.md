---
name: create-journey-map
description: Map what happens today, or what should happen in future, step by step, from your beliefs or from real research.
disable-model-invocation: true
argument-hint: "<idea> [proto|real] [current|future] [--evidence <path>]"
---

Answers: what happens step by step, and where does it hurt? A current journey records what happens today. A future journey is a proposal for what should happen instead, and it is labelled that way.

Read `${CLAUDE_PLUGIN_ROOT}/shared/contract.md` and keep to it throughout. `$SHARED` means that folder. Your output is `journeys.md` in the idea folder. With neither `current` nor `future` named, make the current journey.

## Steps

1. **Start.** Follow "Start a run" in the contract.
   Done when the brief names a decision and the intake has reported.

2. **Choose the mode.** Follow "Proto or real" in the contract.
   Done when you have said which mode this run uses and why.

3. **Pick persona and scenario.** Take the primary persona from `personas.md`, and any other the decision depends on. For each, name one specific scenario and its boundaries: where it starts, and where it ends, which is when the person learns whether it worked or, for something recurring, the start of the next cycle. If `personas.md` is absent, use the segments in `jobs.md` and say so in the run notes.
   Done when each journey has one scenario, with a stated start and end.

Then follow the branch for the state you are mapping.

## Current

4. **Proto only: interview.** Follow the Ask, Record and Check parts of `$SHARED/belief-interview.md`, before reading any research. Topics: the situation that starts this, the steps people go through today, the worst moment, who else gets involved, and how it ends.
   Done when every belief this skill uses has a verdict.

5. **Walk the stages.** Write 5 to 7 stages of what happens today, for each journey: phase, goal, what they are doing, the touchpoints, what they are thinking, emotion from 1 to 5, pain points and opportunities. Real mode uses only `primary.md`. An emotion score is an inference unless a participant's words back it. Paths that never converge become separate journeys. Touchpoints names who else is involved, and a wait or handoff that hurts gets its own row. Then invert the walk's assumptions: what if it is not done in one sitting, or not alone, or the person has an access need? Each answer becomes a pain point or a `[gap]`.
   Done when every row is filled, with `unknown` where nothing is known, every Emotion is a whole number from 1 to 5 or `unknown`, and the inversion has been done.

6. **Mark the moments that matter.** Name 2 or 3, each starting with its Phase in bold. These are where a product could change the outcome.
   Done when each moment names a phase in the table and says what happens if it goes well, if it goes badly, and what people do if they quit.

7. **Write.** Fill the `## Journey:` part of `$SHARED/templates/journeys.md`, with the banner the mode calls for.
   Done when every section has its claims or a `[gap]`.

8. **Finish.** Follow "Finish a run" in the contract. In proto mode, also follow the "Tell the person" part of `$SHARED/belief-interview.md`, and the next skill is `/ux-os:create-interview-script`, to test the riskiest beliefs. In real mode, the next step is this skill again with `future`.

## Future

4. **Start from today.** A future journey answers a current one. If `journeys.md` has no current journey for this persona and scenario, make that first.
   Done when the current journey it answers exists.

5. **Redesign the stages.** Go through the current journey's pain points and moments that matter. For each stage say what changes and what the person would now do. Cut stages that should stop existing. Keep what already works. Every line is tagged `[proposed]` with the evidence that motivates it, because this is a design and not a finding. Predicted emotion uses the same 1 to 5.
   Done when every painful stage of the current journey has been changed or marked as left alone, with a reason.

6. **Say what has to be true.** List what this future depends on: what people would have to do, what the business would have to build, what could go wrong. Name the riskiest of those.
   Done when What has to be true has at least 3 lines and marks the riskiest.

7. **Write.** Add the `## Future journey:` part of `$SHARED/templates/journeys.md`. Then follow "Component lines" in the contract.
   Done when every section has its lines or a `[gap]`.

8. **Finish.** Follow "Finish a run" in the contract. The next skill is `/ux-os:create-usability-plan`, to test the future journey with people.
