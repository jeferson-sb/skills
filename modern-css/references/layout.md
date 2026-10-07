# Layout

## 1. Container queries

**Problem.** Components respond to the viewport, but their space depends on where
they're placed.

**Why.** `@container` adapts a component to its own container, so it works anywhere.

**Fix.**

```css
/* Before */
@media (min-width: 40rem) { .card { grid-template-columns: 10rem 1fr; } }

/* After */
.card-slot { container: card / inline-size; }
.card {
  display: grid;
  @container card (inline-size >= 32rem) { grid-template-columns: 10rem 1fr; }
}
```

**Note.** The container must be an ancestor; an element can't query itself.

## 2. Container units (`cqi`)

**Problem.** `vw` and stepped breakpoints don't track a component's real width.

**Why.** `cqi` is relative to the container's inline size, so it scales smoothly.

**Fix.**

```css
/* Before */
.hero { padding: 2rem; }
@media (min-width: 64rem) { .hero { padding: 4rem; } }

/* After */
.hero { padding: clamp(1rem, 4cqi, 4rem); }
```

**Note.** Always wrap in `clamp()`, and keep a `rem` term in type.

## 3. `gap` instead of margins

**Problem.** Sibling margins need first/last special cases and break on wrapping.

**Why.** `gap` applies only between items, in any direction.

**Fix.**

```css
/* Before */
.toolbar > * { margin-right: 0.75rem; }
.toolbar > *:last-child { margin-right: 0; }

/* After */
.toolbar { display: flex; gap: 0.75rem; }
```

**Note.** Flex and grid only; don't convert block flow.

## 4. Logical properties

**Problem.** `margin-left`, `padding-right`, `left`, `text-align: right` are
hard-wired to LTR and need RTL overrides.

**Why.** Logical properties follow writing direction, so one rule works in LTR and RTL.

**Fix.**

```css
/* Before */
.alert { padding-left: 3rem; border-left: 4px solid; text-align: left; }
[dir="rtl"] .alert { padding-left: 0; padding-right: 3rem; border-left: 0; border-right: 4px solid; }

/* After */
.alert { padding-inline-start: 3rem; border-inline-start: 4px solid; text-align: start; }
```

| Physical | Logical |
|---|---|
| `margin-left` / `-right` | `margin-inline-start` / `-end` |
| `margin-top` / `-bottom` | `margin-block-start` / `-end` |
| `left` / `right` | `inset-inline-start` / `-end` |
| `width` / `height` | `inline-size` / `block-size` |
| `border-top-left-radius` | `border-start-start-radius` |

**Note.** Don't mirror photos, media icons or charts; `transform` stays physical.

## 5. `min()`, `max()`, `clamp()`

**Problem.** `width: 100%` + `max-width` + media queries to change padding.
**Why.** One declaration sets the bounds, and the element grows and shrinks
between them with no media query.
**Fix.**

```css
/* Before */
.container { width: 100%; max-width: 80ch; margin: 0 auto; padding: 0 1rem; }
@media (min-width: 48rem) { .container { padding: 0 2rem; } }

/* After */
.fluid-container {
  inline-size: min(80ch, 100% - 2rem);
  margin-inline: auto;
}
.sidebar { inline-size: clamp(15rem, 25%, 22rem); }   /* min, preferred, max */
```

**Note.** Spaces are required around `+` and `-` inside these functions.

## 6. Intrinsic sizing instead of fixed sizes

**Problem.** `width: 300px` / `height: 200px` clips text, breaks with translations
and larger fonts, and shifts layout while media loads.
**Why.** Let the content size the box: `min-content` (narrowest), `max-content`
(widest, no wrap), `fit-content` (hugs content, capped by available space).
**Fix.**

```css
/* Before */
.badge { width: 80px; }
.meta  { display: grid; grid-template-columns: 120px 1fr; }
.video { width: 640px; height: 360px; }

/* After */
.badge { inline-size: fit-content; }
.meta  { display: grid; grid-template-columns: max-content 1fr; }
.video { inline-size: 100%; aspect-ratio: 16 / 9; }
```

