// A complete minimal idea folder that keeps the contract, and one break per failure type.

import { claimsHash } from '../parse.mjs';

const NOTES = '## Run notes\n- Searched: fixture only.\n';

const EV = 'evidence/S4-interviews.md';
export const link = (n, m = 1) => `[S4 P${n}](${EV}#p${n}-excerpt-${m})`;
const ALL = [1, 2, 3, 4, 5].map((n) => link(n)).join(' ');
// Kept out of CLEAN because status.mjs reads evidence file times, and its tests build folders from CLEAN.
export const EVIDENCE = { [EV]: [1, 2, 3, 4, 5].map((n) => `<a id="p${n}-excerpt-1"></a>\nP${n}: a passage.\n`).join('\n') };
export const WORK_FILE = 'work/2026-11-01-form.md';
export const AUDIT_FILE = 'work/2026-11-01-form.audit.md';
const WORK_ROWS = `| 1 | Owners fill it in between patients | [S4 P1](../${EV}#p1-excerpt-1) |
| 2 | Clinics run bookings on paper today | [B1: confirmed S4 P1-P5] |
| 3 | Owners would pay monthly | [B2: supported S2] |
| 4 | One column is quicker to complete | [practice] |
| 5 | Offer save and continue | [proposed S4] |
| 6 | How many fields owners will finish | [gap] |
| 7 | Owners keep the diary at the desk | [S4 P2](../${EV}#p2-excerpt-1) [S4 P3](../${EV}#p3-excerpt-1) |
`;

