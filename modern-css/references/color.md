# Color

## 1. Tokens instead of hardcoded colors

**Problem.** Literal colors scattered across components drift; rebranding or dark
mode means editing every file.

**Why.** A token names the meaning once; components reference it.

**Fix.**

```css
/* Before */
.btn   { background: #2563eb; color: #fff; }
.card  { background: #fff; }

/* After */
:root {
  --color-accent: oklch(54.6% 0.215 262.9);
  --color-on-accent: oklch(100% 0 0);
  --color-surface: oklch(100% 0 0);
}
.btn  { background: var(--color-accent); color: var(--color-on-accent); }
.card { background: var(--color-surface); }
```

**Note.** Leave `currentColor`, `transparent` and system colors alone; name tokens by role.

## 2. `oklch()` for color values

**Problem.** Hex/`rgb()`/`hsl()` aren't perceptually uniform, so shades and hue
shifts come out uneven.

**Why.** In `oklch(L C H)` equal lightness looks equal across hues, so scales and
contrast are predictable.

**Fix.**

```css
/* Before */
:root { --brand: #3b82f6; --shadow: rgba(0, 0, 0, 0.08); }

/* After */
:root { --brand: oklch(62.3% 0.188 259.8); --shadow: oklch(0% 0 0 / 8%); }
```

**Note.** Convert with a tool, not by hand, and keep the same appearance.

## 3. `color-mix()` for derived shades

**Problem.** Each hover, disabled and tint state is a hand-picked literal that drifts from the base.

**Why.** Derived shades follow the base token.

**Fix.**

```css
/* Before */
.btn:hover { background: #1d4ed8; }

/* After */
.btn:hover { background: color-mix(in oklch, var(--color-accent), black 15%); }
```

**Note.** Always name the space (`in oklch`).
