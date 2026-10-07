# modern-css

A skill for **writing and refactoring
native CSS with modern, [Baseline](https://web.dev/baseline) features** — whether
the styles live in plain `.css`, CSS Modules, Vue/Svelte/Astro scoped blocks,
Sass/PostCSS, or CSS-in-JS like StyleX.

Every rule is *problem → why → fix* with a before/after and a one-line note.
`SKILL.md` has the grep-able audit table.

## Install

```bash
npx skills install jeferson-sb/skills
```

Or copy this directory into `~/.claude/skills/modern-css` (or a project's `.claude/skills/modern-css`).

## Usage

Describe the task; the skill triggers on intent:

```
modernize the styles in src/components/Card.module.css   → refactor mode
review this CSS for modern best practices                 → review mode (no edits)
style a pricing card component                            → write mode
```

## What it covers

| Category | Rules |
|---|---|
| [Architecture](references/architecture.md) | Shallow nesting · custom properties · `@layer` instead of `!important` · `:is()` · pseudo-element `content` · `@property` |
| [Layout](references/layout.md) | `@container` + `cqi` · `gap` · logical properties · `min()`/`max()`/`clamp()` · intrinsic sizing · flex wrapping and shrinking · grid named lines + subgrid · `inset` · `overflow: clip` · z-index tokens + `isolation` |
| [Typography](references/typography.md) | `rem` · fluid type · line-height · `text-wrap` · `tabular-nums` · `shape-outside` · truncation / line clamp |
| [Color](references/color.md) | Tokens instead of hardcoded colors · `oklch()` · derived shades with `color-mix()` |
| [Animation](references/animation.md) | No `transition: all` · `transform`/`opacity` · `@starting-style` · hover flicker · staggering · durations ≤ 400ms |
| [Preferences](references/preferences.md) | `prefers-reduced-motion` · `color-scheme` / `light-dark()` · `prefers-contrast` / `forced-colors` · `prefers-reduced-transparency` · `accent-color` |
| [Forms](references/forms.md) | `field-sizing: content` · `lh` heights · `font: inherit` |
| [Baseline policy](references/baseline-policy.md) | Status table, fallback patterns, how to verify support |

```
modern-css/
├── README.md
├── SKILL.md                  # workflow: context → audit → refactor → verify → report
└── references/               # one file per category (the rules)
```

## Design decisions

- **Baseline-first.** *Widely available* is the default. *Newly available*
  features (`@starting-style`, `light-dark()`, `field-sizing`, …) are used with a
  documented fallback; non-Baseline features are not applied.
- **Behavior-preserving by default.** The workflow ends in a verification checklist (RTL, dark mode,
  reduced motion, container resizing, zoom) because CSS has no compiler to prove
  equivalence.
- **Honest about corrections.** Where a common idea is imprecise, the reference
  says so — e.g. `@starting-style` defines the first-render "from" state (entering is the
  usual use; it is not an exit trigger), and exit animations of
  `display`/top-layer elements are not Baseline yet.

## License

MIT — see the repository [`LICENSE`](../LICENSE).
