---
name: perf-measure
description: "DMAIC Phase 2 — Collect performance data. Routes to the correct measurement tool based on symptom domain (FPS, TTI, bundle, memory, animation). Guides profiling setup, interprets tool output, and produces a structured baseline metrics report."
effort: medium
argument-hint: "[domain: fps|tti|bundle|memory|animation]"
tools: Read, Glob, Grep, Bash
---

# Measure — DMAIC Phase 2

Collect baseline performance data using the correct tool for the symptom domain. Always measure in release/production mode, minimum 3 runs, on a representative device.

## Usage

```
/perf-measure fps          # FPS/jank measurement
/perf-measure tti          # Startup time measurement
/perf-measure bundle       # Bundle & app size analysis
/perf-measure memory       # Memory usage & leak detection
/perf-measure animation    # Animation frame rate analysis
```

## Measurement Principles

1. **Always release mode** — Debug mode has DevTools overhead, serialization logging, and disabled optimizations that make measurements meaningless.
2. **Minimum 3 runs** — Take median, not average (avoids outlier skew from GC pauses or OS scheduling).
3. **Document device** — Record exact model, OS version, RAM, and device tier.
4. **Cold state** — For TTI: restart device or clear app from recents. For memory: fresh app launch.
5. **Disable dev tools** — No React DevTools connected, no Flipper, no console transport.

## Domain Routing

### FPS / Jank (`fps`)

**Primary tool**: Flashlight (Android)
```bash
# Install
npx @perf-profiler/web-reporter
# or
npm install -g @perf-profiler/cli

# Measure (replace with your app's bundle ID)
flashlight measure --bundleId com.yourapp --testCommand "maestro test scroll-test.yaml" --duration 30
```

**Secondary tool**: React Native Perf Monitor (both platforms)
- Shake device → "Show Perf Monitor" → observe RAM/FPS in real-time

**Automation**: `agent-device` (`callstackincubator/agent-device`) can drive device control and run profiling commands programmatically — useful for scripted or agent-run Flashlight measurements.

**Interpretation**: See `${CLAUDE_SKILL_DIR}/references/flashlight-output-guide.md`

**What to record**:
- Flashlight composite score (0-100)
- Average FPS during interaction
- FPS drops: count, duration, and trigger correlation
- CPU usage during interaction
- Thread distribution (JS vs UI vs native)

---

### Startup / TTI (`tti`)

**Primary tool**: `react-native-performance` markers
```bash
npm install react-native-performance
```

**Instrumentation points**:
```typescript
import performance from 'react-native-performance';

// In App.tsx or entry point
performance.mark('app_start');

// After first meaningful screen renders
performance.mark('tti');
performance.measure('startup', 'app_start', 'tti');
```

**Secondary tool**: Flashlight (Android) — measures native startup phases too
```bash
flashlight measure --bundleId com.yourapp --testCommand "maestro test launch-test.yaml"
```

**What to record**:
- Total cold start time (icon tap → interactive)
- JS bundle parse time (Hermes)
- Native initialization time
- First render time
- TTI (time to first user interaction possible)

---

### Bundle / App Size (`bundle`)

**JS Bundle analysis**:
```bash
# React Native CLI
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output /tmp/bundle.js --sourcemap-output /tmp/bundle.js.map

# Analyze with source-map-explorer
npx source-map-explorer /tmp/bundle.js.map --html /tmp/bundle-report.html

# Or with Expo Atlas (Expo SDK 52+)
EXPO_ATLAS=1 npx expo export
```

**App size analysis**:
```bash
# Android — APK Analyzer
# Build release: ./gradlew assembleRelease
# Open in Android Studio → Build → Analyze APK

# iOS — Xcode
# Archive → Distribute App → Export → App Thinning report
```

**What to record**:
- JS bundle size (minified, before Hermes bytecode)
- Hermes bytecode size
- Total app download size (iOS thin / Android AAB)
- Top 5 largest dependencies (from source-map-explorer)
- Native library sizes (from APK/IPA breakdown)

---

### Memory (`memory`)

**JS Heap**:
- React DevTools → Profiler → Memory tab
- Take heap snapshots: (1) after app launch, (2) after navigation cycle, (3) after 5 navigation cycles
- Compare retained sizes

**Native memory**:
- **iOS**: Xcode → Product → Profile → Leaks / Allocations template
- **Android**: Android Studio → App Inspection → Memory Profiler → Record allocations

**What to record**:
- JS heap size at rest (after initial load)
- JS heap growth per navigation cycle
- Native RSS at rest
- Native RSS growth per navigation cycle
- Leak count (if using Leaks instrument)

See `${CLAUDE_SKILL_DIR}/references/xcode-instruments-guide.md` and `${CLAUDE_SKILL_DIR}/references/android-studio-profiler-guide.md`

---

### Animation (`animation`)

**Primary approach**: Flashlight + targeted scenario
```bash
# Create a Maestro test that triggers the animation
flashlight measure --bundleId com.yourapp --testCommand "maestro test animation-test.yaml" --duration 10
```

**Secondary**: React Native Perf Monitor for real-time FPS during animation

**What to record**:
- FPS during animation (should be 58-60)
- Frame drops: at animation start, during, at end
- Whether animation runs on UI thread (Reanimated) or JS thread (Animated)
- CPU spike correlation with frame drops

---

## Output: Baseline Metrics Report

After measurement, produce this structured artifact:

```markdown
# Baseline Metrics — [Problem Slug]

**Date**: [YYYY-MM-DD]
**Device**: [Model, OS version, RAM, tier]
**Build**: [release/debug, commit SHA]
**Tool**: [Flashlight/DevTools/Xcode/etc.]

## Measurements (3 runs, median)

| Metric | Run 1 | Run 2 | Run 3 | Median | Target |
|--------|-------|-------|-------|--------|--------|
| [metric] | [val] | [val] | [val] | [val] | [from define phase] |

## Key Observations
- [Most significant finding]
- [Second finding]
- [Correlation or pattern noticed]

## Raw Data Location
- [Path to Flashlight JSON / screenshot / export]
```

Save to `.perf/[slug]/baseline-metrics.md`

## After Measuring

- "Baseline collected. Run `/perf-analyze` to identify root cause from these metrics."
- If metrics are already in "Excellent" range: "Metrics look healthy — verify the symptom is reproducible or check device-specific issues."

## Callstack References
- `js-measure-fps.md` — FPS measurement approaches
- `native-measure-tti.md` — TTI instrumentation
- `bundle-analyze-js.md` — JS bundle visualization
- `bundle-analyze-app.md` — Full app size analysis
- `js-memory-leaks.md` — Memory profiling setup
- `native-profiling.md` — Native profiler setup
