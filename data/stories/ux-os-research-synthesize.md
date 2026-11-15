## How it was built

Written from scratch on 10 November 2026 in our own words. Chaining synthesis steps into one command comes from MC Dean's `synthesize` command (MIT), and the skill credits it. A file built in real mode cites no beliefs, so this command adds an `Outcome` column to `beliefs.md` to record where each belief ended up. The check rejects any confirmed, refuted or mixed outcome below the bar of 5 organisations.

## What testing showed

The first run confirmed a review finding: nothing recorded what the evidence did to a belief, and rebuilt models were never checked against transcripts when the evidence had arrived earlier. Both were fixed. The verifying agent now always runs in a chain. A second run on six interviews rebuilt models already in real mode, kept copies under `superseded/`, and its verifier corrected counts before the check passed.

## Still to do

- Use it on real studies.
- Test it against no skill, as the method asks.
- Run the typed command end to end.
- Decide how to count people outside a belief's segment. The bar names the segment, but the check and the status script cannot apply it.
