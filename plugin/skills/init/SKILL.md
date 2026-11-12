---
name: init
description: Connect a project's design system and house rules to UX-OS deliverables, so they take its fonts and colours, their design proposals name real components, and third-party skills are held to its rules.
disable-model-invocation: true
argument-hint: "[project path]"
---

Connects a design system to what UX-OS produces, once per project. Deliverables take the system's fonts and colours, and each design proposal names a real component or says none fits. It also records the project's house rules, the files `/ux-os:run` hands to every third-party skill. Run it again when the system or the rules change.

`$SHARED` means `${CLAUDE_PLUGIN_ROOT}/shared`. Everything is saved in `.research-profile.md` at the project root, and only its `## Book look`, `## Design system` and `## House rules` sections change.

## Steps

1. **Find the project.** Use the path given, otherwise the git root, otherwise the working directory.
   Done when you have said which folder this run connects.

2. **Find the design system.** Read `.ds-kit.json` first if the project has one: its `tokens` lists the token files and its `catalog` names the component catalogue. Otherwise search for token files, such as a CSS file full of custom properties or a tokens JSON, and for a JSON file with a `components` object. Read what you find. Never guess a path. With no design system, say so and go to step 7. Deliverables keep the book's default look.
   Done when you have named the token file and the catalogue, or said there is none.

3. **Read the look.** Fill these slots from the tokens, following any variable to its final value, with colours as hex values and fonts as family names. A slot with no matching token is left out. Never invent a value.

   | Slot | The token for |
   |---|---|
   | Display font | Headlines |
   | Text font | Body text |
   | Accent | The main brand colour |
   | Paper | The page background |
   | Sheet | Cards and raised surfaces |
   | Sunk | Muted or recessed surfaces |
   | Ink | Main text |
   | Rule | Borders and dividers |

   Done when every slot holds a value read from the tokens, or is left out.

4. **Check the fonts.** The published book can only load fonts from Google Fonts. For each font run `curl -s -o /dev/null -w '%{http_code}' 'https://fonts.googleapis.com/css2?family=<name>'`, with spaces in the name written as `+`. Leave out any font that does not return 200, and say the book will use its default for it.
   Done when each font has returned 200 or been left out.

5. **Check the catalogue.** It has to be JSON with a `components` object keyed by component name. If the project has none, draft `.ux-os-components.json` at the project root in that shape, `{ "components": { "<name>": {} } }`, from the component names you can see in the code, and do not write it yet.
   Done when you have a catalogue that fits, or a draft to show.

6. **Look for a finder.** Check `package.json` for a script that searches components, and write out the exact command, with `<need>` where the description goes. Without one, skip this. Components will be found by searching the catalogue.
   Done when you have a command to offer, or know there is none.

7. **Find the house rules.** Look at the project root for the files that set how things should look and read, such as `DESIGN.md`, `taste.md` or a brand or voice guide, and read what `CLAUDE.md` or `AGENTS.md` points to. Ask the person which of them a third-party skill should be held to. Keep only files that exist inside the project root, with paths relative to it. None is a fine answer.
   Done when you have a list of files, or the person has said none.

8. **Get a yes.** Show the person everything you would save: each look value and the token it came from, the token file, the catalogue and any draft of it, the finder command, which skills will run, and the house rules. Ask whether to save it, and whether the finder may run. A wrong path is worse than a gap. With nothing to save, say so and stop. Without a yes, write nothing and stop. Without a yes to the finder, leave it out.
   Done when the person has said yes.

9. **Save and check.** Write any drafted catalogue. Write the connection to a temporary JSON file, `{ "look": { "display": "", "text": "", "accent": "", "paper": "", "sheet": "", "sunk": "", "ink": "", "rule": "" }, "designSystem": { "tokens": "", "catalogue": "", "finder": "" }, "houseRules": [""] }`, leaving out anything you left out above, with paths relative to the project root. Then run `node "$SHARED/profile.mjs" --write <project> <file>` and `node "$SHARED/profile.mjs" --check <project>`. An empty `houseRules` list removes the section, and leaving the key out keeps it as it is. `--check` refuses a house-rule file that does not exist or sits outside the project root.
   Done when `--check` exits 0.

10. **Report.** Say what was connected, what was left out and why, and whether anything changed. Research deliverables take this look the next time their book is rendered, and design proposals name components from the next run of `/ux-os:create-personas`, `/ux-os:create-jtbd` or `/ux-os:create-journey-map`. The house rules reach the next `/ux-os:run`.
