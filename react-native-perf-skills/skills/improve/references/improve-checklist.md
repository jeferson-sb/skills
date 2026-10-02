---
title: Improvement Checklists by Category
impact: HIGH
tags: checklist, fixes, improve, optimization, step-by-step
---

# Improvement Checklists by Category

Ordered fix sequences for each root cause category. Apply in order — each step builds on the previous.

## Re-renders Category

| # | Fix | Impact | Effort | Callstack Ref |
|---|-----|--------|--------|---------------|
| 1 | Replace ScrollView+map with FlashList | CRITICAL | 1-3h | `js-lists-flatlist-flashlist.md` |
| 2 | Enable React Compiler (auto-memoization) | HIGH | 30m-2h | `js-react-compiler.md` |
| 3 | Wrap list item components with `React.memo()` | HIGH | 30m | — |
| 4 | Replace inline callbacks with `useCallback` | HIGH | 1-2h | — |
| 5 | Replace inline style objects with StyleSheet constants | MEDIUM | 1h | — |
| 6 | Migrate Context to Zustand/Jotai selectors | MEDIUM | 2-4h | `js-atomic-state.md` |
| 7 | Use `useMemo` for expensive derived data | MEDIUM | 30m | — |
| 8 | Apply `useDeferredValue` / `useTransition` for non-urgent updates | MEDIUM | 30m | `deferred-work-patterns.md` |

**When to stop**: Re-measure after steps 1-3. If FPS target met, remaining steps are optional tech debt.

### Step 1: FlashList Migration

```typescript
// Before
import { ScrollView } from 'react-native';

<ScrollView>
  {items.map(item => <Item key={item.id} {...item} />)}
</ScrollView>

// After
import { FlashList } from '@shopify/flash-list';

<FlashList
  data={items}
  renderItem={({ item }) => <Item {...item} />}
  keyExtractor={item => item.id}
  // FlashList v2+ auto-computes sizing — no estimatedItemSize needed.
  // On v1 only, add estimatedItemSize={80}.
/>
```

### Step 2: React Compiler

**Prerequisites**: `babel-plugin-react-compiler` is `@beta`. Requires Expo SDK 52+ or bare RN 0.76+ (New Architecture).

```bash
# Install
npm install -D babel-plugin-react-compiler@beta

# babel.config.js
module.exports = {
  plugins: [
    ['babel-plugin-react-compiler', { target: '19' }],
  ],
};
```

Eliminates need for manual `useMemo`, `useCallback`, `React.memo` in most cases.

### Step 3: Memo + Stable Props

```typescript
// Item component
const FeedItem = React.memo(({ id, title, onPress }) => {
  return (
    <Pressable onPress={() => onPress(id)} style={styles.item}>
      <Text>{title}</Text>
    </Pressable>
  );
});

// Parent — stable callback
const handlePress = useCallback((id: string) => {
  navigation.navigate('Detail', { id });
}, [navigation]);
```

---

## Animations Category

| # | Fix | Impact | Effort | Callstack Ref |
|---|-----|--------|--------|---------------|
| 1 | Replace `Animated.Value` with `useSharedValue` | CRITICAL | 2-4h | `js-animations-reanimated.md` |
| 2 | Replace `PanResponder` with `Gesture.Pan()` | HIGH | 2-3h | — |
| 3 | Replace `Animated.event` with `useAnimatedScrollHandler` | HIGH | 1-2h | — |
| 4 | Defer heavy screen work with `InteractionManager.runAfterInteractions` | HIGH | 30m | `deferred-work-patterns.md` |
| 5 | Move interpolation to `useAnimatedStyle` | MEDIUM | 1h | — |
| 6 | Use `withTiming`/`withSpring` instead of `Animated.timing` | MEDIUM | 1h | — |
| 7 | Add `native: true` to legacy LayoutAnimation | LOW | 15m | — |

### Step 1: Reanimated Migration

```typescript
// Before (JS thread)
const translateY = useRef(new Animated.Value(0)).current;
Animated.timing(translateY, { toValue: 100, duration: 300, useNativeDriver: true }).start();

// After (UI thread)
const translateY = useSharedValue(0);
const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ translateY: translateY.value }],
}));

// Trigger
translateY.value = withTiming(100, { duration: 300 });
```

### Step 2: Gesture Handler Migration

```typescript
// Before (JS thread)
const panResponder = PanResponder.create({
  onMoveShouldSetPanResponder: () => true,
  onPanResponderMove: (e, gestureState) => {
    translateX.setValue(gestureState.dx);
  },
});

// After (UI thread)
const translateX = useSharedValue(0);
const gesture = Gesture.Pan()
  .onUpdate((e) => {
    translateX.value = e.translationX;
  });

<GestureDetector gesture={gesture}>
  <Animated.View style={animatedStyle} />
</GestureDetector>
```

---

## Bundle Size Category

| # | Fix | Impact | Effort | Callstack Ref |
|---|-----|--------|--------|---------------|
| 1 | Run source-map-explorer — identify top 5 offenders | (diagnostic) | 30m | `bundle-analyze-js.md` |
| 2 | Fix barrel imports — direct file imports | CRITICAL | 1-4h | `bundle-barrel-exports.md` |
| 3 | Replace moment.js with dayjs | HIGH | 1-2h | — |
| 4 | Enable tree shaking (Re.Pack or Expo SDK 52+) | HIGH | 2-4h | `bundle-tree-shaking.md` |
| 5 | Remove unused dependencies (run `npx depcheck`) | MEDIUM | 1h | — |
| 6 | Remove Intl polyfills if Hermes covers needed APIs | MEDIUM | 1h | — |
| 7 | Enable R8 for Android | HIGH | 30m | `bundle-r8-android.md` |
| 8 | Disable JS bundle compression for Hermes mmap (RN ≤ 0.78 only) | HIGH | 15m | `bundle-hermes-mmap.md` |
| 9 | Evaluate code splitting with Re.Pack | MEDIUM | 1-2 days | `bundle-code-splitting.md` |

