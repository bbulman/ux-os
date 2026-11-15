---
name: create-voice-file
description: Write or revise a project's VOICE.md by interview, settling how every word a user reads should sound, with examples from the product's own copy.
disable-model-invocation: true
argument-hint: "[project path]"
---

Answers: how does this product sound, in every word a user reads? Buttons, errors, empty states, emails and help all follow it.

Read `${CLAUDE_PLUGIN_ROOT}/shared/project-file-interview.md` and follow its steps, with `<NAME>` as `VOICE.md`. What follows is particular to this file.

## Sources

The product's own copy: button labels, error messages, empty states, confirmations and emails, found by searching the templates and code. Also any writing style guide, the interface wording rules in `DESIGN.md`, any banned-word list, and any copy linter.

## Topics

1. **Scope.** Whether `VOICE.md` covers only the words in the product, or marketing and long-form writing too. The answer is a sentence under "The voice in one line". If a style guide already covers long-form writing, that sentence points at it rather than the copy repeating it.
2. **The voice in one line.** Who it sounds like, in one sentence.
3. **Pillars.** Three or four, each with one sentence on what it means and a before and after. The before is a real line from the product that misses, found by search. The after is the same line in the voice, approved by the person.
4. **What the voice is not.** The registers it avoids, each with an example.
5. **Words.** What to use, what not to, and why. Start from any banned-word list the project keeps.
6. **The messages written most.** A button, an error, an empty state, a confirmation and a wait: the shape of each, and an example that is a real line from the product or a rewrite the person approved.
7. **Mechanics and inclusive language.** Case, numbers, dates, contractions, punctuation to avoid, and how the product writes about people.

## Checks

- Every "Instead of" line is real copy from the product, and the notes say where it was found. A made-up line is labelled as made up.
- Every example in "The messages you write most" is real copy or a rewrite the person approved.
- If `DESIGN.md` or a style guide also holds a banned-word list, the report says so, since one list should point at the other.
