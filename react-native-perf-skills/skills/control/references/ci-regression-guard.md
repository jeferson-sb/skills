---
title: CI Regression Guard Setup
impact: HIGH
tags: ci, regression, github-actions, flashlight, bundlesize, monitoring
---

# CI Regression Guard Setup

Three levels of CI-based performance regression protection.

## Level 1: Bundle Size Guard (Free, 5 min setup)

Catches: Large dependency additions, barrel import regressions, dead code accumulation.

### Option A: bundlesize npm package

```bash
npm install --save-dev bundlesize
```

`.bundlesizerc.json`:
```json
{
  "files": [
    {
      "path": "./android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle",
      "maxSize": "3 MB",
      "compression": "none"
    },
    {
      "path": "./ios/build/Build/Products/Release-iphonesimulator/*.app/main.jsbundle",
      "maxSize": "3 MB",
      "compression": "none"
    }
  ]
}
```

GitHub Actions step:
```yaml
- name: Check bundle size
  run: |
    npx react-native bundle \
      --platform android \
      --dev false \
      --entry-file index.js \
      --bundle-output /tmp/bundle.js
    
    SIZE=$(wc -c < /tmp/bundle.js)
    MAX=3145728  # 3MB
    if [ "$SIZE" -gt "$MAX" ]; then
      echo "::error::Bundle size ${SIZE} exceeds threshold ${MAX}"
      exit 1
    fi
    echo "Bundle size: ${SIZE} bytes (limit: ${MAX})"
```

### Option B: Custom threshold with size tracking

```yaml
# .github/workflows/bundle-size.yml
name: Bundle Size Check

on: [pull_request]

jobs:
  bundle-size:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      
      - name: Build bundle
        run: |
          npx react-native bundle \
            --platform android --dev false \
            --entry-file index.js \
            --bundle-output /tmp/bundle.js \
            --sourcemap-output /tmp/bundle.js.map

      - name: Analyze size
        run: |
          BUNDLE_SIZE=$(wc -c < /tmp/bundle.js)
          echo "BUNDLE_SIZE=$BUNDLE_SIZE" >> $GITHUB_ENV
          
          # Source map explorer for detailed breakdown
          npx source-map-explorer /tmp/bundle.js.map --json > /tmp/analysis.json
          
          # Extract top 5 largest modules
          cat /tmp/analysis.json | jq -r '.results[0].files | to_entries | sort_by(-.value.size) | .[0:5] | .[] | "\(.key): \(.value.size) bytes"'

      - name: Comment PR with size
        uses: actions/github-script@v7
        with:
          script: |
            const size = process.env.BUNDLE_SIZE;
            const sizeMB = (parseInt(size) / 1048576).toFixed(2);
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `**Bundle Size**: ${sizeMB} MB (${size} bytes)\nThreshold: 3.0 MB`
            });
```

---

## Level 2: Render Regression Tests (Free, 2-3h setup)

Catches: Re-render count regressions, render duration increases, Context cascade introductions.

See `reassure-setup.md` for full guide. Summary:

```yaml
# Add to existing CI
- name: Performance regression check
  run: |
    git checkout ${{ github.event.pull_request.base.sha }}
    npx reassure --baseline
    git checkout ${{ github.event.pull_request.head.sha }}
    npx reassure
    npx reassure compare --fail-on-regression
```

---

## Level 3: Device Benchmarks (Advanced, 1 day setup)

Catches: FPS regressions, TTI regressions, real-device performance differences.

### Flashlight on Firebase Test Lab