### Step 2: Barrel Import Fix

```typescript
// Before (pulls entire library)
import { debounce, throttle } from 'lodash';

// After (only imports what's used)
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';
```

### Step 7: Enable R8 (Android)

```groovy
// android/app/build.gradle
android {
    buildTypes {
        release {
            minifyEnabled true       // Enable R8
            shrinkResources true     // Remove unused resources
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### Step 8: Hermes mmap

Version-gated. On **RN 0.79+**, Android JS bundles default to uncompressed, so Hermes
already mmaps the bundle — no action needed. Only set this on **RN 0.78 and earlier**:

```groovy
// android/app/build.gradle (RN ≤ 0.78 only)
project.ext.react = [
    enableHermesBundleCompression: false  // Allow Hermes to mmap the bundle directly
]
```

---

## Startup / TTI Category

| # | Fix | Impact | Effort | Callstack Ref |
|---|-----|--------|--------|---------------|
| 1 | Fix barrel imports on startup path | CRITICAL | 2-4h | `bundle-barrel-exports.md` |
| 2 | Lazy-load non-critical screens | HIGH | 2-3h | — |
| 3 | Defer non-critical init with `InteractionManager.runAfterInteractions` | HIGH | 30m | `deferred-work-patterns.md` |
| 4 | Move heavy init to after first render (useEffect) | HIGH | 1-2h | — |
| 5 | Remove sync storage reads from startup | MEDIUM | 1-2h | — |
| 6 | Remove unused native module auto-links | MEDIUM | 1h | — |
| 7 | Enable Hermes (if not already) | HIGH | 30m | — |
| 8 | Optimize splash → first render transition | LOW | 1h | — |

### Step 2: Lazy Screen Loading

```typescript
// Before: all screens imported eagerly
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import SettingsScreen from './screens/SettingsScreen';

// After: lazy load non-initial screens
import HomeScreen from './screens/HomeScreen';
const ProfileScreen = React.lazy(() => import('./screens/ProfileScreen'));
const SettingsScreen = React.lazy(() => import('./screens/SettingsScreen'));
```

### Step 3: Deferred Initialization

```typescript
// Before: everything initializes before first render
const App = () => {
  const analytics = initAnalytics(); // 200ms
  const featureFlags = loadFlags();   // 150ms
  const config = parseRemoteConfig(); // 100ms
  
  return <MainNavigator />;
};

// After: critical path only, rest deferred
const App = () => {
  useEffect(() => {
    // Non-critical init after first render
    initAnalytics();
    loadFlags();
    parseRemoteConfig();
  }, []);
  
  return <MainNavigator />;
};
```

---

## Memory Category

| # | Fix | Impact | Effort | Callstack Ref |
|---|-----|--------|--------|---------------|
| 1 | Add useEffect cleanup for all subscriptions | CRITICAL | 1-2h | `js-memory-leaks.md` |
| 2 | Clear timers (setInterval/setTimeout) on unmount | HIGH | 30m | — |
| 3 | Use native-stack instead of stack (native screen lifecycle) | HIGH | 1-2h | — |
| 4 | Add image cache size limits | MEDIUM | 30m | — |
| 5 | Use WeakRef for optional back-references | MEDIUM | 1h | — |
| 6 | Investigate native leaks with Xcode Leaks | MEDIUM | 2-4h | `native-memory-leaks.md` |

### Step 1: Subscription Cleanup Pattern

```typescript
// Correct pattern for ALL subscriptions
useEffect(() => {
  const subscription = eventEmitter.addListener('event', handler);
  
  return () => {
    subscription.remove(); // MUST clean up
  };
}, []);

// For multiple subscriptions
useEffect(() => {
  const sub1 = store.subscribe(handler1);
  const sub2 = emitter.addListener('x', handler2);
  const timer = setInterval(poll, 5000);
  
  return () => {
    sub1();              // Zustand returns unsubscribe function
    sub2.remove();       // EventEmitter returns subscription object
    clearInterval(timer); // Timer must be cleared
  };
}, []);
```

---

## Native Optimization Category

| # | Fix | Impact | Effort | Callstack Ref |
|---|-----|--------|--------|---------------|
| 1 | Switch to native-stack navigator | HIGH | 1-2h | — |
| 2 | Enable view flattening (`collapsable` prop) | MEDIUM | 30m | `native-view-flattening.md` |
| 3 | Replace JS polyfills with native SDKs | HIGH | 2-4h | `native-sdks-over-polyfills.md` |
| 4 | Move heavy computation to TurboModule | HIGH | 1-2 days | `native-turbo-modules.md` |
| 5 | Use background threading in TurboModules | MEDIUM | 4-8h | `native-threading-model.md` |
| 6 | Fix Android 16KB page alignment | CRITICAL | 1-2h | `native-android-16kb-alignment.md` |

**When to go native**: If JS-level fixes (re-renders, memoization, Reanimated) are all applied and the metric is still "Needs Work", the bottleneck is in native land. Check Time Profiler (iOS) or CPU Profiler (Android) for native-layer hotspots.
