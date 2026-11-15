## What it is for

A design system audit usually measures a system against a general idea of what one ought to have. This one holds it to its own rules. A finding is a written rule broken, two of the project's files saying different things, or a WCAG 2.2 AA failure. Anything else, such as a missing dark theme or two tokens holding one value, is a question for the owner and is listed apart.

The report goes in `ux-os/audits/`. Nothing else in the project changes, and nothing gets fixed in the same run.

## How it was built

Built on 15 November 2026. Bill asked for his own version of the `audit-system` command in MC Dean's design-systems pack, which hands each part of the audit to another skill in that pack. This one is written from scratch and stands alone. Its skill file and report template share no run of five words with the 1,215 third-party skill files installed here.

It started from what Claude does with no skill at all. Asked to audit a small made-up design system with planted faults, it found most of them, and its report had four problems:

- It quoted the result of the project's lint, and said elsewhere that nothing had been run.
- It gave one line number, and the number was wrong.
- Its summary counted 3, 4 and 6 issues over lists that held 5, 6 and 6.
- Rule breaches and opinions about what a system should have sat in one list, with nothing to tell them apart.

Each part of the skill answers one of those:

- The project's own checks run first, and only the ones that read. Their closing line is copied, and a result that was not run is never written down.
- Every finding names one line and quotes a few words from it. A gate opens that line and looks for the words, so a line that is one off fails.
- The gate recounts the findings, so the counts cannot drift from the table.
- A Rules table lists every rule the system was held to and how it came out: broken, held or not checked.
- Severity is set by what happens to a person, in four levels read before looking: stops someone, misleads a builder, costs time, untidy.
- A second agent, given only the report and the project, rereads each claim and reworks each contrast figure.

## What testing showed

Two trial runs on a made-up system, then one on a real one, each by a fresh agent following the skill file to the letter.

- **First run.** Nine findings, all with a line that held the quoted words, and the lint result copied from a real run. The gate passed first time. The second reader caught a file count the writer had guessed.
- **Second run**, on a harder copy with a dark theme and a script that rewrites files. Fifteen findings. The agent read the script, saw that it writes, and did not run it. The second reader caught a finding that named two of the three roles with no dark value. All five contrast figures matched a separate recount.

Between the runs the skill gained the Rules table, a rule for which way round `files disagree` applies, and a line telling the second reader what the report is allowed to say. The first run's agent had no place to record a rule that was checked and held.

An independent review of the gate then built reports meant to slip through it, and nine kinds did. A link could lead a finding to a file outside the project, a section written twice hid its first table, a finding could be marked broken by another rule's row, and a one-letter quote matched almost any line. Seven of the nine now fail, and the gate's self-test holds 47 cases. Two were left as they are: a suspected finding is not opened, because that is what suspected means, and a report can pass before the second reader has run, with a note saying so. The second run's report still passes the stricter gate.

## The first real run

On 15 November 2026 it ran on Workshopr's web design system: 97 components, a 754-line rule file and six checks of its own. It took 26 minutes and produced 23 findings, all with a line that held the quoted words. Seven contrast figures, two of them suggested fixes, matched a separate recount. Only the six checks that read files were run. The browser suites start a server, so they were listed and left alone.

What it showed about the skill:

- **The gate caught no wrong fact.** It passed first time on every run. Every correction came from the second reader: a wrong colour pair, a miscount, three rules marked held that were not, and about 23 rules the list had left out.
- **A long rulebook does not fit one row per rule.** A row may now stand for a numbered section, and the gate names each numbered section of a rule file that has no row.
- **A check can print the wrong line.** One pointed three lines off. Where is now the line that was opened.
- **Checks found and not run had no place.** They now get a row that says why.
- **Five calls were left to judgement:** a warning that a baseline tolerates, a `var()` with a fallback, a failure in a variant nothing uses, how many components a sample takes, and a rule written only for new components. Each now has a line.
- **The second reader did not know what was unsafe to run.** Its brief now carries the project's own rules on that, and nothing else.

Those changes are version 0.6.1. The gate's self-test holds 52 cases.

## Still to do

- Run it on a second real design system, one it was not built beside.
- The changes in 0.6.1 have not been tried on a fresh run.
- Type the command in a live session.
- The fixes that followed the gate's review have had no second review.
- A rule can be marked `held` with nothing to prove a pass looked. Only the second reader stands behind that.
