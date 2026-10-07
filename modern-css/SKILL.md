---
name: modern-css
description: Write and refactor native CSS (plain, CSS Modules, scoped styles, Sass, StyleX) to use Baseline features: nesting, container queries, @layer, custom-property tokens, oklch, logical properties, gap, clamp(), @starting-style, field-sizing, and preference media queries. Use when asked to modernize, refactor, audit, or write CSS/styles.
---

# Modern CSS

Write new CSS — and refactor existing CSS — so it uses current **Baseline**
platform features instead of legacy workarounds. Every rule in this skill is a
*problem → rationale → fix* with a concrete before/after, grouped by concern.

## Iron rules

1. **Preserve rendered behavior unless the rule says otherwise.** Changes that
   can alter the result (container queries, `@layer`, fluid sizes, intrinsic
   sizing, dark mode, merging near-duplicate values) need a visual check before
   you move on.
2. **Respect the Baseline target.** Default to *Widely available*. Use *Newly
   available* features only with a graceful fallback, or when the project's
   browser target allows. Never use a feature that isn't Baseline without being
   asked. See `references/baseline-policy.md`.
3. **Match the codebase.** Keep its token names, file layout, naming scheme
   (BEM, camelCase modules), and formatting. Modernize the *CSS*, not the
   team's conventions. If a rule conflicts with an established convention, say
   so and ask instead of overriding.
4. **Don't touch what you don't own.** Skip vendored/third-party CSS, generated
   CSS, and HTML email styles (email clients support almost none of this).
5. **Fix at the source.** Reach for the token, the layer, or the container before
   adding another override. Never "fix" a specificity fight with `!important`.
6. **Say what you didn't change.** If a finding is intentionally skipped (e.g. a
   `1px` border kept in px, a media query kept for a page-level layout), note why.

## Reference files (read the ones for the categories in play)

| File | Covers |
|---|---|
| `references/architecture.md` | Nesting, custom properties, cascade layers & `!important`, `:is()`, pseudo-element `content`, `@property` |
| `references/layout.md` | Container queries, `cqi`, `gap`, logical properties, `min()`/`max()`/`clamp()`, intrinsic sizing, flexbox wrapping/shrinking, grid named lines & subgrid, `inset`, `overflow: clip`, z-index tokens |
| `references/typography.md` | `rem` units, fluid type, line-height, `text-wrap`, `tabular-nums`, `shape-outside`, truncation |
| `references/color.md` | Color tokens, `oklch()`, derived colors |
| `references/animation.md` | `transition: all`, compositor-friendly properties, `@starting-style`, hover flicker, stagger, durations |
| `references/preferences.md` | `prefers-reduced-motion`, `color-scheme`/`light-dark()`, `prefers-contrast`, `forced-colors`, `prefers-reduced-transparency`, `accent-color` |
| `references/forms.md` | `field-sizing`, `lh` heights, `font: inherit` |
| `references/baseline-policy.md` | Baseline status table, fallback patterns, how to verify support |

Each rule is **Problem → Why → Fix** (before/after), plus a one-line **Note** for
the pitfall that matters most. Read the Note before applying.

## Modes

- **Write mode** — "style this component", "add a card". Apply the rules as
  defaults; no audit needed. Follow `references/architecture.md` first for
  layer/token placement, then the relevant categories.
- **Refactor mode** — "modernize / clean up / audit these styles". Run the
  workflow below.
- **Review mode** — "review this CSS". Run steps 1–3 only and report findings;
  change nothing.

## Workflow (refactor mode)

### 1. Establish context
- **Browser target:** look for `.browserslistrc`, `browserslist` in `package.json`,
  a documented Baseline policy, or `stylelint-plugin-use-baseline` config. If none,
  assume *Widely available*.
- **Styling system** (determines *where* and *how* a fix is written):

  | System | Notes |
  |---|---|
  | Plain `.css` / PostCSS | Everything applies as written. |
  | CSS Modules (`*.module.css`) | Nesting, `@layer`, `@container` all work; class hashing is unaffected. Declare the layer order in one global entry file, not per module. |
  | Vue / Svelte / Astro scoped `<style>` | Same CSS applies; scoping attributes are added by the compiler. Check the compiler version handles native nesting and `@layer` before relying on them (see Verify). |
  | Sass / Less | These have their own nesting. Native CSS nesting differs (see `architecture.md` §1 *Watch out*); only convert if the project is dropping the preprocessor. |
  | StyleX / vanilla-extract / CSS-in-JS | Not native CSS syntax — apply the *intent* (tokens, logical properties, `gap`, no `transition: all`) in the library's idiom. Nesting, `@layer` and `@container` support is toolchain-specific: **verify in the library's docs/config before using**, do not assume. |
  | Tailwind | Utility-driven; apply the rules to custom CSS/`@layer`/`@theme`, and prefer logical (`ms-*`, `ps-*`) and `gap-*` utilities. |

- **Existing tokens:** find the `:root` / theme file. New values go there.

### 2. Audit
Run the signals in the table below across the target. Group hits by category, then
rank by impact and safety: simple, high-frequency fixes first.

