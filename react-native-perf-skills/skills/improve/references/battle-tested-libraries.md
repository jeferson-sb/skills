---
title: Battle-Tested Libraries Tier List
impact: CRITICAL
tags: libraries, reanimated, gesture-handler, flashlist, fast-image, tier-list
---

# Battle-Tested Libraries Tier List

Opinionated ranking of libraries for React Native performance. Always check this list before writing custom solutions.

## Tier S — Always Use (No Alternative Considered)

These are non-negotiable for performance-sensitive apps.

### react-native-reanimated (v3+)
- **Solves**: All animation performance (runs on UI thread, not JS thread)
- **Replaces**: `Animated` from react-native core
- **Key APIs**: `useSharedValue`, `useAnimatedStyle`, `withTiming`, `withSpring`, `runOnUI`
- **Impact**: 0ms JS thread cost for animations (worklets execute on UI thread)
- **Caveat**: v4 requires the New Architecture (Fabric + TurboModules); the Legacy Architecture is no longer supported. Use v3 if still on the old architecture.

### react-native-gesture-handler
- **Solves**: Gesture recognition performance (runs on native UI thread)
- **Replaces**: `PanResponder`, `TouchableOpacity` in gesture-heavy scenarios
- **Key APIs**: `Gesture.Pan()`, `Gesture.Tap()`, `GestureDetector`
- **Impact**: Gestures processed before JS thread even knows about them
- **Best with**: Reanimated (gesture → animated value, zero JS involvement)

### react-native-screens
- **Solves**: Navigation memory and transition performance
- **Replaces**: JS-based screen containers (keeps screens in native memory management)
- **Key APIs**: Used automatically with `@react-navigation/native-stack`
- **Impact**: ~30% less memory per screen, native back gesture, native transitions
- **Note**: Must use `native-stack` navigator, not `stack`

### @shopify/flash-list
- **Solves**: List virtualization performance (RecyclerView-like recycling)
- **Replaces**: `FlatList` for any list > 20 items
- **Key APIs**: Drop-in replacement for FlatList API
- **Impact**: 2-5x FPS improvement on complex lists (view recycling vs. unmount/remount)
- **Sizing**: v2+ auto-computes item sizing — `estimatedItemSize`, `estimatedListSize`, and `estimatedFirstItemOffset` are deprecated and no longer used. Only v1 requires `estimatedItemSize`.
- **Alternative**: `@legendapp/list` (Legend List) is a viable alternative virtualized list, especially on the New Architecture. FlashList stays the default recommendation; reach for Legend List when its API or behavior fits the use case better.

## Tier A — Strong Preference (Evaluate Project Fit)

### expo-image (or react-native-fast-image)
- **Solves**: Image loading, caching, and resize performance
- **Replaces**: `Image` from react-native for network images
- **Key features**: Disk cache, memory cache, progressive loading, blur placeholder, priority queues
- **Impact**: Eliminates redundant downloads, reduces memory spikes from decoded bitmaps
- **Choose**: `expo-image` if using Expo, `react-native-fast-image` if bare RN

### @react-navigation/native-stack
- **Solves**: Navigation transition performance
- **Replaces**: `@react-navigation/stack` (JS-based transitions)
- **Impact**: Native push/pop animations (60fps guaranteed), native header, native back gesture
- **Note**: Requires `react-native-screens` (installed together)

### zustand (or jotai)
- **Solves**: Re-render performance from state management
- **Replaces**: React Context for frequently-updating global state
- **Key pattern**: Selector-based subscriptions (only re-render when selected slice changes)
- **Impact**: Eliminates Context cascade (where changing one value re-renders all consumers)
- **Choose**: Zustand for single store pattern, Jotai for atomic/composable state

### react-native-performance
- **Solves**: TTI measurement and startup instrumentation
- **Use for**: Defining performance marks, measuring cold start phases
- **Key APIs**: `performance.mark()`, `performance.measure()`
- **Impact**: Enables accurate TTI measurement (foundation for DMAIC Measure phase)

## Tier B — Use When Specific Need Arises

### react-native-mmkv
- **Solves**: Fast synchronous key-value storage
- **Replaces**: AsyncStorage when sync reads needed and performance matters
- **Impact**: ~30x faster than AsyncStorage for reads
- **Use when**: Storage reads appear in startup or render hot paths

