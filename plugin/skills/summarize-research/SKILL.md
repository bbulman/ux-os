---
name: summarize-research
description: Turn a transcript, a study or a whole research folder into a summary someone can act on. Needs real data.
disable-model-invocation: true
argument-hint: "<idea> [--evidence <path>] [--for <who>]"
---

Says what was learned, how strongly, and what it changes. It reports disagreement instead of smoothing it, and adds nothing the data does not hold.

Read `${CLAUDE_PLUGIN_ROOT}/shared/contract.md` and keep to it throughout. `$SHARED` means that folder. Your output is `summary.md` in the idea folder.

## Steps

1. **Start.** Before anything else, look for data in `inbox/`, `--evidence` and `primary.md`. With none, say what this skill needs and stop, creating nothing. Then follow "Start a run" in the contract. The intake takes in any transcript or study, including names coming out.
   Done when the brief names a decision and the intake has reported.

2. **Decide what is in scope.** One interview, one study, or everything in the folder. Name who is reading it and the decision they face. With no real data, say what is needed and stop. A summary of beliefs is not a summary of research.
   Done when the scope and the reader are written down.

3. **Read for what happened.** Go through the excerpts in `primary.md` and list what people did and said. Separate observed from reported from opinion. Note who said what, using codes.
   Done when every finding you might use has its people named.

4. **Rate each finding by how much stands behind it.** **Strong** is 5 or more people from different organisations on what they did. **Some** is 2 to 4. **Hint** is one person, or opinion only. Hints stay in, labelled as hints.
   Done when every finding has a strength and a count of people and organisations.

5. **Look for what cuts against it.** For each finding, search the excerpts in `primary.md` for anyone who did or said the opposite. Then write down where people disagreed and what distinguishes the two groups, if anything does.
   Done when Against is filled for every finding, with `none found` where that is the case.

6. **Say what it changes.** Tie the findings to the decision: what to do, what to stop, and what stays undecided. A recommendation is an inference and is tagged as one. Then say what is still not known, and who was not heard.
   Done when every recommendation cites the findings behind it.

7. **Write the short version last.** At most 3 lines that someone could repeat in a meeting, each with its strength intact. Nothing appears here that is not in the findings.
   Done when each line traces to a finding.

8. **Write.** Fill `$SHARED/templates/summary.md`, in plain words for the reader you named.
   Done when every section has its claims or a `[gap]`.

9. **Finish.** Follow "Finish a run" in the contract. The next skill is `/ux-os:create-research-repository`, to keep what was learned.