```yaml
# .github/workflows/perf-device.yml
name: Device Performance Test

on:
  pull_request:
    branches: [main]
    paths:
      - 'src/**'
      - 'package.json'

jobs:
  flashlight:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      
      - name: Build release APK
        run: |
          cd android
          ./gradlew assembleRelease
      
      - name: Upload to Firebase Test Lab
        uses: google-github-actions/firebase-test-lab@v1
        with:
          credentials: ${{ secrets.FIREBASE_SA }}
          testApk: android/app/build/outputs/apk/release/app-release.apk
          device: model=oriole,version=33  # Pixel 6
          testCommand: "maestro test e2e/perf-scroll.yaml"
      
      - name: Run Flashlight
        run: |
          npx @perf-profiler/cli measure \
            --bundleId com.yourapp \
            --testCommand "maestro test e2e/perf-scroll.yaml" \
            --duration 20 \
            --output current.json
      
      - name: Compare with baseline
        run: |
          npx @perf-profiler/cli compare \
            --baseline perf-baselines/scroll.json \
            --current current.json \
            --threshold 10
```

### Alternative: Maestro Cloud

```yaml
- name: Run on Maestro Cloud
  uses: mobile-dev-inc/action-maestro-cloud@v1
  with:
    api-key: ${{ secrets.MAESTRO_CLOUD_API_KEY }}
    app-file: android/app/build/outputs/apk/release/app-release.apk
    workspace: e2e/
    include-tags: performance
```

---

## Combining All Three Levels

```yaml
# .github/workflows/performance.yml
name: Performance Gates

on:
  pull_request:
    branches: [main]

jobs:
  # Level 1: Always runs (fast, free)
  bundle-size:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - name: Bundle size check
        run: ./scripts/check-bundle-size.sh

  # Level 2: Runs on source changes (medium speed, free)
  render-regression:
    runs-on: ubuntu-latest
    if: contains(github.event.pull_request.changed_files, 'src/')
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - run: npm ci
      - name: Reassure comparison
        run: ./scripts/run-reassure.sh

  # Level 3: Runs on significant changes (slow, costs device time)
  device-benchmark:
    runs-on: ubuntu-latest
    if: |
      contains(github.event.pull_request.labels.*.name, 'perf-check') ||
      contains(github.event.pull_request.changed_files, 'src/screens/')
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - name: Build & benchmark
        run: ./scripts/run-flashlight-ci.sh

  # Gate: All must pass
  perf-gate:
    needs: [bundle-size, render-regression, device-benchmark]
    if: always()
    runs-on: ubuntu-latest
    steps:
      - name: Check results
        run: |
          if [[ "${{ needs.bundle-size.result }}" == "failure" ]] || \
             [[ "${{ needs.render-regression.result }}" == "failure" ]] || \
             [[ "${{ needs.device-benchmark.result }}" == "failure" ]]; then
            echo "::error::Performance regression detected"
            exit 1
          fi
```

---

## Baseline Management

### When to Update Baselines

- After intentional performance changes (new feature adds renders → expected)
- After DMAIC cycle completion (new baseline is better)
- Monthly re-baseline to catch gradual drift

### How to Update

```bash
# Flashlight
flashlight measure --bundleId com.app --testCommand "..." --output perf-baselines/scroll.json

# Reassure
npx reassure --baseline
cp .reassure/baseline.perf perf-baselines/

# Bundle
# Just update the threshold in .bundlesizerc.json

# Commit
git add perf-baselines/
git commit -m "perf: update baselines after optimization cycle"
```

### Baseline Storage

```
perf-baselines/
├── scroll-baseline.json      # Flashlight FPS baseline
├── startup-baseline.json     # Flashlight TTI baseline  
├── reassure-baseline.perf    # Reassure render counts
├── bundle-threshold.json     # Size limits
└── README.md                 # When/why last updated
```

---

## Alert Fatigue Prevention

1. **Warn vs Block**: Set two thresholds. Warn on 10% regression (comment on PR), block on 25%+ (fail CI).
2. **Skip for documentation-only PRs**: Use path filters to avoid running device tests on README changes.
3. **Label-gated expensive tests**: Only run Flashlight on PRs with `perf-check` label.
4. **Weekly digest**: Schedule a weekly job that runs full benchmarks and reports trends (not per-PR).
