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