**Note.** `max-content` can overflow; cap it or use `fit-content`. Keep fixed sizes for icons and hairlines.

## 7. Flexbox: wrap by content size

**Problem.** `flex: 1` items squish into one row instead of wrapping.
**Why.** `min-inline-size: fit-content` makes each item's size at least its content, so the browser wraps when they no longer fit.
**Fix.**

```css
/* Before */
.row { display: flex; flex-wrap: wrap; }
.row > * { flex: 1 1 0; }

/* After */
.row > * { flex: 1 1 0; min-inline-size: fit-content; }
```

**Note.** Needs `flex-wrap: wrap`. Tested: 3 items in 400px stayed on one row without it, wrapped to 3 rows with it.

## 8. Flexbox: let items shrink

**Problem.** Long text, URLs, `pre` or images overflow a flex item.
**Why.** Flex items default to `min-width: auto`, so they never shrink below their content.
**Fix.**

```css
/* Before */
.row > .main { flex: 1; }

/* After */
.row > .main { flex: 1; min-inline-size: 0; }
```

**Note.** In grid the same blowout comes from `1fr`; use `minmax(0, 1fr)`.

## 9. Grid: place items with named lines and subgrid

**Problem.** Mixing full-bleed and constrained content relies on source order, wrappers, or `100vw` tricks (which add a horizontal scrollbar).
**Why.** Named lines let each child pick its column explicitly; `subgrid` lets nested wrappers reuse the parent's tracks.
**Fix.**

```css
/* Before */
.fullbleed { inline-size: 100vw; margin-inline: calc(50% - 50vw); }

/* After */
.page {
  display: grid;
  grid-template-columns: [fullbleed-start] 1rem [main-start] auto [main-end] 1rem [fullbleed-end];
  & > * { grid-column: main; }
}

.fullbleed { grid-area: fullbleed; }

.section {                                  /* nested wrapper keeps the same tracks */
  grid-column: fullbleed;
  display: grid;
  grid-template-columns: subgrid;
  & > * { grid-column: 2; }
}
```

**Note.** `grid-area: fullbleed` resolves from the `fullbleed-start/-end` lines (tested). `subgrid` is Widely available.

## 10. `inset: 0`

**Problem.** Four declarations to stretch an absolutely positioned element.
**Why.** `inset` is the shorthand for `top`, `right`, `bottom`, `left`.
**Fix.**

```css
/* Before */
.overlay { position: absolute; top: 0; right: 0; bottom: 0; left: 0; }

/* After */
.overlay { position: absolute; inset: 0; }
```

**Note.** Use `inset-inline` / `inset-block` for one axis.

## 11. `overflow: clip` instead of `hidden`

**Problem.** `overflow: hidden` clips, but also makes a scroll container: content can still be scrolled programmatically, and it breaks `position: sticky` descendants.
**Why.** `overflow: clip` only clips; no scroll container is created.
**Fix.**

```css
/* Before */
.card { overflow: hidden; }

/* After */
.card { overflow: clip; }
```

**Note.** Keep `hidden` when you need programmatic scrolling or to contain floats/margins (or use `display: flow-root`).

## 12. Z-index tokens and `isolation: isolate`

**Problem.** Arbitrary `z-index` values (`9999`) escalate, and nobody knows what sits above what.
**Why.** Named layers make the order explicit; `isolation: isolate` creates a stacking context so a component's inner z-indexes can't leak out.
**Fix.**

```css
/* Before */
.dropdown { z-index: 100; }
.modal    { z-index: 9999; }

/* After */
:root { --z-dropdown: 10; --z-sticky: 20; --z-modal: 30; --z-toast: 40; }

.dropdown { z-index: var(--z-dropdown); }
.modal    { z-index: var(--z-modal); }
.card     { isolation: isolate; }           /* its inner z-index values stay inside */
```

**Note.** `z-index` only affects positioned elements and flex/grid items.
