---
name: create-diary-study
description: Plan a diary study people will actually finish, for behaviour that plays out across days or weeks.
disable-model-invocation: true
argument-hint: "<idea or question>"
---

Plans a study of what happens over time, in the moment, before memory tidies it up. The hard part is keeping people going, so the plan is built around that.

Read `${CLAUDE_PLUGIN_ROOT}/shared/contract.md` and keep to it throughout. `$SHARED` means that folder. Your output is `diary-study.md` in the idea folder.

## Steps

1. **Start.** Follow "Start a run" in the contract.
   Done when the brief names a decision and the intake has reported.

2. **Check a diary is the right tool.** It suits behaviour that recurs, varies, or changes over time, and that people would misremember. If a single interview or analytics query would answer this, say so and stop.
   Done when Why a diary says what only a diary can show.

3. **Decide the shape.** How long, based on how often the behaviour really happens, so each person logs enough. Whether an entry is triggered by the event itself, or by a set time for things that may not announce themselves. Where it happens, using a tool people already have open.
   Done when the length gives each person at least 5 expected entries.

4. **Write the prompts.** Each entry takes under 2 minutes on a phone. Ask for what just happened, with a photo or a voice note wherever typing would be a burden. Keep the core prompts the same throughout so entries can be compared. Add a small number that appear once, at a chosen point.
   Done when every prompt says why it is asked, and none asks people to analyse themselves.

5. **Plan to keep people in.** Recruit a third more than you need, since people drop out. Run a short welcome call. Pay in stages, so finishing is worth more than starting. Reply to early entries so people know someone is reading. Set a rule for when to nudge someone and when to let them go, and record who left and when, because leavers skew the results.
   Done when every day of the Schedule says what the researcher does.

6. **Write what participants receive.** The welcome note, a one-paragraph explanation of what a good entry looks like, the reminder, the nudge, and the thank-you.
   Done when someone could run the study by sending these.

7. **Handle consent and privacy.** Diaries catch other people and private moments. Say what is collected, who sees it, how long it is kept, how to delete an entry, and what to do about third parties in photos.
   Done when the consent wording covers those points.

8. **Plan the analysis.** A closing interview per person that walks through their own entries. Name how entries will be coded, using the intake's codes, and what result would change the decision.
   Done when each research question has a planned way of being answered.

9. **Write.** Fill `$SHARED/templates/diary-study.md`.
   Done when every section is filled.

10. **Finish.** Follow "Finish a run" in the contract. Afterwards, entries go in `inbox/` and the next skill is `/ux-os:affinity-diagram`.
