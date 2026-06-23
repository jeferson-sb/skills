/**
 * diff-harness.ts — differential equivalence harness for pure TS/JS functions.
 *
 * Proves `oldFn ≡ newFn` by running both on a fixed edge-case battery plus seeded
 * random fuzz inputs and deep-comparing outputs. Also asserts that `oldFn` does not
 * mutate its arguments (a purity sanity check). On the first divergence it reports
 * the offending input verbatim.
 *
 * HONEST LIMITS: this is high-coverage fuzzing, NOT a proof. Input generation is
 * best-effort. Float outputs are compared with an epsilon. Functions that cannot be
 * isolated (closures over module state, exotic generics) should be downgraded to
 * advisory-only by the caller, not run through here.
 *
 * Run via a small driver (see SKILL.md):
 *   node --experimental-strip-types driver.ts     // or: tsx driver.ts
 *
 * No external dependencies.
 */

// ----------------------------- Param specs ----------------------------------

export type ParamSpec =
  | { kind: "int"; min?: number; max?: number }
  | { kind: "number"; min?: number; max?: number }
  | { kind: "bool" }
  | { kind: "string"; maxLen?: number; alphabet?: string }
  | { kind: "intArray"; maxLen?: number; min?: number; max?: number }
  | { kind: "numberArray"; maxLen?: number; min?: number; max?: number }
  | { kind: "stringArray"; maxLen?: number; maxItemLen?: number }
  | { kind: "array"; of: ParamSpec; maxLen?: number }
  | { kind: "tuple"; of: ParamSpec[] }
  | { kind: "object"; shape: Record<string, ParamSpec> }
  | { kind: "oneOf"; values: unknown[] }
  | { kind: "nullable"; of: ParamSpec };

export interface DiffOptions {
  params: ParamSpec[];
  iterations?: number; // random cases (default 1000)
  seed?: number; // default 42
  epsilon?: number; // float compare tolerance (default 1e-9)
  verbose?: boolean; // log progress
}

export interface DiffResult {
  ok: boolean;
  checked: number;
  edgeCases: number;
  randomCases: number;
  floatComparedWithEpsilon: boolean;
  failure?: {
    reason: "output-mismatch" | "threw-mismatch" | "old-mutated-args";
    input: unknown[];
    oldOutput?: unknown;
    newOutput?: unknown;
    oldThrew?: string;
    newThrew?: string;
  };
}

// ----------------------------- Seeded RNG -----------------------------------

/** mulberry32 — small, fast, deterministic PRNG. */
function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const randInt = (rng: () => number, min: number, max: number) =>
  Math.floor(rng() * (max - min + 1)) + min;

// ----------------------------- Generators -----------------------------------

const DEFAULT_ALPHABET = "abc ABZ09_-é🙂";

function genOne(spec: ParamSpec, rng: () => number): unknown {
  switch (spec.kind) {
    case "int":
      return randInt(rng, spec.min ?? -1000, spec.max ?? 1000);
    case "number": {
      const min = spec.min ?? -1000;
      const max = spec.max ?? 1000;
      return min + rng() * (max - min);
    }
    case "bool":
      return rng() < 0.5;
    case "string": {
      const alpha = spec.alphabet ?? DEFAULT_ALPHABET;
      const len = randInt(rng, 0, spec.maxLen ?? 16);
      let s = "";
      for (let i = 0; i < len; i++) s += alpha[randInt(rng, 0, alpha.length - 1)];
      return s;
    }
    case "intArray":
    case "numberArray": {
      const len = randInt(rng, 0, spec.maxLen ?? 32);
      const elem: ParamSpec =
        spec.kind === "intArray"
          ? { kind: "int", min: spec.min, max: spec.max }
          : { kind: "number", min: spec.min, max: spec.max };
      return Array.from({ length: len }, () => genOne(elem, rng));
    }
    case "stringArray": {
      const len = randInt(rng, 0, spec.maxLen ?? 16);
      return Array.from({ length: len }, () =>
        genOne({ kind: "string", maxLen: spec.maxItemLen ?? 8 }, rng),
      );
    }
    case "array": {
      const len = randInt(rng, 0, spec.maxLen ?? 16);
      return Array.from({ length: len }, () => genOne(spec.of, rng));
    }
    case "tuple":
      return spec.of.map((s) => genOne(s, rng));
    case "object": {
      const obj: Record<string, unknown> = {};
      for (const [k, s] of Object.entries(spec.shape)) obj[k] = genOne(s, rng);
      return obj;
    }
    case "oneOf":
      return spec.values[randInt(rng, 0, spec.values.length - 1)];
    case "nullable":
      return rng() < 0.15 ? null : genOne(spec.of, rng);
  }
}

