# Animation

Pair with `preferences.md` §1 (`prefers-reduced-motion`).

## 1. No `transition: all`

**Problem.** `all` animates every changing property, including unintended and expensive ones.

**Why.** Listing properties makes motion intentional and cheap.

**Fix.**

```css
/* Before */
.btn { transition: all 0.3s; }

/* After */
.btn { transition: background-color 200ms, translate 200ms; }
```

**Note.** `transition: transform` doesn't cover the individual `translate`/`scale`/`rotate`.

## 2. Animate `transform` and `opacity`

**Problem.** Animating `width`, `height`, `top`, `left`, `margin` or `box-shadow`
forces layout or paint every frame.

**Why.** `transform` (and `translate`/`scale`/`rotate`) and `opacity` run on the compositor.

**Fix.**

```css
/* Before */
.drawer { left: -20rem; transition: left 0.3s; }
.drawer.is-open { left: 0; }

/* After */
.drawer { translate: -100% 0; transition: translate 0.3s; }
.drawer.is-open { translate: 0 0; }
```

**Note.** For height, use `grid-template-rows: 0fr → 1fr`; `interpolate-size` isn't Baseline.

## 3. `@starting-style` for enter animations (Newly)

**Problem.** Appearing elements use `@keyframes` or JS that adds a class on the next frame.

**Why.** `@starting-style` sets the transition's "from" values at first render.

**Fix.**

```css
/* Before */
@keyframes toast-in { from { opacity: 0; transform: translateY(1rem); } }
.toast { animation: toast-in 0.25s; }

/* After */
.toast {
  transition: opacity 0.25s, translate 0.25s;
  @starting-style { opacity: 0; translate: 0 1rem; }
}
```

**Note.** It runs at first render, not on exit. Exit needs `display … allow-discrete`
(and `overlay` for top-layer elements), which isn't Baseline: treat it as an enhancement.

## 4. Separate the trigger from the effect

**Problem.** An element that moves on its own `:hover` slides out from under the pointer, loses hover, moves back, and flickers in a loop.
**Why.** The trigger must stay put while the effect moves: hover the stable parent, animate the child.
**Fix.**

```css
/* Before */
.btn { transition: translate 0.2s; }
.btn:hover { translate: 0 -8px; }

/* After */
.btn-wrap:hover .btn { translate: 0 -8px; }
.btn { transition: translate 0.2s; }
```

**Note.** Same for `scale` or anything that changes the hit area; the wrapper must not move.

## 5. Stagger with a custom property

**Problem.** Staggered delays are hard-coded per `:nth-child()`, so they break when the list grows.
**Why.** One formula, driven by an index, covers any length.
**Fix.**

```css
/* Before */
li:nth-child(1) { transition-delay: 0ms; }
li:nth-child(2) { transition-delay: 50ms; }
li:nth-child(3) { transition-delay: 100ms; }

/* After */
li { transition-delay: calc(var(--i) * 50ms); }     /* <li style="--i: 2"> */

/* Newly available: no inline variable (1-based) */
li { transition-delay: calc((sibling-index() - 1) * 50ms); }
```

**Note.** Typed `attr(data-i type(<number>))` isn't Baseline; use the custom property or `sibling-index()`.

## 6. Keep durations under 400ms

**Problem.** Slow transitions (600ms+) make the UI feel laggy; very fast ones (under ~100ms) are invisible.
**Why.** Interfaces feel responsive when feedback arrives in under 400ms (Doherty threshold).
**Fix.**

```css
/* Before */
.menu { transition: opacity 800ms; }

/* After */
:root { --duration-fast: 150ms; --duration-base: 250ms; --duration-slow: 400ms; }
.menu { transition: opacity var(--duration-base); }
```

**Note.** Make exits shorter than entrances. Ambient or looping motion is exempt.

