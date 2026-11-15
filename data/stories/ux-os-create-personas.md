## How it was built

Written from scratch on 9 November 2026 in our own words. Bill set the list of twelve research skills, which follows the topics in MC Dean's design-research pack. About 40 existing skills were reviewed for methods worth keeping and no text was carried over. A wording check found no run of 5 consecutive words shared with 83 plugin and repo skill files, which is why it carries no attribution.

It shares a common folder with the other eleven: the evidence tags, the intake for interviews, the checking script and the designed research book.

## What makes it different

A proto persona is labelled as assumptions until evidence replaces them, and the page shows belief in pencil and evidence in ink. Personas split on one behaviour, one is named primary, and each closes with its weakest claim and what would prove it wrong.

## What testing showed

Proto mode ran on simulated founder answers. Real mode ran on five made-up interviews. Both passed the checking script. Run against this repo's profile, it treated `PERSONAS.md` as beliefs rather than evidence.

## Still to do

- Run proto mode with a real person's beliefs.
- Run it on a real project.
- Test it against no skill, as the method asks.

## Moved into ux-os

On 10 November 2026 this skill moved with the other fifteen research skills into one private plugin, `ux-os`. It is now typed `/ux-os:create-personas`, and this is the only one whose name changed. The shared rules and scripts moved to the plugin's `shared/` folder, and the old folders were retired.

Real mode now links every citation to the exact passage in the anonymised copy of the source, and the checking script fails the run if a link is missing, broken or points anywhere else. In proto mode nothing changes.

Tested on five made-up interviews: every link resolved, and six opened by hand landed on the right passage. A fresh reviewer then found two ways a participant's name could still get into a link. Both now fail the check, each proved by a test that failed first.
