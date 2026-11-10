# Render and publish the book

Every skill ends here. `$SHARED` means the folder this file is in.

1. **Render.** Run `node $SHARED/book.mjs <folder>`. It writes `<folder>/book/`: `index.html`, `open-me.html` and one data file per view in `data/`.
   Done when it exits 0.

2. **Check for local only.** If `brief.md` says `Book: local only`, stop here and give the person the path to `book/open-me.html`.

3. **Publish.** Use the Artifact tool and follow its own rules. Read each file before publishing it. A first publish is around 400 KB, so split the reading across agents if it will not fit.
   - **First publish** (the `Book:` line in `brief.md` says `not published`): publish `book/index.html` as `file_path`, every file in `book/data/` through `files` with paths like `data/personas.js`, an `icon` of `book`, and a one-sentence `description` naming the idea. Save the link on the `Book:` line of `brief.md`.
   - **Later runs** (the `Book:` line holds a link): read the artifact and list its published files, as the tool requires in a new conversation, then publish to that `url` with `book/index.html` as `file_path` and, through `files`, only the data files `book.mjs` reported as changed. The link stays the same.
   Without the Artifact tool, or if publishing is refused, keep the local copy and say so.
   Done when `brief.md` holds the link, or the report says why it does not.

The book is private by default. The person chooses whether to share it.
