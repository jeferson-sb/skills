---
name: perf-control
description: "DMAIC Phase 5 — Prevent regressions. Sets up callstack/reassure for render/interaction benchmarks, configures Flashlight for CI, adds bundle size thresholds, and documents the performance baseline. Use after /perf-improve to lock in gains."
effort: medium
argument-hint: "[what to monitor: fps|bundle|tti|renders|all]"
tools: Read, Glob, Grep, Bash, Edit
---

# Control — DMAIC Phase 5

Lock in performance gains by setting up automated regression detection. Performance degrades gradually through small changes — monitoring prevents death by a thousand cuts.

## Usage

```
/perf-control all         # Full regression setup
/perf-control fps         # Flashlight CI integration
/perf-control bundle      # Bundle size threshold
/perf-control renders     # Reassure render count tests
/perf-control tti         # Startup time monitoring
```

## Control Mechanisms (by metric)

### Render Regressions → callstack/reassure

**Setup**: See `${CLAUDE_SKILL_DIR}/references/reassure-setup.md`

Reassure measures render counts and durations, comparing against committed baselines. Catches re-render regressions in PRs.

```bash
npm install --save-dev reassure
```

**What it catches**: Component that used to render 2x now renders 15x after someone added Context dependency.

### FPS Regressions → Flashlight CI

**Setup**: Run Flashlight in CI on a cloud device (Firebase Test Lab, AWS Device Farm).

```bash
# In CI pipeline
flashlight measure \
  --bundleId com.yourapp \
  --testCommand "maestro test scroll-test.yaml" \
  --duration 20 \
  --iterationCount 3 \
  --output current-results.json

# Compare against baseline
flashlight compare \
  --baseline perf-baselines/scroll-baseline.json \
  --current current-results.json \
  --threshold 10
```

**What it catches**: FPS dropped from 55 to 42 after adding a new feature to the feed.

### Bundle Size → Threshold Guards

**Setup**: See `${CLAUDE_SKILL_DIR}/references/ci-regression-guard.md`

Options:
- `bundlesize` npm package with `.bundlesizerc` config
- Custom CI step comparing bundle output
- Expo Atlas diff (for Expo projects)

```json
// .bundlesizerc
{
  "files": [
    {
      "path": "android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle",
      "maxSize": "3 MB",
      "compression": "none"
    }
  ]
}
```

**What it catches**: Someone adds a full lodash import, bundle grows 70KB.

### TTI → Performance Markers in Analytics

**Setup**: Send react-native-performance markers to analytics (Datadog, New Relic, Firebase Performance).

```typescript
import performance from 'react-native-performance';

performance.measure('cold_start', 'app_launch', 'tti');
const measurement = performance.getEntriesByName('cold_start')[0];

analytics.track('performance.cold_start', {
  duration_ms: measurement.duration,
  device_tier: getDeviceTier(),
  platform: Platform.OS,
});
```

**What it catches**: P75 TTI crept from 2.1s to 3.4s over 3 releases.

## Workflow

### Step 1: Determine What to Monitor

Based on what was fixed in `/perf-improve`:
- Fixed re-renders → set up reassure
- Fixed FPS → set up Flashlight CI
- Fixed bundle → set up size threshold
- Fixed TTI → set up performance marker monitoring

### Step 2: Choose Monitoring Level

| Level | Setup Time | What It Covers | CI Cost |
|-------|-----------|----------------|---------|
| **Basic** | 30 min | Bundle size threshold only | Free (no device needed) |
| **Standard** | 2-3 hours | Bundle + reassure render tests | Free (runs on CI machine) |
| **Advanced** | 1 day | Bundle + reassure + Flashlight on real device | Cloud device cost |

### Step 3: Implement

Spawn the regression testing specialist for implementation:
```
Agent({ subagent_type: "react-native-perf-skills:regression-testing-specialist", prompt: "..." })
```

Or follow the reference guides manually.

### Step 4: Commit Baselines

Whatever monitoring you set up, commit the baselines to the repo:
- `perf-baselines/scroll-baseline.json` (Flashlight)
- `perf-baselines/reassure-baseline.perf` (Reassure)
- `.bundlesizerc` (Bundle thresholds)

### Step 5: Document Control Configuration

```markdown
# Performance Control — [Problem Slug]

## Baselines Committed
- [x] Flashlight scroll baseline: score 74, avg 52 FPS
- [x] Reassure: FeedItem renders 2x per scroll, 3ms avg
- [x] Bundle threshold: 2.8MB max

## CI Integration
- [x] Flashlight runs on every PR to `main`
- [x] Reassure comparison on every PR
- [x] Bundle size check on every PR

## Alert Thresholds
| Metric | Warn | Block PR |
|--------|------|----------|
| Flashlight score | < 65 | < 55 |
| FPS average | < 48 | < 40 |
| Render count increase | > 50% | > 200% |
| Bundle size | > 3MB | > 3.5MB |

## Re-measurement Schedule
- Monthly: full Flashlight re-baseline
- Per release: TTI check on low-end device
- Quarterly: full DMAIC cycle review
```

Save to `.perf/[slug]/control-baseline.md`

## After Control Setup

- "Regression monitoring is in place. The DMAIC cycle is complete."
- "Schedule monthly re-measurement (`/perf-measure`) to catch gradual degradation."
- "When CI catches a regression: run `/perf-analyze` on the failing PR to identify what changed."

## DMAIC Cycle Complete

```
Define → Measure → Analyze → Improve → Control ✓
                                            │
                                            └── Re-measure monthly ──→ (back to Measure if drift detected)
```

## Callstack References
- `js-measure-fps.md` — FPS monitoring approaches (for CI setup)
- `native-measure-tti.md` — TTI marker placement (for analytics setup)
