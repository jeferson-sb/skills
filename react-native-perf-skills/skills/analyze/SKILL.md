---
name: perf-analyze
description: "DMAIC Phase 3 — Root cause analysis. Takes baseline metrics from /perf-measure and maps them to root causes using pattern matching. Searches the codebase for supporting evidence. Produces a ranked hypothesis list with confidence levels."
effort: medium
argument-hint: "[path to baseline-metrics or symptom summary]"
tools: Read, Glob, Grep, Bash
---

# Analyze — DMAIC Phase 3

Map measured metrics to root causes. This phase bridges "what's slow" to "why it's slow."

## Usage

```
/perf-analyze                    # Reads from .perf/[slug]/baseline-metrics.md
/perf-analyze "FPS drops to 28 during scroll, JS thread at 80%"
```

## Workflow

### Step 1: Load Metrics

Read baseline from `.perf/[slug]/baseline-metrics.md` or accept inline description.

Extract key signals:
- Which metric is out of range? (FPS, TTI, bundle size, memory)
- What was the measurement context? (scroll, navigation, startup, idle)
- What did the profiler tool highlight? (thread saturation, GC pauses, specific components)

### Step 2: Pattern Match Against Root Causes

Reference `${CLAUDE_SKILL_DIR}/references/root-cause-patterns.md` for the full pattern library.

Match the metric signature to candidate root causes:

| If you see... | Likely root cause | Confidence |
|---------------|------------------|------------|
| FPS < 45 + JS thread > 70% | Excessive re-renders / heavy render computation | High |
| FPS < 45 + UI thread > 50% | View hierarchy too deep / layout complexity | High |
| FPS drops on scroll start only | JS-thread gesture/animation (Animated.event) | High |
| FPS drops correlate with data fetch | Large JSON parse blocking JS thread | Medium |
| TTI > 3s + bundle > 3MB | Heavy imports on startup path (barrel imports) | High |
| TTI > 3s + bundle < 2MB | Sync initialization (storage reads, heavy providers) | Medium |
| Memory growing linearly | Subscription/listener not cleaned up on unmount | High |
| Memory spike on navigation | Large component tree retained after unmount | Medium |
| Bundle > 5MB | Barrel imports + large unused dependencies | High |

### Step 3: Search Codebase for Evidence

For each candidate root cause, grep the project for supporting evidence:

```bash
# Re-render cascade evidence
grep -rn "style={{" --include="*.tsx" --include="*.ts" | wc -l
grep -rn "onPress={() =>" --include="*.tsx" --include="*.ts" | wc -l
grep -rn "useContext" --include="*.tsx" --include="*.ts" | wc -l

# JS-thread animation evidence
grep -rn "Animated\.\(timing\|spring\|event\)" --include="*.tsx" --include="*.ts"
grep -rn "PanResponder" --include="*.tsx" --include="*.ts"

# Large bundle evidence
grep -rn "from ['\"]lodash['\"]" --include="*.tsx" --include="*.ts"
grep -rn "from ['\"]moment['\"]" --include="*.tsx" --include="*.ts"
grep -rn "from ['\"]@aws-sdk" --include="*.tsx" --include="*.ts"

# Memory leak evidence
grep -rn "addEventListener\|addListener\|subscribe" --include="*.tsx" --include="*.ts"
grep -rn "setInterval\|setTimeout" --include="*.tsx" --include="*.ts"

# Heavy startup evidence
grep -rn "require(" --include="*.tsx" --include="*.ts" | grep -v "node_modules"
```

### Step 4: Confidence Scoring

For each hypothesis, assign confidence based on evidence:

| Evidence Signals | Confidence |
|-----------------|------------|
| Metric signature matches + code pattern found + profiler confirms | **High** |
| Metric signature matches + code pattern found | **Medium** |
| Metric signature matches but no direct code evidence | **Low** |

### Step 5: Rank and Output

Produce a ranked hypothesis list:

```markdown
# Root Cause Analysis — [Problem Slug]

## Hypothesis 1 (Confidence: HIGH)
**Root cause**: Excessive re-renders in FeedItemCard due to inline onPress callbacks
**Evidence**:
- Flashlight shows FPS drops correlating with scroll (28 FPS average)
- JS thread at 78% during scroll
- Found 42 instances of `onPress={() =>` in list item components
- React DevTools shows "Props changed: onPress" on every item re-render
**Affected files**: src/components/FeedItem.tsx, src/screens/HomeScreen.tsx
**Fix category**: Re-renders → memoization
**Callstack ref**: js-react-compiler.md, js-lists-flatlist-flashlist.md

## Hypothesis 2 (Confidence: MEDIUM)
**Root cause**: ...

## Hypothesis 3 (Confidence: LOW)
**Root cause**: ...
```

Save to `.perf/[slug]/root-cause.md`

### Step 6: Route to Fix

- "Root cause identified. Run `/perf-improve [category]` to apply targeted fixes."
- If multiple hypotheses: "Start with Hypothesis 1 (highest confidence). Re-measure after fix to confirm before addressing Hypothesis 2."

## Spawning Specialist Agents

For complex analysis, spawn domain-specific agents:

```
# JS re-render investigation
Agent({ subagent_type: "react-native-perf-skills:js-profiling-specialist", prompt: "..." })

# Native layer investigation  
Agent({ subagent_type: "react-native-perf-skills:native-profiling-specialist", prompt: "..." })

# Bundle size deep dive
Agent({ subagent_type: "react-native-perf-skills:bundle-analysis-specialist", prompt: "..." })
```

## Callstack References
- `js-profile-react.md` — React profiling mechanics
- `js-lists-flatlist-flashlist.md` — List performance patterns
- `js-animations-reanimated.md` — Animation thread issues
- `js-memory-leaks.md` — Memory leak patterns
- `bundle-barrel-exports.md` — Barrel import analysis
- `native-threading-model.md` — Thread architecture
- `native-view-flattening.md` — View hierarchy optimization
