Written from scratch.

**What the no-skill run missed.** It found most defects by reading, and gave an opinion with no measurement.

**What the skill adds.** A static audit worth 40 of 100 and blind builds in fresh contexts worth 60. `ds-ai-check` counts invented components, invalid options and undefined tokens, and fixes are ranked by how many blind failures each explains.

**Known limit.** It measures only the model that ran the builds, and CSS-in-JS template literals go unread.
