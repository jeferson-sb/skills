# Baseline policy — what's safe to use, and how to check

[Baseline](https://web.dev/baseline) tracks when a web feature works across the
core browser set (Chrome, Edge, Firefox, Safari — desktop and mobile).

| Tier | Meaning | Policy |
|---|---|---|
| **Widely available** | In all core browsers for **≥ 30 months** | **Default.** Use freely. |
| **Newly available** | In all core browsers, but < 30 months | Use when it **degrades gracefully** (see below) or the project's target allows it. State it in the report. |
| **Limited / not Baseline** | Missing from at least one core browser | **Don't use** unless asked, and then only as a progressive enhancement behind `@supports`. |

> **Snapshot** from `web-features@3.40.1` (checked 2026-10-07). Statuses change —
> "Newly" features graduate to "Widely" on the dates shown. **Re-verify before
> relying on a row** (see *How to verify*). Dates marked `→ ~` are the projected
> "Widely" date (Newly date + 30 months); treat as approximate.

## Status of the features this skill uses

| Feature | Tier | Widely since / projected | Chrome / Firefox / Safari (first) |
|---|---|---|---|
| CSS nesting | **Widely** | 2026-06-11 | 120 / 117 / 17.2 |
| `@container` (size) + cq units | **Widely** | 2025-08-14 | 105 / 110 / 16 |
| Custom properties | **Widely** | 2019-10-05 | 49 / 31 / 9.1 |
| `@layer` | **Widely** | 2024-09-14 | 99 / 97 / 15.4 |
| `oklch()` / `oklab()` | **Widely** | 2025-11-09 | 111 / 113 / 15.4 |
| `color-mix()` | **Widely** | 2025-11-09 | 111 / 113 / 16.2 |
| `gap` (flexbox) | **Widely** | 2023-10-26 | 84 / 63 / 14.1 |
| `gap` (grid) / Grid | **Widely** | 2020-04-17 | 57 / 52 / 10.1 |
| Logical properties & values | **Widely** | 2024-03-20 | 89 / 66 / 15 |
| `:dir()` | **Widely** | 2026-06-07 | 120 / 49 / 16.4 |
| `:is()` / `:where()` | **Widely** | 2023-07-21 | 88 / 82 / 14 |
| `min()` `max()` `clamp()` | **Widely** | 2023-01-28 | 79 / 75 / 13.1 |
| `aspect-ratio` | **Widely** | 2024-03-20 | 88 / 89 / 15 |
| `min-content` / `max-content` | **Widely** | 2022-07-15 | 46 / 66 / 11 |
| `fit-content` | **Widely** | 2024-05-02 | 46 / 94 / 11 |
| `contain-intrinsic-size` | **Widely** | 2026-03-18 | 83 / 107 / 17 |
| `prefers-reduced-motion` | **Widely** | 2022-07-15 | 74 / 63 / 10.1 |
| `color-scheme` | **Widely** | 2024-08-03 | 98 / 96 / 13 |
| `prefers-color-scheme` | **Widely** | 2022-07-15 | 76 / 67 / 12.1 |
| `prefers-contrast` | **Widely** | 2024-11-30 | 96 / 101 / 14.1 |
| `forced-colors` | **Widely** | 2025-03-12 | 89 / 89 / 16 |
| `translate` `scale` `rotate` | **Widely** | 2025-02-05 | 104 / 72 / 14.1 |
| `grid-template-rows` animation | **Widely** | 2025-04-27 | 107 / 66 / 16 |
| `will-change` | **Widely** | 2022-07-15 | 36 / 36 / 9.1 |
| `light-dark()` | **Newly** | → ~2026-11-13 | 123 / 120 / 17.5 |
| `@starting-style` | **Newly** | → ~2027-02-06 | 117 / 129 / 17.5 |
| `transition-behavior` | **Newly** | → ~2027-02-06 | 117 / 129 / 17.4 |
| Relative color syntax | **Newly** | → ~2027-03-16 | 125 / 128 / 18 |
| `@property` | **Newly** | → ~2027-01-09 | 85 / 128 / 16.4 |
| `field-sizing` | **Newly** | → ~2028-12-16 | 123 / 152 / 26.2 |
| `content-visibility` | **Newly** | → ~2028-03-15 | 108 / 130 / 26 |
| Container style queries | **Newly** | → ~2028-11-19 | 111 / 151 / 18 |
| Name-only container queries | **Newly** | → ~2028-11-07 | 148 / 149 / 26.4 |
| Popover API / `:popover-open` | **Newly** | → ~2027-07-27 | 116 / 125 / 17 |
| `text-wrap: balance` | **Newly** | → ~2026-11-13 | 114 / 121 / 17.5 |
| `:has()` | **Widely** | 2026-06-19 | 105 / 121 / 15.4 |
| `display` animation (`allow-discrete`) | **No** | — | 117 / ✗ / 18 |
| `overlay` | **No** | — | 117 / ✗ / ✗ |
| `interpolate-size` / `calc-size()` | **No** | — | 129 / ✗ / ✗ |
| Scroll-driven animations | **No** | — | 115 / ✗ / 26 |
| Anchor positioning | **No** | — | ✗ / ✗ / 27 |
| `text-wrap: pretty` | **No** | — | 117 / ✗ / 26 |
| `overflow: clip` | **Widely** | 2025-03-12 | 90 / 81 / 16 |
| `isolation` | **Widely** | 2022-07-15 | 41 / 36 / 8 |
| `font-variant-numeric` | **Widely** | 2022-07-15 | 52 / 34 / 9.1 |
| `shape-outside` | **Widely** | 2022-07-15 | 37 / 62 / 10.1 |
| `text-overflow` | **Widely** | 2018-01-29 | 1 / 7 / 1.3 |
| `subgrid` | **Widely** | 2026-03-15 | 117 / 71 / 16 |
| `sibling-index()` / `sibling-count()` | **Newly** | → ~2029-02-18 | 138 / 154 / 26.2 |
| `backdrop-filter` | **Newly** | → ~2027-03-16 | 76 / 103 / 18 |
| Alt text for `content` | **Newly** | → ~2027-01-09 | 77 / 128 / 17.4 |
| `accent-color` | **No** | — | 93 / 92 / 26.2 |
| `prefers-reduced-transparency` | **No** | — | 119 / ✗ / ✗ |
| `line-clamp` (unprefixed) | **No** | — | ✗ / ✗ / ✗ |
| `attr()` (typed) | **No** | — | 133 / 155 / ✗ |

`✗` = not shipped in that engine.

### Summary
- Everything in `architecture` (except `@property`), `layout` (except `content-visibility`),
  `typography` (except `text-wrap`), `color` (except relative color) and `preferences`
  (except `light-dark()`) is Widely available unless listed below.
- **Newly**, used with a fallback: `@starting-style`, `transition-behavior`, `light-dark()`,
  `field-sizing`, `content-visibility`, `@property`, relative color, popover,
  `text-wrap: balance`, `backdrop-filter`, `sibling-index()`, alt text for `content`.
- **Not Baseline**, harmless no-ops elsewhere (enhancement only): `prefers-reduced-transparency`,
  `accent-color`, `text-wrap: pretty`, `display`/`overlay` exit animation.
- **Not Baseline**, avoid: unprefixed `line-clamp` (use `-webkit-line-clamp`), typed `attr()`,
  `interpolate-size`/`calc-size()`, scroll-driven animations, anchor positioning.

## Making "Newly available" safe

1. **Does it degrade gracefully?** If unsupported means "looks slightly less
   polished but fully works" (e.g. `@starting-style`, `content-visibility`,
   `field-sizing`), use it with no guard.
