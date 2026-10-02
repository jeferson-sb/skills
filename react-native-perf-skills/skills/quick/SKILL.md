---
name: perf-quick
description: "Fast 5-minute React Native performance audit. Scans source for the 12 most impactful antipatterns without profiling — code-level grep scan only. Use as a first pass before deeper DMAIC investigation."
effort: low
argument-hint: "[path to scan, defaults to src/]"
tools: Read, Glob, Grep, Bash
---

# Quick Performance Audit

Run a fast, grep-based scan for the 12 most impactful React Native performance antipatterns. No profiling tools needed — this is a code-level analysis.

## Usage

```
/perf-quick              # Scan src/ (default)
/perf-quick app/         # Scan specific directory
```

## Scan Protocol

1. Identify the scan root (argument or default `src/`, `app/`, or project root)
2. Find all `.tsx`, `.ts`, `.jsx`, `.js` files (exclude `node_modules`, `__tests__`, `*.test.*`, `*.spec.*`)
3. Run each check below in priority order
4. Report findings grouped by severity with file:line references

## Antipattern Checklist (Priority Order)

### CRITICAL

**1. ScrollView wrapping dynamic lists**
```bash
# Grep: ScrollView in same file as .map(
grep -rn "ScrollView" --include="*.tsx" --include="*.ts" | xargs -I{} grep -l "\.map("
```
- Fix: Replace with `FlashList` from `@shopify/flash-list` for lists >20 items
- Ref: `react-native-best-practices/references/js-lists-flatlist-flashlist.md`

**2. Barrel imports from large packages**
```bash
# Grep: import { X } from 'large-lib' (not deep import)
grep -rn "from ['\"]lodash['\"]" --include="*.tsx" --include="*.ts"
grep -rn "from ['\"]@aws-sdk" --include="*.tsx" --include="*.ts"
```
- Fix: Use direct imports (`lodash/debounce` not `lodash`)
- Ref: `react-native-best-practices/references/bundle-barrel-exports.md`

### HIGH

**3. Animated.Value from react-native (not Reanimated)**
```bash
grep -rn "new Animated\.Value\|Animated\.timing\|Animated\.spring" --include="*.tsx" --include="*.ts"
```
- Fix: Migrate to `useSharedValue` + `withTiming`/`withSpring` from `react-native-reanimated`
- Ref: `react-native-best-practices/references/js-animations-reanimated.md`

**4. Inline style objects in JSX**
```bash
grep -rn "style={{" --include="*.tsx" --include="*.ts"
```
- Fix: Extract to `StyleSheet.create()` constants outside component body
- Impact: eliminates object allocation on every render

**5. Anonymous callbacks in list item renders**
```bash
# Look for onPress={() => inside renderItem or .map
grep -rn "onPress={() =>\|onChangeText={() =>" --include="*.tsx" --include="*.ts"
```
- Fix: Use `useCallback` or enable React Compiler for automatic memoization
- Impact: prevents child re-renders when parent re-renders

**6. Missing memo() on list item components**
```bash
# Components used as renderItem that aren't wrapped in memo
grep -rn "renderItem.*=" --include="*.tsx" --include="*.ts"
```
- Fix: Wrap item components with `React.memo()` or enable React Compiler
- Ref: `react-native-best-practices/references/js-react-compiler.md`

### MEDIUM

**7. console.log without __DEV__ guard**
```bash
grep -rn "console\.\(log\|warn\|error\)" --include="*.tsx" --include="*.ts" | grep -v "__DEV__" | grep -v "\.test\." | grep -v "\.spec\."
```
- Fix: Wrap with `if (__DEV__)` or use babel-plugin-transform-remove-console

**8. useEffect subscriptions without cleanup**
```bash
# Files with addEventListener/addListener/subscribe but no cleanup return
grep -rln "addListener\|addEventListener\|\.subscribe(" --include="*.tsx" --include="*.ts"
```
- Fix: Return cleanup function from useEffect
- Ref: `react-native-best-practices/references/js-memory-leaks.md`

**9. Images without caching library**
```bash
# Using Image from react-native directly for remote URLs
grep -rn "source={{uri:" --include="*.tsx" --include="*.ts" | grep -v "FastImage\|fast-image\|expo-image"
```
- Fix: Use `react-native-fast-image` or `expo-image` for network images

**10. Missing keyExtractor on lists**
```bash
grep -rn "FlatList\|FlashList\|SectionList" --include="*.tsx" --include="*.ts" | xargs -I{} grep -L "keyExtractor"
```
- Fix: Add `keyExtractor` prop for stable item identity

### LOW

**11. setInterval/setTimeout without cleanup**
```bash
grep -rn "setInterval\|setTimeout" --include="*.tsx" --include="*.ts" | grep -v "clearInterval\|clearTimeout"
```
- Fix: Store ref and clear in useEffect cleanup

**12. require() inside render/component body**
```bash
grep -rn "^\s*const.*= require(" --include="*.tsx" --include="*.ts"
```
- Fix: Move to top-level imports

## Output Format

```
## Performance Audit Results — [directory scanned]

### CRITICAL (fix immediately)
- `src/screens/Home.tsx:42` — ScrollView with .map() → use FlashList
- `src/utils/index.ts:1` — barrel import from lodash → use lodash/debounce

### HIGH (fix before next release)
- `src/components/Card.tsx:15` — Animated.Value → use reanimated useSharedValue
- `src/components/List.tsx:23` — inline style={{}} → StyleSheet.create

### MEDIUM (tech debt)
- `src/hooks/useData.ts:8` — subscription without cleanup

### Summary
- 2 CRITICAL, 3 HIGH, 1 MEDIUM issues found
- Estimated FPS impact: +15-25 frames if CRITICAL/HIGH resolved
- Next step: /perf-define to scope the highest-priority fix, or /perf-measure for baseline
```

## After Scan

- If CRITICAL issues found: recommend `/perf-define` to scope the fix
- If no issues found: recommend `/perf-measure` to profile for non-code-visible bottlenecks
- Always remind: "This scan catches code-level patterns only. Runtime issues (memory leaks, native bottlenecks) require profiling — use `/perf-measure`"

## Callstack References
- `js-lists-flatlist-flashlist.md` — FlashList migration
- `js-animations-reanimated.md` — Reanimated patterns
- `js-memory-leaks.md` — Memory leak detection
- `js-react-compiler.md` — React Compiler auto-memoization
- `bundle-barrel-exports.md` — Barrel import elimination
