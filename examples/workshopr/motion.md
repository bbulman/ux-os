# motion.md (Workshopr example)

An excerpt from Workshopr's own motion.md, trimmed to show the shape. Sections left out are marked.

---

## How to Use This

This isn't a reference doc for you to memorize. It's **context for Claude**. When this file is loaded, Claude will:

- Reach for the right vanilla technique for each animation type (CSS transitions, `@keyframes`, or `IntersectionObserver`)
- Use your project's exact easing, timing, and motion values
- Avoid common pitfalls (layout shift, re-triggering, jarring motion)
- Keep motion subtle and premium: never theme-park

Just describe the *feeling* you want. Claude handles the implementation.

*[Section left out: the motion stack, a table of techniques and when to reach for each.]*

---

## Motion Language

The project has a specific motion personality. All animations should feel:

- **Unhurried:** nothing snaps or pops. Things drift into place.
- **Confident:** elements don't bounce or overshoot. They arrive and stay.
- **Quiet:** motion supports content, never competes with it.

Think: a page that *breathes* rather than *performs*.

---

## The Standard Values

These are the **page-reveal regime** values. Claude must use them by default for marketing/landing reveals and hero sequences. (In-app UI micro-motion, meaning hovers, modals and toggles, uses shorter 150–300ms durations.)

```
Ease:         cubic-bezier(0.22, 1, 0.36, 1)   (soft deceleration, things slow into rest)
Duration:     0.8s – 1.2s            (scroll reveals)
              1.2s – 1.4s            (large elements, hero sequences)
              0.8s – 0.9s            (labels and metadata fading in within a reveal sequence)
Max Y offset: 16–32px                (never more: subtle, not theatrical)
Max X offset: 0px                    (things move vertically, not sideways)
Stagger gap:  0.12s per item         (UI micro-motion staggers 30–50ms)
Viewport trigger: rootMargin "-15%" to "-20%"  (trigger before element fully enters view)
```

Express these as CSS custom properties so every component pulls from the same values instead of hardcoding numbers.

*[Section left out: the pattern catalogue (hero entrance, scroll reveals, line and image reveals, parallax, staggered lists, opacity-only reveals) with its code.]*

---

## Anti-Patterns (What Claude Must Avoid)

| Don't | Why | Do Instead |
|-------|-----|-----------|
| Animate elements more than once | Feels restless, breaks premium feel | `unobserve()` after first trigger, always |
| Move things sideways on scroll | Feels gimmicky, breaks vertical rhythm | Vertical movement only |
| Use overshoot/bounce easing (curves that go past 1) | Too playful for this brand | Use `cubic-bezier(0.22, 1, 0.36, 1)`. The spring-named easing in the system is pure deceleration and does NOT overshoot despite its name, so it is allowed |
| Translate more than 32px | Draws too much attention to the motion itself | Keep it 16–24px |
| Animate to full opacity for labels | Supporting text should stay subdued | Target 0.4–0.7 for metadata |
| Animate layout properties (`top`, `left`, `width`, `height`, `margin`) | Triggers layout/paint, causes jank | Animate `transform` and `opacity` only |
| Add scroll-jacking or position-locking | Frustrates users, fights native scroll | Let the page scroll naturally |
| Re-trigger reveals on every scroll pass | Re-triggering looks broken and restless | Always unobserve after the first intersection |
| Install animation libraries (Framer Motion, GSAP, Lenis, etc.) | Fragments the stack, pulls in a framework this project doesn't use | CSS transitions/`@keyframes` + `IntersectionObserver` |
| Ignore `prefers-reduced-motion` | Accessibility requirement, not optional | Always gate non-essential motion behind the media query |

*[Section left out: prompting tips, technical context for the model and the quick decision tree.]*