/** Edge-case values per spec — empty, singletons, sorted, dup, boundaries, etc. */
function edgeValues(spec: ParamSpec): unknown[] {
  switch (spec.kind) {
    case "int":
    case "number": {
      const min = spec.min ?? -1000;
      const max = spec.max ?? 1000;
      return [0, 1, -1, min, max, spec.kind === "number" ? 0.5 : 0];
    }
    case "bool":
      return [true, false];
    case "string":
      return ["", "a", "aa", "abc", "  ", "é🙂", "Aa0_-"];
    case "intArray":
    case "numberArray":
      return [
        [],
        [0],
        [1, 1, 1], // duplicates
        [1, 2, 3, 4, 5], // sorted asc
        [5, 4, 3, 2, 1], // sorted desc
        [-3, 0, 7, -1, 2], // mixed
        [spec.min ?? -1000, spec.max ?? 1000],
      ];
    case "stringArray":
      return [[], [""], ["a"], ["b", "a", "b"], ["x", "y", "z"]];
    case "array":
      return [[], [genOne(spec.of, makeRng(7))]];
    case "tuple":
      return [spec.of.map((s) => edgeValues(s)[0])];
    case "object": {
      const obj: Record<string, unknown> = {};
      for (const [k, s] of Object.entries(spec.shape)) obj[k] = edgeValues(s)[0];
      return [obj];
    }
    case "oneOf":
      return [...spec.values];
    case "nullable":
      return [null, ...edgeValues(spec.of)];
  }
}

/** Cartesian product of per-param edge values, capped to keep it bounded. */
function edgeCaseInputs(params: ParamSpec[], cap = 256): unknown[][] {
  let combos: unknown[][] = [[]];
  for (const p of params) {
    const vals = edgeValues(p);
    const next: unknown[][] = [];
    for (const c of combos)
      for (const v of vals) {
        next.push([...c, v]);
        if (next.length >= cap) return next;
      }
    combos = next;
  }
  return combos;
}

// --------------------------- Comparison -------------------------------------

let usedEpsilon = false;

function deepEqual(a: unknown, b: unknown, eps: number): boolean {
  if (a === b) return true;
  if (typeof a === "number" && typeof b === "number") {
    if (Number.isNaN(a) && Number.isNaN(b)) return true;
    if (!Number.isInteger(a) || !Number.isInteger(b)) {
      usedEpsilon = true;
      return Math.abs(a - b) <= eps * (1 + Math.max(Math.abs(a), Math.abs(b)));
    }
    return false;
  }
  if (a === null || b === null || typeof a !== "object" || typeof b !== "object")
    return false;
  const aArr = Array.isArray(a);
  const bArr = Array.isArray(b);
  if (aArr !== bArr) return false;
  if (aArr && bArr) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++)
      if (!deepEqual(a[i], b[i], eps)) return false;
    return true;
  }
  const ao = a as Record<string, unknown>;
  const bo = b as Record<string, unknown>;
  const ak = Object.keys(ao);
  const bk = Object.keys(bo);
  if (ak.length !== bk.length) return false;
  for (const k of ak) {
    if (!Object.prototype.hasOwnProperty.call(bo, k)) return false;
    if (!deepEqual(ao[k], bo[k], eps)) return false;
  }
  return true;
}

