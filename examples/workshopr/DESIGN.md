# DESIGN.md (Workshopr example)

An excerpt from Workshopr's own DESIGN.md, trimmed to show the shape. Sections left out are marked.

---

*[Section left out: product summary, brand voice, writing style and anti-AI tells. The voice is gathered in VOICE.md.]*

## 7. Visual system

### Palette character

Warm, grounded, slightly editorial. **Learn Phase Red** (`#E54D4D`) is the signature. Human, analog warmth that intentionally contrasts with the cool indigo and teal defaults of most SaaS tools. The palette should feel like morning light in a workshop room, not a dashboard.

The neutrals are warm-leaning Stone grays. Avoid cool blue-grays. The page background is Stone-50 (`#FAFAF9`), not white: the lightest step of that same warm ramp, carrying the platform's 24px drafting grid. Cards are a warm paper tone (`#F7F1EA`); white is kept for what opens over or inside a card: modals, menus and inputs. The page was warm cream (`#FEF7F1`) until July 2026; the grid is what now gives the page its warmth and texture, so the paper beneath it sits back.

### Typography pairing

A high-contrast pairing reinforces the editorial feel:

- **Fraunces** (serif) for display, headlines, and editorial accents. Soft, humanist, signals the content was written by a person, not a committee.
- **Inter** (sans-serif) for UI, body, and the data-heavy planner. High legibility where precision matters most.

**Display Text Pattern** is a signature treatment for hero headlines:

- Primary text: bold Fraunces in the dark text colour.
- Emphasized text: italicized, colored in the phase's dark variant (e.g., `#C73E3E`), with a flush 8px bottom underline in the phase's tint (e.g., `#FEE2E2`).

Do not use all-caps for anything longer than a three-word label.

**Headings.** Every heading, tab, button and empty-state title is in sentence case: "Your workshops", "Show all workshops", not "Your Workshops". A page has one `h1`. Sections under it are `h2`, and the items in a section are `h3`. A fragment included into a page never takes the `h1`: the page that includes it owns that, and the fragment opens at `h2`. Name a list the way the reader owns it: "Your workshops" in a heading, the same words the page's navigation uses.

### Spacing and structure

The grid is 4px, giving spacing steps from 4px through 64px.

Layouts use generous whitespace on Learn surfaces (marketing, library, editorial) and high-density structural efficiency on Plan surfaces (the Planner, where time is the primary dimension and every pixel earns its keep).

Inside the app, every view that is not full-bleed sits on an eight-column page grid with 20px gutters. The main area takes six columns and a shared rail takes two. At 1100px and below the grids halve and the main and rail each take the full row; below 900 the shell shows a desktop-only notice instead.

### Radii

- Buttons and inputs: 8px.
- Cards: 12px.
- Modals: 16px.
- Pills and badges: fully round.

### Elevation

At rest, cards use the small shadow. On hover, cards lift by `translateY(-2px)` and the shadow upgrades to medium. Modals use the extra-large shadow. Use the colored shadows (all red) sparingly for emphasis on hero CTAs.

*[Section left out: motion, which has its own file in motion.md.]*

*[Section left out: iconography, illustration, UX principles 10.1 and 10.2, the audit checklist, forms, the component system, voice examples by surface, working with AI, content taxonomy and file index.]*

### 10.3 Workshopr-specific laws

**The Law of Immediacy.** Facilitators are often high-stress and time-poor. Critical tools (Interventions, time adjusters) must be exactly one click away. No nesting under "Settings" or "More."

**The Law of Time-as-Gravity.** Time is the primary dimension in Workshopr. Every piece of content (Exercise, Icebreaker, Break) displays its duration prominently. The total time of a workshop auto-calculates in real time as items are moved.

**The Principle of Warm, Not Cute.** Warm neutrals (`#FAFAF9` page, `#2C2416` ink) create a calm environment. But spacing and typography are precise (4px grid). The feel is high-end leather notebook, not coloring book, and since July 2026 the notebook is ruled: every page carries the 24px drafting grid.

**The Law of Progressive Disclosure.** Show what matters now. Reveal complexity on demand. In the Library, show name and duration. Reveal Materials Required and Step-by-Step Instructions only when expanded.

**The One Surface, One Purpose Rule.** The Library browses (infinite, horizontal, exploratory). The Planner constructs (vertical, sequence-driven, finite). The Coach supports live (real-time, reactive, minimalist). Don't bleed Library discovery into the active Planner workspace.

**Templates are starting points, not finished products.** Every exercise, workshop, and agenda is meant to be customized. UI should make "duplicate and edit" feel natural. Never make the user feel like they're fighting the template.

**AI assists, never substitutes.** AI Coach, recommendations, and agenda help always show *why* they suggest what they do, and make it easy to override. The facilitator is the expert. The AI is a second set of eyes.

**Polish is a feature.** Small details (an agenda timeline that shows tight transitions in a different color, a duration field that auto-sums, a one-click export to PDF/Word/Markdown) are how practitioners know Workshopr was built by one of them.

**Facilitators scan before they read.** Every screen should be scannable in under 3 seconds for "is what I need here?" Hero info (exercise name, duration, participant count, category) appears first. Details wait for a click.

**Inclusive by default.** Instructions, exercises, and prompts accommodate different modes of participation (quiet-writing before discussion, typed input alongside verbal, movement-optional variants). UI is keyboard-navigable, high-contrast-compatible, and respects reduced motion.

*[Section left out: the component-first and token-first workflow, which names internal files and tooling.]*
