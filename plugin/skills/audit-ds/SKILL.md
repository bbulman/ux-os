---
name: audit-ds
description: Audit a design system against its own written rules. The project's checks run first, every finding quotes the line it was seen on, and what nobody read is said out loud.
disable-model-invocation: true
argument-hint: "[project path] [part to audit]"
---

Answers: where does this design system break its own rules, and what gets fixed first? The rules are the project's, not a general idea of what a design system ought to have. A finding is something you saw on a line. Anything else is a suspicion or a question for the owner, and the report keeps the three apart.

`$AUDIT` means `${CLAUDE_PLUGIN_ROOT}/shared/audit-ds`. Your output is one report, `ux-os/audits/<YYYY-MM-DD>-design-system.md` in the project, with `-2` before `.md` if that name is taken. An audit reads. Nothing else in the project changes, and nothing gets fixed in this run.

## What counts as a finding

One of three things, and the Rule column says which:

- **A written rule broken.** The rule's file and section, such as `DESIGN.md §5`. When a written rule covers it, cite the rule, never one of the two below.
- **Two of the project's files saying different things.** `files disagree`, either way round: the catalogue lists a component the code does not have, the code has one the catalogue leaves out, or the docs describe an option the component lacks.
- **A WCAG 2.2 AA failure.** The criterion, such as `WCAG 1.4.3`.

Whatever else you would like the system to have goes under `No rule on file`, as the question the owner has to answer. Two tokens holding one value, a missing dark theme and thin docs are questions until a rule says otherwise.

## Severity

Read this before you look, so a finding cannot be argued up or down afterwards.

| Severity | Means | Such as |
|---|---|---|
| 1 Stops someone | A person cannot see, reach or finish something | Text below the contrast floor, a control with no visible focus, a target smaller than the floor, a component that breaks in a theme the product ships |
| 2 Misleads a builder | The system says one thing and the code does another, so the next person, or Claude, builds it wrong | A token the rules name and the code lacks, a catalogue entry with nothing behind it, an option the docs describe that does not exist |
| 3 Costs time | It works, and somebody redoes it by hand each time | A literal where a token holds that value, a component missing the demo or docs the rules ask for |
| 4 Untidy | Nobody trips on it | A token nothing uses, where a rule says to remove them |

## Steps

1. **Find the project and the scope.** Use the path given, otherwise the git root, otherwise the working directory. The scope is the whole system unless the person named a part. Run `git rev-parse --short HEAD` and `git status --porcelain` for the Commit line. Outside a repo the line says `not a git repo`.
   Done when you have said which folder, which scope and which commit.

2. **Find the system.** Read `.ds-kit.json` first if there is one, then the `## Design system` section of `.research-profile.md`. Otherwise search for the token files, the component catalogue, the components and the product code that uses them. Never guess a path. With no tokens and no components, say there is nothing to audit and stop.
   Done when you have named each of the four, or said which is absent.

3. **Find the rules.** Read `DESIGN.md` in full, and whatever it, `CLAUDE.md` or `AGENTS.md` points to for how things look and behave. List every rule a check could enforce, with its file and section, one row each in the report's `Rules` table. That list is what the system is held to, and by the end every row says `broken`, `held` or `not checked`. With no written rules, `Held to` says so, and only `files disagree` and WCAG findings are possible.
   Done when each rule on the list has a file and a section.

4. **Run the project's own checks.** Look in `package.json`, `composer.json`, a Makefile, `.ds-kit.json` and the CI workflow for commands that lint tokens, check drift, validate the catalogue or test accessibility. Read what each command runs before you run it, and run only the ones that only read. Never run one that fixes, writes, updates a snapshot or a baseline, or touches a database, and when you cannot tell, do not run it. Copy each command's closing line and exit code into `Checks run`. A result you did not get from running the command in this run is never written down. What a check reported is one finding, cited `counted C<n>` even after you open it, with the first place the check printed as its Where. It is not recounted by hand.
   Done when every check has a row, or `What was read` says which were not run and why.

5. **Make the six passes.** For each, write its `What was read` row as you go: what you opened in full, what you sampled and how you chose it, and what you left out. Count with a command, not by eye, and a comment is never a use. On a system too large to read whole, take the most used components first and say so. A finding from a sample never says "all" or "none".
   - **Inventory.** What is in the catalogue and docs, and what is in the code. Three lists: in both, on paper only, in code only. The same for tokens the rules name against tokens defined.
   - **Naming.** One thing called two names, or one name doing two jobs, across the rules, the catalogue and the code.
   - **Finish.** Each component against what the rules say a finished one has. If the rules do not say, that is a `No rule on file` question and the pass is skipped.
   - **Use.** Literals where a token holds the same value, markup rebuilt by hand where a component exists, and tokens or components that nothing references.
   - **Access.** Work out the contrast of every text and surface pair the components put together with a script, to two decimals, never by estimate. Where nothing sets the surface, take the page surface and say so in the finding. Then visible focus on every control, target size, reduced motion where anything moves, and names and roles in the demos' markup. What code cannot show, such as focus order or what a screen reader says, goes under Not read.
   - **Themes.** Every colour role has a value in each theme, no literal stays put when the theme switches, and contrast holds in each. A failure that only shows in a second theme is a Themes finding. One theme and no rule asking for more: the pass is `skipped`.

   Done when all six rows are filled, every finding has a line you opened, and every row in `Rules` has its outcome.

6. **Write.** Copy `$AUDIT/report.md` to the report's path and fill the copy. The template itself is never changed. One cause is one finding: three literals the lint reported are a single row that says "3 places" and names the first. Copy `Line says` from the file, not from memory. A finding about something missing points at the line that promises it. Set severity from the table above by what happens to a person, not by which pass found it.
   Done when every finding has a Rule, a Where and the words on that line.

7. **Fix order.** Group findings by cause and put the severity 1 causes first. Suggest a value, such as a darker colour, only when you have worked it out and it passes.
   Done when every severity 1 finding is on a line.

8. **Gate.** Run `node "$AUDIT/check.mjs" <report> <project>`. It recounts the findings, opens every Where and looks for the quoted words. Fix the report, never by dropping a finding that is true.
   Done when it exits 0.

9. **Second reader.** The gate proves each place exists. It cannot tell whether the finding is right, and neither can the session that wrote it. Start a fresh agent with only the report's path and the project's path: "Open every Where in this report and say whether that line shows what the finding claims, whether the Rule it cites says what the finding needs it to, and whether each contrast figure is right when you work it out yourself. Then name any rule in the Held to files that the `Rules` table leaves out or marks `held` when it is not. A Rule of `files disagree` or a WCAG criterion is allowed, and a `counted` finding counts as seen. Return the rows that fail and why. Change nothing." Correct each row that fails, lower it to `suspected`, or remove it if it is wrong. Where you think the reader is the one who is wrong, keep the row and say so in your report. Set the `Second reader` line to `checked every Where`, and run the gate again. If you cannot start an agent, the line says `not run` and why.
   Done when the line is set and the gate exits 0.

10. **Report.** In your final message: the verdict, the counts as seen and suspected, what was not read, the first fix, and the report's path. Say plainly that the gate checked the places and a second reader checked the claims, and that neither shows nothing is missing.
