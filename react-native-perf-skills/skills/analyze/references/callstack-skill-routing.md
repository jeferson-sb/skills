---
title: Callstack Skill Routing (Extended)
impact: MEDIUM
tags: routing, callstack, references, mapping
---

# Callstack Skill Routing — Extended

Maps root causes to specific `react-native-best-practices` reference files, with profiler evidence and code grep patterns to confirm the diagnosis.

## JS Performance Domain

| Root Cause | Callstack Ref File | Profiler Evidence to Look For | Grep Pattern |
|-----------|-------------------|------------------------------|--------------|
| Non-virtualized list | `js-lists-flatlist-flashlist.md` | All items render simultaneously in flamegraph | `ScrollView.*\.map\(` |
| Non-virtualized list (alt) | `js-lists-flatlist-flashlist.md` | — | Virtualized options: FlashList (default) or `@legendapp/list` (Legend List) |
| JS-thread animations | `js-animations-reanimated.md` | FPS drops correlate with gesture start, JS thread spikes | `new Animated\.Value\|Animated\.timing\|Animated\.event` |
| Missing memoization | `js-react-compiler.md` | "Props changed" or "Parent rendered" in DevTools | Components in renderItem without `memo()` |
| State management cascades | `js-atomic-state.md` | "Context changed" in DevTools for many components | `useContext.*Provider.*value=\{\{` |
| Heavy computation in render | `js-concurrent-react.md` | Single component >16ms in flamegraph | `.sort(\|.filter(\|.reduce(` on large arrays |
| FPS measurement setup | `js-measure-fps.md` | (measurement itself) | N/A |
| Uncontrolled TextInput | `js-uncontrolled-components.md` | TextInput re-renders on every keystroke | `<TextInput.*value=\{.*\}.*onChangeText` |
| Bottom sheet jank | `js-bottomsheet.md` | FPS drops during sheet drag | `BottomSheet\|bottom-sheet` without Reanimated |
| Memory leaks (JS) | `js-memory-leaks.md` | Heap growing, objects not freed after unmount | `addEventListener\|\.subscribe\(` without cleanup |
| React DevTools profiling | `js-profile-react.md` | (profiling workflow) | N/A |

## Native Performance Domain

| Root Cause | Callstack Ref File | Profiler Evidence to Look For | Grep Pattern |
|-----------|-------------------|------------------------------|--------------|
| Slow Turbo Module | `native-turbo-modules.md` | Custom thread high CPU, blocking JS thread | TurboModule spec files with sync methods |
| JS polyfill where native exists | `native-sdks-over-polyfills.md` | Large JS bundle contribution from polyfill | `crypto-js\|text-encoding\|punycode` |
| Slow TTI | `native-measure-tti.md` | Large gap between native start and JS ready | App.tsx with heavy initialization |
| Wrong thread model | `native-threading-model.md` | Background thread starving main thread | TurboModules without `@ReactMethod(isBlockingSynchronousMethod = false)` |
| View hierarchy too deep | `native-view-flattening.md` | Main thread >30% in layoutSubviews/Yoga | Deeply nested `<View>` wrappers |
| Native memory leak | `native-memory-leaks.md` | Xcode Leaks showing retain cycles | Native modules without `invalidate()` |
| Native memory patterns | `native-memory-patterns.md` | Allocations growing without dealloc | C++ shared_ptr cycles, Swift strong captures |
| Xcode/Android profiling | `native-profiling.md` | (profiling workflow) | N/A |
| Platform tool setup | `native-platform-setup.md` | (setup) | N/A |
| Android 16KB alignment | `native-android-16kb-alignment.md` | Crash on Android 15+ devices | Third-party .so files not aligned |

## Bundle Size Domain

| Root Cause | Callstack Ref File | Profiler Evidence to Look For | Grep Pattern |
|-----------|-------------------|------------------------------|--------------|
| Barrel exports | `bundle-barrel-exports.md` | source-map-explorer shows full lib included | `from ['"]lib-name['"]` without subpath |
| No tree shaking | `bundle-tree-shaking.md` | Dead code in bundle analysis | Re.Pack not configured, Expo < 52 |
| Large JS bundle | `bundle-analyze-js.md` | Bundle > 3MB, top modules analysis | N/A (use source-map-explorer) |
| Large app binary | `bundle-analyze-app.md` | Download size > thresholds | N/A (use APK Analyzer / Xcode) |
| Heavy native assets | `bundle-native-assets.md` | Assets contribute >30% of app size | Large files in `assets/` or `res/` |
| Hermes mmap disabled | `bundle-hermes-mmap.md` | Bundle compressed in APK (slower load) | `bundleInRelease` without `enableHermesBundleCompression = false` |
| R8 not enabled | `bundle-r8-android.md` | Java/Kotlin dead code in APK | `minifyEnabled false` in build.gradle |
| Large third-party lib | `bundle-library-size.md` | Single dep > 500KB in bundle | Package.json dependencies |
| Code splitting possible | `bundle-code-splitting.md` | Multiple independent features in one bundle | Re.Pack available, large feature modules |

## Decision Tree: Which Reference to Load First

```
Is the issue FPS/jank?
├─ YES → Is it during scroll?
│   ├─ YES → Is it a list? → js-lists-flatlist-flashlist.md
│   └─ NO → Is it during animation? → js-animations-reanimated.md
├─ Is the issue startup/TTI?
│   ├─ Is bundle large? → bundle-barrel-exports.md then bundle-tree-shaking.md
│   └─ Is bundle fine? → native-measure-tti.md (check init sequence)
├─ Is the issue memory?
│   ├─ JS heap growing? → js-memory-leaks.md
│   └─ Native RAM growing? → native-memory-leaks.md
└─ Is the issue bundle size?
    ├─ JS bundle? → bundle-analyze-js.md → bundle-barrel-exports.md
    └─ App binary? → bundle-analyze-app.md → bundle-native-assets.md
```
