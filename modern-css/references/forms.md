# Forms

## 1. `field-sizing: content` (Newly)

**Problem.** Auto-growing textareas rely on JS (`scrollHeight` on every input).

**Why.** `field-sizing: content` sizes the field to its content natively.

**Fix.**

```css
/* Before */
textarea { height: 6rem; }
/* + JS: el.style.height = el.scrollHeight + 'px' */

/* After */
textarea {
  field-sizing: content;
  min-block-size: 6rem;
  max-block-size: 20rem;
}
```

**Note.** Always set min and max sizes. Keep the JS until your browser target supports it.

## 2. Textarea height in lines with `lh`

**Problem.** Textarea heights in `px`, `rem` or `rows` don't follow the font size or line-height, so "3 lines" changes when the type changes.

**Why.** `lh` is one line-height of the element, so heights are written in lines.

**Fix.**

```css
/* Before */
textarea { min-block-size: 96px; max-block-size: 320px; }

/* After */
textarea {
  field-sizing: content;
  min-block-size: 3lh;
  max-block-size: 10lh;
}
```

**Note.** Padding and borders add to it unless `box-sizing: border-box`.

## 3. `font: inherit` on form controls

**Problem.** Inputs, buttons, selects and textareas ignore the page font and use the browser's small system font.

**Why.** Form controls don't inherit font properties by default; `font: inherit` resets them to the page typography.

**Fix.**

```css
/* Before */
body { font: 1rem/1.5 "Inter", sans-serif; }

/* After */
body { font: 1rem/1.5 "Inter", sans-serif; }
:is(input, button, select, textarea) { font: inherit; }
```

**Note.** Keeps inputs at 1rem, avoiding the focus zoom iOS Safari applies below 16px. Put it in your base layer.

