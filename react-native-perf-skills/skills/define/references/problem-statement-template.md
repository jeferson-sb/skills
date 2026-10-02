---
title: Problem Statement Template
impact: MEDIUM
tags: define, template, problem-statement, dmaic
---

# Problem Statement Template

Use this structured format to define a performance problem clearly before measuring.

## Template

```markdown
# Performance Problem: [Short Title]

## Symptom
On [platform: iOS/Android/both] [device tier: high/mid/low-end],
[user action: scrolling/navigating/launching/animating]
causes [observed symptom: dropped frames/slow start/large download/memory growth].

## Current Metric
- Measured value: [e.g., ~30 FPS during scroll, 4.2s cold start, 8MB bundle]
- How measured: [tool used or user report]
- Conditions: [release mode, device model, network]

## Target Metric
- Goal: [e.g., sustained 55+ FPS, < 2s cold start, < 3MB bundle]
- Acceptable range: [e.g., 45-60 FPS]
- Based on: [metric-targets.md thresholds / business requirement / competitor benchmark]

## Affected Flow
1. [Step to reproduce - e.g., Open app]
2. [Step - e.g., Navigate to Home tab]
3. [Step - e.g., Scroll feed list quickly]
4. [Symptom occurs here]

## Hypothesis (initial)
- Suspected area: [e.g., list re-renders, heavy component tree, unoptimized images]
- Evidence: [e.g., user reports, initial code inspection, /perf-quick results]
- Confidence: [Low/Medium/High]

## Impact
- Users affected: [% or segment]
- Frequency: [every session / specific flow / rare]
- Business impact: [retention / store rating / conversion]

## Constraints
- Timeline: [when does this need to be resolved]
- Platform priority: [iOS first / Android first / both equally]
- Breaking changes acceptable: [yes/no — affects solution scope]
```

## Examples

### Example 1: Scroll Jank

```markdown
# Performance Problem: Feed Scroll Jank on Android

## Symptom
On Android mid-range devices (Galaxy A54, Pixel 7a),
scrolling the home feed causes visible frame drops and stuttering.

## Current Metric
- Measured value: Flashlight score 35/100, ~28 FPS during fast scroll
- How measured: Flashlight CLI on Galaxy A54 (release build)
- Conditions: Release mode, 50+ feed items loaded, WiFi

## Target Metric
- Goal: Flashlight score > 70, sustained 50+ FPS
- Acceptable range: 45-60 FPS
- Based on: metric-targets.md "Acceptable" threshold

## Affected Flow
1. Launch app (logged in)
2. Land on Home tab (default)
3. Scroll feed quickly (flick gesture)
4. Frame drops visible within first 10 items

## Hypothesis (initial)
- Suspected area: FlatList with heavy item components, inline styles
- Evidence: /perf-quick found 23 inline style={{}} and ScrollView+map in HomeScreen
- Confidence: Medium

## Impact
- Users affected: ~60% (Android users on mid/low-end)
- Frequency: Every session
- Business impact: 12% higher bounce rate on Android vs iOS
```

### Example 2: Slow Startup

```markdown
# Performance Problem: Cold Start > 4s on Low-End

## Symptom
On Android low-end devices (Galaxy A13, 3GB RAM),
app cold start shows splash screen for 4+ seconds before interactive.

## Current Metric
- Measured value: 4.2s TTI (measured with react-native-performance)
- How measured: 5 cold starts averaged, airplane mode, release APK
- Conditions: After device restart, no other apps in memory

## Target Metric
- Goal: < 2.5s TTI
- Acceptable range: 1.5-3s
- Based on: Google Play ANR threshold and user expectation

## Affected Flow
1. Kill app from recents
2. Tap app icon
3. Splash screen appears
4. 4.2s until Home screen interactive

## Hypothesis (initial)
- Suspected area: Large JS bundle (5.2MB), sync initialization in App.tsx
- Evidence: Bundle size is 5.2MB, 12 barrel imports at top level
- Confidence: High (bundle size directly correlates with parse time)

## Impact
- Users affected: ~25% (low-end Android segment)
- Frequency: Every cold start (2-3x per day average)
- Business impact: 8% day-1 retention gap vs iOS
```

## After Writing the Problem Statement

Save to `.perf/[slug]/define.md` and proceed:
- `/perf-measure [domain]` — collect baseline metrics with the correct tool
- If hypothesis confidence is High and code evidence is clear: skip to `/perf-improve`
