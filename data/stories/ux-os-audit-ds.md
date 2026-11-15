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

Two trial runs, each by a fresh agent following the skill file to the letter.

- **First run.** Nine findings, all with a line that held the quoted words, and the lint result copied from a real run. The gate passed first time. The second reader caught a file count the writer had guessed.
- **Second run**, on a harder copy with a dark theme and a script that rewrites files. Fifteen findings. The agent read the script, saw that it writes, and did not run it. The second reader caught a finding that named two of the three roles with no dark value. All five contrast figures matched a separate recount.

Between the runs the skill gained the Rules table, a rule for which way round `files disagree` applies, and a line telling the second reader what the report is allowed to say. The first run's agent had no place to record a rule that was checked and held.

An independent review of the gate then built reports meant to slip through it, and nine kinds did. A link could lead a finding to a file outside the project, a section written twice hid its first table, a finding could be marked broken by another rule's row, and a one-letter quote matched almost any line. Seven of the nine now fail, and the gate's self-test holds 47 cases. Two were left as they are: a suspected finding is not opened, because that is what suspected means, and a report can pass before the second reader has run, with a note saying so. The second run's report still passes the stricter gate.

## Still to do

- Run it on a real design system. Both trials used the same made-up one.
- Type the command in a live session.
- The wording changes made after the second run have not been tried, and the fixes that followed the review have had no second review.
- A rule can be marked `held` with nothing to prove a pass looked. Only the second reader stands behind that.
