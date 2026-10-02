---
title: Android Studio Profiler Interpretation Guide
impact: HIGH
tags: android-studio, profiler, cpu, memory, android, native
---

# Android Studio Profiler Interpretation Guide

How to use and interpret Android Studio Profiler for React Native Android performance.

## Accessing the Profiler

1. Run app on device/emulator in release mode (profileable build)
2. Android Studio → View → Tool Windows → App Inspection (or Run → Profile)
3. Select your app process
4. Choose profiler type: CPU, Memory, or Energy

**For profileable release builds**, add to `android/app/build.gradle`:
```groovy
buildTypes {
    release {
        // Enable profiling in release without debuggable=true
        proguardFiles getDefaultProguardFile('proguard-android.txt')
    }
    // Or create a "benchmark" build type
    benchmark {
        initWith release
        profileable true
    }
}
```

## CPU Profiler

### Recording Types

| Type | Overhead | Detail | Use When |
|------|----------|--------|----------|
| **Sample Java/Kotlin** | Low (~5%) | Call stacks every 1ms | General CPU investigation |
| **Trace Java/Kotlin** | High (~30%) | Every method entry/exit | Need exact call counts |
| **Sample C/C++** | Medium | Native call stacks | Hermes internals, native modules |
| **System Trace** | Very low | Thread scheduling + syscalls | Thread contention, I/O waits |

**Default choice**: "Sample Java/Kotlin" for most RN issues. Use "System Trace" for thread problems.

### Reading the Flame Chart

The flame chart shows call stacks over time (x-axis = time, y-axis = stack depth):

**Identify RN threads by name**:
```
Thread: mqt_js              ← Hermes JavaScript thread
Thread: main                ← Android UI thread  
Thread: mqt_native_modules  ← Native modules bridge thread (old arch)
Thread: DefaultDispatcher   ← Kotlin coroutines (TurboModules)
```

### Common Patterns in RN Apps

**Pattern: `mqt_js` saturated (>80% CPU)**
```
mqt_js thread:
  ├─ com.facebook.hermes.HermesExecutor.call()
  │   ├─ React reconciliation (40%)
  │   ├─ JSON.parse (25%)
  │   └─ User code (15%)
  └─ GC (garbage collection) (20%)
```
**Diagnosis**: JS thread overloaded. React is re-rendering too much or parsing large payloads.
**Fix**: Reduce re-renders (memo, selectors), parse in background, paginate API responses.

**Pattern: Main thread waiting on JS**
```
main thread:
  ├─ android.os.MessageQueue.nativePollOnce() (60%)  ← IDLE/WAITING
  ├─ com.facebook.react.bridge.queue.MessageQueueThread (30%)
  └─ android.view.Choreographer.doFrame() (10%)
```
**Diagnosis**: UI thread is waiting for JS thread to finish. Bridge bottleneck (old arch) or sync JSI call.
**Fix**: Move to New Architecture (TurboModules), or break up the JS work.

**Pattern: Heavy GC pauses**
```
mqt_js thread:
  ├─ hermes::vm::GCGeneration::collect() (15%)
  │   └─ Duration: 50-150ms per collection
```
**Diagnosis**: Hermes garbage collector is doing major collections. Too many short-lived objects.
**Fix**: Reduce allocations (avoid inline objects in render), investigate memory leaks.

### Top Down vs Bottom Up vs Flame Chart

| View | Shows | Best For |
|------|-------|----------|
| **Top Down** | Callers → callees (tree from root) | Understanding flow of execution |
| **Bottom Up** | Callees → callers (hottest functions first) | Finding the most expensive functions |
| **Flame Chart** | Visual call stacks over time | Correlating CPU usage with user actions |

**Workflow**: Start with Bottom Up to find hot functions, then switch to Flame Chart to see when they run relative to user interactions.

### Filtering for RN

In the search/filter bar:
- `hermes` — show only Hermes/JS work
- `react` — show React bridge/native module calls
- Your package name — show your native module code
- Exclude `android.` and `java.` to reduce noise

## Memory Profiler

### Recording Allocations

1. Click "Record" in Memory profiler
2. Perform interaction (navigate, scroll, etc.)
3. Click "Stop"
4. Force GC button (trash can icon) to see true retained memory

### Reading the Memory Graph

```
[━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━]
Java/Kotlin: 45MB ████████████
Native:      120MB ████████████████████████████████
Graphics:    35MB ████████
Stack:       2MB █
Code:        28MB ███████
Others:      10MB ███
```

For React Native apps:
- **Native** is often largest — includes Hermes heap, native view backing, image bitmaps
- **Java/Kotlin** — React Native bridge objects, view managers, native modules
- **Graphics** — GPU texture memory (images, shadows, gradients)

### Leak Detection

1. Navigate: Screen A → Screen B → Back to A
2. Force GC
3. Check if memory returned to baseline
4. If growth: dump heap → search for objects from Screen B that shouldn't exist

**Common Android RN leaks**:
- Activity leak (holding reference to destroyed Activity)
- View reference in static/singleton (common in native module mistakes)
- Bitmap not recycled (large images held in memory)
- Hermes closure capturing large scope

### Allocation Tracking

After recording, sort by "Allocations" column (descending):
- High allocation count + low retained = normal (GC handles it)
- High allocation count + high retained = leak suspect
- Specific class growing: click to see allocation call stack

## System Trace (Perfetto)

For advanced thread analysis:

```bash
# Record system trace
adb shell perfetto -o /data/misc/perfetto-traces/trace.perfetto-trace -t 10s \
  sched freq idle -a com.yourapp

# Pull and open in ui.perfetto.dev
adb pull /data/misc/perfetto-traces/trace.perfetto-trace
```

### What to Look For in Perfetto

- **Thread wakeups**: When does `mqt_js` wake up? Is it running continuously or sleeping between frames?
- **Choreographer frames**: Each frame should complete in <16.6ms. Frames exceeding budget appear red.
- **Binder transactions**: Cross-process calls (e.g., to SurfaceFlinger) that might delay frame delivery.
- **CPU frequency scaling**: Low-end devices may throttle CPU under sustained load (thermal).

## Energy Profiler

Useful for:
- Wake locks held during background operations
- Network requests that prevent Doze
- GPS/sensor usage from native modules

Not typically the primary tool for FPS/jank, but important for user-perceived "performance" (battery drain = "my phone gets hot when using your app").

## Practical Tips

1. **Use release builds** — debug builds have ~5-10x overhead.
2. **Record short sessions** (10-30s) — profiler overhead increases with duration.
3. **Disable other apps** — background apps competing for CPU skew results.
4. **Test on target device tier** — emulator performance is not representative.
5. **Compare before/after** — export traces and compare same interaction.

## When Results Point to Native Layer

If CPU profiler shows:
- >40% time in `com.facebook.react.uimanager` → view hierarchy too complex
- >30% time in image decoding → use fast-image/expo-image with resizing
- >20% time in `hermes::vm::GCGeneration` → too many allocations per frame
- Custom native module appearing → review that module's threading model
- `nativePollOnce` dominating main thread → UI thread starved (JS bridge bottleneck)

**Escalation**: If JS and bridge are fine but native rendering is slow:
- Check for GPU overdraw: Developer Options → Show GPU overdraw
- Check view hierarchy depth: Layout Inspector
- Consider `react-native-screens` for native navigation containers
