# Belief interview

Proto skills run this after the intake and before they read any research, so the answers come from the person's head and are not led by the evidence.

## Ask

Read `beliefs.md` if it exists. Ask only about what is still missing for this skill's topics. If the project profile lists files as beliefs, take lines from them that bear on the brief's decision, enter them as beliefs with the file and line noted, Basis `imported` and Certainty `unknown`, and count how many lines you left out and which sections they came from for the run notes. Those lines are claims to test. They are never evidence, whatever the file says about itself.

Ask one question at a time, at most 7 per skill or the limit under "Chains" in the contract when a chain runs this, in plain conversation, waiting for each answer. Ask about specifics and past events.

- "Who was the last person you saw hit this problem, and what did they do about it?"
- "What do you think they do today instead?"
- "Who has actually paid or switched, and what for?"
- "Who did you expect to care about this and did not?"

When an answer is fluent and general, ask "how exactly?" up to twice, then ask for the last real example. When the person has no view, record that and move on. A person with no view has told you where the risk is. Close with: "What else has to be true for this to work that we have not covered?"

## Record

Save each belief to `beliefs.md`, from `$SHARED/templates/beliefs.md`, in the person's own words, with any real customer's name replaced by their role. Split an answer holding two claims into two beliefs, so each can get its own verdict. Number them `B1`, `B2`, continuing across skills. A "no view" gets a number too, written `No view: <topic>`, and carries no verdict.

For each belief, before showing any evidence, record its Basis (`saw`, `heard`, `read` or `reasoned`), how sure the person is (`sure`, `fairly sure` or `guessing`), and what would make them drop it.

Done when every topic the skill lists has a belief or a recorded "no view", and every belief has its basis, certainty and exit.

## Check

Now read the evidence, in this order, and give each belief one verdict, the same wherever it appears:

1. Primary research in `primary.md`.
2. Targeted searches for each belief still showing no evidence, at most 2 per belief. New sources join the ledger and go through verification. The run notes say if coverage is thin.

When a verdict rests on participants, write the belief's number in the Beliefs column of each excerpt it rests on. Then tag the belief where it appears in the output: `supported`, `contradicted` or `no evidence`, or `confirmed`, `refuted` or `mixed` where the validation bar is met. Look for evidence against each belief as hard as evidence for it. A `contradicted` or `refuted` line states what the evidence found, not what the person believed: the belief itself is kept in `beliefs.md`.

Done when every belief this skill uses carries a verdict.

## Tell the person

In the report, lead with the beliefs the person was `sure` of that came back `contradicted`, then the other contradictions. Being shown where you were wrong is the point of the exercise.
