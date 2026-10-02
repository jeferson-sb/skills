---
title: Deferred Work Patterns
impact: HIGH
tags: interaction-manager, useTransition, useDeferredValue, concurrent-react, navigation, animations
---

# Deferred Work Patterns

Techniques for scheduling heavy work *after* animations and interactions complete, preventing jank during transitions.

## The Problem

Navigation transitions, gesture animations, and other UI interactions share the JS thread with component mounting and state updates. When a screen mounts and immediately does expensive work (API calls, large renders, state hydration), it competes with the animation — causing dropped frames.

```
User taps → Navigation animation starts → New screen mounts → Heavy useEffect fires → JANK
```

The fix: defer non-critical work until the interaction finishes.

## Pattern 1: InteractionManager (React Native API)

The simplest and most portable solution. Works on all React Native versions.

```typescript
import { InteractionManager } from 'react-native';

function DetailScreen() {
  const [data, setData] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      // Heavy work runs AFTER navigation animation completes
      fetchData().then(setData);
      setIsReady(true);
    });

    return () => task.cancel();
  }, []);

  if (!isReady) return <ScreenSkeleton />;
  return <DetailContent data={data} />;
}
```

**How it works**: InteractionManager tracks active touches and animations. `runAfterInteractions` queues callbacks that execute only when all interactions (touches, animations) have completed.

**Best for**: Screen mount work, navigation-correlated jank, any useEffect that can wait 200-500ms.

### Pairing with React Navigation's useFocusEffect

The most common use case — deferring work when a screen gains focus:

```typescript
import { useFocusEffect } from '@react-navigation/native';
import { InteractionManager } from 'react-native';

function HomeScreen() {
  const [posts, setPosts] = useState([]);

  useFocusEffect(
    useCallback(() => {
      const task = InteractionManager.runAfterInteractions(() => {
        // Runs after the tab switch animation finishes
        loadPosts().then(setPosts);
      });

      return () => task.cancel();
    }, [])
  );

  return <FeedList data={posts} />;
}
```

**Why this matters**: `useFocusEffect` fires as soon as the screen is focused — which is often *during* the transition animation. Without InteractionManager, the data fetch + render competes with the animation.

### Custom Interaction Handles

For custom animations, register them with InteractionManager so other deferred work waits:

```typescript
const handle = InteractionManager.createInteractionHandle();

// Run your custom animation...
Animated.timing(opacity, { toValue: 1, duration: 300 }).start(() => {
  // Animation done — release the handle
  InteractionManager.clearInteractionHandle(handle);
  // All runAfterInteractions callbacks now execute
});
```

---

## Pattern 2: useTransition (Concurrent React)

Marks state updates as non-urgent, allowing React to interrupt them if higher-priority work arrives (like user input).

```typescript
import { useTransition, useState } from 'react';
import { TextInput, ActivityIndicator } from 'react-native';

function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isPending, startTransition] = useTransition();

  const handleChange = (text: string) => {
    setQuery(text); // Urgent: update input immediately

    startTransition(() => {
      // Non-urgent: filter/search can wait
      const filtered = expensiveSearch(text);
      setResults(filtered);
    });
  };

  return (
    <>
      <TextInput value={query} onChangeText={handleChange} />
      {isPending && <ActivityIndicator />}
      <ResultsList data={results} />
    </>
  );
}
```

**How it works**: React processes the urgent update (`setQuery`) immediately, then processes the transition update (`setResults`) in the background. If new input arrives before the transition finishes, React abandons the stale transition and starts fresh.

**Best for**: Search-as-you-type, filtering large lists, any state update triggered by rapid user input.

**Requirement**: New Architecture (React Native 0.76+). Concurrent features require Fabric renderer.

---

## Pattern 3: useDeferredValue (Concurrent React)

Shows stale content while expensive re-renders process in the background. Similar to useTransition but applied to values rather than state updates.

```typescript
import { useDeferredValue, useState, memo } from 'react';
import { View, TextInput, ActivityIndicator } from 'react-native';

function FilterScreen() {
  const [filter, setFilter] = useState('');
  const deferredFilter = useDeferredValue(filter);
  const isStale = filter !== deferredFilter;

  return (
    <View>
      <TextInput value={filter} onChangeText={setFilter} />
      <View style={isStale ? { opacity: 0.7 } : undefined}>
        <ExpensiveList filter={deferredFilter} />
      </View>
      {isStale && <ActivityIndicator />}
    </View>
  );
}

// IMPORTANT: wrap expensive component in memo() so React can skip
// re-rendering it when the deferred value hasn't changed yet
const ExpensiveList = memo(({ filter }: { filter: string }) => {
  const items = computeExpensiveFilter(filter); // heavy work
  return <FlashList data={items} renderItem={...} />; // v2+ auto-computes sizing
});
```

**How it works**: `deferredFilter` lags behind `filter`. React renders the UI with the stale deferred value first (keeping input responsive), then re-renders with the new value when ready.

**Best for**: Expensive child components that receive rapidly-changing props, search results, data visualization updates.

**Requirement**: New Architecture (React Native 0.76+). Must wrap deferred consumers in `React.memo()`.

---

## Decision Guide: Which Pattern to Use

```
Is the jank during navigation/screen transition?
├─ Yes → InteractionManager.runAfterInteractions
│         (works everywhere, simple, reliable)
└─ No → Is it during rapid user input (typing, slider)?
    ├─ Yes → Is the slow part a state UPDATE?
    │   ├─ Yes → useTransition (defer the setState)
    │   └─ No → useDeferredValue (defer the render of a value)
    └─ No → Is it a one-time heavy mount?
        ├─ Yes → InteractionManager (defer until idle)
        └─ No → Consider moving work off JS thread (Reanimated worklet, TurboModule)
```

## Compatibility Matrix

| Pattern | Old Architecture | New Architecture | Min RN Version |
|---------|-----------------|-----------------|----------------|
| InteractionManager | Yes | Yes | Any |
| useTransition | No | Yes | 0.76+ |
| useDeferredValue | No | Yes | 0.76+ |
| startTransition (non-hook) | No | Yes | 0.76+ |

## Combining Patterns

For complex screens, combine InteractionManager (for mount) with Concurrent React (for updates):

```typescript
function ComplexScreen() {
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState('');
  const deferredFilter = useDeferredValue(filter);

  // Defer initial data load until after navigation animation
  useFocusEffect(
    useCallback(() => {
      const task = InteractionManager.runAfterInteractions(() => {
        fetchScreenData().then(setData);
      });
      return () => task.cancel();
    }, [])
  );

  // Once loaded, use deferred value for responsive filtering
  if (!data) return <ScreenSkeleton />;

  return (
    <>
      <FilterBar value={filter} onChange={setFilter} />
      <FilteredList data={data} filter={deferredFilter} />
    </>
  );
}
```

## Anti-patterns

| Don't | Why | Do Instead |
|-------|-----|------------|
| `setTimeout(fn, 0)` to "defer" work | Arbitrary delay, doesn't wait for interactions | `InteractionManager.runAfterInteractions` |
| `requestAnimationFrame` for heavy work | Runs on next frame — still competes with animation | InteractionManager or useTransition |
| `useTransition` for navigation mount | Doesn't help — the component isn't rendering yet | InteractionManager in useEffect |
| Forgetting `task.cancel()` in cleanup | Memory leak if screen unmounts during animation | Always return cleanup |
| `useDeferredValue` without `memo()` | Component still re-renders from parent — no benefit | Wrap consumer in `React.memo()` |
