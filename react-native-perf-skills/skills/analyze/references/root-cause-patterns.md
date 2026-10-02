---
title: Root Cause Pattern Library
impact: CRITICAL
tags: root-cause, patterns, diagnosis, analysis
---

# Root Cause Pattern Library

Mapping metric signatures to root causes for React Native performance issues.

## FPS / Jank Patterns

### Pattern: Continuous Low FPS During Scroll

| Signal | Value |
|--------|-------|
| FPS | < 45 sustained during scroll |
| JS Thread CPU | > 70% |
| Flashlight Score | < 40 |
| React DevTools | Many components yellow every frame |

**Root causes (check in order)**:
1. **ScrollView + .map()** — All items rendered at once, no virtualization
   - Evidence: `grep -rn "ScrollView" | xargs grep -l "\.map("`
   - Fix: Replace with FlashList
   
2. **Unmemoized list items** — Every item re-renders when list state changes
   - Evidence: React DevTools shows "Parent component rendered" on items
   - Fix: `React.memo()` on item component + stable keyExtractor
   
3. **Inline callbacks in items** — New function reference causes item re-render
   - Evidence: `grep -rn "onPress={() =>" --include="*.tsx"` in list items
   - Fix: `useCallback` or React Compiler

4. **Heavy item components** — Each item does too much work
   - Evidence: Single item render > 5ms in React DevTools
   - Fix: Lazy load below-fold content, reduce nesting

### Pattern: FPS Drops on Gesture/Scroll Start

| Signal | Value |
|--------|-------|
| FPS | Drops from 60 to < 30 at gesture start, recovers after |
| JS Thread | Spike at start of interaction |
| Flashlight | Score 40-70 with periodic deep drops |

**Root causes**:
1. **JS-thread animation** — `Animated.event` or `PanResponder` running on JS thread
   - Evidence: `grep -rn "Animated\.event\|PanResponder" --include="*.tsx"`
   - Fix: Migrate to `react-native-reanimated` + `react-native-gesture-handler`

2. **onScroll handler doing heavy work** — Computation in scroll callback
   - Evidence: `onScroll` handler with state updates or complex logic
   - Fix: Move to Reanimated `useAnimatedScrollHandler`

### Pattern: Periodic Frame Drops (Every N Seconds)

| Signal | Value |
|--------|-------|
| FPS | Regular drops every 1-5 seconds |
| JS Thread | Periodic spikes |
| Pattern | Drops correlate with timer/interval |

**Root causes**:
1. **Polling/interval updating state** — `setInterval` triggering re-renders
   - Evidence: `grep -rn "setInterval" --include="*.tsx"`
   - Fix: Use `requestAnimationFrame` or debounce updates

2. **WebSocket/subscription pushing frequent updates** — Real-time data causing cascading re-renders
   - Evidence: Context or global state updated from WebSocket
   - Fix: Batch updates, use atomic state (Zustand selectors)

3. **Hermes GC pauses** — Major garbage collection cycles
   - Evidence: CPU profiler shows GC spikes, many short-lived objects
   - Fix: Reduce allocations (memoize objects, avoid inline creation)

### Pattern: Freeze (0 FPS for >250ms)

| Signal | Value |
|--------|-------|
| FPS | Drops to 0 for 250ms+ |
| JS Thread | 100% during freeze |
| UI | Completely unresponsive |

**Root causes**:
1. **Large JSON.parse** — Synchronous parsing of big API response
   - Evidence: Network response > 1MB, parse happens on JS thread
   - Fix: Paginate API, parse in chunks, or use native JSON parsing

2. **Synchronous storage read** — `AsyncStorage.getItem` blocking (old versions)
   - Evidence: Storage read in component mount or render path
   - Fix: Use `react-native-mmkv` for truly sync fast reads, or move to async flow

3. **Heavy computation in render** — Sorting, filtering large datasets synchronously
   - Evidence: `.sort()`, `.filter()`, `.reduce()` on large arrays in render
   - Fix: `useMemo` for expensive computations, or move to worker thread

---

## Startup / TTI Patterns

### Pattern: TTI > 3s with Large Bundle

| Signal | Value |
|--------|-------|
| Cold Start | > 3s |
| JS Bundle Size | > 3MB |
| Parse Time | > 1s |

**Root causes**:
1. **Barrel imports pulling entire libraries** — `import { x } from 'big-lib'`
   - Evidence: source-map-explorer shows large dependencies loaded upfront
   - Fix: Direct file imports, tree shaking (Re.Pack / Expo SDK 52+)

2. **Unused dependencies in bundle** — Dead code not eliminated
   - Evidence: source-map-explorer shows modules with no import chain to used code
   - Fix: Remove from package.json, enable tree shaking

