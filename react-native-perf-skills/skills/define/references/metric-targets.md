---
title: Performance Metric Targets
impact: HIGH
tags: metrics, thresholds, targets, fps, tti, bundle, memory
---

# Performance Metric Targets

Reference thresholds for setting measurable goals in the Define phase.

## FPS (Frames Per Second)

| Rating | Scroll FPS | Animation FPS | Gesture Response |
|--------|-----------|---------------|-----------------|
| Excellent | 58-60 | 58-60 | < 16ms to first frame |
| Acceptable | 45-57 | 50-57 | < 32ms to first frame |
| Needs Work | < 45 | < 50 | > 32ms to first frame |

**Context**: React Native targets 60fps. Each frame budget is 16.6ms. Anything below 45fps is perceptible jank to users.

## Startup / TTI (Time to Interactive)

| Rating | Cold Start | Warm Start | JS Bundle Parse |
|--------|-----------|------------|-----------------|
| Excellent | < 1.5s | < 0.5s | < 500ms |
| Acceptable | 1.5–3s | 0.5–1s | 500ms–1s |
| Needs Work | > 3s | > 1s | > 1s |

**Context**: Google Play penalizes cold starts > 5s. Users abandon apps after 3s. Hermes bytecode significantly reduces parse time vs plain JS.

## Bundle Size (JS)

| Rating | iOS Bundle | Android Bundle | OTA Update |
|--------|-----------|---------------|------------|
| Excellent | < 1.5MB | < 1.5MB | < 500KB |
| Acceptable | 1.5–3MB | 1.5–3MB | 500KB–1.5MB |
| Needs Work | > 3MB | > 3MB | > 1.5MB |

**Context**: Hermes bytecode bundles are ~2x larger than minified JS but load faster via mmap. Focus on the minified JS size for OTA, bytecode size for store.

## App Download Size

| Rating | iOS (App Store) | Android (Play Store) |
|--------|----------------|---------------------|
| Excellent | < 30MB | < 15MB |
| Acceptable | 30–60MB | 15–30MB |
| Needs Work | > 60MB | > 30MB |

**Context**: Google Play warns at 150MB (AAB). Users on mobile data skip downloads > 50MB. Android 16KB page alignment can increase native lib sizes.

## Memory (RAM)

| Rating | JS Heap (typical screen) | Total RSS | Growth per navigation |
|--------|------------------------|-----------|----------------------|
| Excellent | < 50MB | < 200MB | < 1MB |
| Acceptable | 50–100MB | 200–350MB | 1–5MB |
| Needs Work | > 100MB | > 350MB | > 5MB |

**Context**: Low-end Android devices have 2-3GB total RAM. iOS aggressively kills background apps above ~400MB. Steady growth per navigation signals a memory leak.

## Device Tier Classification

When setting targets, always specify the device tier:

| Tier | Example Devices | Expected Performance |
|------|----------------|---------------------|
| High-end | iPhone 15 Pro, Pixel 8 Pro, Galaxy S24 | Should hit Excellent on all metrics |
| Mid-range | iPhone SE 3, Pixel 7a, Galaxy A54 | Should hit Acceptable on all metrics |
| Low-end | iPhone 8, Pixel 4a, Galaxy A13 | Must not be Needs Work on any metric |

**Principle**: Optimize for mid-range, verify on low-end. If it works on low-end, it'll fly on high-end.
