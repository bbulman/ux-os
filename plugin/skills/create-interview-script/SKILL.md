---
name: create-interview-script
description: Draft a short interview guide that gets real stories and tests what you actually need to know.
disable-model-invocation: true
argument-hint: "<idea or question>"
---

Produces a guide someone can run tomorrow. It gets people telling true stories about what they did, and every question earns its place by testing something.

Read `${CLAUDE_PLUGIN_ROOT}/shared/contract.md` and keep to it throughout. `$SHARED` means that folder. Your output is `interview-script.md` in the idea folder.

## Steps

1. **Start.** Follow "Start a run" in the contract.
   Done when the brief names a decision and the intake has reported.

2. **Name what this has to settle.** Take the beliefs in `beliefs.md` with no evidence or that came back contradicted, or the question the person brought. Keep the 3 to 6 that would change the decision. Anything that needs a count goes to `/ux-os:create-survey` instead, and say so.
   Done when each item would change the decision if the answer came back differently.

3. **Decide who to talk to.** Describe people by what they recently did, not who they are. Include likely disprovers: people who tried and quit, people who never started. Write a screener whose answers cannot be guessed from the question. Aim for at least 5 people from different organisations in each segment, the number the validation bar needs.
   Done when every screener question has a keep rule and a screen-out rule.

4. **Build around one story.** Open with something easy that is true. Then ask for the last specific time this happened, and let the person tell it from the start. Prompts go in order, and each says what to listen for. Keep it to what fits in 45 minutes, and mark what to cut if time runs out.
   Done when the main section is built from prompts about real past events.

5. **Write the probes.** Short follow-ups that keep the story moving: "What happened next?", "What did you do then?", "Who else was involved?", "How did you decide?". Add a line on what to do when someone generalises: bring them back to that one time.
   Done when there are at least 6 probes, and none suggests an answer.

6. **Test every question.** Rewrite any that is hypothetical, leading, a double question, answerable with yes or no, or that asks people to predict themselves. Then check coverage: each item from step 2 is reached by at least one prompt.
   Done when the Coverage table has no empty row.

7. **Read it cold.** Start a fresh agent, give it the guide, and have it play a participant in the screened group, answering each prompt. Have it name anything confusing, jargon, or any point where it could only guess. Change the guide accordingly. If you cannot start an agent, do this pass yourself and say so.
   Done when the changes are made and listed in the run notes.

8. **Write.** Fill `$SHARED/templates/interview-script.md`, including the consent line and a note sheet using the intake's codes, so results drop straight into `inbox/`.
   Done when every section is filled.

9. **Finish.** Follow "Finish a run" in the contract. Afterwards, the transcripts go in `inbox/` and the next skill is `/ux-os:affinity-diagram`. To turn proto models into researched ones, run them again in real mode.
