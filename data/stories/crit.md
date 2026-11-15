## How it was built

Version 2 was built on 2 November 2026 because version 1 could no longer review a URL: the preview tools it relied on had been removed, and WebFetch only returns a summary and refuses [localhost](http://localhost). A subagent cannot ask questions, so the interview and the loop moved into a main-session skill, `/crit`. The critic stayed an agent, `critique-partner`, with critique, revise, verify and reconsider modes.

## How it was tested

`check.mjs --selftest` runs 55 cases. Two headless runs on 2 November exercised the whole flow. The second used all three passes, and its verifier corrected five factual details.

## Where it goes

It is public at [github.com/bbulman/critique-partner](https://github.com/bbulman/critique-partner). The public files are generic. Workshopr's specifics live in a project rules file, which the skill and agent read first.

The tutorial for version 1 is "Worked example, Critique Partner (design review)".
