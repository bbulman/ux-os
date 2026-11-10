# Primary research intake

Every research and proto skill runs this first. It turns interviews and other primary research into evidence every skill can cite. With nothing to take in, say so in one line and carry on.

## Where it comes from

- Files in `inbox/` in the idea folder.
- A file or a folder passed with the command: `--evidence <path>`. A folder means every file directly inside it. The originals stay where they are.
- Connected sources named under `## Primary sources` in the project profile. Query them read-only.

Interview transcripts and notes, expert calls, sales and support conversations, usability tests, diary studies, survey exports, field notes and analytics results all count. Audio or video is transcribed first when a transcription tool is connected. Otherwise ask for a transcript and carry on without it.

## For each new file

Run `shasum -a 256` on the file. A hash already in the Studies table of `primary.md` has been taken in: skip it, unless that study's excerpts have no links, in which case add the anchors and links now.

1. **Anonymise.** Replace every person's name with a code: `P1`, `P2`, continuing from the highest code in `primary.md`. Remove company names, cities, email addresses, phone numbers and anything else that identifies someone. Keep role, segment and country. Keep the key, saying which person and organisation each code stands for, only in `inbox/codes.md`, as a table with the columns Code, Org code, Person and Organisation, so a second person from the same organisation gets the same Org code.
2. **Save.** Write the anonymised copy to `evidence/<S-id>-<short-name>.<ext>`, where the short name is lowercase kebab-case with no spaces and says what kind of material it is, such as `interview-p3` or `survey`. It never holds a person's or organisation's name. Anything holding participant passages is saved as `.md`, so each passage can carry an anchor. Survey and analytics exports keep their own format, and a quotable open-text answer goes in `evidence/<S-id>-open-text.md`, one passage per respondent, under the same S-id and ledger row as the export. Then read it back and confirm no name survived. `inbox/` keeps the raw file, and raw text goes nowhere else.
3. **Ledger.** Add one row to `sources.md`: kind `first-party`, `Where` set to the file in `evidence/`, a neutral Title such as `Interview P1`, Publisher `own research`, status `verified` once step 2 passes.
4. **Study note.** Add a row to Studies in `primary.md`: the file's hash, who ran it, when, how many people, how they were recruited, what was asked, and any known bias, such as only talking to happy customers or leading questions. Write in the skew that comes with the method: support tickets show only problems, sales calls are pitches, diaries lose the people who drop out. Write `not recorded` rather than guessing.
5. **Participants.** Give each person a row with role, segment and an anonymised organisation code (`O1`, `O2`), because the validation bar counts different organisations.
6. **Excerpts.** Take every match, not just the striking ones. Each excerpt gets a Code: `pain`, `trigger`, `workaround`, `alternative`, `outcome`, `objection`, `say-do gap` or `context`, which is for facts about someone's setting. Its Grade is `observed` (seen happening, so describe it), `reported` (the person told of something they did) or `opinion` (what they think or would do). Prompted is `yes` when the interviewer led them to it. Observed and reported outrank opinion. Each excerpt names one person. Beliefs starts as `none`, and a skill checking a belief fills in the belief numbers this excerpt bears on. Put `<a id="p3-excerpt-4"></a>` in the anonymised copy directly before the passage. The number counts that person's excerpts across the folder and is never reused, and the anchor holds a code, never a name. The Evidence cell is the link: `[S20 P3](evidence/S20-interview.md#p3-excerpt-4)`.

Use `$SHARED/templates/primary.md` the first time. A card sort or a survey export has no individual stories: it needs its anonymised copy, a ledger row and a study note, with Participants and Excerpts only where someone wrote something worth quoting.

**Surveys** record sample size and response rate in the study note, keep the counts for each option by segment in the snapshot, and flag open text that contradicts the closed answers. **Analytics** saves the query, the date and the result to the file in `evidence/`, so verifying means reading that snapshot. A live number that later moves does not break it.

**Confidential material.** If the person says it is confidential, or the profile says so, write `Book: local only` in `brief.md`. The book then stays a local file.

## After intake

Cite primary research as `[S20 P3](evidence/S20-interview.md#p3-excerpt-4)`, as "Evidence links" in the contract sets out. The validation bar in the contract counts people from different organisations, on what they did.

Report one line: how many new files, how many people, and any existing output in the folder written before this evidence arrived that should be re-run.

Done when every new file has an anonymised copy in `evidence/`, a ledger row, a study note, its participants and its excerpts.
