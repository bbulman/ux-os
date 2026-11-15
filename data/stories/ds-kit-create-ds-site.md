Written from scratch.

**What the no-skill run missed.** It wrote a sensible generator but never opened the site, had no search or staleness check, and only worked from inside the repo.

**What the skill adds.** `ds-site` builds from the sources, sandboxes demos, tests the phone menu and search in a browser, and fails on any drift. Independent review found injection paths through catalog and icon data; those are closed.

**Known limit.** A demo opened on its own can still run its own inline script.
