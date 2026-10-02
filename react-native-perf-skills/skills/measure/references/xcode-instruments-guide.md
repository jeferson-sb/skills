---
title: Xcode Instruments Interpretation Guide
impact: HIGH
tags: xcode, instruments, ios, time-profiler, leaks, allocations, native
---

# Xcode Instruments Interpretation Guide

How to use and interpret Xcode Instruments for React Native iOS performance.

## Template Selection

| Template | Use When | What It Shows |
|----------|----------|---------------|
| **Time Profiler** | Slow operations, jank, high CPU | Call stacks sampled at 1ms intervals |
| **Leaks** | Memory growing, suspected retain cycles | Objects leaked (not freed when expected) |
| **Allocations** | Memory investigation, object lifecycle | Every malloc/free, retained size over time |
| **Animation Hitches** | Frame drops during animations | Frames exceeding budget (hitch ratio) |
| **System Trace** | Thread scheduling, preemption | OS-level thread activity |

**Default choice**: Start with Time Profiler for most RN performance issues.

## Time Profiler

### Setup
1. Product → Profile (⌘I) — builds release + instruments config
2. Select "Time Profiler" template
3. Click Record, perform interaction, Stop

### Reading the Call Tree

**Critical filters** (apply immediately):
- ✅ "Hide System Libraries" — removes OS framework noise
- ✅ "Invert Call Tree" — shows hottest leaf functions first (bottom-up)
- ✅ "Separate by Thread" — isolates JS vs UI vs background work

### Thread Identification in React Native

| Thread Name | Role | Bottleneck Means |
|------------|------|-----------------|
| `Main Thread` | UIKit rendering, touch handling | Layout complexity, view hierarchy too deep |
| `com.facebook.react.JavaScript` | Hermes JS execution | Heavy computation, re-renders, JSON parsing |
| `com.facebook.react.ShadowQueue` | Yoga layout calculation | Complex flexbox, deeply nested views |
| `RCTJSThread` (legacy) | Old architecture JS thread | Same as above (pre-bridgeless) |
| Custom named threads | Turbo Module background work | Expected — check if blocking main |

### Interpreting Results

**Heavy function on JS thread**:
```
Weight    Symbol
45.2%     hermes::vm::Interpreter::dispatch
 ├─ 20.1%  JSON.parse (large response)
 ├─ 15.3%  reconciler (React render phase)
 └─  9.8%  closure allocation
```
**Action**: JS thread is doing too much. Look at what `dispatch` is running.

**Heavy function on Main thread**:
```
Weight    Symbol
38.0%     -[UIView layoutSubviews]
 ├─ 22.0%  -[RCTView layoutSubviews] (or RCTViewComponentView)
 └─ 16.0%  YGNodeCalculateLayout
```
**Action**: View hierarchy is too deep or complex. Check for unnecessary wrapper views, enable view flattening.

### Hang/Microhang Detection

Instruments marks hangs automatically:
- **Hang** (>250ms): Main thread blocked — app appears frozen
- **Microhang** (>50ms): Brief stutter — perceptible in animations

Click the hang marker to see what was running. Common RN causes:
- Synchronous bridge call (old arch)
- `requireNativeComponent` during render
- Large `StyleSheet.create` at module load
- Sync `AsyncStorage` read (yes, it's sync in some paths)

## Leaks Template

### Setup
1. Profile with "Leaks" template
2. Perform navigation: Screen A → Screen B → Back to A (repeat 3x)
3. Each iteration should free Screen B's objects

### Reading Results

**Leak detected**: Instruments shows a purple diamond marker on the timeline.

Click to see leaked objects:
```
Leaked Object          Size    Responsible Frame
RCTImageView           128B    -[RCTImageView setImage:]
NSMutableArray         64B     -[RCTBridge enqueueCallback:]
```

**Common RN retain cycle patterns**:
- `RCTImageView` — image component holds reference after unmount
- Timer/listener allocated in native module without `invalidate()`
- Block capturing `self` in native module (Swift/ObjC classic)

### What's NOT a Leak

Some "leaks" in RN are expected:
- Hermes JIT code buffers (grow then stabilize)
- React Native bridge tables (old arch — fixed allocations)
- Metro bundler connection objects (dev only)

Focus on leaks that **grow proportionally with navigation**.

## Allocations Template

### Setup
1. Profile with "Allocations" template
2. Use "Mark Generation" button to create baseline snapshots
3. Perform interaction between marks

### Growth Analysis

Look at "Growth" column between generations:
```
Generation A → B:  +2.4MB (after navigating to detail screen)
Generation B → C:  +2.4MB (after navigating to another detail)
Generation C → D:  +2.4MB (same screen, same growth)
```
**Pattern**: Linear growth = memory leak. Each navigation allocates but never frees.

**Investigation**: Filter by "Still Living" objects between generations. Sort by size. The largest new allocations that persist are your suspects.

### Retained vs Shallow Size

- **Shallow**: Just this object's direct memory
- **Retained**: This object + everything it keeps alive

`Retained >> Shallow` means this object is the root of a large tree that can't be freed. This is your leak suspect.

## Animation Hitches Template (iOS 15+)

### Reading Hitch Ratio
```
Hitch Ratio: 4.2ms/s
```
- < 1ms/s: Excellent (imperceptible)
- 1-5ms/s: Some dropped frames (noticeable on fast scroll)
- > 5ms/s: Significant jank

### Hitch Types
- **Commit hitch**: View tree changes too expensive (too many views)
- **Render hitch**: GPU work too expensive (shadows, blur, overdraw)

## Practical Tips for RN Developers

1. **Always profile release builds** — debug has ~10x overhead from Metro, DevTools connection, sync logging.
2. **Filter to your module's frames** — search for your app's binary name or "hermes" to isolate RN work.
3. **Compare before/after** — save `.trace` files, re-run same scenario after fix, compare weights.
4. **Use Time Profiler recording options**: set to "Deferred Mode" for minimal probe effect during measurement.
5. **Pinch to zoom** the timeline — most issues are visible in 1-2 second windows.

## When to Escalate from Xcode to Native Investigation

If Time Profiler shows:
- >50% weight in your own native module → review that module's implementation
- >30% in Yoga layout → reduce view depth, enable `collapsable` prop
- >20% in image decoding → use react-native-fast-image with resize/cache
- Main thread blocked by JS thread (waiting on lock) → architecture issue, needs TurboModule refactor
