# Project file interview

The nine `create-<file>-file` skills follow this. Each names its file, the sources to read, the topics to settle and its own checks. This file holds what they share. `$FILES` means `${CLAUDE_PLUGIN_ROOT}/shared/project-files`, where the templates live, and `<NAME>` is the file the skill writes, such as `PRODUCT.md`. "The person" is whoever you are interviewing. The people the product serves are its users or customers.

The interview is a grilling. Facts come first, from the code and the files. Then the person settles the decisions in rounds of questions, each with a recommended answer, and is asked for a fact only when no source holds it. Nothing is written until they agree a summary, and no file other than the copy is ever changed.

## Lanes

One rule lives in one file. A line that belongs in another file's lane is left out of the copy and listed in the report as a line for that file. The other file is not changed.

| File | Holds | Never holds |
|---|---|---|
| `PRODUCT.md` | What the product is, who it is for, how success is measured, what exists, product principles, what will not be built, open product questions | Visual or interface rules, voice, codebase guidance |
| `DESIGN.md` | Rules a check could enforce: the visual system, UX principles, components, forms, accessibility | Judgment (`taste.md`), words and how they sound (`VOICE.md`), motion values (`motion.md`), product facts (`PRODUCT.md`) |
| `taste.md` | Judgment no check can enforce, in the owner's words | Anything a script could check |
| `motion.md` | How motion feels, its values as tokens, the patterns allowed and banned, reduced motion, the stack | Static visual rules |
| `VOICE.md` | Every word a user reads: how it sounds, the shape of the messages written most, button labels, case and other mechanics | Layout and component rules |
| `AGENTS.md` | A pointer to the guide, the guardrails where a mistake is expensive, the definition of done | A copy of the guide |
| `PERSONAS.md`, `JOURNEYS.md`, `JTBD.md` | Beliefs about users, their journeys and their jobs, each line labelled | Findings presented as evidence with no study behind them, feature specs |

## Belief and taste files

`PERSONAS.md`, `JOURNEYS.md`, `JTBD.md` and `taste.md` record what the person believes or judges, so a recommendation must not put words in their mouth. For these four, ask each question open first, and offer your recommendation or a draft only after they answer or say they have no view. A line you drafted from a source is marked as a draft in the step 6 summary and names its source.

For the three belief files:

- **The research folder** means every idea folder under the folder that `.research-profile.md` names under `## Output`, or every `ux-os/*/research/` folder when it names none.
- **Real research first.** If an idea folder holds a model of the same kind built in real mode (`personas.md`, `journeys.md` or `jobs.md`), say so before the topics, and draft the file from it, citing it, rather than from beliefs.
- **Evidence.** Each row's Evidence cell says `belief` unless a study in the research folder backs it. Then it cites the idea folder and the source, such as `workshopr-io S3 P2`. A row in a future journey says `proposed`. A line the current file presents as validated, with no study behind it, goes back to `belief`, and the report says so.
- **The banner.** The line under the title says the file holds beliefs. It stays unless every row cites a study. When some rows do, it says how many.
- **Sections.** The copy keeps the template's sections exactly, so a research run can be carried in section by section. Open questions go in the report, not the file.

## Steps

1. **Find the project.** Use the path given, otherwise the git root, otherwise the working directory. If a path was given and is not an existing folder, say so and stop.
   Done when you have said which folder this run is for.

2. **Read the bar.** Read `$FILES/<NAME>`. Its opening comment says what the file is for, who reads it and what good looks like, and the new copy is held to that. Its headings, in order, are the shape of the new copy.
   Done when you can say in one line what good looks like for this file.

3. **Choose the mode.** Look for the file at the project root, ignoring case, so `design.md` counts as `DESIGN.md`.
   - **New:** there is no such file. The copy will be written at the root.
   - **Fill:** the file is an unfilled template: compared with `$FILES/<NAME>`, it differs only in the values `/ux-os:create-project-files` fills in. The copy will replace it at the root, after the yes in step 6.
   - **Revise:** the file exists and has been filled in. Read all of it. It is never changed: the copy goes to `.scratch/project-files/<NAME>`, or to another folder the person names. Then find what points into it: search the project for the file's name followed by a section mark or an anchor (`DESIGN.md §11`, `DESIGN.md#forms`). A cited section that moves or is renumbered breaks those citations, so the copy either keeps the number or the summary in step 6 lists the citations it would break, grouped by the file that cites them. If the person keeps the numbers, the current file's order wins over the template's.
   Done when you have said which mode this is, where the copy will go, and how many citations point into the current file.

