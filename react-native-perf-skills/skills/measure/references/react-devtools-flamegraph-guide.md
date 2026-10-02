---
title: React DevTools Flamegraph Interpretation Guide
impact: HIGH
tags: react-devtools, flamegraph, profiler, re-renders, interpretation
---

# React DevTools Flamegraph Interpretation Guide

How to read React DevTools Profiler output to identify re-render root causes.

## Setup

1. Install React DevTools standalone: `npx react-devtools`
2. Or use Flipper's React DevTools plugin
3. Ensure app is in development mode (profiling works in dev only, but measure FPS in release)
   - To profile **release** builds with React DevTools, use `@callstack/inspector` — it exposes the profiler against production builds, so re-render data reflects optimized code instead of dev-mode overhead.
4. Navigate to Profiler tab → click Record → perform the interaction → Stop

## Commit Timeline (Bar Chart)

Each vertical bar = one React commit (a batch of state updates that triggered renders).

| Bar Height | Meaning | Action |
|-----------|---------|--------|
| Tall (yellow/red) | Slow commit (>16ms) — frame budget exceeded | Investigate this commit |
| Short (green) | Fast commit (<5ms) — no concern | Skip |
| Grey | Commit with no visible changes | Check if work is wasted |

**Key insight**: Count the bars during your interaction. If scrolling for 2 seconds produces 120+ commits, something is triggering renders every frame (likely a subscription or animation on JS thread).

## Flamegraph Colors

| Color | Meaning |
|-------|---------|
| Yellow/Orange | This component rendered and was slow |
| Green | This component rendered but was fast |
| Grey | This component did NOT render (memoized or unchanged) |
| Blue stripe | This component was the "root" that triggered the cascade |

## "Why Did This Render?" Panel

Click any colored component in the flamegraph to see why it re-rendered:

### Pattern: "Props changed: onPress"
```
Why did this render?
• Props changed: (onPress)
```
**Root cause**: Parent passes a new function reference every render.
**Fix**: Wrap with `useCallback`, or enable React Compiler.
```typescript
// Bad: new function every render
<Item onPress={() => handlePress(item.id)} />

// Good: stable reference
const handlePress = useCallback((id) => { ... }, []);
<Item onPress={() => handlePress(item.id)} />

// Best: React Compiler handles it automatically
```

### Pattern: "Props changed: style"
```
Why did this render?
• Props changed: (style)
```
**Root cause**: Inline style object recreated every render.
**Fix**: Move to `StyleSheet.create` outside component.
```typescript
// Bad
<View style={{ flex: 1, padding: 16 }} />

// Good
<View style={styles.container} />
const styles = StyleSheet.create({ container: { flex: 1, padding: 16 } });
```

### Pattern: "Props changed: data"
```
Why did this render?
• Props changed: (data)
```
**Root cause**: Array/object reference changes even if contents are same.
**Fix**: Memoize with `useMemo`, or restructure to pass primitives.

### Pattern: "Hook 1 (useState) changed"
```
Why did this render?
• Hooks changed: (useState)
```
**Root cause**: State update in this component or ancestor.
**Investigation**: Is this state update necessary for this component? Could it be more granular?
**Fix**: Split state, use selectors (Zustand/Jotai), or move state closer to where it's consumed.

### Pattern: "Context changed"
```
Why did this render?
• Context changed
```
**Root cause**: Context provider value changed, causing ALL consumers to re-render.
**Fix**: Split context by update frequency, use selectors, or migrate to Zustand/Jotai.
```typescript
// Bad: one context for everything
<AppContext.Provider value={{ user, theme, cart, notifications }}>

// Good: split by update frequency  
<UserContext.Provider value={user}>
<ThemeContext.Provider value={theme}>
<CartContext.Provider value={cart}>      // Updates frequently
<NotificationContext.Provider value={notifications}>  // Updates very frequently
```

### Pattern: "Parent component rendered"
```
Why did this render?
• The parent component rendered
```
**Root cause**: No memoization — component re-renders whenever parent does.
**Fix**: Wrap with `React.memo()` if props are stable, or enable React Compiler.

## Ranked View Analysis

Switch to "Ranked" tab to see components sorted by render duration (slowest first).

**Focus on the top 3**. These are your highest-impact optimization targets.

For each:
1. Note the component name and render count
2. Check "Why did this render?" for each occurrence
3. Calculate: `render_count × render_duration = total_cost`
4. A component that renders 50 times at 2ms each (100ms total) may matter more than one that renders once at 50ms

## Heaviest Commit Analysis

Find the tallest bar in the commit timeline. Click it. This is your worst single frame.

Look for:
- Which component tree branch is orange/yellow? That's the expensive subtree.
- Is one component disproportionately expensive? Might have heavy computation in render.
- Are many components grey except one cascade? That's likely a Context consumer.

## Interaction Tracing

If available (React 18+):
1. Start profiling
2. Perform the exact user interaction that causes jank
3. Stop profiling
4. Correlate the slow commits with the interaction timeline

## Common Profiler Anti-patterns in Results

| What You See | What It Means | Fix Category |
|-------------|---------------|--------------|
| Every component yellow every frame | Global state update cascading everywhere | State management refactor |
| One component yellow, rest grey | Single expensive component | Memoize or split it |
| Many short green bars but too many commits | Frequent micro-updates (animation on JS thread) | Move to Reanimated |
| List items all re-rendering on scroll | Unmemoized list items | memo() + stable props |
| Root component yellow causing cascade | Top-level state too broad | Move state down |

## Limitations

- **Dev mode only**: Profiler measurements include DevTools overhead. Use for *relative* comparison (which component is slowest), not absolute timings. To profile a release build instead, use `@callstack/inspector`.
- **Cannot see native work**: If the flamegraph shows fast React commits but FPS is still low, the bottleneck is in native land. Use Xcode/Android Studio profiler.
- **Suspense boundaries**: Components behind Suspense won't show render time for the suspended phase.

## Next Steps

After identifying the re-rendering components:
- Save findings to `.perf/[slug]/research/devtools-findings.md`
- Run `/perf-analyze` with specific component names and "Why did this render?" reasons
- The analyze phase will map these to specific fix patterns