export const CLEAN = {
  'sources.md': `# Sources: Test idea

| ID | Where | Title | Publisher | Published | Fetched | Kind | Status |
|---|---|---|---|---|---|---|---|
| S1 | https://example.org/a | Annual report | Example Stats | 2026-01-01 | 2026-11-01 | original | verified |
| S2 | https://example.org/b | Market note | Example News | 2026-02-01 | 2026-11-01 | secondary | verified |
| S3 | https://example.org/c | Vendor blog | Example Co | 2026-03-01 | 2026-11-01 | vendor | unverified |
| S4 | evidence/S4-interviews.md | Five interviews | Test team | 2026-10-01 | 2026-11-01 | first-party | verified |
| S5 | https://example.org/e | Thread | Example Forum | 2026-04-01 | 2026-11-01 | forum | verified |
`,
  'beliefs.md': `# Beliefs: Test idea

| ID | Belief | Basis | Certainty | Would drop it if | Origin | Recorded |
|---|---|---|---|---|---|---|
| B1 | Clinics run bookings on paper | saw | sure | Most use software | create-jtbd | 2026-11-01 |
| B2 | Owners would pay monthly | reasoned | guessing | Nobody pays | create-persona | 2026-11-01 |
| B3 | Patients never reschedule | heard | fairly sure | Reschedules are common | create-journey-map | 2026-11-01 |
`,
  'primary.md': `# Primary research: Test idea

## Studies
| Study | Hash | Who ran it | When | People | How recruited | What was asked | Known bias |
|---|---|---|---|---|---|---|---|
| S4 | abc123 | Test team | 2026-10 | 5 | Referrals | Booking habits | Referrals only |

## Participants
| Code | Role | Segment | Org | Study |
|---|---|---|---|---|
| P1 | Clinic owner | Solo | O1 | S4 |
| P2 | Clinic owner | Solo | O2 | S4 |
| P3 | Practice manager | Group | O3 | S4 |
| P4 | Physiotherapist | Group | O4 | S4 |
| P5 | Clinic owner | Group | O5 | S4 |

## Excerpts
| Verbatim | Code | Theme | Grade | Prompted | Beliefs | Evidence |
|---|---|---|---|---|---|---|
| "I still write it in the diary" | workaround | Paper | reported | no | B1 | ${link(1)} |
| "The book lives on the desk" | workaround | Paper | reported | no | B1 | ${link(2)} |
| "We print the week out" | workaround | Paper | reported | no | B1 | ${link(3)} |
| "I pencil them in" | workaround | Paper | reported | no | B1 | ${link(4)} |
| "Still the paper diary" | workaround | Paper | reported | no | B1 | ${link(5)} |
`,
  'jobs.md': `# Jobs: Test idea

Proto: 1 of 1 beliefs validated. Treat everything else as an assumption.

## The core job
> When my day fills up, I want to keep every slot paid, so I can stay open. [B1: confirmed S4 P1-P5]
Confidence: high

## The three dimensions
| Dimension | What they want | Evidence |
|---|---|---|
| Functional | Full diary | [S4 P1-P5] |
Confidence: high

## The job map
| Stage | What they do | Where it hurts | Evidence |
|---|---|---|---|
| Plan | Plan the week | Double bookings | [S4 P1-P3] |
| Fill | Finds the diary | Left at home | [S4 P1-P3] |
| Remind | Texts patients | Slow | [S4 P1-P3] |
| Treat | Sees patients | Interrupted | [S4 P1-P3] |
| Close | Takes payment | Chasing | [S4 P1-P3] |
Confidence: high

## What gets hired today
| Solution | Hired for | Fired because | Why they stay | Evidence |
|---|---|---|---|---|
| Paper diary | Speed | Lost pages | Habit | [S4 P1-P2] |
Confidence: high

## Top underserved outcomes
| Outcome | Importance | Satisfaction | Evidence |
|---|---|---|---|
| Fewer no-shows | 5 | 2 | [S5] |
Confidence: low

## Job statements by segment
| Segment | Job statement | Evidence |
|---|---|---|
| Solo | Keep my week full | [S4 P1-P2] |
Confidence: high

## Design implications
- Lead with reminders. [inference S4, S5]
Confidence: low

${NOTES}`,
  'personas.md': `# Personas: Test idea

Proto: 1 of 2 beliefs validated. Treat everything else as an assumption.

## Segmentation
- **Variable:** How much admin they do themselves. [inference S4, S1]
- **Low end:** Has a manager. [S4 P3]
- **High end:** Does it all. [S4 P1]
- **Primary:** Sam, because the owner decides. [S4 P1-P2]

| Persona | Position | Why here | Evidence |
|---|---|---|---|
| Sam | 90 | Works alone | [S4 P1] |
Confidence: medium

## Persona: Sam
> "I still write it in the diary" [S4 P1]

### Day in the life
- Answers the phone between patients. [S4 P1-P2]

### Goals
- Keep every slot paid. [B1: confirmed S4 P1-P5]

### Needs
- Fewer calls. [S4 P1-P2]

### Motivations
- Independence. [S4 P1-P2]

### Frustrations
- No-shows. [S5]

### Previous experience
- Tried one booking app. [S4 P1-P2]

### Technology
- Phone first. [S4 P1-P2]

### Design implications
- Works one-handed. [inference S4, S1]

### Least evidenced claim
- Would pay monthly. [B2: supported S2]

### How we would know this is wrong
- Owners refuse a monthly price in test. [gap]

Confidence: low

${NOTES}`,
  'journeys.md': `# Journeys: Test idea

Proto: 0 of 1 beliefs validated. Treat everything else as an assumption.

## Journey: Sam, a week of bookings

### Scenario
- A solo owner fills next week. [S4 P1-P2]

### Boundaries
- Starts on Sunday night, ends Friday. [S4 P1-P2]

### Stages
| Phase | Goal | Doing | Touchpoints | Thinking | Emotion | Pain points | Opportunities | Evidence |
|---|---|---|---|---|---|---|---|---|
| Plan | Fill the week | Reads the diary | Diary | Am I full? | 3 | Gaps | Waitlist | [inference S4, S1] |
| Reschedule | Move a patient | Phones them | Phone | Not again | 1 | Patients reschedule often | Self-service | [B3: contradicted S5] |

### Moments that matter
- **Reschedule:** Where the day falls apart. [S4 P1-P2]

Confidence: low

## Future journey: Sam, a week of bookings

### Stages
| Phase | Today's pain | What changes | Doing | Thinking | Emotion | Risk | Evidence |
|---|---|---|---|---|---|---|---|
| Reschedule | Phone tag | Patients move themselves | Nothing | Good | 4 | Patients may not bother | [proposed S4, S5] |

### What has to be true
- **Riskiest:** Patients will use a link. [proposed]

${NOTES}`,
  'empathy.md': `# Empathy: Test idea

Proto: 1 of 1 beliefs validated. Treat everything else as an assumption.

## Map: Sam, a cancellation lands

### Says
- "I still write it in the diary" [S4 P1]

### Does
- Phones the next patient on the list. [S4 P1-P2]

### Thinks
- The week is slipping away. [inference S4, S1]

### Feels
- Rushed. [inference S4, S1]

### Say-do gaps
- Says the diary works, yet keeps a backup list. [B1: confirmed S4 P1-P5]

Confidence: medium

${NOTES}`,
  'affinity.md': `# Affinity: Test idea

## Themes
| Theme | Clusters | People | Orgs | What it tells us | Evidence |
|---|---|---|---|---|---|
| Paper persists | 1 | 5 | 5 | Habit outlasts software | ${ALL} |
Confidence: high

## Cluster: Owners keep paper because it is always to hand
| Note | Who | Evidence |
|---|---|---|
| Keeps the book on the desk | Clinic owner | ${link(2)} |
| Prints the week | Practice manager | ${link(3)} |
Confidence: medium

## Outliers
| Note | Who | Why it stands apart | Evidence |
|---|---|---|---|
| None | nobody | Every note clustered | [gap] |
Confidence: low

## What surprised us
- Nobody raised price first. [inference S4]
Confidence: medium

${NOTES}`,
  'cardsort.md': `# Card sort: Test idea

## Study
- **Type:** open [S4 P1-P5]
- **Participants:** 5 [S4 P1-P5]
- **Cards:** 12 [S4 P1-P5]
- **Run:** Online, October 2026. [S4 P1-P5]
Confidence: high

## Groups
| Group | Cards | Agreement | Suggested label | Evidence |
|---|---|---|---|---|
| 1 | Book, Cancel | 0.8 | Appointments | [S4 P1-P5] |
Confidence: high

## Cards without a clear home
| Card | Closest to | Share | What to do | Evidence |
|---|---|---|---|---|
| Invoices | Reports | 0.3 | Second route | [S4 P1-P5] |
Confidence: high

## Pairs people keep together
| Card | Card | Together | Evidence |
|---|---|---|---|
| Book | Cancel | 1 | [S4 P1-P5] |
Confidence: high

## Labels people used
| Label | People | Cards it held | Evidence |
|---|---|---|---|
| Appointments | 4 | Book, Cancel | [S4 P1-P4] |
Confidence: high

## What this means for the structure
- Put booking and cancelling under Appointments. [inference S4]
Confidence: medium

${NOTES}`,
  'summary.md': `# Summary: Test idea

## The short version
- Clinics stay on paper out of habit. ${ALL}
Confidence: high

## What we found
| Finding | Strength | People | Orgs | Against | Evidence |
|---|---|---|---|---|---|
| Paper persists | strong | 5 | 5 | none found | ${ALL} |
Confidence: high

## Where people disagreed
- No disagreement surfaced. [gap]
Confidence: low

## What this changes
- Lead with reminders. [inference S4, S1]
Confidence: medium

## What we still do not know
- Whether owners would pay monthly. [gap]
Confidence: low

${NOTES}`,
  'interview-script.md': `# Interview script: Test idea

## What this has to settle
- Do clinics pay?

## Who to talk to
- Owners who changed systems this year.

## Screener
| Question | Keep if | Screen out if |
|---|---|---|
| Last change? | This year | Never |

## Before you start
- Ask to record.

## Warm-up
- Tell me about your clinic.

## The story
| Prompt | Listen for | Tests |
|---|---|---|
| Tell me about the last time | The trigger | B2 |

## Probes
- What happened next?

## Close
- Anything I missed?

## Coverage
| Belief or question | Reached by |
|---|---|
| B2 | The story |

## Note sheet
- Codes as in the intake.

${NOTES}`,
  'usability-plan.md': `# Usability plan: Test idea

## What this has to settle
- Can patients rebook?

## What is being tested
- A prototype.

## Who to test with
- 5 patients.

## Tasks
### Task 1: Move a visit
- **Situation:** Your Tuesday no longer works.
- **Starts at:** The reminder text.
- **Success:** Moved without help.
- **Partial:** Moved with a hint.
- **Failure:** Not moved.
- **Stop after:** 3 minutes.

## Pass lines
| Measure | How it is taken | Pass line | If we miss it |
|---|---|---|---|
| Completion | Observed | 4 of 5 | Redesign |

## Session plan
| Minutes | What happens | Moderator says |
|---|---|---|
| 5 | Welcome | Thanks |

## Severity scale
| Level | Meaning |
|---|---|
| 1 | Stops people |

## After the sessions
- Notes go to the inbox.

${NOTES}`,
  'diary-study.md': `# Diary study: Test idea

## What this has to settle
- How often do slots go empty?

## Why a diary
- People misremember.

## Who takes part
- 8 owners.

## The shape
- **Length:** Two weeks.
- **Entry trigger:** Each cancellation.
- **Time per entry:** One minute.
- **Tool:** WhatsApp.

## Prompts
| Prompt | Format | When | Why we ask |
|---|---|---|---|
| What just happened? | Voice | On the event | The moment |

## Schedule
| Day | Participants | Researcher |
|---|---|---|
| 1 | Welcome call | Reply |

## Keeping people in
- Pay in stages.

## What participants receive
- A welcome note.

## Consent and privacy
- Delete on request.

## Analysis
- Closing interview.

${NOTES}`,
  'survey.md': `# Survey: Test idea

## What this has to settle
- How many clinics use software?

## Who and how many
- 278 of 1000.

## Analysis plan
| Decision | Number to look at | Cut by | Result that changes the decision |
|---|---|---|---|
| Build | Share on paper (tests B1) | Size | Under 15 percent |

## Questions
| Number | Question | Type | Options | Skip logic | Feeds |
|---|---|---|---|---|---|
| 1 | What did you use last week? | Single | Paper, software, none | None | Build |

## Bias check
| Question | Risk | What we changed |
|---|---|---|
| 1 | None | Nothing |

## Before it goes out
- Pilot with 5.

${NOTES}`,
  'repository.md': `# Research repository: Test

## How this works
- One row per study.

## Studies
| Study | Idea | When | Method | People | Orgs | Where | Review by |
|---|---|---|---|---|---|---|---|
| Five interviews | Test idea | 2026-10 | Interview | 5 | 5 | evidence | 2028-04 |

## Insights
| Insight | Idea | Strength | People | Orgs | Tags | Source | Last checked |
|---|---|---|---|---|---|---|---|
| Paper persists | Test idea | strong | 5 | 5 | habits | summary.md | 2026-11 |

## Tags
| Tag | Means |
|---|---|
| habits | What people keep doing |

## Open questions
| Question | Idea | Impact | Source |
|---|---|---|---|
| Would owners pay? | Test idea | high | summary.md |

## Consent and retention
| Study | Participants agreed to | Raw files kept until | Status |
|---|---|---|---|
| Five interviews | Internal use | 2027-11 | In date |

${NOTES}`,
  [WORK_FILE]: `# Form: Test idea

- **Skill:** interaction-design:design-form
- **Pack:** interaction-design
- **Version:** 0123456789ab
- **Given:** brief.md, personas.md (proto), jobs.md (proto), journeys.md (proto), beliefs.md, primary.md, sources.md
- **Pick:** picked
- **Ran:** 2026-11-01

## Claims
| # | Claim | Basis |
|---|---|---|
${WORK_ROWS}
## Output
### Structure
- Name, phone, preferred day.
`,
};

