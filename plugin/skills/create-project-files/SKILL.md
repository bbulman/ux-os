---
name: create-project-files
description: Set up a project's nine UX-OS files (PRODUCT, DESIGN, AGENTS, PERSONAS, JOURNEYS, JTBD, taste, motion and VOICE) from annotated templates, writing only the ones that are missing.
disable-model-invocation: true
argument-hint: "[project path]"
---

Gives a project the files every UX-OS skill and agent reads first: what the product is, how it looks, how it moves and sounds, who it is for, and the rules an AI agent must not miss. Each file comes from an annotated template that says what the file is for, who reads it and what good looks like. It writes only the files that are missing and never changes one of the nine that exists. The one other file it may change is `.research-profile.md`, and only with a yes (step 6).

`$FILES` means `${CLAUDE_PLUGIN_ROOT}/shared/project-files`, which holds the nine templates.

## Steps

1. **Find the project.** Use the path given, otherwise the git root, otherwise the working directory. If a path was given and is not an existing folder, say so and stop. Never create the project folder.
   Done when you have said which folder this run sets up.

2. **See what is there.** For each of `PRODUCT.md`, `DESIGN.md`, `AGENTS.md`, `PERSONAS.md`, `JOURNEYS.md`, `JTBD.md`, `taste.md`, `motion.md` and `VOICE.md`, check whether a file of that name exists at the project root, ignoring case, so `design.md` counts as `DESIGN.md`. Do not open or change one that exists. From here on, "missing" means missing by this case-blind check, and the report names an existing file as it is spelt on disk. Also note whether `CLAUDE.md` exists. If all nine exist, say so, then do steps 6 and 7 only.
   Done when you have listed which files exist and which are missing.

3. **Ask only what a template cannot guess.** Ask one question at a time, and skip any the project already answers.
   - **The product's name.** Look first at the README's title and the `name` in `package.json` or its equivalent, and offer what you find.
   - **Who it is for, in one sentence.** Only if `PRODUCT.md` is missing.
   - **Where the design system lives.** Only if `DESIGN.md` is missing. Look first: a `.ds-kit.json`, a CSS file full of custom properties, a tokens JSON, a component catalogue. Offer the paths you find. Never guess one, and "none yet" is a fine answer.
   Done when you have each answer you need, in the person's words.

4. **Get a yes.** Show the person the files you will write, the files you will leave alone, and the values you will fill in. Without a yes, write nothing and stop.
   Done when the person has said yes.

5. **Write the missing files.** For each missing file, read its template in `$FILES` and write it to the project root under the template's name. Immediately before writing each one, list the project root again, as its own step and not alongside the write, and check, ignoring case, that no file of that name is there: on a disk that ignores case, writing `DESIGN.md` replaces an existing `design.md`. If one is there now, leave it and say so. Fill in only these:
   - `<Product>`, wherever it appears in the template: the product's name.
   - In `PRODUCT.md`: `<date>` becomes today's date, and on the `**Primary:**` line the person's sentence replaces `<who, in what situation, and what they need most>`.
   - In `DESIGN.md`: the `**Catalogue:**` and `**Tokens:**` lines take the paths the person confirmed, or `none yet`.
   - In `AGENTS.md`, the line that begins `**The guide for any AI agent`: if `CLAUDE.md` exists, `<GUIDE FILE>` becomes `CLAUDE.md` in both places on that line. If it does not, replace that whole line with `**This file is the guide for any AI agent working here.** It points at the files that hold the detail, and states the rules that must not be missed.`
   Leave every other placeholder and every comment for the person to fill. Never invent product facts.
   Done when each missing file is written and no existing file has changed.

6. **Register the beliefs.** The research skills treat `PERSONAS.md`, `JOURNEYS.md` and `JTBD.md` as beliefs to test only when `.research-profile.md` names them under `## Belief files`.
   - If `.research-profile.md` exists and has no `## Belief files` section, ask whether to add one. On a yes, append this at the end of the file, after one blank line, naming only those of the three that exist now, including any written in step 5:

     ```
     ## Belief files

     `PERSONAS.md`, `JOURNEYS.md` and `JTBD.md` describe <product>'s users, journeys and jobs. Treat what they say as beliefs to test, never as evidence. Only lines bearing on the brief's decision enter `beliefs.md`.
     ```

     Then read the file back: `## Belief files` appears exactly once, and everything above it is as it was. If not, restore the file and say why.
   - If there is no `.research-profile.md`, say that `/ux-os:init` creates one, and that running this command again afterwards adds the section.
   - If the section already exists, leave it.
   Done when the section is added, already there, or the person has said no.

7. **Report.** List the files written, those of the nine that already existed and were left alone, and whether step 6 changed `.research-profile.md`. Say which to fill first: `PRODUCT.md`, then `DESIGN.md`, because the others defer to them. Then name the next commands:
   - `/ux-os:init` connects the design system and holds third-party skills to `DESIGN.md`, `taste.md` and `VOICE.md` as house rules.
   - `/ux-os:research-discover` turns what `PERSONAS.md`, `JOURNEYS.md` and `JTBD.md` believe into first models and names the belief to test first.
   - `/ux-os:create-personas real`, once there are interviews with at least five people from different organisations, replaces the beliefs with what people did.
