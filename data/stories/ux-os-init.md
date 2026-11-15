## How it was built

Built on 10 November 2026 while the sixteen research skills moved into one plugin, typed `/ux-os:init`. Bill asked for a way to connect the design system to deliverables, and chose fonts, colours and real component names over fonts and colours alone.

It starts from the project's `.ds-kit.json` if there is one, reads the token values, shows everything it would save and writes nothing without a yes. Only two sections of `.research-profile.md` change: Book look and Design system.

## What makes it different

The component lookup runs last, after findings and implications are written, so what a design system offers cannot steer what the research says. A proposal names a component from the catalogue or says none fits, and the checking script fails an invented name. The book keeps its own layout, and its pencil colour never comes from the tokens, so a belief and a finding cannot end up looking alike.

## What testing showed

Run on this repo's design system, it read 133 components and a second run changed nothing. A persona and a future journey built with it passed the check, an invented component failed it, and the book took the new look in a real browser. In that test Claude named two components that fitted weakly, so the rule now says a near miss is no fit. Nothing can check fit by script.

## Still to do

- Publish the plugin, if it is going to be public.
- See whether component names help or get in the way on real research.