4. **Look things up.** Read the sources the skill lists, every other project file, and the code wherever it can settle a claim. Where an agreed copy of another project file is in `.scratch/project-files/`, read that copy instead of the root file, and say which version you took as current. In revise mode, test every checkable claim in the current file: each path, command, token, component, count, route and status. Keep working notes outside the project: each fact and where it came from, and each stale claim with what is true now. A stale fact is corrected in the copy without a question and listed in the report. A fact the code cannot settle but the person might know becomes a question. A fact nobody has becomes an open question.
   Done when every source the skill lists has been read and every checkable claim has a verdict in the notes.

5. **Grill.** Settle the skill's topics in its order. In revise mode, then settle these:
   - each section of the current file that the template lacks: keep it as an extra section, list it in the report for the file whose lane it is in, or cut it;
   - each place the current file disagrees with another project file or with the code, where the code cannot say which is right;
   - each open question the current file lists: settled now, still open, or dropped.

   Ask in rounds. A round is every question whose prerequisites are already settled, numbered, each with your recommended answer and the fact or reason it rests on, and worded so that "yes" accepts the recommendation. A question that depends on one still open waits for a later round. Where the answer should be in the person's own words, offer two or three drafted wordings and say they can write their own. For the belief and taste files, follow the rule in that section instead. Wait for the answers, then work out the next round from them. A lookup still running holds back only the questions that depend on it. Never ask for something you could look up.

   When an answer is fluent and general, ask how exactly, then for the last real time it happened. When the person has no view, record that and move on: it becomes an open question. In revise mode, anything the current file already settles that no fact and no answer has disturbed carries over without a question, and the summary in step 6 shows it. If the person calls a halt, the topics left carry over from the current file or become open questions.

   Record each answer in the notes. Words the person wrote themselves are recorded exactly. A drafted wording they picked is recorded as "chose draft N", with the draft beside it. Only words the person wrote can appear in the copy as a quotation attributed to them.
   Done when every topic has an answer, a recorded "no view", or a place under open questions.

6. **Confirm.** Before writing anything, show one summary: a line for each section of the new copy saying what it will say, what carries over unchanged, what changes and why, what you drafted and from which source, the lines listed for other files, what is cut, the open questions, and the citations the copy would break, grouped by citing file. Ask whether this is a shared understanding. Fold in each correction and show the changed lines again. Without a yes, write nothing.
   Done when the person has said yes to the summary.

7. **Write.** Use the template's headings in its order, unless step 3 kept the current file's numbering. Extra sections the person kept go where they agreed, otherwise after the template's sections. Open questions go in the template's open questions section where it has one, and otherwise in the report only. Delete every template comment and leave no placeholder from the template, such as `<Product>`. A gap is a named open question or it stays out. Follow the project's own writing rules where its guide, `VOICE.md` or `DESIGN.md` sets them, and name the product as it names itself. Where the template has a date line, use today's date.
   - **New and fill modes:** immediately before writing, list the project root again, as its own step and not alongside the write, and check, ignoring case, that the file is still missing (new) or still the unfilled template (fill). On a disk that ignores case, writing `DESIGN.md` replaces `design.md`. If anything else is there now, write to `.scratch/project-files/` instead and say so.
   - **Revise mode:** if a copy already exists at the destination, ask before replacing it.
   Done when the copy is written and no other file has changed.

8. **Check.** Read the copy back and fix the copy until each of these holds:
   - no placeholder from the template and no `<!--` comment is left;
   - every path, command, token, component and route it names exists, checked from the project root with a listing or a search, not from memory;
   - nothing in it belongs in another file's lane;
   - every quotation attributed to the person is words they wrote in step 5, or a quotation the current file already attributed to them, and other quotations meet the skill's own checks;
   - the skill's own checks pass.

   A check about another file is reported, never fixed by editing that file. If the project has a documentation checker, run it, and say whether it reads the copy's folder or only the root files.
   Done when every check passes, or the report names the one that does not and why.

9. **Report.** Say where the copy is. In revise mode, say in a few lines what changed: the facts corrected, the sections changed or cut, and the citations that would break if the copy replaced the current file. Say that nothing at the root has changed, so the person compares the two and moves across what they want, and that the next command reads this copy as current. List the lines for other files and the open questions. For a belief file written in new or fill mode, say that `/ux-os:create-project-files` registers it in `.research-profile.md`. Name the file to do next, in this order: `PRODUCT.md`, `DESIGN.md`, `taste.md`, `VOICE.md`, `motion.md`, `PERSONAS.md`, `JOURNEYS.md`, `JTBD.md`, `AGENTS.md`. The others defer to the first two, journeys and jobs build on personas, and `AGENTS.md` points at all of them.
   Done when the report is given.
