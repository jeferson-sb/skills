# Typography

## 1. `rem` for font sizes and spacing

**Problem.** `px` ignores the user's browser font-size setting.

**Why.** `rem` follows the root size, so text and spacing scale together.

**Fix.**

```css
/* Before */
h1    { font-size: 32px; margin-bottom: 24px; }
.card { padding: 16px 24px; }

/* After (px ÷ 16) */
h1    { font-size: 2rem; margin-block-end: 1.5rem; }
.card { padding: 1rem 1.5rem; }
```

**Note.** Keep `px` for `1px` borders and fixed icons; never `html { font-size: 62.5% }`.

## 2. Fluid type with `clamp()`

**Problem.** Breakpoint-stepped sizes jump; `vw`-only sizes can't be zoomed.

**Why.** `clamp()` scales smoothly, and `rem` in it keeps user preferences working.

**Fix.**

```css
/* Before */
h1 { font-size: 1.75rem; }
@media (min-width: 64rem) { h1 { font-size: 3rem; } }

/* After */
h1 { font-size: clamp(1.75rem, 1.25rem + 2.5vw, 3rem); }
```

**Note.** Never `vw` alone; keep max ≲ 2.5× min.

## 3. Line-height by role

**Problem.** One line-height for everything: tight body text is hard to read, loose headings look disconnected.

**Why.** Long lines of body text need room; large headings need less.

**Fix.**

```css
/* Before */
body { line-height: 1.2; }
h1   { line-height: 1.6; }

/* After */
body { line-height: 1.6; }
:is(h1, h2, h3) { line-height: 1.2; }
```

**Note.** Always unitless; body text at least 1.5 (WCAG 1.4.12).

## 4. `text-wrap: balance` and `pretty`

**Problem.** Headings end with a single orphan word; paragraphs leave short last lines.

**Why.** `balance` evens out line lengths; `pretty` avoids orphans. This changes where lines break, not how words break.

**Fix.**

```css
/* Before */
h1 { max-inline-size: 20ch; }

/* After */
:is(h1, h2, h3) { text-wrap: balance; }
p { text-wrap: pretty; }
```

**Note.** `balance` is Newly available; `pretty` isn't Baseline yet. Both fall back to normal wrapping. For long words use `overflow-wrap: anywhere` or `hyphens: auto`.

## 5. `tabular-nums`

**Problem.** Digits have different widths, so columns of numbers and counters jitter.

**Why.** `tabular-nums` gives every digit the same width.

**Fix.**

```css
/* Before */
td.amount { text-align: end; }

/* After */
td.amount, .counter { font-variant-numeric: tabular-nums; text-align: end; }
```

**Note.** Needs a font with tabular figures.

## 6. Text around shapes

**Problem.** Text wraps around a round or irregular float as if it were a rectangle, leaving gaps.

**Why.** `shape-outside` lets text follow the shape; `shape-margin` adds breathing room.

**Fix.**

```css
/* Before */
.avatar { float: left; inline-size: 8rem; border-radius: 50%; margin-right: 1rem; }

/* After */
.avatar {
  float: inline-start;
  inline-size: 8rem;
  aspect-ratio: 1;
  border-radius: 50%;
  shape-outside: circle(50%);
  shape-margin: 1rem;
}
```

**Note.** Only works on floats.

## 7. Truncating text

**Problem.** Long text overflows its box or breaks the layout.

**Why.** `text-overflow: ellipsis` truncates one line; line clamping truncates a block to N lines.

**Fix.**

```css
/* Before */
.title { white-space: nowrap; }

/* After */
.title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.excerpt {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  overflow: hidden;
}
```

**Note.** Unprefixed `line-clamp` isn't Baseline; keep the `-webkit-` form. Inside flex items the container needs `min-inline-size: 0` (layout §8).

