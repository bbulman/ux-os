## How it was built

Built on 24 October 2026. Two public skills had the same name, one from lyndonkl/claude and one from mcorbett51090/RavenClaude, so we combined them into a single skill instead of installing either. Neither repo has an open licence, so the content was rewritten rather than copied. Six posts from [jarango.com](http://jarango.com) were also used. Every source is credited at the bottom of `SKILL.md`.

## What is in it

`SKILL.md` holds the method. `references/` holds the methodology, templates and rubric. `evals/` holds three test cases: a blog taxonomy built from a corpus, a SaaS sidebar restructure and a site migration with redirects.

## How it was tested

We used skill-creator to run each case with the skill and without it, over two rounds.

| Round | With the skill | Without | Before this round |
| --- | --- | --- | --- |
| 1 | 24 of 25 | 23 of 25 | First version |
| 2 | 29 of 29 | 22 of 29 | Four fixes (place every item, check the proposal agrees with itself, scale to the job, no guessed platform behaviour) and four sharper checks |

With the skill, runs take about 70% longer and use about 25% more tokens.

## Trigger check (9 November 2026)

In this project about 36 of roughly 505 skills get a description in Claude's list, and this one appears by name only. We tested 20 realistic requests with the real name, with the information-architecture skill inside ux-strategy also available. Claude chose this skill on 9 of the 10 requests it should win and on none of the 10 near-misses. On the tenth it listed files first, so it may still have reached the skill later.

The tuning tool in skill-creator was stopped after a baseline. It tests a copy with a temporary name, and that copy scored 0 of 10 with the rival winning 9. The real name scored 9 of 10 with the same description, so the description was left unchanged.

## Still open

- The description does not reach Claude while the skill list is this long.
- Each trigger request ran once, so 9 of 10 shows a direction and is not a precise rate.
- Any future edit should rerun the three evals.

## Split into twelve skills (9 November 2026)

The single skill became this front door and eleven focused skills: content-inventory, card-sort, taxonomies, sitemaps, navigation, labeling, content-models, url-structure, redirect-maps, tree-tests and findability. Nine have a checking script with its own self-test, so counting and checking is done by code rather than by eye. Credits were removed from the text of the skills at Bill's request. The split was published to the same repo on 9 November 2026, with the single skill kept at the single-skill tag. The repo's README and NOTICE still name the sources, because RavenClaude's MIT licence requires its notice to ship with anything drawing on it.

| Run | Score on the three evals |
| --- | --- |
| The single skill, same day | 25 of 29 |
| The split, first build | 26 of 29 |
| The split, after an independent review and fixes | 28 of 29 |

Each was one run per case, graded from the deliverable file, so these are not comparable with the rounds above. The one remaining miss is the grader's reading: 19 URLs that correctly stay at the same address are not counted as mapped.

Trigger check, one request per skill with everything loaded: 10 of 12 fired correctly. sitemaps lost to site-architecture outside the platform project, and findability lost to systematic-debugging on a request that read like a bug report.

The scripts have only been tested on made-up data. The original skill is backed up.
