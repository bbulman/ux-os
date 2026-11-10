---
name: create-usability-plan
description: Plan a usability test with realistic tasks and pass lines set before anyone is tested.
disable-model-invocation: true
argument-hint: "<idea or thing to test>"
---

Plans a test that can actually fail. What success looks like is written down before the first session, so the result cannot be argued into a pass.

Read `${CLAUDE_PLUGIN_ROOT}/shared/contract.md` and keep to it throughout. `$SHARED` means that folder. Your output is `usability-plan.md` in the idea folder.

## Steps

1. **Start.** Follow "Start a run" in the contract.
   Done when the brief names a decision and the intake has reported.

2. **Say what this has to settle.** Name what will be tested, how finished it is, and the 2 to 4 things this test must answer. Draw on the moments that matter in `journeys.md`, the riskiest lines of a future journey, or `cardsort.md`. If the real question is whether anyone wants this, say so and point to `/ux-os:create-interview-script`.
   Done when each question would change what gets built.

3. **Choose the format and the people.** Say whether it is moderated or unmoderated, remote or in person, and why. Recruit by what people recently did, at least 5 per segment. Include at least one person who uses assistive technology, or write down why not and what that leaves untested.
   Done when the recruit list has a screener and the access decision is written down.

4. **Write the tasks.** 3 to 7 tasks, each a realistic situation with a reason to act, in words that do not appear on the screen. Say where it starts. Order them as they would happen, with the riskiest early, when people are fresh.
   Done when no task names a button, a menu or the answer.

5. **Set the pass lines first.** For each task, define success, partial success and failure in terms an observer could mark without judgement, and when to stop and move on. Set overall pass lines for completion and ease, and say what happens if the test misses them.
   Done when two observers would mark the same session the same way.

6. **Plan the session.** Minute by minute: the welcome and consent, how to ask people to think aloud, the tasks, and the closing questions. Add what the moderator says when someone asks for help, which is mostly another question.
   Done when the session fits its time with 5 minutes spare.

7. **Plan what happens after.** A severity scale tied to how many people it stopped and how badly, and how findings get turned into decisions. Results go in `inbox/` so they join the rest of the research.
   Done when there is an owner for acting on the findings, or a line saying one must be named.

8. **Pilot on paper.** Start a fresh agent, give it the tasks and what is being tested, and ask where the wording gives away the answer or could be misread. Change what it finds. If you cannot start an agent, do this yourself and say so.
   Done when the changes are made and listed in the run notes.

9. **Write.** Fill `$SHARED/templates/usability-plan.md`.
   Done when every section is filled.

10. **Finish.** Follow "Finish a run" in the contract. Afterwards, session notes go in `inbox/` and the next skill is `/ux-os:summarize-research`.
