# Strategy playbook

The decision aid for Pass B. For each strategy: **strategy id**, when it applies,
the smell it replaces, the complexity win, a TS before/after sketch, and a
**don't bother when** note. Pick the smallest change that wins the complexity and
stays readable.

---

## `hash-map-lookup` — Set / Map lookup
**Replaces:** linear scans, nested membership, array-as-set/dict.
**Win:** O(n²) → O(n) (or O(n) lookup → O(1)).

```ts
// before — O(n·m): linear membership in a loop
function common(a: number[], b: number[]) {
  return a.filter((x) => b.includes(x));            // b.includes is O(m)
}
// after — O(n+m)
function common(a: number[], b: number[]) {
  const set = new Set(b);                            // O(m)
  return a.filter((x) => set.has(x));                // O(1) each
}
```
**Don't bother when:** both arrays are tiny and constant, or the lookup target
can't be precomputed because it changes every iteration.

---

## `sort-once` — sort once, then two-pointer / scan
**Replaces:** repeated re-sorts, or nested loops solvable on ordered data.
**Win:** O(n²)→O(n log n); removes per-iteration sorts.

```ts
// before — sort inside the loop
for (const q of queries) {
  const sorted = [...items].sort(cmp);              // O(n log n) every query
  ...
}
// after — sort once
const sorted = [...items].sort(cmp);                // once
for (const q of queries) { ... }
```
**Don't bother when:** the data genuinely changes between iterations and must be
re-sorted (consider `heap` instead).

---

## `binary-search`
**Replaces:** linear search over sorted data.
**Win:** O(n) → O(log n) per query.

```ts
function search(sorted: number[], target: number): number {
  let lo = 0, hi = sorted.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >>> 1;
    if (sorted[mid] === target) return mid;
    if (sorted[mid] < target) lo = mid + 1; else hi = mid - 1;
  }
  return -1;
}
```
**Don't bother when:** data isn't actually sorted, n is small, or you need all
matches rather than one (sort + scan a range may be clearer).

---

## `heap` — priority queue
**Replaces:** repeated linear min/max, top-k, k-way merge, Dijkstra-style frontiers.
**Win:** O(n·k) → O(n log k).

```ts
// top-k smallest without sorting everything: keep a max-heap of size k.
// (Use a small binary-heap helper; push n items, pop when size > k → O(n log k).)
```
**Don't bother when:** you need only a single min/max (one O(n) scan), or k ≈ n
(just `sort-once`).

---

## `memoization-dp` — memoization / tabulation
**Replaces:** recursion with overlapping subproblems.
**Win:** exponential → polynomial.

```ts
// before — O(2^n)
function fib(n: number): number {
  return n < 2 ? n : fib(n - 1) + fib(n - 2);
}
// after — O(n) time, O(1) space (tabulation)
function fib(n: number): number {
  let a = 0, b = 1;
  for (let i = 0; i < n; i++) [a, b] = [b, a + b];
  return a;
}
```
**Don't bother when:** subproblems don't overlap (true divide-and-conquer), or n is
tiny and bounded.

---

## `prefix-sum` / `sliding-window`
**Replaces:** repeated recomputation of range sums / subarray aggregates.
**Win:** O(n²) → O(n).

```ts
// range-sum queries: precompute prefix once, answer each query in O(1)
const prefix = [0];
for (const x of arr) prefix.push(prefix[prefix.length - 1] + x);
const rangeSum = (i: number, j: number) => prefix[j + 1] - prefix[i];
```
**Don't bother when:** there's a single range query, or the window logic obscures
otherwise-clear code for no real-size benefit.

---

## `graph-traversal` — BFS / DFS with an adjacency structure
**Replaces:** ad-hoc reachability/level/order logic, repeated re-scans of edges.
**Win:** clarity + O(V+E); BFS gives shortest unweighted paths, DFS gives
topo/cycle detection.

```ts
const adj = new Map<N, N[]>();                       // build once: O(E)
function bfs(start: N) {
  const seen = new Set([start]); const q = [start];
  while (q.length) {
    const u = q.shift()!;                            // (use a head index for big graphs)
    for (const v of adj.get(u) ?? []) if (!seen.has(v)) { seen.add(v); q.push(v); }
  }
}
```
**Don't bother when:** the structure isn't really a graph, or a direct formula exists.

---

## `stack` / `queue`
**Replaces:** manual index juggling; deep recursion at risk of stack overflow;
nearest-smaller/greater and matching-bracket style scans.
**Win:** clarity; O(n) monotonic-stack solutions; iterative avoids overflow.

```ts
// next-greater-element with a monotonic stack — O(n)
function nextGreater(a: number[]) {
  const res = Array(a.length).fill(-1); const st: number[] = [];
  for (let i = 0; i < a.length; i++) {
    while (st.length && a[st[st.length - 1]] < a[i]) res[st.pop()!] = a[i];
    st.push(i);
  }
  return res;
}
```
**Don't bother when:** recursion is shallow and clearer, or there's no LIFO/FIFO
structure to exploit.

---

## `accumulate-join`
**Replaces:** O(n²) string `+=` or `[...acc, x]` per iteration.
**Win:** O(n²) → O(n).

```ts
// before: acc = [...acc, x] each step is O(n) ⇒ O(n²)
// after:
const out: T[] = [];
for (const x of xs) out.push(f(x));                  // O(1) amortized each
// strings: const parts: string[] = []; ... parts.join("")
```
**Don't bother when:** the loop is very short.

---

## `counting-sort` / bucketing
**Replaces:** comparison sort when keys are small bounded integers/categories.
**Win:** O(n log n) → O(n).
**Don't bother when:** key range is large or unbounded, or values aren't integer-like.

---

## `hoist-invariant`
**Replaces:** recomputing loop-invariant work each iteration.
**Win:** removes a constant/linear factor of wasted work.
```ts
const n = items.length;                              // hoist, don't recompute
for (let i = 0; i < n; i++) { ... }
```
**Don't bother when:** the value genuinely changes each iteration.

---

## Universal "don't bother" checklist
Before recommending ANY strategy, confirm:
- The function is **pure** (else advisory-only).
- The input size is **large enough** for the asymptotic win to matter.
- The path is **hot enough** to care.
- The new structure **preserves semantics** (order, duplicates, key types, float
  precision).
- Readability cost ≤ the gain.
