---
title: Measurement Tool Matrix
impact: HIGH
tags: measurement, tools, flashlight, devtools, xcode, android-studio, routing
---

# Measurement Tool Matrix

Master routing table: symptom → platform → tool → what to look for.

## Primary Tool Selection

| Symptom | Platform | Primary Tool | Secondary Tool | Setup Time |
|---------|----------|--------------|----------------|------------|
| Scroll jank | Android | Flashlight CLI | React DevTools Profiler | 5 min |
| Scroll jank | iOS | React Perf Monitor | Xcode Time Profiler | 10 min |
| Animation stutter | Android | Flashlight CLI | React DevTools Profiler | 5 min |
| Animation stutter | iOS | React Perf Monitor | Xcode Time Profiler | 10 min |
| Slow cold start | Android | Flashlight + react-native-performance | Android Studio CPU Profiler | 15 min |
| Slow cold start | iOS | react-native-performance | Xcode Time Profiler | 15 min |
| JS bundle large | Both | source-map-explorer | Expo Atlas | 5 min |
| App size large | Android | APK Analyzer / Ruler | Emerge Tools | 10 min |
| App size large | iOS | Xcode Thinning Report | Emerge Tools | 10 min |
| JS memory growth | Both | React DevTools Memory | Chrome DevTools (Hermes) | 5 min |
| Native memory leak | iOS | Xcode Leaks instrument | Xcode Allocations | 15 min |
| Native memory leak | Android | Android Studio Memory Profiler | LeakCanary | 10 min |
| Touch response lag | Both | Flashlight (gesture scenario) | React DevTools Profiler | 10 min |
| Navigation transition | Both | react-native-performance markers | Flashlight | 15 min |

## Tool Capabilities Comparison

### Flashlight (@perf-profiler/cli)

| Capability | Support |
|-----------|---------|
| Platform | Android only |
| FPS measurement | Yes (real device frames) |
| CPU per-thread | Yes (JS, UI, native) |
| RAM tracking | Yes |
| Automated scenarios | Yes (Maestro, Appium, Detox) |
| CI integration | Yes (JSON output, compare command) |
| Score (0-100) | Yes (composite metric) |
| Cost | Free / open-source |

**Best for**: FPS regression testing, CI baselines, comparing before/after

> **Automation**: `agent-device` (`callstackincubator/agent-device`) lets an AI agent drive device control and run profiling commands programmatically — useful for scripting/automating the Flashlight + Maestro flow above.

### React DevTools Profiler

| Capability | Support |
|-----------|---------|
| Platform | Both (via Hermes debugger) |
| Re-render detection | Yes (component-level) |
| "Why did this render?" | Yes |
| Flamegraph | Yes (render duration) |
| Memory tab | Yes (JS heap) |
| Release-build profiling | Via `@callstack/inspector` (dev-only otherwise) |
| CI integration | No (manual only) |
| Cost | Free |

**Best for**: Identifying which components re-render and why

### Xcode Instruments

| Capability | Support |
|-----------|---------|
| Platform | iOS only |
| Time Profiler | Yes (native call stacks) |
| Leaks | Yes (retain cycles) |
| Allocations | Yes (memory patterns) |
| Thread analysis | Yes (main/JS/shadow) |
| CI integration | Limited (xctrace CLI) |
| Cost | Free (requires Mac) |

**Best for**: Native iOS performance, memory leaks, thread analysis

### Android Studio Profiler

| Capability | Support |
|-----------|---------|
| Platform | Android only |
| CPU Profiler | Yes (Sampled/Instrumented) |
| Memory Profiler | Yes (allocations, leaks) |
| Network Profiler | Yes |
| Energy Profiler | Yes |
| Thread view | Yes |
| CI integration | Limited |
| Cost | Free |

**Best for**: Native Android performance, memory allocations, energy impact

## Measurement Protocols

### FPS Measurement Protocol (Flashlight)

```bash
# 1. Build release APK
cd android && ./gradlew assembleRelease

# 2. Install on device
adb install -r app/build/outputs/apk/release/app-release.apk

# 3. Create Maestro test scenario
cat > scroll-test.yaml << 'EOF'
appId: com.yourapp
---
- launchApp
- waitForAnimationToEnd
- scrollUntilVisible:
    element: "end-of-list-marker"
    direction: DOWN
    speed: 40
EOF

# 4. Run Flashlight measurement
flashlight measure \
  --bundleId com.yourapp \
  --testCommand "maestro test scroll-test.yaml" \
  --duration 30 \
  --iterationCount 3

# 5. Generate comparison report
flashlight report --output ./perf-report
```

### TTI Measurement Protocol

```bash
# 1. Add markers to app code (see native-measure-tti.md)
# 2. Build release
# 3. Kill app completely
adb shell am force-stop com.yourapp
# 4. Clear from recents
# 5. Launch and capture time:
adb shell am start -W com.yourapp/.MainActivity
# 6. Read "TotalTime" from output
# 7. Compare with react-native-performance marker for JS-level TTI
```

### Bundle Size Protocol

```bash
# 1. Generate source map
npx react-native bundle \
  --platform android \
  --dev false \
  --entry-file index.js \
  --bundle-output /tmp/bundle.js \
  --sourcemap-output /tmp/bundle.js.map

# 2. Check raw sizes
ls -lh /tmp/bundle.js
wc -c /tmp/bundle.js

# 3. Analyze treemap
npx source-map-explorer /tmp/bundle.js.map --json > bundle-analysis.json

# 4. Top 10 modules by size
cat bundle-analysis.json | jq '.results[0].files | to_entries | sort_by(-.value.size) | .[0:10] | .[] | {name: .key, size: .value.size}'
```

## When Tools Disagree

If React DevTools shows few re-renders but FPS is still low:
→ Problem is likely in the native layer. Use Xcode/Android Studio profiler.

If Flashlight score is good but user reports jank:
→ Check if the test scenario matches the actual user interaction. May need longer duration or specific gesture sequences.

If bundle size looks fine but TTI is slow:
→ Problem may be synchronous initialization, not bundle size. Check for `require()` at startup, sync storage reads, or heavy provider trees.
