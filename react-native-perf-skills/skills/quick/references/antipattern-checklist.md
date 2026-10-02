---
title: Antipattern Detection Patterns
impact: HIGH
tags: antipatterns, grep, detection, scan
---

# Antipattern Detection Reference

Quick lookup table for the grep patterns used by `/perf-quick` and the `detect-perf-antipatterns.sh` hook.

## Pattern Registry

| # | Antipattern | Severity | Grep Pattern | Fix Library |
|---|-------------|----------|--------------|-------------|
| 1 | ScrollView + .map() | CRITICAL | `ScrollView` in file with `.map(` | `@shopify/flash-list` |
| 2 | Barrel imports | CRITICAL | `from ['"]lodash['"]` (no subpath) | Direct imports |
| 3 | Animated.Value | HIGH | `new Animated\.Value\(` | `react-native-reanimated` |
| 4 | Inline styles | HIGH | `style={{` | `StyleSheet.create` |
| 5 | Anonymous list callbacks | HIGH | `onPress={() =>` in renderItem | `useCallback` / React Compiler |
| 6 | Unmemoized list items | HIGH | renderItem without memo | `React.memo()` / React Compiler |
| 7 | console.log in prod | MEDIUM | `console\.(log\|warn\|error)` without `__DEV__` | babel-plugin-transform-remove-console |
| 8 | Missing subscription cleanup | MEDIUM | `addListener`/`subscribe` without cleanup return | useEffect cleanup |
| 9 | Uncached remote images | MEDIUM | `source={{uri:` without FastImage/expo-image | `expo-image` / `react-native-fast-image` |
| 10 | Missing keyExtractor | MEDIUM | FlatList/FlashList without keyExtractor | Add `keyExtractor` prop |
| 11 | Leaked timers | LOW | `setInterval`/`setTimeout` without clear | useEffect cleanup |
| 12 | Dynamic require | LOW | `const x = require(` indented (not top-level) | Top-level import |

## False Positive Mitigation

Files to exclude from scanning:
- `*.test.*`, `*.spec.*`, `__tests__/*`, `__mocks__/*`
- `*.stories.*` (Storybook)
- `*.d.ts` (type declarations)
- `node_modules/`
- Files with `// perf-ignore` comment on the flagged line

## Severity Definitions

- **CRITICAL**: Causes measurable FPS drops or >500KB bundle increase in typical apps. Fix immediately.
- **HIGH**: Causes re-render cascades or animation jank under load. Fix before release.
- **MEDIUM**: Contributes to gradual performance degradation. Schedule as tech debt.
- **LOW**: Minor inefficiency, only matters at scale. Fix opportunistically.

## Mapping to Callstack References

| Antipattern | Callstack Reference File | Key Section |
|-------------|--------------------------|-------------|
| ScrollView + .map() | `js-lists-flatlist-flashlist.md` | "Quick Pattern" |
| Barrel imports | `bundle-barrel-exports.md` | "Step-by-Step" |
| Animated.Value | `js-animations-reanimated.md` | "Quick Pattern" |
| Inline styles | (no dedicated file) | General best practice |
| Anonymous callbacks | `js-react-compiler.md` | "When to Use" |
| Unmemoized items | `js-react-compiler.md` | "Prerequisites" |
| console.log | (no dedicated file) | General best practice |
| Missing cleanup | `js-memory-leaks.md` | "Quick Pattern" |
| Uncached images | (no dedicated file) | Fast-image docs |
| Missing keyExtractor | `js-lists-flatlist-flashlist.md` | "Prerequisites" |