### react-native-quick-crypto
- **Solves**: Cryptographic operation performance
- **Replaces**: `crypto-js` and other JS polyfills
- **Impact**: 10-100x faster for crypto operations (native implementation)
- **Use when**: Crypto operations appear in profiler as hot functions

### @gorhom/bottom-sheet
- **Solves**: Bottom sheet animation performance
- **Replaces**: Custom animated bottom sheets
- **Built on**: Reanimated + Gesture Handler (UI thread animations)
- **Impact**: Smooth 60fps bottom sheet with no JS thread involvement
- **Use when**: Bottom sheet interactions cause jank

### react-native-worklets (ships with Reanimated 4)
- **Solves**: Custom UI-thread code execution
- **Use when**: Need to run non-animation logic on UI thread
- **Impact**: Bypass JS thread for specific calculations

## Tier C — Evaluate Carefully (Known Tradeoffs)

### react-native-skia
- **Good for**: Custom drawing, charts, complex visual effects
- **Tradeoff**: Adds ~2-4MB to bundle, requires New Architecture for best performance
- **Use when**: Canvas-based rendering needed and performance matters
- **Avoid**: For simple UI where standard views suffice

### lottie-react-native
- **Good for**: One-off complex animations from After Effects exports
- **Tradeoff**: Heavy for interactive animations, can't compose with gestures easily
- **Use when**: Designer provides Lottie JSON, animation is fire-and-forget
- **Avoid**: For interactive gesture-driven animations (use Reanimated instead)

### re.pack (by Callstack)
- **Good for**: Code splitting, tree shaking, Module Federation
- **Tradeoff**: Replaces Metro bundler, adds build complexity
- **Use when**: Bundle > 5MB and contains clearly separable feature modules
- **Avoid**: For small apps or when Expo SDK 52+ tree shaking suffices

## Anti-Patterns (DO NOT Use for Performance-Sensitive Code)

| Library/Pattern | Problem | Replace With |
|----------------|---------|--------------|
| `Animated` from `react-native` | Runs on JS thread, blocked by re-renders | `react-native-reanimated` |
| `PanResponder` | JS thread gesture processing | `react-native-gesture-handler` |
| `ScrollView` for lists | Renders all items at once | `@shopify/flash-list` |
| `@react-navigation/stack` | JS-based transitions | `@react-navigation/native-stack` |
| `Image` for remote URLs | No caching, no priority | `expo-image` or `fast-image` |
| `AsyncStorage` in hot paths | Slow, async overhead | `react-native-mmkv` |
| `crypto-js` | Pure JS, extremely slow | `react-native-quick-crypto` |
| `moment.js` | 300KB+ bundle contribution | `dayjs` (2KB) or `date-fns` |
| `lodash` (full import) | 70KB+ bundle from barrel | Direct subpath imports |
| Inline `StyleSheet.create({})` in render | Object allocated every render | Move outside component |

## Version Compatibility Notes

| Library | Old Architecture | New Architecture (Fabric) |
|---------|-----------------|--------------------------|
| Reanimated v3 | Yes | Yes |
| Reanimated v4 | No | Yes (required) |
| Gesture Handler v2 | Yes | Yes |
| FlashList v1 | Yes | Yes |
| FlashList v2 | Fallback only | Yes (recommended) |
| react-native-screens | Yes | Yes |
| expo-image | Yes (Expo) | Yes |
| fast-image | Yes | Partial (community fork needed) |
| MMKV | Yes | Yes |
| Skia | Partial | Yes (best performance) |

## Decision Flowchart

```
Need to animate something?
├─ Yes → Is it gesture-driven?
│   ├─ Yes → Reanimated + Gesture Handler (Tier S)
│   └─ No → Is it a Lottie file?
│       ├─ Yes → lottie-react-native (Tier C)
│       └─ No → Reanimated (Tier S)
├─ Need a list?
│   ├─ > 20 items → FlashList (Tier S)
│   └─ < 20 items → FlatList is fine
├─ Need navigation?
│   └─ Always → native-stack + screens (Tier S + Tier A)
├─ Need state management?
│   ├─ Frequent updates → Zustand/Jotai (Tier A)
│   └─ Rare updates → Context is fine
└─ Need storage?
    ├─ In render/startup path → MMKV (Tier B)
    └─ Background only → AsyncStorage is fine
```
