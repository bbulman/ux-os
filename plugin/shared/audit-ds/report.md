# Design system audit: <project name>

- **Project:** <the project folder's name>
- **Audited:** <today's date, as YYYY-MM-DD>
- **Commit:** <the short hash the audit read, with `, uncommitted changes` after it when the tree is dirty, or `not a git repo`>
- **Scope:** <`the whole system`, or the part the person named>
- **Held to:** <the files whose rules this audit used, such as DESIGN.md, or `no written rules`>
- **Second reader:** <`not yet` until the second reader has run, then `checked every Where`, or `not run` and why>

## Verdict
<!-- Three bullets at most: the state the system is in, the one thing to fix first, and how much of this report was seen and how much is suspected. Delete every comment in this file. -->

## Counts
<!-- Seen counts the findings whose Basis is seen or counted. Suspected counts the rest. The gate recounts both from Findings, so fill this in last. -->
| Severity | Seen | Suspected |
|---|---|---|
| 1 Stops someone | | |
| 2 Misleads a builder | | |
| 3 Costs time | | |
| 4 Untidy | | |

## Rules
<!-- One row per rule the system was held to, from the files under Held to, in the order those files give them. Rule is the file and section, such as DESIGN.md §5, where §5 is a heading that file numbers 5; cite an unnumbered heading by its words, and a section holding three rules gets three rows, as does a rule checked only in part: one row for the part that was checked, one for the part that was not. Says is the rule in a few of its own words. Outcome is `broken: F1, F4` naming every finding against it, `held` when a pass looked and found no break, or `not checked: ` and why. With no written rules, the single row | none | none | none |. -->
| Rule | Says | Outcome |
|---|---|---|

## What was read
<!-- One row per pass, all six, in this order. Read is what was opened in full, with a count. Sampled is what was sampled and how it was chosen, or `nothing`. Not read is what was left out, or `nothing`. A pass that did not run says `skipped` under Read and why under Not read. -->
| Pass | Read | Sampled | Not read |
|---|---|---|---|
| Inventory | | | |
| Naming | | | |
| Finish | | | |
| Use | | | |
| Access | | | |
| Themes | | | |

## Checks run
<!-- One row per command the project already had and this audit ran, numbered C1, C2. Result is the command's own closing line or count, copied, with its exit code. With none, the single row | none | none | none |. -->
| # | Command | Result |
|---|---|---|

## Findings
<!-- One row per finding, worst first, numbered F1, F2. Severity is 1 to 4. Pass is one of the six names above. Rule is what the finding breaks: the project's own file and section, such as DESIGN.md §5; `files disagree` when two of the project's files say different things; or the WCAG 2.2 criterion, written WCAG 1.4.3. Something no rule covers is not a finding and goes under No rule on file. Where is one place, path:line from the project root: the first or the worst. Other places go in the finding's words as a count. Where covers 5 lines at most. Line says is a few words copied exactly from that line, at least four characters, in backticks, and the gate looks for them there. Inside any cell, write a pipe as \|. Basis is `seen` (you opened that line), `counted C1` (a command in Checks run reported it) or `suspected` (you did not open it, and Line says is -). A suspected finding is never severity 1: open it, or lower it. -->
| # | Severity | Pass | Finding | Rule | Where | Line says | Basis |
|---|---|---|---|---|---|---|---|

## No rule on file
<!-- What this audit went looking for a rule on and found none, such as themes, a naming rule or what a finished component has. One bullet each, worded as the question the owner has to answer. These are not findings. With none, the single bullet - None. -->

## Fix order
<!-- Numbered. Each line names the findings it clears, as F3 or F3, F7, then what to do. Every severity 1 finding appears. Findings with one cause share a line. -->
