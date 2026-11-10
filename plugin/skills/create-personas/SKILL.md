---
name: create-personas
description: Define who behaves differently enough to design for separately, from your beliefs or from real research.
disable-model-invocation: true
argument-hint: "<idea> [proto|real] [--evidence <path>]"
---

Answers: who behaves differently enough to need a different design? A proto persona is a labelled set of assumptions. A real one traces every line to what people did and said.

Read `${CLAUDE_PLUGIN_ROOT}/shared/contract.md` and keep to it throughout. `$SHARED` means that folder. Your output is `personas.md` in the idea folder.

## Steps

1. **Start.** Follow "Start a run" in the contract.
   Done when the brief names a decision and the intake has reported.

2. **Choose the mode.** Follow "Proto or real" in the contract.
   Done when you have said which mode this run uses and why.

3. **Proto only: interview.** Follow the Ask, Record and Check parts of `$SHARED/belief-interview.md`, before reading any research. Topics: who you picture using this, how those people differ in what they do, the last real one you met, what they have already tried, and what would stop them.
   Done when every belief this skill uses has a verdict.

4. **Real only: map the behaviour.** List 3 to 5 behaviours that vary between participants: how often, how alone, how much at stake, how they decide. Place each participant along each one. People who sit together across several behaviours are a persona. Job titles and ages are poor separators.
   Keep this working in the run notes.
   Done when every participant is placed and the groupings are visible.

5. **Choose the variable that splits them.** Pick the one behaviour that most changes what someone needs. Set its low and high ends, and place each persona from 0 to 100. Say whether each persona uses it, buys it, or both, from your beliefs in proto mode, and from what participants said in real mode. Name one primary persona, whose needs win when they conflict.
   Done when each persona's position says what behaviour puts them there, and one is named primary.

6. **Write at most 4 personas.** Fill every subsection, with demographics only where they change behaviour. Technology covers the setting, time pressure, who is present and any assistive technology, or a `[gap]`. Frustrations closes with why they would refuse this and what would overcome it. Open each with a participant's own words from `primary.md`, under 15 words, or with no primary research what someone in a public source did or said, reported in the third person. Give each a plain first name.
   Done when no subsection is empty, each persona opens with a tagged line, and each has one deal-breaker no other persona shares, or a `[gap]` saying none has been seen yet. Merge any two the evidence cannot tell apart.

7. **Name the weak points.** Each persona closes with its least evidenced claim and the observation that would prove it wrong.
   Done when each "how we would know" names something a person could go and observe.

8. **Write.** Fill `$SHARED/templates/personas.md`, with the banner the mode calls for. Then follow "Component lines" in the contract.
   Done when every section has its claims or a `[gap]`.

9. **Finish.** Follow "Finish a run" in the contract. In proto mode, also follow the "Tell the person" part of `$SHARED/belief-interview.md`, and if the profile named belief files, the run notes say how many lines were left out and from which sections. The next skill is `/ux-os:create-journey-map`.
