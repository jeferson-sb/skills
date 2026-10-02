---
name: perf-define
description: "DMAIC Phase 1 — Define the performance problem. Scope the symptom, classify it, set measurable targets, identify the affected user flow, and produce a structured problem statement. Use before measuring to avoid wasted profiling time."
effort: low
argument-hint: "[symptom description or screen name]"
tools: Read, Glob, Grep, Bash
---

# Define — DMAIC Phase 1

Scope the performance problem before investing time in profiling. A well-defined problem leads directly to the correct measurement tool.

## Usage

```
/perf-define "Home screen scrolls at 30fps on Android"
/perf-define "App takes 5 seconds to start on low-end devices"
/perf-define "Bundle is 12MB and growing"
```

## Workflow

### Step 1: Symptom Classification

Classify the user's reported symptom into one of these domains:

| Domain | Symptoms | Measurement Tool | Next Skill |
|--------|----------|-----------------|------------|
| **FPS / Jank** | Dropped frames, stuttering scroll, laggy touch response | Flashlight (Android), React Perf Monitor | `/perf-measure fps` |
| **Startup / TTI** | Slow cold start, splash screen lingers, delayed interactivity | react-native-performance markers, Flashlight | `/perf-measure tti` |
| **Bundle / App Size** | Large download, slow OTA updates, Play Store warnings | source-map-explorer, Expo Atlas, Ruler | `/perf-measure bundle` |
| **Memory** | Growing RAM usage, OOM crashes, GC pauses | React DevTools Memory, Xcode Leaks, Android Memory Profiler | `/perf-measure memory` |
| **Animation** | Choppy animations, gesture lag, non-60fps transitions | Flashlight + Reanimated inspector | `/perf-measure animation` |

### Step 2: Affected Flow Identification

Ask or determine:
- Which screen(s) exhibit the problem?
- What user action triggers it? (scroll, navigation, gesture, app launch)
- Is it reproducible on all devices or only low-end?
- Does it happen on both platforms or one?

Search the codebase for the affected screen:
```bash
find . -name "*.tsx" -path "*Screen*" | grep -i "[screen-name]"
```

### Step 3: User Impact Framing

Frame the problem in terms of user impact:
- What % of users are affected? (device tier distribution)
- How frequently do they encounter it? (every session, specific flow)
- What's the business cost? (drop-off, retention, store rating)

### Step 4: Set Measurable Targets

Reference `${CLAUDE_SKILL_DIR}/references/metric-targets.md` for thresholds.

Define:
- **Current metric** (measured or reported): e.g., "~30 FPS during scroll"
- **Target metric**: e.g., "sustained 55+ FPS during scroll"
- **Acceptable range**: e.g., "45-60 FPS"

### Step 5: Write Problem Statement

Use the template from `${CLAUDE_SKILL_DIR}/references/problem-statement-template.md`:

```
On [platform/device tier], [user action] causes [observed symptom],
measured at [current metric]. Target: [goal metric].
Hypothesis: [suspected area].
Affected flow: [navigation path to reproduce].
```

### Step 6: Save Artifact

Save the problem statement for reference by later DMAIC phases:
```
.perf/[slug]/define.md
```

## Output

After completing the definition, recommend:
- "Problem defined. Run `/perf-measure [domain]` to collect baseline metrics."
- If obvious code-level issues spotted during flow identification: "Consider `/perf-quick` first for a fast scan."

## Callstack References
- `native-measure-tti.md` — TTI measurement markers setup
- `js-measure-fps.md` — FPS monitoring approaches
- `bundle-analyze-js.md` — Bundle size measurement
- `js-memory-leaks.md` — Memory leak identification
