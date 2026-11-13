---
name: create-service-blueprint
description: Lay out how a service delivers one scenario, step by step, with what the person sees above the line and what makes it work below.
disable-model-invocation: true
argument-hint: "<idea> [scenario]"
---

Shows one scenario as steps in time and lanes of who or what does the work, so a failure can be traced from what the person sees to the system behind it. It describes the service as it is, and proposes nothing.

Read `${CLAUDE_PLUGIN_ROOT}/shared/contract.md` and keep to it throughout. `$SHARED` means that folder. Your output is `blueprint.md` in the idea folder.

## Steps

1. **Start.** Follow "Start a run" in the contract.
   Done when the brief names a decision and the intake has reported.

2. **Choose one scenario.** Ask which scenario, if the person has not said: one person, one goal, from where they start to where they learn whether it worked. A blueprint of everything shows nothing. Use the journey in `journeys.md` when there is one, and say which.
   Done when the scenario, its actors, its start and its end are written down.

3. **List the steps.** Walk the scenario in the order it happens, as the person meets it. Name each step for what the person does, with a number. A wait or a handoff that hurts gets its own step.
   Done when there are at least 3 steps and each is one thing the person does.

4. **Fill the lanes above the line.** For each step: the physical evidence, what the person does, and what anyone else does. Take these from `primary.md` and `journeys.md`, or from the product itself when it exists, opened and used. What the person only believes happens is a belief.
   Done when every step has those three lanes, or a line saying a lane is empty.

5. **Fill the lanes below the line.** For each step: the frontstage the person can see, the backstage they cannot, and the support it leans on. Read the code, the configuration or the process document. Add each file as a row in `sources.md`, Kind `original`, with its path from the project root under Where, and cite it by its id with the file and line written out in the claim, such as `api/plans.php:40`. Never write that path as a link, because a link may only point into `evidence/`. Ask the person only for what no file holds: add that to `beliefs.md` as a belief, and tag the line with it.
   Done when every claim below the line cites the file it was read from, or is a belief or a `[gap]`.

6. **Find the failure points.** For each step, ask what breaks, who is left waiting, and whether anyone is told. A failure nobody is told about is the kind worth a line.
   Done when every step has a failure point or a line saying none was found.

7. **Read across.** Look for what only shows when the lanes are read together: one support system behind several steps, a promise frontstage that nothing backstage keeps, the person moved without being told. Each is an inference from the lines it rests on.
   Done when `What the lanes show together` holds what you found, or is left out.

8. **Write.** Fill `$SHARED/templates/blueprint.md`.
   Done when every step has all seven lanes.

9. **Finish.** Follow "Finish a run" in the contract. The book does not show the blueprint yet, so the render changes nothing for this file, and the report says so. The next skill is `/ux-os:record-decision`, for what the blueprint settles, or `/ux-os:create-journey-map <idea> real future` for what should change.
