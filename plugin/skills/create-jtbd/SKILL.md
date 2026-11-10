---
name: create-jtbd
description: Work out what people are really trying to get done, from your beliefs or from real research.
disable-model-invocation: true
argument-hint: "<idea> [proto|real] [--evidence <path>]"
---

Answers: what are people trying to get done, separate from any product? A proto version is a labelled set of assumptions. A real one comes from what people actually did when they changed how they work.

Read `${CLAUDE_PLUGIN_ROOT}/shared/contract.md` and keep to it throughout. `$SHARED` means that folder. Your output is `jobs.md` in the idea folder.

## Steps

1. **Start.** Follow "Start a run" in the contract.
   Done when the brief names a decision and the intake has reported.

2. **Choose the mode.** Follow "Proto or real" in the contract.
   Done when you have said which mode this run uses and why.

3. **Proto only: interview.** Follow the Ask, Record and Check parts of `$SHARED/belief-interview.md`, before reading any research. Topics: what people are trying to get done, what sets it off, what they use today and why they would stop, the habits and worries that keep them where they are, why nobody has solved this already, and what a good result looks like to them.
   Done when every belief this skill uses has a verdict.

4. **Real only: rebuild the switch stories.** From `primary.md`, reconstruct each time someone changed what they use or how they work: what they were doing before, what finally set them off, what they weighed up, what they chose, and what they still miss. Keep this working in the run notes.
   Done when every participant who changed something has a story, or the run notes say none did.

5. **Find the core job.** State one job in the customer's terms: "When I..., I want to..., so I can...". Then what they want from it practically, the feeling they are after, and the impression they hope to leave.
   Done when the job statement names no solution and would still be true if your product never existed.

6. **Map the job.** Walk through it in 4 to 8 stages, named for what this particular job involves, from the moment it begins to the moment the person knows it is done. For each, say what they do and where it hurts. Where nothing is known, the row is a `[gap]`.
   Done when the stages run in order, and the map contains no product's features.

7. **Score the outcomes.** List what gets hired today, always including doing nothing, doing it by hand and hiring someone, with why it gets fired and why people stay anyway. Write each outcome as direction, measure and object, naming no solution, with at least one about feeling and one about being seen, or a `[gap]`. Rate each for importance and satisfaction, 1 to 5, from evidence. Sort by the gap between them.
   Done when each rating is tagged, the table is sorted, and no outcome names a solution.

8. **Write.** Fill `$SHARED/templates/jobs.md`, with a job statement per segment and the design implications, and the banner the mode calls for. Then follow "Component lines" in the contract.
   Done when every section has its claims or a `[gap]`.

9. **Finish.** Follow "Finish a run" in the contract. In proto mode, also follow the "Tell the person" part of `$SHARED/belief-interview.md`. The next skill is `/ux-os:create-personas`.
