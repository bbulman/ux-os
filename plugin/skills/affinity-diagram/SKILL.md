---
name: affinity-diagram
description: Sort real research notes into the themes people actually share. Needs data to work from.
disable-model-invocation: true
argument-hint: "<idea> [--evidence <path>]"
---

Turns a pile of observations into a structure you can reason about. There is no proto mode: with no data there is nothing to sort.

Read `${CLAUDE_PLUGIN_ROOT}/shared/contract.md` and keep to it throughout. `$SHARED` means that folder. Your output is `affinity.md` in the idea folder.

## Steps

1. **Start.** Before anything else, look for data in `inbox/`, `--evidence` and `primary.md`. With none, say what this skill needs and stop, creating nothing. Then follow "Start a run" in the contract. The intake takes in any new material.
   Done when the brief names a decision and the intake has reported.

2. **Lay out the notes.** Use every excerpt in `primary.md`. Anything else the person points you at, such as exported stickies, a spreadsheet of feedback or field notes, goes through the intake first. Split each excerpt into notes that hold one observation apiece.
   Done when you have at least 20 notes from at least 3 people. With fewer, stop, say how many more are needed, and point to `/ux-os:create-interview-script`.

3. **Sort from the bottom up.** Set aside the research questions and any categories anyone expected. Take a note, find what it belongs with, and start a new pile if nothing fits. Name nothing yet. Each note lives in one pile.
   Done when every note is in a pile.

4. **Sort it again, blind.** Start a fresh agent with only the notes, and have it sort them with no sight of your piles. Compare the two. Notes that landed differently are where the structure is weak: reread each one and decide where it belongs. If you cannot start an agent, say so in the run notes.
   Done when every disagreement is resolved or listed, and the run notes say how many notes moved.

5. **Name each cluster as a sentence.** Say what these people have in common, in their language: "Owners only learn about a no-show when the patient fails to arrive", rather than "No-shows".
   Done when no cluster name is a topic label.

6. **Count people, not notes.** For each cluster, count distinct people and organisations. One talkative person is one voice however many notes they gave. A cluster resting on a single person moves to Outliers. Split any pile above 12 notes. A single stray note also goes to Outliers, with why it stands apart.
   Done when every cluster has at least 2 people, and Outliers says why each one is there.

7. **Stack into themes.** Group the clusters into 3 to 6 themes. Each theme says what it tells us about the decision in the brief, and how many people stand behind it.
   Done when every cluster sits under one theme.

8. **Look for the surprises.** What contradicts what the team expected? Which group of people is missing from the wall?
   Done when What surprised us has at least one line, or a `[gap]`.

9. **Write.** Fill `$SHARED/templates/affinity.md`.
   Done when every section has its claims or a `[gap]`.

10. **Finish.** Follow "Finish a run" in the contract. The next skill is `/ux-os:summarize-research`, or `/ux-os:create-personas` in real mode.
