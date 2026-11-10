# ux-os

UX research for Claude Code that keeps what you believe apart from what you found. Part of [UX-OS](https://bbulman.github.io/ux-os/research/).

## Install

You need Claude Code, and Node for the checking scripts.

```
/plugin marketplace add bbulman/ux-os
/plugin install ux-os@ux-os
```

## Use it

Everything is typed by name. Not sure where to start? `/ux-os:research-next <idea>` says where an idea stands and the one thing to do now.

| Command | What it does |
| --- | --- |
| `/ux-os:research-next` | Says where an idea stands and what to run next |
| `/ux-os:research-discover` | Builds first models from what you believe, and names the belief to test first |
| `/ux-os:research-debrief` | Takes in new evidence and shows which beliefs it bears on |
| `/ux-os:research-synthesize` | Rebuilds your models on what people did, once there is enough evidence |
| `/ux-os:init` | Connects a project's design system to the deliverables |
| `/ux-os:create-personas` | Who behaves differently enough to design for separately |
| `/ux-os:create-empathy-map` | What one person says, does, thinks and feels in one moment |
| `/ux-os:create-jtbd` | What people are trying to get done, apart from any product |
| `/ux-os:create-journey-map` | What happens today, or what should happen in future |
| `/ux-os:create-interview-script` | A short guide that gets real stories |
| `/ux-os:create-usability-plan` | Realistic tasks, with pass lines set before anyone is tested |
| `/ux-os:create-diary-study` | A study for behaviour that plays out over days or weeks |
| `/ux-os:create-survey` | Questions that each feed a decision, with the analysis worked out first |
| `/ux-os:affinity-diagram` | Sorts real notes into the themes people share |
| `/ux-os:analyze-card-sort` | How people grouped your cards |
| `/ux-os:summarize-research` | Findings rated by how many people stand behind them |
| `/ux-os:create-research-repository` | One place for what you have learned across studies |

## Proto or real

Personas, journeys, jobs and empathy maps each take a switch.

```
/ux-os:create-personas volunteer-rota proto
/ux-os:create-personas volunteer-rota real --evidence ~/interviews/
```

`proto` builds from what you believe and labels it an assumption. `real` builds from your files. Names come out first, and every line links to the exact passage it came from. Real needs at least 5 people from different organisations, and stops if you don't have them.

## Connect a design system

Run `/ux-os:init` once per project. Deliverables take your design system's fonts and colours, and design proposals name a real component or say none fits. It shows you everything before it saves.

## How far it has been tested

On made-up test data, and on one real design system. None of it has been compared with no skill at all.

## Credit

The shape of `research-next`, `research-discover` and `research-synthesize` comes from MC Dean's Designer Skills Pack (MIT).

MIT licence.