2. **Else guard it with `@supports`** and keep a baseline path:

   ```css
   .field { min-block-size: 6rem; }                       /* works everywhere */

   @supports (field-sizing: content) {
     .field { field-sizing: content; max-block-size: 20rem; }
   }
   ```

3. **For syntax that invalidates a whole declaration**, put the fallback *first*:

   ```css
   .btn:hover {
     background: color-mix(in oklch, var(--color-accent), black 15%);
   }
   @supports (color: oklch(from red l c h)) {            /* relative color */
     .btn:hover { background: oklch(from var(--color-accent) calc(l - 0.08) c h); }
   }
   ```

4. If the project has a stated Baseline/browserslist target, **it overrides this
   table.** Don't use a feature the target excludes; do use a Widely feature even
   if the codebase hasn't yet.

## How to verify (don't trust memory)

- **MDN** compatibility table / **web.dev/baseline** for the feature.
- **`web-features` data:** `npm view web-features version`, then read
  `data.json` → `features["<id>"].status` (`baseline`: `"high"` | `"low"` | `false`).
- **Stylelint:** [`stylelint-plugin-use-baseline`](https://github.com/ericwbailey/stylelint-plugin-use-baseline)
  enforces a Baseline level in CI. Suggest it if the project lints CSS.
- **`@supports`** for the feature in the real target browsers, via DevTools or
  BrowserStack/Playwright.
- **Browserslist + `baseline-browser-mapping`** to turn a Baseline year/tier into a
  concrete browserslist query.