function clone<T>(v: T): T {
  return v === undefined ? v : (JSON.parse(JSON.stringify(v)) as T);
}

// ----------------------------- Runner ---------------------------------------

type Fn = (...args: any[]) => unknown;

function callCapture(fn: Fn, args: unknown[]): { value?: unknown; threw?: string } {
  try {
    return { value: fn(...args) };
  } catch (e) {
    return { threw: e instanceof Error ? e.name + ": " + e.message : String(e) };
  }
}

/**
 * Run the differential check. Returns ok=false with the first divergent input.
 */
export function runDifferential(
  oldFn: Fn,
  newFn: Fn,
  opts: DiffOptions,
): DiffResult {
  usedEpsilon = false;
  const iterations = opts.iterations ?? 1000;
  const eps = opts.epsilon ?? 1e-9;
  const rng = makeRng(opts.seed ?? 42);

  const edge = edgeCaseInputs(opts.params);
  const inputs: unknown[][] = [...edge];
  for (let i = 0; i < iterations; i++)
    inputs.push(opts.params.map((p) => genOne(p, rng)));

  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];

    // purity sanity check: old must not mutate its args
    const before = clone(input);
    const oldRes = callCapture(oldFn, input);
    if (!deepEqual(input, before, eps)) {
      return {
        ok: false,
        checked: i + 1,
        edgeCases: edge.length,
        randomCases: i + 1 - Math.min(i + 1, edge.length),
        floatComparedWithEpsilon: usedEpsilon,
        failure: { reason: "old-mutated-args", input: before },
      };
    }

    const newRes = callCapture(newFn, clone(input));

    const oldThrew = oldRes.threw !== undefined;
    const newThrew = newRes.threw !== undefined;

    if (oldThrew || newThrew) {
      // both must throw (equivalence of error behavior); we don't compare messages
      if (oldThrew !== newThrew) {
        return fail(i, edge.length, {
          reason: "threw-mismatch",
          input: before,
          oldThrew: oldRes.threw,
          newThrew: newRes.threw,
          oldOutput: oldRes.value,
          newOutput: newRes.value,
        });
      }
      continue; // both threw — treat as equivalent
    }

    if (!deepEqual(oldRes.value, newRes.value, eps)) {
      return fail(i, edge.length, {
        reason: "output-mismatch",
        input: before,
        oldOutput: oldRes.value,
        newOutput: newRes.value,
      });
    }

    if (opts.verbose && (i + 1) % 500 === 0)
      console.error(`  …${i + 1}/${inputs.length} checked`);
  }

  const result: DiffResult = {
    ok: true,
    checked: inputs.length,
    edgeCases: edge.length,
    randomCases: inputs.length - edge.length,
    floatComparedWithEpsilon: usedEpsilon,
  };
  console.error(
    `✓ equivalent on ${result.checked} inputs ` +
      `(${result.edgeCases} edge + ${result.randomCases} random)` +
      (usedEpsilon ? ` [floats compared with epsilon ${eps}]` : ""),
  );
  return result;

  function fail(i: number, edges: number, f: NonNullable<DiffResult["failure"]>): DiffResult {
    console.error("✗ DIVERGENCE FOUND");
    console.error("  reason:", f.reason);
    console.error("  input: ", JSON.stringify(f.input));
    if (f.reason === "output-mismatch") {
      console.error("  old → ", JSON.stringify(f.oldOutput));
      console.error("  new → ", JSON.stringify(f.newOutput));
    } else if (f.reason === "threw-mismatch") {
      console.error("  old threw:", f.oldThrew ?? "(no)");
      console.error("  new threw:", f.newThrew ?? "(no)");
    }
    return {
      ok: false,
      checked: i + 1,
      edgeCases: edges,
      randomCases: Math.max(0, i + 1 - edges),
      floatComparedWithEpsilon: usedEpsilon,
      failure: f,
    };
  }
}