3. **Heavy polyfills** — Polyfilling features Hermes already supports
   - Evidence: `core-js`, `intl` polyfills in bundle
   - Fix: Check Hermes compatibility table, remove unnecessary polyfills

### Pattern: TTI > 3s with Small Bundle

| Signal | Value |
|--------|-------|
| Cold Start | > 3s |
| JS Bundle Size | < 2MB |
| Native Init | > 1.5s |

**Root causes**:
1. **Synchronous initialization** — Heavy work in App.tsx/root before first render
   - Evidence: Multiple `require()`, sync config reads, heavy provider trees
   - Fix: Lazy initialization, code splitting, deferred non-critical setup

2. **Too many native modules auto-linking** — Every module initializes on startup
   - Evidence: Large `Podfile.lock` / many native dependencies
   - Fix: Use TurboModules (lazy loading), remove unused native deps

3. **Splash screen not masking TTI correctly** — App is interactive but splash hides it
   - Evidence: TTI marker fires before splash dismissed
   - Fix: Move `SplashScreen.hide()` to after first meaningful render

---

## Memory Patterns

### Pattern: Linear Memory Growth

| Signal | Value |
|--------|-------|
| RAM Growth | > 5MB per navigation cycle |
| Growth Pattern | Linear (never returns to baseline) |
| Leak Detection | Objects from previous screens still retained |

**Root causes**:
1. **Event listener not cleaned up** — `addEventListener` without `removeEventListener`
   - Evidence: `grep -rn "addEventListener" | grep -v "removeEventListener"`
   - Fix: Return cleanup from useEffect

2. **Subscription without unsubscribe** — Zustand/RxJS/EventEmitter listeners accumulating
   - Evidence: `.subscribe(` without corresponding unsubscribe in cleanup
   - Fix: Store subscription reference, call `.unsubscribe()` in cleanup

3. **Timer without clear** — `setInterval`/`setTimeout` not cleared on unmount
   - Evidence: `grep -rn "setInterval\|setTimeout"` without corresponding `clear`
   - Fix: `useEffect` cleanup with `clearInterval`/`clearTimeout`

4. **Closure capturing screen-level data** — Callbacks holding references to unmounted state
   - Evidence: Callbacks defined in screens that reference screen-local state
   - Fix: WeakRef for optional references, or proper cleanup

### Pattern: Memory Spike on Navigation

| Signal | Value |
|--------|-------|
| RAM | Jumps 20-50MB on screen transition |
| Return | Does NOT return when navigating back |
| Objects | Components from previous screen still in heap |

**Root causes**:
1. **Navigation not using react-native-screens** — JS-based screens kept in memory
   - Evidence: `@react-navigation/stack` instead of `@react-navigation/native-stack`
   - Fix: Switch to `native-stack` (native screen lifecycle management)

2. **Large images loaded eagerly** — High-res images loaded for screens not visible
   - Evidence: Image components loading full-size assets on mount
   - Fix: Use `react-native-fast-image` with `priority: low` for off-screen, resize to display size

---

## Bundle Size Patterns

### Pattern: Bundle > 5MB

| Signal | Value |
|--------|-------|
| JS Bundle | > 5MB |
| Top Dependencies | lodash, moment, AWS SDK, etc. |
| Barrel Imports | Multiple `from 'lib'` without subpath |

**Root causes**:
1. **Full library imports via barrel** — `import { debounce } from 'lodash'` pulls 70KB+ instead of 2KB
   - Evidence: `grep -rn "from ['\"]lodash['\"]"` (no subpath)
   - Fix: `import debounce from 'lodash/debounce'`

2. **moment.js with all locales** — 300KB+ for date formatting
   - Evidence: `grep -rn "from ['\"]moment['\"]"`
   - Fix: Replace with `dayjs` (2KB) or `date-fns`

3. **Unused native module JS wrappers** — Installed but unused dependencies
   - Evidence: In package.json but no import found in source
   - Fix: Remove dependency, run `npx depcheck`

---

## Cross-Reference: Evidence → Callstack Skill File

| Evidence Found | Callstack Reference | Key Section |
|---------------|-------------------|-------------|
| ScrollView + .map() | `js-lists-flatlist-flashlist.md` | Migration guide |
| Animated.event on JS thread | `js-animations-reanimated.md` | Worklet migration |
| Large barrel imports | `bundle-barrel-exports.md` | Direct import pattern |
| No tree shaking | `bundle-tree-shaking.md` | Re.Pack / Expo setup |
| Native module slow | `native-turbo-modules.md` | TurboModule guide |
| View hierarchy deep | `native-view-flattening.md` | collapsable prop |
| Slow TTI | `native-measure-tti.md` | Marker placement |
| Context causing cascades | `js-atomic-state.md` | Zustand/Jotai migration |
| React DevTools flamegraph | `js-profile-react.md` | Profiling workflow |