| Signal (regex, adapt per syntax) | Rule |
|---|---|
| `!important` | architecture §3 |
| `#[0-9a-f]{3,8}\b`, `rgba?\(`, `hsla?\(`, named colors in declarations | color §1–2 |
| `(margin\|padding\|border)-(left\|right\|top\|bottom)`, `\b(left\|right)\s*:`, `text-align:\s*(left\|right)`, `float:` | layout §4 |
| `margin` between siblings inside `display: flex\|grid`, `> * + *`, `:not(:last-child)` margin | layout §3 |
| `@media[^{]*(min\|max)-width` inside component files | layout §1 |
| `transition:\s*all`, `transition-property:\s*all` | animation §1 |
| transitions/keyframes on `width\|height\|top\|left\|margin\|padding\|box-shadow` | animation §2 |
| `@keyframes` used only for enter/appear, `display: none` toggled by JS class | animation §3 |
| `font-size:\s*\d+px`, `padding\|margin\|gap:\s*\d+px`, `html\s*{[^}]*font-size:\s*62.5%` | typography §1 |
| `(width\|min-width\|height):\s*\d{3,}px`, fixed `width` on badges/buttons/tooltips/label columns | layout §6 |
| `animation\|transition` with no `prefers-reduced-motion` anywhere in the project | preferences §1 |
| hardcoded `#fff`/`#000` backgrounds + a separate `.dark` / `[data-theme]` override block | preferences §2 |
| repeated literal values (same `px`/color 3+ times) | architecture §2 |
| `a:hover, a:focus, …` lists with identical bodies | architecture §4 |
| `z-index:\s*\d{3,}` | layout §12 |
| `overflow:\s*hidden` where only clipping is needed | layout §11 |
| `top: 0; right: 0; bottom: 0; left: 0` | layout §10 |
| `100vw` full-bleed / negative-margin hacks | layout §9 |
| `flex: 1` items squishing, or text/URLs overflowing a flex child (no `min-inline-size: 0`) | layout §7–8 |
| `::before` / `::after` rule with no `content` | architecture §5 |
| JS-animated custom property, or gradient/angle that snaps | architecture §6 |
| one `line-height` for body and headings; `line-height` in `px`/`rem` | typography §3 |
| headings/paragraphs with orphans, no `text-wrap` | typography §4 |
| number columns/counters without `tabular-nums` | typography §5 |
| `float` on round/irregular images | typography §6 |
| `white-space: nowrap` / `-webkit-line-clamp` | typography §7 |
| `backdrop-filter` or translucent surfaces, no `prefers-reduced-transparency` | preferences §4 |
| `appearance: none` on checkbox/radio/range | preferences §5 |
| `:hover` that moves/scales the same element | animation §4 |
| `:nth-child(n)` carrying `transition-delay` / `animation-delay` | animation §5 |
| durations over 400ms (`[5-9]\d\d ms`, `\d{4,}ms`, `0?\.[5-9]s`, `[1-9]s`) | animation §6 |
| form controls with no `font: inherit`; textarea heights in `px`/`rows` | forms §2–3 |
| `<textarea>`/`<input>` auto-grow done in JS (`scrollHeight`) | forms §1 |

Convert colors with a tool of the user's choice, never by hand.

### 3. Present findings (review mode stops here)
Report per category: location, rule, and the proposed change. Call out changes
that can alter the result (see Iron rule 1) separately so the user can approve them knowingly.

### 4. Refactor
- Work **one category at a time**, in this order (lowest risk / highest leverage
  first): architecture (tokens, layers) → color → logical properties & `gap` →
  typography units → intrinsic sizing / `clamp()` → container queries →
  animation → preferences → forms.
- Tokenize **before** converting values (e.g. create `--color-brand` then convert
  it to `oklch`) so each value is changed once.
- Keep each step small enough to review as a diff. Don't mix formatting churn
  with semantic changes.

### 5. Verify
CSS has no compiler to prove equivalence, so check the things that can regress:

1. **Build/lint passes.** Run the project's build and stylelint if present. A
   scoped-style or CSS-modules compiler that chokes on nesting/`@layer` shows up
   here.
2. **Visual check** (use Chrome DevTools MCP / agent-browser when available):
   - widths: narrow / medium / wide — for container-query conversions, also resize
     the *container*, not just the viewport;
   - `dir="rtl"` on `<html>` — logical-property conversions should mirror
     correctly and *LTR must be pixel-identical to before*;
   - dark mode and `prefers-reduced-motion: reduce` emulation;
   - browser zoom / larger default font size — `rem` conversions should scale.
3. **Cascade check.** After introducing `@layer`, confirm nothing changed
   precedence: unlayered styles beat layered ones. Spot-check computed styles of
   elements that had overrides.
4. **Support check.** Confirm each used feature against `references/baseline-policy.md`
   (or MDN / `web-features`) — don't trust memory for status.

### 6. Report
Three buckets, honestly: **Applied** (with the verification done), **Skipped**
(with the reason), **Needs a decision** (risky changes, convention conflicts,
features that need a fallback). Do not claim visual equivalence you didn't check.

## What this skill deliberately does not do

- It does not chase every possible modern feature. The rules listed are the
  scope; if you spot another clear win (`:has()`, `text-wrap: balance`,
  `@property`, `@scope`), mention it as a suggestion rather than applying it.
- It does not rewrite markup/HTML structure, except where a rule needs a hook
  (e.g. a `container-type` wrapper).