// The claims auditor's report on CLEAN's work file, with nothing left open.
CLEAN[AUDIT_FILE] = `# Audit: 2026-11-01-form.md

- **Work file:** ${WORK_FILE}
- **Claims hash:** ${claimsHash(CLEAN[WORK_FILE])}
- **Audited:** 2026-11-02

## Rows
| # | Verdict | Note |
|---|---|---|
| 1 | sound | P1's excerpt is about keeping the diary to hand |
| 2 | sound | B1 restated, confirmed as beliefs.md and the folder carry it |
| 3 | sound | B2 restated, supported as the folder carries it |
| 4 | sound | form-design/SKILL.md:10 says a single column is almost always correct |
| 5 | could not check | S4 is the interviews, but the motivation is not in an excerpt |
| 6 | under-cited | The job map's Fill stage bears on this |
| 7 | sound | Both excerpts are about the diary on the desk |

## Missing
| Claim | Suggested basis | Pointer |
|---|---|---|
| none | none | none |

## Departures and conflicts
- None found.

## Claims found first
- Owners fill the form in between patients.
- Clinics book on paper today.
`;

const CONNECTED = { '.research-profile.md': '# Research profile: Test\n\n## Design system\n\n- Catalogue: catalogue.json\n', 'catalogue.json': '{"components":{"ws_accordion":{}}}' };
const COMP = '\n  - **Component:** ws_accordion';
const PERSONA_LINE = '- Works one-handed. [inference S4, S1]';
const JOBS_LINE = '- Lead with reminders. [inference S4, S5]';
const withFuture = (cell) => [
  ['journeys.md', "| Phase | Today's pain | What changes | Doing |", "| Phase | Today's pain | What changes | Component | Doing |"],
  ['journeys.md', '| Reschedule | Phone tag | Patients move themselves | Nothing |', `| Reschedule | Phone tag | Patients move themselves | ${cell} | Nothing |`],
];
const NOOP = { file: 'personas.md', find: PERSONA_LINE, replace: PERSONA_LINE };

const CODES = { 'inbox/codes.md': '# Codes\n\n| Code | Org code | Person | Organisation |\n|---|---|---|---|\n| P1 | O1 | Maya Okafor | Harbour Lane Pantry |\n' };

const NOT_SETTLED = 'not settled: 0 of 5 organisations';
const outcomes = (b1, b2 = NOT_SETTLED, b3 = NOT_SETTLED) => ({
  file: 'beliefs.md',
  find: '| Recorded |',
  replace: '| Recorded | Outcome |',
  also: [['| create-jtbd | 2026-11-01 |', `| create-jtbd | 2026-11-01 | ${b1} |`], ['| create-persona | 2026-11-01 |', `| create-persona | 2026-11-01 | ${b2} |`], ['| create-journey-map | 2026-11-01 |', `| create-journey-map | 2026-11-01 | ${b3} |`]],
});

CLEAN['decisions.md'] = `# Decisions: Test idea

## Decisions
| # | Date | Decision | Rests on | Would reverse it |
|---|---|---|---|---|
| 1 | 2026-11-02 | Build for clinics on paper first | [B1: confirmed S4 P1-P5] | Most clinics turn out to use software |
| 2 | 2026-11-03 | Charge monthly | [B2: supported S2] | Nobody pays monthly |
| 3 | 2026-11-03 | Put the diary view first | ${link(2)} | Owners stop keeping the diary at the desk |

## Still open
- Whether patients reschedule. [gap]
`;

