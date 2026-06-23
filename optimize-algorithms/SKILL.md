---
name: optimize-algorithms
description: Find and safely apply algorithmic optimizations to custom, pure functions — replacing suboptimal time/space complexity (nested loops, wrong data structures, un-memoized recursion) with better algorithms and data structures. Use when the user asks to "optimize", "speed up", "improve complexity of", or "audit performance of" their own functions, or to scan a codebase/directory for algorithmic improvements. TS/JS-first; behavior is proven preserved by a differential equivalence harness before any change is kept.
---

# Optimize Algorithms

Find suboptimal **custom, pure functions** and replace their algorithms/data
structures with better ones — **without ever changing behavior**, and **never
without your approval first**.

This skill does NOT touch library/framework code. It targets hand-written "custom
pure" functions where the operation count or data-structure choice is wrong
(nested loops that could be a hash join, linear membership that could be a `Set`,
un-memoized overlapping recursion, repeated sorts, linear search over sorted data,
repeated min/max that wants a heap, etc.).

## Iron rules

1. **The auditor never writes.** Diagnosis is read-only. Only this skill's main
   loop applies changes, and only after approval. The approval gate is structural.
2. **Purity is a precondition for auto-applying.** Functions with side effects
   (I/O, shared-state mutation, randomness, time) are surfaced as *advisory-only* —
   recommended, never auto-rewritten.
3. **No change is kept unless proven equivalent.** Every applied rewrite passes the
   differential harness (`scripts/diff-harness.ts`) AND the existing test suite. A
   failure reverts *that* function and continues — never leave a half-broken change.
4. **Be honest.** State input counts and coverage; never imply the harness is a
   proof. Report applied / advisory-only / failed-and-reverted separately at the end.
5. **Don't bother when it doesn't matter.** Small n, cold paths, or readability cost
   greater than the gain → say so and skip. Optimizations are means, not trophies.

## Reference files (read before acting)

- `references/heuristics.md` — the suspect-pattern catalog (Pass A triage).
- `references/strategies.md` — the algorithm/data-structure playbook, with
  before/after sketches and "don't bother when" notes.
- `references/report-format.md` — the exact ranked-report schema.

## Modes

Decide the mode from the request:

- **Scan mode** — "audit this repo / this directory / these files." Dispatch the
  `algorithm-auditor` subagent over the target, get the ranked report, present it,
  let the user batch-approve. Then run the apply loop per approved function.
- **Targeted mode** — "optimize this function / this flow." Skip the broad scan.
  Deep-dive the named target directly, then run the apply loop on it.

## Workflow

### 1. Diagnose

**Scan mode:** dispatch the `algorithm-auditor` agent (read-only) at the target.
It runs Pass A (heuristic triage from `heuristics.md`) then Pass B (LLM reasoning
to confirm real complexity, infer intent, and kill false positives), and returns
findings in the `report-format.md` schema.

**Targeted mode:** do the same two-pass analysis yourself on the named function(s).

### 2. Present the ranked report

Show findings ranked by **Impact × Confidence**, pure functions above advisory-only.
Each finding states: location, purity, current vs proposed complexity, strategy,
impact/confidence/effort, and risk notes. Ask the user to **batch-approve** which
findings to apply. Advisory-only (impure / non-isolatable) findings are presented
but excluded from auto-apply.

### 3. Apply loop (per approved function, independently)

For each approved function:

1. **Purity check.** If impure, mark advisory-only and skip (should already be
   filtered, but re-verify before touching code).
2. **Preserve the original** as `oldFn` (copy the exact current implementation).
3. **Rewrite** to `newFn` using the chosen strategy. Show the diff + a one-paragraph
   equivalence rationale.
4. **Prove equivalence.** Run the differential harness (see below). If outputs
   diverge, **revert** this function, record the first divergent input, continue to
   the next function.
5. **Run existing tests.** If they fail, **revert** this function, record the
   failure, continue.
6. **Keep** the change. Record the equivalence evidence (input count, tests passed).

One function's failure never aborts the batch and never leaves a partial edit.

### 4. Final summary

Report three buckets honestly:
- **Applied** — with equivalence evidence (input count, tests passed).
- **Advisory-only** — impure or non-isolatable; recommendation given, not applied.
- **Failed / reverted** — with the failing input or failing test.

## Running the differential harness

`scripts/diff-harness.ts` proves `oldFn ≡ newFn` for a pure TS/JS function via a
fixed edge-case battery plus seeded random fuzzing, comparing deep-equal outputs
and asserting `oldFn` did not mutate its arguments.

Generate a small driver that imports both implementations and calls
`runDifferential`, then run it with node's native TS support (or `tsx`):

```ts
// /tmp/oa-driver.ts
import { runDifferential } from "<skill>/scripts/diff-harness.ts";
import { oldFn } from "./old.ts";   // original, preserved
import { newFn } from "./new.ts";   // proposed

const result = runDifferential(oldFn, newFn, {
  params: [{ kind: "intArray", maxLen: 200 }, { kind: "int", min: 0, max: 200 }],
  iterations: 2000,
  seed: 42,
});
process.exit(result.ok ? 0 : 1);
```

```bash
node --experimental-strip-types /tmp/oa-driver.ts   # or: tsx /tmp/oa-driver.ts
```

On failure the harness prints the **first divergent input** verbatim. See the
header of `scripts/diff-harness.ts` for the full `ParamSpec` kinds and options.

**Honest limits:** input generation is best-effort high-coverage fuzzing, not a
proof. Float comparisons use an epsilon (flagged when used). Functions that can't
be isolated (closures over module state, generics the generator can't synthesize)
→ the finding **downgrades to advisory-only** rather than guessing.

## Extending to other languages

The heuristics, playbook, report format, and workflow are language-neutral. A new
language needs: (1) a heuristic pattern set, (2) a runner that isolates a function
and executes old-vs-new, (3) a type-aware input generator. Only TS/JS ships now.
