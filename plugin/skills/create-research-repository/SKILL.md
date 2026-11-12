---
name: create-research-repository
description: Set up or update one place that says what you have learned across every study, and how far to trust it.
disable-model-invocation: true
argument-hint: "[add | ask <question>]"
---

Keeps what was learned findable and honest after the study is over. It stores insights with their strength and age, so nobody cites something that was never validated or has gone stale.

Read `${CLAUDE_PLUGIN_ROOT}/shared/contract.md` and keep to it throughout. `$SHARED` means that folder. Your output is `repository.md` in the research root, the folder that holds every idea: `ux-os/` for a project laid out by discipline, otherwise the folder above the idea folder the profile names, otherwise `docs/research/` when it exists, otherwise `research/`. In `ux-os/`, each idea's files are in `<slug>/research/`.

Take **Ask** if the person asked a question. Otherwise **Build**, which creates the repository or brings it up to date.

## Build

1. **Find everything.** Read every idea folder under the research root: `brief.md`, `primary.md`, `affinity.md`, `summary.md`, and the belief verdicts in the model files. Include any other research files in the root, listed as not yet in this format.
   Done when every folder is accounted for in Studies or in the run notes.

2. **List the studies.** One row each: what it was, when, the method, how many people and organisations, where it lives, and a review-by date 18 months after the fieldwork, or after the plan date for a study not yet run.
   Done when every study has a review-by date.

3. **Pull out the insights.** An insight is one sentence that someone could act on. Take them from confirmed and refuted beliefs, and from themes backed by 5 or more organisations and findings rated strong. Give each its strength, people, organisations, tags and when it was last checked. Leave out anything that is only a belief or an inference.
   Done when every insight links to the file it came from.

4. **Keep the tags few.** Reuse the existing tags. Add one only when nothing existing fits, and say what it means. Tag by what the insight is about, never by which study it came from.
   Done when every tag in use is defined, and there are at most about 25.

5. **Record the open questions.** Beliefs still untested across every idea, rated high impact where the decision in the brief rests on them.
   Done when each links to where it came from.

6. **Record consent and retention.** For each study, what participants agreed to and how long raw files in `inbox/` may be kept. List anything past its date for the person to act on. Never delete raw files yourself.
   Done when every study has a row, with `not recorded` where that is the truth.

7. **Write.** Fill `$SHARED/templates/repository.md`.
   Done when `node $SHARED/check.mjs <research root>` exits 0.

8. **Finish.** Run `node $SHARED/book.mjs --repository <research root>`. If any idea's `brief.md` says `Book: local only`, stop there and give the path to `repository-book/open-me.html`, because the repository draws on every idea. Otherwise publish as `$SHARED/book.md` describes, with the link saved in the repository's `How this works` section.
   Done when the link is saved, or the report says why not.

## Ask

1. **Answer from what is on file.** Search `repository.md` and the files it links to. Lead with the answer, then how strong it is: how many people, how long ago, what disagrees with it.
   Done when every statement cites its study.

2. **Say what is not known.** If the repository cannot answer this, say so plainly and name the cheapest skill that would, such as `/ux-os:create-interview-script`. Never fill the gap from general knowledge.
   Done when the answer says what it could not cover.
