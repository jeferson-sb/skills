# Heuristics — suspect-pattern catalog (Pass A)

Cheap, pattern-based triage. These flag **suspects only** — Pass B reasoning
confirms or kills each one. A pattern matching is not by itself a finding.

Each entry: the smell, what to grep/look for, the likely fix (strategy id from
`strategies.md`), and common false positives to remember during Pass B.

---

## 1. Nested loop over same/related data
- **Smell:** O(n²) (or worse) — a loop whose body loops again over the same or a
  related collection, comparing/matching elements.
- **Look for:** `for`/`while`/`.forEach`/`.map` whose body contains another loop or
  a `.find`/`.filter`/`.some`/`.includes` over a second array.
- **Fix:** `hash-map-lookup` (build a `Map`/`Set` of one side, single pass the other).
- **False positives:** tiny fixed bounds; the two loops iterate unrelated small sets;
  the inner work is genuinely needed for every pair (true O(n²) problem).

## 2. Linear membership inside a loop
- **Smell:** O(n²) membership testing.
- **Look for:** `.includes(`, `.indexOf(`, `.find(`, `.some(` on an array, inside a
  loop body.
- **Fix:** `hash-map-lookup` — pre-build a `Set`/`Map`, test with O(1) `.has()`/`.get()`.
- **False positives:** array is tiny and constant; membership target changes each
  iteration in a way that defeats precomputation.

## 3. Sort inside a loop / repeated re-sort
- **Smell:** O(n² log n) — sorting the same (or barely changed) data repeatedly.
- **Look for:** `.sort(` inside a loop, or multiple `.sort(` of the same array.
- **Fix:** `sort-once` — sort once outside the loop; maintain order incrementally if
  the data changes (consider a heap — `heap`).
- **False positives:** the data genuinely changes between sorts and must be re-sorted.

## 4. Array used as a set/dictionary
- **Smell:** wrong data structure — linear scans for lookup/dedup/grouping.
- **Look for:** dedup via `.indexOf`/`.includes` + push; grouping via `.find` then
  mutate; "does this key exist" via array scan.
- **Fix:** `hash-map-lookup` (`Set` for membership/dedup, `Map` for keyed lookup/grouping).
- **False positives:** order-sensitive logic where a plain object/Map would lose
  needed semantics (rare — `Map` preserves insertion order).

## 5. Recursion with overlapping subproblems, no memo
- **Smell:** exponential blowup (e.g. naive Fibonacci, naive grid/path counting).
- **Look for:** a function calling itself ≥2× on overlapping inputs, no cache.
- **Fix:** `memoization-dp` (top-down memo or bottom-up tabulation).
- **False positives:** subproblems don't overlap (e.g. true divide-and-conquer like
  merge sort); inputs are tiny and bounded.

## 6. Repeated linear scan for min/max or top-k
- **Smell:** O(n·k) — repeatedly scanning to pull the smallest/largest, k times.
- **Look for:** loop that each iteration does `Math.min`/`Math.max` over the whole
  collection, or finds-and-removes the extreme element k times.
- **Fix:** `heap` (priority queue) → O(n log k); or `sort-once` if k ≈ n.
- **False positives:** single min/max scan (already O(n), fine); k is 1 or 2.

## 7. Linear search over sorted data
- **Smell:** O(n) where O(log n) is available.
- **Look for:** `.find`/`.indexOf`/linear `for` searching an array that is known
  sorted (sorted nearby, named `sorted*`, or produced by `.sort()`).
- **Fix:** `binary-search`.
- **False positives:** data not actually sorted; n small; you need all matches, not one.

## 8. Repeated string/array concat in a loop
- **Smell:** O(n²) from repeated `+=` string building or `[...acc, x]` per iteration.
- **Look for:** `str += ` inside a loop; `acc = [...acc, x]` / `acc.concat(x)` in a
  reduce/loop.
- **Fix:** `accumulate-join` — push to an array and `join`, or mutate a single accumulator.
- **False positives:** very short loops; engines optimize some `+=` cases, but the
  array-spread-per-iteration case is reliably bad.

## 9. Loop-invariant recompute
- **Smell:** wasted work — recomputing inside a loop something that doesn't depend on
  the loop variable.
- **Look for:** `.length` of a recomputed expression, repeated property derivation,
  rebuilding the same lookup each iteration.
- **Fix:** `hoist-invariant` — compute once before the loop.
- **False positives:** the value actually changes each iteration.

---

## Cross-cutting Pass B reminders

- **Confirm purity first.** Impure ⇒ advisory-only, regardless of pattern.
- **Confirm the input size matters.** No win is worth complexity if n is small and
  the path is cold.
- **Confirm the data structure semantics survive** (ordering, duplicates, key types).
- **Prefer the smallest change that gets the complexity win** and stays readable.
