## How it was built

Written from scratch on 10 November 2026 in our own words, after Bill compared the research set with MC Dean's design-research pack and chose four commands to sit on top of the twelve skills. The shape of one command now, the two after it and what to skip comes from MC Dean's `start-here` command (MIT), and the skill credits it. A wording check found no run of 5 consecutive words shared with the 175 files in that collection.

It reads the idea folder through `status.mjs`, which writes nothing. The script reuses the book's logic for which belief to test first and the check's way of counting people, so the three cannot drift apart.

## What testing showed

The first runs found two steps with no branch for an idea that has no folder, and a report that listed inbox files already taken in. An independent review found routing loops and an audio file that jammed the inbox route. All were fixed, each with a test written first.

## Still to do

- Run it on a real project.
- Test it against no skill, as the method asks.
- Run the typed command end to end. The tests used agents following the same file, because the permission system blocks scripts that start separate Claude processes.
