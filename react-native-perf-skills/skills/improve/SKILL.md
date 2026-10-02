---
name: perf-improve
description: "DMAIC Phase 4 — Apply targeted fixes. Takes a root cause from /perf-analyze and presents an ordered improvement checklist. Prioritizes battle-tested library substitutions over custom code, then code-level fixes, then architecture changes."
effort: medium
argument-hint: "[category: renders|animations|bundle|tti|memory|native]"
tools: Read, Glob, Grep, Bash, Edit
---

# Improve — DMAIC Phase 4

Apply targeted fixes based on the root cause identified in `/perf-analyze`. Follow the checklist for the specific category. Always re-measure after each significant fix.

## Usage

```
/perf-improve renders       # Re-render optimization checklist
/perf-improve animations    # Animation performance fixes
/perf-improve bundle        # Bundle size reduction
/perf-improve tti           # Startup time optimization
/perf-improve memory        # Memory leak fixes
/perf-improve native        # Native layer optimization
```

## Improvement Principles

1. **Battle-tested library first** — Before writing custom code, check `${CLAUDE_SKILL_DIR}/references/battle-tested-libraries.md` for the canonical solution.
2. **One fix at a time** — Apply one change, re-measure, confirm improvement, then next.
3. **Lowest effort, highest impact** — Sort fixes by ROI (impact ÷ effort).
4. **Never ship without re-measuring** — "I think it's faster" is not evidence.
5. **Know when to go native** — If JS fixes are applied and issue persists, escalate to native solutions.

## Workflow

### Step 1: Load Root Cause

Read from `.perf/[slug]/root-cause.md` or accept category argument.

### Step 2: Check Battle-Tested Library

Before any custom fix, consult `${CLAUDE_SKILL_DIR}/references/battle-tested-libraries.md`:
- Does a Tier S/A library solve this problem?
- Is the project already using it? (check package.json)
- If not, is migration feasible given project constraints?

### Step 3: Apply Checklist

Load the appropriate checklist from `${CLAUDE_SKILL_DIR}/references/improve-checklist.md` for the root cause category.

### Step 4: Implement Fixes

For each checklist item (in order):
1. Read the affected file(s)
2. Apply the fix
3. Verify it doesn't break existing behavior
4. Note: "Applied fix N: [description]"

### Step 5: Re-measure

After applying fixes:
- Run the same measurement from `/perf-measure`
- Compare baseline vs. post-fix metrics
- Document delta in `.perf/[slug]/improvements.md`

### Step 6: Evaluate Native Escalation

If after applying all JS-level fixes the metric is still "Needs Work":
- Check if a Turbo Module could offload the work
- Check if view flattening / native view optimization applies
- Consider `react-native-screens` for navigation performance
- Reference `native-turbo-modules.md` and `native-threading-model.md`

## Output

```markdown
# Improvements Applied — [Problem Slug]

## Fixes Applied (in order)
1. [Fix description] — Expected impact: [X]
2. [Fix description] — Expected impact: [X]

## Re-measurement
| Metric | Baseline | After Fix | Delta | Target |
|--------|----------|-----------|-------|--------|
| FPS | 28 | 52 | +24 | 55+ |

## Status
- [x] Target met / [ ] Further optimization needed

## Next Step
- /perf-control to lock in gains
- OR: further fixes needed for [remaining gap]
```

Save to `.perf/[slug]/improvements.md`

## After Improvement

- If target met: "Run `/perf-control` to set up regression prevention."
- If target not met: "Re-run `/perf-analyze` with updated metrics — the bottleneck may have shifted."
- Remind: "Performance optimization is iterative. The bottleneck after fixing re-renders may be native layout. Re-measure to find the new ceiling."

## Callstack References
- `js-lists-flatlist-flashlist.md` — FlashList migration steps
- `js-animations-reanimated.md` — Reanimated migration
- `js-react-compiler.md` — Auto-memoization setup
- `js-atomic-state.md` — State management migration
- `js-concurrent-react.md` — useDeferredValue/useTransition
- `bundle-barrel-exports.md` — Fixing barrel imports
- `bundle-tree-shaking.md` — Enabling tree shaking
- `native-turbo-modules.md` — Building TurboModules
- `native-view-flattening.md` — Reducing view hierarchy
