---
title: Flashlight Output Interpretation Guide
impact: CRITICAL
tags: flashlight, fps, android, profiling, interpretation
---

# Flashlight Output Interpretation Guide

How to read and act on Flashlight (@perf-profiler/cli) measurement results.

## Score Interpretation (0-100)

Flashlight produces a composite performance score:

| Score Range | Rating | Typical Root Cause |
|-------------|--------|-------------------|
| 80-100 | Excellent | No action needed — minor optimizations only |
| 60-79 | Good | Isolated drops during specific interactions |
| 40-59 | Needs Work | Re-render cascades or JS thread blocking |
| 20-39 | Poor | Structural issues: wrong list component, JS-thread animations |
| 0-19 | Critical | Multiple compounding issues — likely ScrollView + unmemoized items |

## FPS Graph Signatures

### Pattern: Periodic Regular Drops
```
60 ████████████████████████████████████
55 █
60 ████████████████████████████████████
55 █
60 ████████████████████████████████████
```
**Diagnosis**: Re-render cascade on a timer or subscription update.
**Investigation**: React DevTools → look for components re-rendering every N ms.
**Common cause**: Context value changing on interval, polling state updates.

### Pattern: Drops Correlated with Scroll Start
```
60 ████████████
30 ████
45 ████████
60 ████████████████████████████████████
```
**Diagnosis**: Gesture handler or list initialization running on JS thread.
**Investigation**: Check if using `Animated` (JS thread) vs `Reanimated` (UI thread).
**Common cause**: `Animated.event` for scroll, `PanResponder` instead of `gesture-handler`.

### Pattern: Continuous Low FPS During Scroll
```
35 ████████████████████████████████████████████████
28 ████████████████
35 ████████████████████████████████████████████████
```
**Diagnosis**: Heavy list items or non-virtualized list.
**Investigation**: Check if using ScrollView+map or FlatList with complex items.
**Common cause**: ScrollView rendering all items, items with nested images/animations.

### Pattern: Sudden Drop to 0 (Freeze)
```
60 ████████████████████████
 0 ████
60 ████████████████████████████████████
```
**Diagnosis**: Synchronous blocking operation on JS thread.
**Investigation**: Check for JSON.parse of large data, sync storage reads, heavy computation.
**Common cause**: Large API response parsing, AsyncStorage.getItem in render path (sync in Hermes).

### Pattern: Gradual Degradation Over Time
```
60 ██████████████████
55 ██████████████
50 ██████████
45 ██████
40 ████
```
**Diagnosis**: Memory pressure causing GC pauses, or accumulating listeners.
**Investigation**: Monitor RAM alongside FPS. If RAM grows → memory leak.
**Common cause**: Unmounted component listeners, growing cache without eviction.

## CPU/RAM Correlation Analysis

### High CPU + Low FPS
**Meaning**: JS thread is saturated — too much work per frame.
**Action**: Profile with React DevTools to find expensive renders.

### High RAM + FPS Decay
**Meaning**: Memory pressure triggers GC, which pauses JS thread.
**Action**: Take heap snapshots, look for growing retained objects.

### Low CPU + Low FPS
**Meaning**: UI thread blocked (not JS). Likely layout complexity or native view hierarchy.
**Action**: Use Xcode/Android Studio native profiler. Check view flattening.

### Spiky CPU + Stable FPS
**Meaning**: Work is being offloaded correctly (background thread / worklet).
**Action**: This is fine — Reanimated worklets or TurboModule background threads working correctly.

## Thread Analysis

Flashlight shows CPU usage per thread:

| Thread | Normal Usage | High Usage Means |
|--------|-------------|-----------------|
| JS Thread | 30-50% during interaction | Re-renders, heavy computation, JSON parsing |
| UI Thread | 10-30% | Layout recalculation, view hierarchy updates |
| Render Thread | 5-15% | GPU overdraw, complex shadows/gradients |
| Native Modules | 0-10% | Turbo Module work (expected during I/O) |

**Red flag**: JS Thread > 70% sustained → JS is the bottleneck. Move work to UI thread (Reanimated) or background (TurboModule).

## JSON Export for CI Comparison

```bash
# Export measurements as JSON
flashlight measure --bundleId com.app --testCommand "..." --output results.json

# Compare against baseline
flashlight compare --baseline baseline.json --current results.json
```

**Key fields in JSON output**:
```json
{
  "score": 72,
  "fps": { "average": 54, "min": 28, "drops": 3 },
  "cpu": { "average": 45, "peak": 82 },
  "ram": { "average": 180, "peak": 220, "growth": 12 }
}
```

**CI threshold recommendations**:
- Score regression > 10 points → block PR
- Average FPS regression > 5 frames → warn
- RAM growth > 20MB → warn (possible leak)

## Common Misinterpretations

1. **"Score is 50 so it's fine"** — No. 50 means perceptible jank to users. Target 70+.
2. **"FPS averages 55"** — Average hides drops. A 55 average with drops to 20 is worse than steady 50.
3. **"CPU is low so it's not a JS problem"** — Low CPU can mean the JS thread is *blocked* (waiting on bridge/sync call), not idle.
4. **"RAM is stable"** — Check growth over time, not just absolute value. 200MB stable is fine; 150MB growing 5MB/min is a leak.

## Next Steps After Flashlight Analysis

- Score < 40 with scroll drops → `/perf-analyze` with "re-renders" or "list virtualization" hypothesis
- Score 40-70 with gesture drops → `/perf-analyze` with "JS-thread animation" hypothesis
- Score 70+ with isolated drops → targeted fix, may not need full DMAIC cycle
