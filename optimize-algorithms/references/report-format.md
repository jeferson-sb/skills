# Report format

The auditor (scan mode) and the skill (targeted mode) present findings using this
exact schema. Rank by **Impact × Confidence**; list pure (auto-applicable) findings
above advisory-only (impure / non-isolatable) ones.

## Per-finding block

```
#<rank> · <file>:<line> · <functionName>
  Pure:       yes | no            (no ⇒ advisory-only)
  Current:    O(<time>) time / O(<space>) space  — <one-line why>
  Proposed:   <approach> → O(<time>) time / O(<space>) space
  Strategy:   <strategy-id from strategies.md>
  Impact:     High | Medium | Low
  Confidence: High | Medium | Low
  Effort:     Low | Medium | High
  Risk/notes: <tradeoffs, e.g. trades memory for speed; assumes n large; float epsilon>
```

### Field meanings

- **Pure** — determined in Pass B. `no` forces advisory-only (recommended, not
  auto-applied).
- **Current / Proposed** — the confirmed complexity, not the pattern's nominal one.
  The one-line "why" cites the actual cost driver (e.g. "`.includes` in the loop").
- **Strategy** — the id from `strategies.md` (e.g. `hash-map-lookup`).
- **Impact** — expected real-world win, accounting for input size and how hot the
  path is. A big-O win on tiny/cold data is Low impact.
- **Confidence** — how sure the rewrite is correct *and* worth it. Drives ranking
  and whether to even propose.
- **Effort** — size/risk of the change.
- **Risk/notes** — anything the user must weigh: memory tradeoffs, size assumptions,
  float-epsilon comparisons, semantics that must be preserved.

## Summary header (top of report)

```
Optimization audit — <target>
Scanned: <N files>   Suspects (Pass A): <M>   Findings (Pass B): <K>
Auto-applicable (pure): <P>   Advisory-only: <A>
```

## Final run summary (after the apply loop)

Three buckets, honest:

```
APPLIED (<count>)
  - <file>:<line> <fn> — <strategy>, O(old)→O(new); verified on <N> inputs, tests passed

ADVISORY-ONLY (<count>)
  - <file>:<line> <fn> — <reason: impure | non-isolatable>; recommended: <strategy>

FAILED / REVERTED (<count>)
  - <file>:<line> <fn> — <equivalence diverged on input <x> | test <name> failed>; reverted
```

## When there are no findings

Say so plainly:

```
Optimization audit — <target>
No worthwhile algorithmic changes found. <one-line reason, e.g. inputs are small /
data structures already appropriate>.
```
A clean "nothing to do" is a valid, good result. Do not invent findings.
