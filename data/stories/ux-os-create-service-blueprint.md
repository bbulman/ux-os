## What it is for

A service blueprint shows one scenario as steps in time and lanes of who or what does the work, so a failure can be traced from what the person sees to the system behind it. The research set had personas, jobs and journeys, and nothing for the service itself.

## How it was built

Built on 13 November 2026. Bill asked for a copy of the research files filled from four existing Workshopr documents. Three had a file to go into. The service blueprint did not, so the file and its command were added.

- `blueprint.md` has one section per step, each with seven lanes: physical evidence, customer actions, other actors, frontstage, backstage, support and failure points. A closing section holds what only shows when the lanes are read together.
- It has no proto or real mode and no banner. Each line is tagged for what it rests on, like any claim.
- The check requires at least three steps, numbered and named once each, every lane present, and no lane left empty. The first version let an empty lane pass, which an independent review caught.
- Code and configuration files are cited as ledger sources by path, written out in the claim and never as a link.
- The worked example is a `blueprint.md` for Workshopr: 12 steps from the Workshopr blueprint, every line a belief, because none of it was checked against the code.

The same day added `guide.mjs`, a script with no command of its own. It writes a templates folder: what each file is for, a blank copy of every template, and links to one project as the example.

## What is not done

- The typed command has not been run in a live session.
- The book does not show the blueprint.
- The check does not require a failure point per step, or that the cross-lane findings are inferences.
