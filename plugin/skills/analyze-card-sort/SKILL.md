---
name: analyze-card-sort
description: Work out how people group things from real card sort results. Needs the results to work from.
disable-model-invocation: true
argument-hint: "<idea> --evidence <results file>"
---

Reads how real people grouped a set of cards and says what structure that points to. There is no proto mode, and the numbers come from a script, never from an estimate.

Read `${CLAUDE_PLUGIN_ROOT}/shared/contract.md` and keep to it throughout. `$SHARED` means that folder. Your output is `cardsort.md` in the idea folder, with `cardsort.json` beside it.

## Steps

1. **Start.** Before anything else, look for data in `inbox/`, `--evidence` and `primary.md`. With none, say what this skill needs and stop, creating nothing. Then follow "Start a run" in the contract. The intake anonymises the results.
   Done when the brief names a decision and the intake has reported.

2. **Normalise the results.** Whatever the export looks like, write a CSV with exactly three columns, `participant,card,category`, one row per card placed, to `evidence/<S-id>-cardsort.csv`. Note whether the sort was open (people named their own groups), closed (they used yours) or hybrid.
   Done when every card placement is a row. With fewer than 5 participants, stop and say how many more are needed. Under 15, carry on and say the groups are tentative.

3. **Run the numbers.** Run `node $SHARED/card-sort.mjs evidence/<file>.csv --out cardsort.json` from the idea folder. It gives the share of people who put each pair together, the groups those shares form, the cards with no clear home, and the labels used.
   Done when `cardsort.json` exists.

4. **Reconcile the labels.** In an open sort, merge labels that mean the same thing, list what you merged in the run notes, and run the script again if the merging changed any category. In a closed sort, compare where people put each card with where you intended it to go.
   Done when every label has been read, and every merge is listed.

5. **Read the shape.** Three things matter most. Groups that hold together strongly can be trusted. Cards with no clear home need renaming, splitting or a second route to them. Cards pulled strongly towards two groups are telling you those groups overlap for people, so they are often the most useful finding.
   Done when every floating or torn card has a suggestion beside it.

6. **Say what it means.** Propose a structure and labels using the words participants chose. Say which parts you are confident in and which need testing.
   Done when every suggestion cites its group or card.

7. **Write.** Fill `$SHARED/templates/cardsort.md`, using figures from `cardsort.json` as they stand.
   Done when every section has its claims or a `[gap]`.

8. **Finish.** Follow "Finish a run" in the contract. The next skill is `/ux-os:create-usability-plan`, to test whether people can find things in the new structure.
