## What it is for

Most of the skills in UX-OS are written by someone else. A third-party skill does not know the idea, writes in its own format, cannot tell a belief from a finding, and changes upstream without notice. `/ux-os:run` fixes those four from outside, without editing a word of the skill.

## How it works

- **Pick.** `picks.json` names one skill per job and the rival it was chosen over, with the reason. The run says both before it reads the skill.
- **Brief.** `brief.mjs` hands the skill the idea's brief, models, beliefs, evidence and the project's house rules.
- **File.** The output is filed word for word, under a Claims table with one tag per claim. General practice the skill states gets its own tag, `[practice]`, so it never passes for a finding.
- **Audit.** The `claims-auditor` agent sees only the work file and the idea folder, and judges whether the table is complete and whether each citation supports its claim. Anything it leaves open fails the check.
- **Watch.** A hash of the skill that ran is kept, and the next run says if the skill has changed.

Since 12 November 2026 a work file goes in the idea's folder for its discipline, such as the interaction-design folder, or in a work folder for an older idea folder.

## What is not done

- The typed command has not been run in a live session.
- Picks cover six jobs, all in Interaction design.
- The check proves the Claims table is well formed. The audit is one independent reading, not proof that no claim is missing.
- No scoreboard, routing or chaining across skills yet.
