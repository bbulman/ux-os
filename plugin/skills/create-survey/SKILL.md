---
name: create-survey
description: Write a survey whose every question feeds a decision, with the sample size and analysis worked out first.
disable-model-invocation: true
argument-hint: "<idea or question>"
---

Writes a survey that can count something worth counting. The analysis is decided before anything goes out, so no question exists just because it was interesting.

Read `${CLAUDE_PLUGIN_ROOT}/shared/contract.md` and keep to it throughout. `$SHARED` means that folder. Your output is `survey.md` in the idea folder.

## Steps

1. **Start.** Follow "Start a run" in the contract.
   Done when the brief names a decision and the intake has reported.

2. **Check a survey is the right tool.** A survey counts things you already understand. If you do not yet know why something happens or what the answer options even are, say so and point to `/ux-os:create-interview-script`.
   Done when each thing to be settled is a how-many question.

3. **Work out who and how many.** Define the population and how you can reach it, and name who that route misses. Run `node $SHARED/sample-size.mjs --population <N> --margin 0.05 --response <expected rate>` for the sample and the number of invitations. Repeat for any segment you plan to compare, because each needs its own numbers.
   Done when the sample figures come from the script, and the route's blind spots are written down.

4. **Write the analysis first.** For each decision: which number you will look at, cut by what, and the result that would change the decision. When a row tests a belief, name it, such as B3, in the Decision column.
   Done when every row of the Analysis plan has a result that would change the decision.

5. **Write the questions.** Only what the analysis needs. Ask about recent, specific behaviour before attitudes. Screen first, then the main questions, and sensitive items last. Options cover every case once, with an honest way out such as "none of these". Use one scale throughout. Keep it to about 5 minutes, or say what you are trading away.
   Done when every question feeds a row of the Analysis plan.

6. **Hunt the bias.** Go through every question for leading wording, double questions, loaded terms, options that overlap, order effects and anything that invites people to agree. Record each risk and what you changed. Randomise options wherever order is arbitrary.
   Done when the Bias check covers every question.

7. **Pilot it.** Start a fresh agent, have it answer as 3 quite different people in the population, and report anything it could not answer truthfully or any option it wanted that was missing. Change what it finds. If you cannot start an agent, do this yourself and say so. Say that 5 real people should also try it before launch.
   Done when the changes are made and listed in the run notes.

8. **Write.** Fill `$SHARED/templates/survey.md`, ready to paste into any survey tool.
   Done when every section is filled.

9. **Finish.** Follow "Finish a run" in the contract. Afterwards, the export goes in `inbox/`, and the next skill is `/ux-os:summarize-research`.