export const MUTATIONS = [
  { name: 'a decisions file with nothing still open', expect: 'CLEAN', file: 'decisions.md', find: '\n## Still open\n- Whether patients reschedule. [gap]\n', replace: '' },
  { expect: 'NO_TAG', file: 'decisions.md', find: '| [B2: supported S2] | Nobody pays monthly |', replace: '| a hunch | Nobody pays monthly |' },
  { expect: 'NO_EVIDENCE_LINK', file: 'decisions.md', find: `| ${link(2)} | Owners stop`, replace: '| [S4 P2] | Owners stop' },
  { expect: 'BAD_VALUE', file: 'decisions.md', find: '| 2 | 2026-11-03 | Charge monthly', replace: '| 2 | last week | Charge monthly' },
  { expect: 'BAD_VALUE', file: 'decisions.md', find: '| 3 | 2026-11-03 | Put the diary', replace: '| 5 | 2026-11-03 | Put the diary' },
  { expect: 'CONFLICTING_VERDICT', file: 'decisions.md', find: '[B2: supported S2]', replace: '[B2: contradicted S2]' },
  { expect: 'BAD_TAG', file: 'decisions.md', find: '| Charge monthly | [B2: supported S2] |', replace: '| Charge monthly [B2: supported S2] |  |' },
  { expect: 'BAD_TAG', file: 'decisions.md', find: '| [B2: supported S2] | Nobody pays monthly |', replace: '| [B2: supported S2] | Nobody pays monthly [gap] |' },
  { expect: 'BAD_TAG', file: 'decisions.md', find: '| [B2: supported S2] | Nobody', replace: '| [B2: supported S2] and a hunch | Nobody' },
  { expect: 'BAD_VALUE', file: 'decisions.md', find: '| # | Date | Decision | Rests on | Would reverse it |', replace: '| # | Date | Decision | Basis | Would reverse it |' },
  { expect: 'BAD_VALUE', file: 'decisions.md', find: '| 3 | 2026-11-03 | Put the diary', replace: '| 3 | 2026-11-01 | Put the diary' },
  { expect: 'BAD_VALUE', file: 'decisions.md', find: '| 3 | 2026-11-03 | Put the diary', replace: '| 3 | 2099-01-01 | Put the diary' },
  { expect: 'BAD_VALUE', file: 'decisions.md', find: '| 2 | 2026-11-03 | Charge monthly', replace: '| 2 | 2026-11-03 | Replaces 2: charge monthly' },
  { name: 'a decision that replaces an earlier one', expect: 'CLEAN', file: 'decisions.md', find: '| 2 | 2026-11-03 | Charge monthly', replace: '| 2 | 2026-11-03 | Replaces 1: charge monthly' },
  { name: 'a decision resting on two tags', expect: 'CLEAN', file: 'decisions.md', find: '| [B2: supported S2] | Nobody', replace: '| [B2: supported S2] [S1] | Nobody' },
  { expect: 'LINK_OUTSIDE_EVIDENCE', file: WORK_FILE, find: '](../evidence/S4-interviews.md#p1-excerpt-1)', replace: '](../../research/evidence/S4-interviews.md#p1-excerpt-1)' },
  { name: 'an outcome that meets the bar', expect: 'CLEAN', ...outcomes('confirmed S4 P1-P5') },
  { name: 'an unsettled outcome needs no bar', expect: 'CLEAN', ...outcomes(NOT_SETTLED) },
  { expect: 'UNDER_BAR', ...outcomes(NOT_SETTLED, 'confirmed S4 P1-P5') },
  { expect: 'UNDER_BAR', ...outcomes('confirmed S4 P1') },
  { expect: 'UNDER_BAR', ...outcomes('confirmed S1 threshold') },
  { expect: 'BAD_VERDICT', ...outcomes('confirmd S4 P1-P5') },
  { expect: 'BAD_VERDICT', ...outcomes('not settled: 5 of 5 organisations') },
  { expect: 'BAD_VERDICT', ...outcomes('') },
  { expect: 'BAD_TAG', ...outcomes('confirmed banana') },
  { expect: 'UNKNOWN_SOURCE', ...outcomes('confirmed S99 P1-P5') },
  { expect: 'UNKNOWN_PARTICIPANT', ...outcomes('confirmed S4 P1-P9') },
  { expect: 'CONFLICTING_VERDICT', ...outcomes('refuted S4 P1-P5') },
  { expect: 'UNKNOWN_SOURCE', file: 'jobs.md', find: '| 5 | 2 | [S5] |', replace: '| 5 | 2 | [S99] |' },
  { expect: 'UNKNOWN_BELIEF', file: 'personas.md', find: '[B2: supported S2]', replace: '[B9: supported S2]' },
  { expect: 'UNKNOWN_PARTICIPANT', file: 'jobs.md', find: '[S4 P1-P3]', replace: '[S4 P1-P9]' },
  { expect: 'NO_TAG', file: 'summary.md', find: `out of habit. ${ALL}`, replace: 'out of habit.' },
  { expect: 'LOOSE_PARAGRAPH', file: 'summary.md', find: '## Where people disagreed\n', replace: '## Where people disagreed\nA paragraph with no evidence.\n' },
  { expect: 'NO_CONFIDENCE', file: 'affinity.md', find: '- Nobody raised price first. [inference S4]\nConfidence: medium', replace: '- Nobody raised price first. [inference S4]' },
  { expect: 'BAD_CONFIDENCE', file: 'summary.md', find: '- Whether owners would pay monthly. [gap]\nConfidence: low', replace: '- Whether owners would pay monthly. [gap]\nConfidence: certain' },
  { expect: 'CONFIDENCE_NOT_EARNED', file: 'jobs.md', find: '| 5 | 2 | [S5] |\nConfidence: low', replace: '| 5 | 2 | [S5] |\nConfidence: high' },
  { expect: 'CONFIDENCE_NOT_EARNED', file: 'affinity.md', find: '| [gap] |\nConfidence: low', replace: '| [gap] |\nConfidence: high' },
  { expect: 'MISSING_SECTION', file: 'affinity.md', find: '## What surprised us', replace: '## Surprises' },
  { expect: 'EXTRA_SECTION', file: 'summary.md', find: '## Run notes', replace: '## Surprise\n- A section nobody asked for. [S5]\nConfidence: low\n\n## Run notes' },
  { expect: 'MISSING_SUBSECTION', file: 'personas.md', find: '### Goals', replace: '### Aims' },
  { expect: 'NO_BANNER', file: 'personas.md', find: 'Proto: 1 of 2 beliefs validated. Treat everything else as an assumption.', replace: '' },
  { expect: 'BANNER_COUNT', file: 'personas.md', find: 'Proto: 1 of 2 beliefs', replace: 'Proto: 2 of 2 beliefs' },
  { expect: 'BAD_VERDICT', file: 'personas.md', find: '[B2: supported S2]', replace: '[B2: probably S2]' },
  { expect: 'UNDER_BAR', file: 'jobs.md', find: '[B1: confirmed S4 P1-P5]', replace: '[B1: confirmed S4 P1-P2]' },
  { expect: 'CONFIDENCE_NOT_EARNED', file: 'summary.md', find: `- Clinics stay on paper out of habit. ${ALL}\nConfidence: high`, replace: '- Clinics stay on paper out of habit. [gap]\nConfidence: medium' },
  { expect: 'UNDER_BAR', file: 'primary.md', find: '| "Still the paper diary" | workaround | Paper | reported |', replace: '| "Still the paper diary" | workaround | Paper | opinion |' },
  { expect: 'UNDER_BAR', file: 'primary.md', find: '| P5 | Clinic owner | Group | O5 | S4 |', replace: '| P5 | Clinic owner | Group | O1 | S4 |' },
  { expect: 'BAD_VALUE', file: 'journeys.md', find: '| Am I full? | 3 |', replace: '| Am I full? | 9 |' },
  { expect: 'BAD_VALUE', file: 'journeys.md', find: '- **Reschedule:**', replace: '- **Nowhere:**' },
  { expect: 'BAD_VALUE', file: 'personas.md', find: '| Sam | 90 |', replace: '| Sam | 140 |' },
  { expect: 'BAD_VALUE', file: 'personas.md', find: '- **Primary:** Sam, because the owner decides. [S4 P1-P2]\n', replace: '' },
  { expect: 'BAD_VALUE', file: 'jobs.md', find: '| Plan | Plan the week | Double bookings | [S4 P1-P3] |\n| Fill | Finds the diary | Left at home | [S4 P1-P3] |\n| Remind | Texts patients | Slow | [S4 P1-P3] |\n', replace: '' },
  { expect: 'UNDER_BAR', file: 'primary.md', find: '| reported | no | B1 | ' + link(5) + ' |', replace: '| reported | no | B2 | ' + link(5) + ' |' },
  { expect: 'UNDER_BAR', file: 'primary.md', find: '| reported | no | B1 | ' + link(5) + ' |', replace: '| reported | yes | B1 | ' + link(5) + ' |' },
  { expect: 'UNDER_BAR', file: 'jobs.md', find: '[B1: confirmed S4 P1-P5]', replace: '[B1: confirmed S3 threshold]' },
  { expect: 'BAD_TAG', file: 'personas.md', find: '[B2: supported S2]', replace: '[B2 supported S2]' },
  { expect: 'BAD_TAG', file: 'jobs.md', find: '| 5 | 2 | [S5] |', replace: '| 5 | 2 | [S5x] |' },
  { expect: 'BAD_TAG', file: 'affinity.md', find: '[inference S4]', replace: '[inference]' },
  { expect: 'BAD_TAG', file: 'journeys.md', find: '[B3: contradicted S5]', replace: '[B3: contradicted]' },
  { expect: 'CONFLICTING_VERDICT', file: 'personas.md', find: '[B1: confirmed S4 P1-P5]', replace: '[B1: contradicted S2]' },
  { expect: 'EMPTY_SECTION', file: 'summary.md', find: `- Clinics stay on paper out of habit. ${ALL}\nConfidence: high`, replace: 'Confidence: high' },
  { expect: 'CONFIDENCE_NOT_EARNED', file: 'summary.md', find: `- Clinics stay on paper out of habit. ${ALL}\nConfidence: high`, replace: '- Clinics stay on paper out of habit. [inference S1, S2]\nConfidence: medium' },
  { expect: 'BAD_TAG', file: 'journeys.md', find: '[proposed S4, S5]', replace: '[proposed soon]' },
  { expect: 'BAD_VALUE', file: 'journeys.md', find: '| Patients may not bother |', replace: '| Patients may not bother |', also: [['| 4 | Patients', '| 8 | Patients']] },
  { expect: 'BAD_VALUE', file: 'summary.md', find: '| strong | 5 | 5 |', replace: '| huge | 5 | 5 |' },
  { expect: 'BAD_VALUE', file: 'cardsort.md', find: '- **Type:** open', replace: '- **Type:** freestyle' },
  { expect: 'MISSING_SECTION', file: 'survey.md', find: '## Bias check', replace: '## Checks' },
  { expect: 'REAL_HAS_BELIEF', file: 'empathy.md', find: 'Proto: 1 of 1 beliefs validated. Treat everything else as an assumption.', replace: 'From research: 5 people, 5 organisations. Every finding traces to what they did or said.' },
  { expect: 'BANNER_COUNT', file: 'empathy.md', find: 'Proto: 1 of 1 beliefs validated. Treat everything else as an assumption.', replace: 'From research: 9 people, 9 organisations. Every finding traces to what they did or said.', also: [['[B1: confirmed S4 P1-P5]', '[S4 P1-P5]']] },
  { expect: 'REAL_HAS_DESK', file: 'empathy.md', find: 'Proto: 1 of 1 beliefs validated. Treat everything else as an assumption.', replace: 'From research: 5 people, 5 organisations. Every finding traces to what they did or said.', also: [['[B1: confirmed S4 P1-P5]', '[S4 P1-P5]'], ['- The week is slipping away. [inference S4, S1]', '- The week is slipping away. [S1]']] },
  { expect: 'CLEAN', name: 'a real-mode map', file: 'empathy.md', find: 'Proto: 1 of 1 beliefs validated. Treat everything else as an assumption.', replace: 'From research: 5 people, 5 organisations. Every finding traces to what they did or said.', also: [['[B1: confirmed S4 P1-P5]', ALL], ['[S4 P1]', link(1)], ['[S4 P1-P2]', `${link(1)} ${link(2)}`], ['- The week is slipping away. [inference S4, S1]', '- The week is slipping away. [inference S4]'], ['- Rushed. [inference S4, S1]', '- Rushed. [inference S4]']] },
  { expect: 'BAD_VALUE', file: 'cardsort.md', find: '| Book | Cancel | 1 |', replace: '| Book | Cancel | 16 of 16 |' },
  { expect: 'UNDER_BAR', file: 'primary.md', find: '| P5 | Clinic owner | Group | O5 | S4 |', replace: '| P5 | Clinic owner | Group | not recorded | S4 |' },
  { expect: 'NOT_PROPOSED', file: 'journeys.md', find: '[proposed S4, S5]', replace: '[S4 P1-P3]' },
  { expect: 'PROPOSED_OUT_OF_PLACE', file: 'jobs.md', find: '| 5 | 2 | [S5] |', replace: '| 5 | 2 | [proposed S5] |' },
  { expect: 'UNDER_BAR', file: 'empathy.md', find: 'Proto: 1 of 1 beliefs validated. Treat everything else as an assumption.', replace: 'From research: 0 people, 0 organisations. Every finding traces to what they did or said.', also: [['[B1: confirmed S4 P1-P5]', '[gap]'], ['[S4 P1]', '[gap]'], ['[S4 P1-P2]', '[gap]'], ['- The week is slipping away. [inference S4, S1]', '- The week is slipping away. [gap]'], ['- Rushed. [inference S4, S1]', '- Rushed. [gap]']] },
  { expect: 'UNDER_BAR', file: 'journeys.md', find: '[B3: contradicted S5]', replace: '[B3: confirmed S4 threshold]' },
  { expect: 'CLEAN', name: 'a threshold result on a belief the survey plan names', file: 'jobs.md', find: '[B1: confirmed S4 P1-P5]\nConfidence: high', replace: '[B1: confirmed S4 threshold]\nConfidence: medium' },
  { expect: 'BAD_LEDGER', file: 'sources.md', find: '| https://example.org/e |', replace: '| inbox/raw.txt |' },
  { expect: 'REAL_HAS_DESK', file: 'affinity.md', find: '[S4 P2]', replace: '[S2]' },
  { expect: 'BAD_VALUE', file: 'summary.md', find: `| none found | ${ALL} |`, replace: `| none found | ${link(1)} ${link(2)} |` },
  { expect: 'BAD_VALUE', file: 'primary.md', find: '| P5 | Clinic owner | Group | O5 | S4 |', replace: '| P5 | Clinic owner | Group | Acme Ltd | S4 |' },
  { expect: 'BAD_VALUE', file: 'repository.md', find: '| evidence | 2028-04 |', replace: '| inbox/raw.txt | 2028-04 |' },
  { expect: 'BAD_LEDGER', file: 'sources.md', find: '| evidence/S4-interviews.md |', replace: '| inbox/raw.txt |' },
  { expect: 'BANNER_COUNT', file: 'journeys.md', find: '[B3: contradicted S5]', replace: '[B3: refuted S4 P1-P5]' },
  { expect: 'BAD_LEDGER', file: 'sources.md', find: '| original | verified |', replace: '| blog | verified |' },
  { expect: 'NO_EVIDENCE_LINK', file: 'affinity.md', find: link(2), replace: '[S4 P2]' },
  { expect: 'NO_EVIDENCE_LINK', file: 'affinity.md', find: link(2), replace: `[S4 P1-P2](${EV}#p1-excerpt-1)` },
  { expect: 'NO_EVIDENCE_LINK', file: 'affinity.md', find: link(2), replace: `[S4 P2](${EV})` },
  { expect: 'NO_EVIDENCE_LINK', file: 'summary.md', find: `| none found | ${ALL} |`, replace: `| none found | ${ALL} [S4](${EV}) |` },
  { expect: 'NO_EVIDENCE_LINK', file: 'affinity.md', find: link(2), replace: '[S4 P2](evidence/S4 interviews.md#p2-excerpt-1)' },
  { expect: 'NO_EVIDENCE_LINK', file: 'primary.md', find: link(5), replace: '[S4 P5]' },
  { expect: 'BROKEN_EVIDENCE_LINK', file: 'affinity.md', find: link(2), replace: link(2, 9) },
  { expect: 'BROKEN_EVIDENCE_LINK', file: 'affinity.md', find: link(2), replace: '[S4 P2](evidence/S9-gone.md#p2-excerpt-1)' },
  { expect: 'BROKEN_EVIDENCE_LINK', add: { [EV]: `${EVIDENCE[EV]}\n<a id="maya-excerpt-1"></a>\nA passage.\n` }, file: 'affinity.md', find: link(2), replace: `[S4 P2](${EV}#maya-excerpt-1)` },
  { expect: 'BROKEN_EVIDENCE_LINK', drop: [EV], file: 'affinity.md', find: 'Paper persists', replace: 'Paper persists' },
  { expect: 'LINK_NOT_RECORDED', add: { [EV]: `${EVIDENCE[EV]}\n<a id="p2-excerpt-2"></a>\nA passage.\n` }, file: 'affinity.md', find: link(2), replace: link(2, 2) },
  { expect: 'LINK_NOT_RECORDED', file: 'affinity.md', find: link(2), replace: `[S4 P2](${EV}#p3-excerpt-1)` },
  { expect: 'LINK_OUTSIDE_EVIDENCE', file: 'affinity.md', find: link(2), replace: '[S4 P2](inbox/raw.md#p2-excerpt-1)' },
  { expect: 'LINK_OUTSIDE_EVIDENCE', file: 'affinity.md', find: link(2), replace: `[S4 P2](../${EV}#p2-excerpt-1)` },
  { expect: 'NO_COMPONENT_LINE', add: CONNECTED, ...NOOP, more: [['jobs.md', JOBS_LINE, JOBS_LINE + COMP], ...withFuture('ws_accordion')] },
  { expect: 'NO_COMPONENT_LINE', add: CONNECTED, file: 'jobs.md', find: JOBS_LINE, replace: JOBS_LINE, more: [['personas.md', PERSONA_LINE, PERSONA_LINE + COMP], ...withFuture('ws_accordion')] },
  { expect: 'NO_COMPONENT_LINE', add: CONNECTED, file: 'personas.md', find: PERSONA_LINE, replace: PERSONA_LINE + COMP, more: [['jobs.md', JOBS_LINE, JOBS_LINE + COMP]] },
  { expect: 'UNKNOWN_COMPONENT', add: CONNECTED, file: 'personas.md', find: PERSONA_LINE, replace: `${PERSONA_LINE}\n  - **Component:** ws_invented`, more: [['jobs.md', JOBS_LINE, JOBS_LINE + COMP], ...withFuture('ws_accordion')] },
  { expect: 'BAD_CATALOGUE', add: { ...CONNECTED, 'catalogue.json': '{not json' }, ...NOOP },
  { expect: 'BAD_CATALOGUE', add: CONNECTED, drop: ['catalogue.json'], ...NOOP },
  { expect: 'CLEAN', name: 'every proposal has a component line', add: CONNECTED, file: 'personas.md', find: PERSONA_LINE, replace: PERSONA_LINE + COMP, more: [['jobs.md', JOBS_LINE, `${JOBS_LINE}\n  - **Component:** no component fits`], ...withFuture('`ws_accordion`')] },
  { expect: 'CLEAN', name: 'a file written before the profile is left alone', add: CONNECTED, profileNewer: true, ...NOOP },
  { expect: 'LINK_OUTSIDE_EVIDENCE', file: 'affinity.md', find: link(2), replace: `${link(2)} [see the transcript](inbox/maya-okafor-raw.md)` },
  { expect: 'LINK_OUTSIDE_EVIDENCE', file: 'affinity.md', find: link(2), replace: `${link(2)} [P2](inbox/raw.md)` },
  { expect: 'LINK_OUTSIDE_EVIDENCE', file: 'summary.md', find: '- Searched: fixture only.', replace: '- Searched: [S4 P2](inbox/maya-okafor-raw.md).' },
  { expect: 'LINK_OUTSIDE_EVIDENCE', file: 'personas.md', find: '[S4 P3]', replace: '[S4 P3](inbox/Maya Okafor.md)' },
  { expect: 'LINK_OUTSIDE_EVIDENCE', file: 'affinity.md', find: link(2), replace: '[S4 P2](evidence/Maya-Okafor.md#p2-excerpt-1)' },
  { expect: 'LINK_OUTSIDE_EVIDENCE', file: 'affinity.md', find: link(2), replace: `${link(2)} [raw](file:///tmp/maya.md)` },
  { expect: 'CLEAN', name: 'a web link in the run notes is left alone', file: 'summary.md', find: '- Searched: fixture only.', replace: '- Searched: [a page](https://example.org/a).' },
  { expect: 'NAME_LEAK', add: CODES, file: 'personas.md', find: '- Answers the phone', replace: '- Maya Okafor answers the phone' },
  { expect: 'NAME_LEAK', add: CODES, file: 'primary.md', find: '| Test team |', replace: '| Harbour Lane Pantry |' },
  { expect: 'NAME_LEAK', add: { ...CODES, 'evidence/S9-okafor-interview.md': 'A passage.\n' }, ...NOOP },
  { expect: 'NAME_LEAK', add: { ...CODES, [EV]: `${EVIDENCE[EV]}\nMaya Okafor said hello.\n` }, ...NOOP },
  { expect: 'CLEAN', name: 'the private key in inbox may hold names', add: CODES, ...NOOP },
  { expect: 'LINK_NOT_RECORDED', file: 'primary.md', find: link(2), replace: `[S4 P2](${EV}#p3-excerpt-1)`, more: [['primary.md', link(3), `[S4 P3](${EV}#p2-excerpt-1)`], ['affinity.md', link(2), `[S4 P2](${EV}#p3-excerpt-1)`], ['affinity.md', link(3), `[S4 P3](${EV}#p2-excerpt-1)`]] },
  { expect: 'LINK_NOT_RECORDED', file: 'primary.md', find: `| B1 | ${link(5)} |\n`, replace: `| B1 | ${link(5)} |\n| "Again" | workaround | Paper | reported | no | none | ${link(5)} |\n` },
  { expect: 'UNKNOWN_COMPONENT', add: CONNECTED, profileNewer: true, file: 'personas.md', find: PERSONA_LINE, replace: `${PERSONA_LINE}\n  - **Component:** ws_invented` },
  { expect: 'UNKNOWN_COMPONENT', add: CONNECTED, file: 'personas.md', find: '- Fewer calls. [S4 P1-P2]', replace: '- Fewer calls. [S4 P1-P2]\n  - **Component:** ws_invented', more: [['personas.md', PERSONA_LINE, PERSONA_LINE + COMP], ['jobs.md', JOBS_LINE, JOBS_LINE + COMP], ...withFuture('ws_accordion')] },
  { expect: 'BAD_CATALOGUE', add: { ...CONNECTED, 'catalogue.json': '{"components":["ws_accordion"]}' }, ...NOOP },
  { expect: 'BAD_CATALOGUE', add: { '.research-profile.md': '# x\n\n## Design system\n\n- Tokens: tokens.css\n' }, ...NOOP },
  { expect: 'CLEAN', name: 'a whole-study link to a file that cannot hold anchors', add: { 'evidence/S4-survey.csv': 'a,b\n1,2\n' }, file: 'summary.md', find: `| none found | ${ALL} |`, replace: `| none found | ${ALL} [S4](evidence/S4-survey.csv) |` },
  { expect: 'WORK_HEADER', file: WORK_FILE, find: '- **Version:** 0123456789ab\n', replace: '' },
  { expect: 'WORK_HEADER', file: WORK_FILE, find: '- **Version:** 0123456789ab', replace: '- **Version:** latest' },
  { expect: 'WORK_HEADER', file: WORK_FILE, find: '- **Pick:** picked', replace: '- **Pick:** maybe' },
  { expect: 'WORK_HEADER', file: WORK_FILE, find: '- **Pack:** interaction-design', replace: '- **Pack:** ux-strategy' },
  { expect: 'WORK_HEADER', file: WORK_FILE, find: '- **Ran:** 2026-11-01', replace: '- **Ran:** 2026-11-01\n- **Mood:** fine' },
  { expect: 'WORK_NO_CLAIMS', file: WORK_FILE, find: WORK_ROWS, replace: '' },
  { expect: 'MISSING_SECTION', file: WORK_FILE, find: '## Claims', replace: '## Assertions' },
  { expect: 'PRACTICE_OUT_OF_PLACE', file: 'jobs.md', find: '| 5 | 2 | [S5] |', replace: '| 5 | 2 | [practice] |' },
  { expect: 'BAD_TAG', file: WORK_FILE, find: '| [practice] |', replace: '| [practice S4] |' },
  { expect: 'BAD_TAG', file: WORK_FILE, find: '| [practice] |', replace: '| [practice] [gap] |' },
  { expect: 'BAD_TAG', file: WORK_FILE, find: '| [practice] |', replace: '| [practice] mostly |' },
  { expect: 'NO_TAG', file: WORK_FILE, find: '| [practice] |', replace: '| common sense |' },
  { expect: 'UNKNOWN_BELIEF', file: WORK_FILE, find: '[B2: supported S2]', replace: '[B9: supported S2]' },
  { expect: 'UNKNOWN_SOURCE', file: WORK_FILE, find: '[proposed S4]', replace: '[proposed S99]' },
  { expect: 'NO_EVIDENCE_LINK', file: WORK_FILE, find: `[S4 P1](../${EV}#p1-excerpt-1)`, replace: '[S4 P1]' },
  { expect: 'LINK_OUTSIDE_EVIDENCE', file: WORK_FILE, find: `[S4 P1](../${EV}#p1-excerpt-1)`, replace: `[S4 P1](${EV}#p1-excerpt-1)` },
  { expect: 'LINK_NOT_RECORDED', file: WORK_FILE, find: `[S4 P1](../${EV}#p1-excerpt-1)`, replace: `[S4 P1](../${EV}#p2-excerpt-1)` },
  { expect: 'CONFLICTING_VERDICT', file: WORK_FILE, find: '[B1: confirmed S4 P1-P5]', replace: '[B1: no evidence]' },
  { expect: 'NAME_LEAK', add: CODES, file: WORK_FILE, find: '- Name, phone, preferred day.', replace: '- Maya Okafor asked for a phone field.' },
  { expect: 'WORK_NOT_A_TABLE', file: WORK_FILE, find: '\n## Output', replace: '- Long forms lose people. [S1] [practice]\n\n## Output' },
  { expect: 'WORK_NOT_A_TABLE', file: WORK_FILE, find: '\n## Output', replace: '\n| a | b |\n|---|---|\n| x | [S1] [practice] |\n\n## Output' },
  { expect: 'WORK_NOT_A_TABLE', file: WORK_FILE, find: '\n## Output', replace: '\n### More\n| # | Claim | Basis |\n|---|---|---|\n| 8 | x | [gap] |\n\n## Output' },
  { expect: 'WORK_HEADER', file: WORK_FILE, find: '- **Pick:** picked', replace: '- **Pick:** unpicked' },
  { expect: 'WORK_HEADER', file: WORK_FILE, find: '- **Skill:** interaction-design:design-form', replace: '- **Skill:** interaction-design:fitts-law' },
  { expect: 'WORK_HEADER', file: WORK_FILE, find: '- **Ran:** 2026-11-01', replace: '- **Ran:** 2026-02-30' },
  { expect: 'BAD_TAG', file: WORK_FILE, find: '| [practice] |', replace: '| [practice](https://example.com) |' },
  { expect: 'BAD_TAG', file: WORK_FILE, find: '| [gap] |', replace: `| [gap](../${EV}) |` },
  { expect: 'BAD_TAG', file: 'jobs.md', find: '- Lead with reminders. [inference S4, S5]', replace: `- Lead with reminders. [inference S4, S5](${EV}#p1-excerpt-1)` },
  { expect: 'BAD_VALUE', file: WORK_FILE, find: '| One column is quicker to complete | [practice] |', replace: '|  | [practice] |' },
  { expect: 'BAD_TAG', file: WORK_FILE, find: '| One column is quicker to complete | [practice] |', replace: '| One column is quicker [S1] | [practice] |' },
  { expect: 'BAD_TAG', file: WORK_FILE, find: `[S4 P2](../${EV}#p2-excerpt-1) [S4 P3](../${EV}#p3-excerpt-1)`, replace: `[S4 P2](../${EV}#p2-excerpt-1) [S1]` },
  { expect: 'BAD_TAG', file: WORK_FILE, find: `[S4 P2](../${EV}#p2-excerpt-1) [S4 P3](../${EV}#p3-excerpt-1)`, replace: `[S4 P2](../${EV}#p2-excerpt-1) [S4 P2](../${EV}#p2-excerpt-1)` },
  { expect: 'NO_EVIDENCE_LINK', file: WORK_FILE, find: `[S4 P2](../${EV}#p2-excerpt-1) [S4 P3](../${EV}#p3-excerpt-1)`, replace: '[S4 P2-P3]' },
  { expect: 'CLEAN', name: 'prose in brackets that starts with practice is not a tag', file: 'jobs.md', find: '| 5 | 2 | [S5] |', replace: '| 5 | 2 | [S5] [practices vary] |' },
  { expect: 'CLEAN', name: 'a link whose text starts with practice is not a tag', file: 'jobs.md', find: '| 5 | 2 | [S5] |', replace: '| 5 | 2 | [S5] see [practice guide](https://example.com) |' },
  { expect: 'CLEAN', name: 'a file named work is not read as a folder', add: { work: 'not a folder\n' }, drop: [WORK_FILE, AUDIT_FILE], ...NOOP },
  { expect: 'CLEAN', name: 'files in work/ not named like a work file are left alone', add: { 'work/notes.md': '# Notes\n- [S99] [B9: banana]\n', 'work/old/2026-01-01-x.md': '# junk\n| 1 | x | [S99] [gap] |\n', 'work/2026-01-01-x.MD': '# junk\n' }, ...NOOP },
  { expect: 'AUDIT_STALE', file: WORK_FILE, find: '| How many fields owners will finish |', replace: '| How many fields owners will fill in |' },
  { expect: 'AUDIT_STALE', drop: [WORK_FILE], ...NOOP },
  { expect: 'AUDIT_STALE', add: { 'work/2026-11-03-states.audit.md': '# Audit\n' }, ...NOOP },
  { expect: 'AUDIT_OPEN', file: AUDIT_FILE, find: '| 3 | sound |', replace: '| 3 | unsupported |' },
  { expect: 'AUDIT_OPEN', file: AUDIT_FILE, find: '| none | none | none |', replace: '| Owners book on a phone | [gap] | work file:23 |' },
  { expect: 'AUDIT_OPEN', file: AUDIT_FILE, find: '| 4 | sound |', replace: '| 4 | wrong tag |' },
  { expect: 'BAD_VALUE', file: AUDIT_FILE, find: '| Claim | Suggested basis | Pointer |\n|---|---|---|\n| none | none | none |', replace: '| Claim | Suggested basis |\n|---|---|\n| none | none |' },
  { expect: 'BAD_VALUE', file: AUDIT_FILE, find: '| 3 | sound |', replace: '| 3 | not stated by the vendor |' },
  { expect: 'CLEAN', name: 'an audit may leave out the claims it found first', file: AUDIT_FILE, find: '## Claims found first\n- Owners fill the form in between patients.\n- Clinics book on paper today.\n', replace: '' },
  { expect: 'AUDIT_HEADER', file: AUDIT_FILE, find: `- **Work file:** ${WORK_FILE}`, replace: '- **Work file:** work/2026-11-09-form.md' },
  { expect: 'AUDIT_HEADER', file: AUDIT_FILE, find: '- **Audited:** 2026-11-02', replace: '- **Audited:** 2026-13-02' },
  { expect: 'AUDIT_HEADER', file: AUDIT_FILE, find: '- **Audited:** 2026-11-02\n', replace: '' },
  { expect: 'BAD_VALUE', file: AUDIT_FILE, find: '| 3 | sound |', replace: '| 3 | fine |' },
  { expect: 'BAD_VALUE', file: AUDIT_FILE, find: "| 7 | sound | Both excerpts are about the diary on the desk |\n", replace: '' },
  { expect: 'BAD_VALUE', file: AUDIT_FILE, find: '| 3 | sound |', replace: '| 9 | sound |' },
  { expect: 'BAD_VALUE', file: AUDIT_FILE, find: '| none | none | none |\n', replace: '' },
  { expect: 'BAD_VALUE', file: AUDIT_FILE, find: '- None found.\n', replace: '' },
  { expect: 'MISSING_SECTION', file: AUDIT_FILE, find: '## Missing', replace: '## Gaps' },
  { expect: 'CLEAN', name: 'a work file with no audit passes the gate', drop: [AUDIT_FILE], ...NOOP },
  { expect: 'CLEAN', name: 'an audit is never read as a work file, and a change below Output leaves it current', file: WORK_FILE, find: '- Name, phone, preferred day.', replace: '- Name and phone.' },
  { expect: 'CLEAN', name: 'the output keeps its own headings, links and brackets', file: WORK_FILE, find: '- Name, phone, preferred day.', replace: '- Name, phone, preferred day. [S99]\n\n## Validation\n- On blur, see [the skill](../skills/form-design).\nA loose paragraph.\n' },
];
