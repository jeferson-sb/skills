# algorithmic-optimised-skills

A set of [Claude Code](https://claude.com/claude-code) skills for finding and
**safely** applying algorithmic optimizations to your own code — replacing
suboptimal time/space complexity (nested loops, wrong data structures, un-memoized
recursion) with better algorithms and data structures, **without ever changing
behavior** and **never without your approval**.

> TS/JS-first. The heuristics, strategy playbook, and workflow are designed to be
> language-agnostic, with a clear extension point for adding more language runners.

## Skills

### `optimize-algorithms`

Finds suboptimal **custom, pure functions** and rewrites their algorithms/data
structures — proving each change behavior-preserving before keeping it.

| Concern | How it's handled |
|---|---|
| **Find opportunities** | Heuristic triage (cheap pattern catalog) → LLM complexity reasoning that kills false positives. |
| **Two entry modes** | *Scan* a repo/dir → ranked report; or *targeted* deep-dive on a named function/flow. |
| **Never silent** | A read-only `algorithm-auditor` subagent diagnoses; only the skill applies, and only after you **batch-approve**. The gate is structural. |
| **Pure only** | Purity is a precondition for auto-applying. Impure functions (I/O, mutation, randomness, time) are surfaced as *advisory-only*. |
| **Behavior preserved** | Every applied rewrite must pass a **differential equivalence harness** (seeded fuzz + edge-case battery) **and** the existing tests. Failures revert in isolation. |
| **Honest** | Final summary separates *applied* / *advisory-only* / *failed-and-reverted*, and never implies the harness is a proof. |

```
optimize-algorithms/
├── SKILL.md                  # workflow orchestration (the brain)
├── agents/
│   └── algorithm-auditor.md  # read-only scanner: triage + reason + rank
├── references/
│   ├── heuristics.md         # suspect-pattern catalog (Pass A)
│   ├── strategies.md         # algorithm/data-structure playbook
│   └── report-format.md      # ranked-report + final-summary schema
└── scripts/
    └── diff-harness.ts       # TS/JS differential equivalence runner
```

Covered strategies: hash-map/Set lookup, sort-once + two-pointer, binary search,
heap (priority queue), memoization/tabulation (DP), prefix-sum / sliding-window,
graph BFS/DFS, stack/queue, accumulate-join, counting sort, invariant hoisting.

## Usage

In Claude Code, just describe the task — the skill triggers on intent:

```
optimize this function   →  targeted mode
audit src/ for slow algorithms  →  scan mode
```

It will diagnose, present a ranked report, ask which findings to apply, then for
each approved function: rewrite → prove equivalence → run tests → keep or revert.

## Requirements

- **Claude Code** (skills + subagents).
- **Node ≥ 22** for the differential harness (`node --experimental-strip-types`),
  or [`tsx`](https://github.com/privatenumber/tsx) as a fallback. The harness has
  **no external dependencies**.

## How the safety net works

`scripts/diff-harness.ts` runs the original (`oldFn`) and proposed (`newFn`)
implementations on a fixed edge-case battery (empty, singletons, duplicates,
sorted/reverse-sorted, boundaries, unicode strings, …) plus seeded random fuzz
inputs, deep-compares the outputs, and asserts the original didn't mutate its
arguments. On the first divergence it prints the offending input verbatim.

```bash
# the skill generates a tiny driver that imports both functions, then:
node --experimental-strip-types driver.ts   # or: tsx driver.ts
```

**Honest limits:** this is high-coverage fuzzing, not formal verification. Float
outputs are compared with an epsilon (flagged when used). Functions that can't be
isolated (closures over module state, exotic generics) downgrade to *advisory-only*
rather than being guessed at.

## Status

The skill and harness are implemented and smoke-tested. Three implementation
details are intentionally left open and documented in
[the design spec](docs/superpowers/specs/2026-06-23-optimize-algorithms-skill-design.md):
TS-type → input-generator coverage, Impact/hot-path estimation without profiling,
and AST-vs-regex mechanics for the heuristic pass.

## Extending to other languages

Add: (1) a heuristic pattern set, (2) a runner that isolates a function and
executes old-vs-new, (3) a type-aware input generator. Only TS/JS ships today.

## License

MIT — see [`LICENSE`](LICENSE).
