# Architecture

## 1. Nesting (max 3 levels)

**Problem.** Flat selectors repeat the parent everywhere. Deep nesting makes
long, hard-to-override selectors.

**Why.** Nesting keeps a component in one block; depth multiplies specificity.

**Fix.**

```css
/* Before */
.card { padding: 1rem; }
.card:hover { box-shadow: var(--shadow-2); }
.card .title a:hover { text-decoration: underline; }

/* After */
.card {
  padding: 1rem;
  &:hover { box-shadow: var(--shadow-2); }
  .title { a:hover { text-decoration: underline; } }
}
```

**Note.** No Sass-style `&__elem` / `&-suffix`; write the full class.

## 2. Custom properties for repeated values

**Problem.** The same literal (color, spacing, radius) is repeated across files and drifts.

**Why.** One source of truth; themes and variants override it without new selectors.

**Fix.**

```css
/* Before */
.btn   { padding: 0.5rem 1rem; border-radius: 6px; }
.badge { border-radius: 6px; }

/* After */
:root { --space-s: 0.5rem; --space-m: 1rem; --radius-m: 0.375rem; }
.btn   { padding: var(--space-s) var(--space-m); border-radius: var(--radius-m); }
.badge { border-radius: var(--radius-m); }
```

**Note.** `var()` doesn't work inside `@media`/`@container` conditions.

## 3. Cascade layers instead of `!important`

**Problem.** Overrides are won with `!important`, `#id`s and extra selectors, each
making the next override harder.

**Why.** A later `@layer` beats an earlier one regardless of specificity.

**Fix.**

```css
/* Before */
.table .btn { background: gray !important; }
#app .modal .btn.primary { color: white; }

/* After */
@layer reset, vendor, base, components, utilities;   /* once, in the global entry */

@layer components {
  .table .btn { background: gray; }
  .modal .btn.primary { color: white; }
}
```

**Note.** Unlayered styles beat all layered ones, so layer everything in one pass.

## 4. `:is()` to group selectors

**Problem.** Long selector lists repeat the same prefix or suffix.

**Why.** `:is()` removes the repetition.

**Fix.**

```css
/* Before */
.prose h1, .prose h2, .prose h3 { line-height: 1.2; }

/* After */
.prose :is(h1, h2, h3) { line-height: 1.2; }
```

**Note.** `:is()` takes its most specific argument's specificity; use `:where()` for zero.

## 5. Always set `content` on pseudo-elements

**Problem.** A `::before` / `::after` without `content` renders nothing, a silent bug.

**Why.** `content` is what makes the pseudo-element exist.

**Fix.**

```css
/* Before */
.badge::before { inline-size: 0.5rem; block-size: 0.5rem; background: currentColor; }

/* After */
.badge::before { content: ""; inline-size: 0.5rem; block-size: 0.5rem; background: currentColor; }
```

**Note.** Decorative text can use alt text, `content: "→" / ""` (Newly available).

## 6. Typed custom properties with `@property` (Newly)

**Problem.** Plain custom properties are untyped strings: they can't be animated, have no default, and always inherit.

**Why.** `@property` sets a type, an initial value and inheritance, so the property can transition and animate.

**Fix.**

```css
/* Before */
.spinner { background: conic-gradient(from var(--angle, 0deg), red, blue); }
/* --angle can't be animated: it snaps */

/* After */
@property --angle {
  syntax: "<angle>";
  inherits: false;
  initial-value: 0deg;
}

.spinner {
  background: conic-gradient(from var(--angle), red, blue);
  animation: spin 2s linear infinite;
}
@keyframes spin { to { --angle: 360deg; } }
```

**Note.** Newly available; unsupported browsers just don't animate. Use `inherits: false` unless children need the value.

