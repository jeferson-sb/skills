# User preferences

## 1. `prefers-reduced-motion`

**Problem.** Large or looping motion can cause nausea or migraines.

**Why.** Users can ask the OS for less motion; reduce it, keep subtle fades.

**Fix.**

```css
/* Before */
.drawer { transition: translate 0.3s; }

/* After */
@media (prefers-reduced-motion: no-preference) {
  .drawer { transition: translate 0.3s; }
}
```

**Note.** Avoid `* { animation: none !important }`; it breaks spinners and end states.

## 2. `color-scheme` and dark mode

**Problem.** Dark mode is a duplicated `.dark` block, and native controls and scrollbars stay light.

**Why.** `color-scheme` makes browser UI adapt; tokens make dark mode a value swap.

**Fix.**

```css
/* Before */
body       { background: #fff; color: #111; }
.dark body { background: #111; color: #eee; }

/* After */
:root {
  color-scheme: light dark;
  --bg: light-dark(oklch(100% 0 0), oklch(15% 0 0));
  --text: light-dark(oklch(20% 0 0), oklch(92% 0 0));
}
body { background: var(--bg); color: var(--text); }
```

**Note.** `light-dark()` is Newly available; use `@media (prefers-color-scheme: dark)` token overrides otherwise.

## 3. `prefers-contrast` and `forced-colors`

**Problem.** Low-contrast borders and `box-shadow`-only focus rings vanish for users who need more contrast.

**Why.** These queries let you strengthen or preserve boundaries.

**Fix.**

```css
/* Before */
.btn { border: none; }
:focus-visible { box-shadow: 0 0 0 2px blue; }

/* After */
.btn { border: 1px solid transparent; }        /* visible in forced colors */
:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
@media (prefers-contrast: more) { .card { border-width: 2px; } }
```

**Note.** Never `outline: none` without a `:focus-visible` replacement.

## 4. `prefers-reduced-transparency`

**Problem.** Translucent surfaces and `backdrop-filter` blur reduce legibility for some users.

**Why.** Users can ask the OS for less transparency; swap blur for a solid surface.

**Fix.**

```css
/* Before */
.glass { background: oklch(100% 0 0 / 60%); backdrop-filter: blur(12px); }

/* After: keep the above, and add */
@media (prefers-reduced-transparency: reduce) {
  .glass { background: var(--color-surface); backdrop-filter: none; }
}
```

**Note.** Not Baseline (Chromium only); it's a harmless no-op elsewhere. `backdrop-filter` itself is Newly available.

## 5. `accent-color` for native controls

**Problem.** Checkboxes, radios and ranges are rebuilt with `appearance: none`, losing the native look, behavior and OS accent.

**Why.** `accent-color` tints the native control; `auto` follows the OS/browser accent.

**Fix.**

```css
/* Before */
input[type="checkbox"] { appearance: none; inline-size: 1.25rem; /* ...custom checked state, focus, RTL... */ }

/* After */
:root { accent-color: auto; }                     /* respect the OS accent */
.brand-form { accent-color: var(--color-accent); } /* only when the brand requires it */
```

**Note.** Not yet marked Baseline (all three engines ship it); unsupported browsers just show the default accent.

