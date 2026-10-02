---
title: Reassure Setup Guide
impact: HIGH
tags: reassure, callstack, regression, testing, ci, benchmarks
---

# Reassure Setup Guide

Complete setup for `@callstack/reassure` — automated performance regression testing for React Native.

## What Reassure Does

Reassure measures:
- **Render count**: How many times a component renders during an interaction
- **Render duration**: How long each render takes
- **Comparison**: Compares current branch against baseline (main branch)

It catches: "This PR added a Context dependency that causes 10x more renders than before."

## Installation

```bash
npm install --save-dev reassure
# or
yarn add --dev reassure
```

## Configuration

### `reassure.config.ts`

```typescript
import { configure } from 'reassure';

configure({
  runs: 10,          // Number of measurement runs (more = more stable, slower)
  warmupRuns: 1,     // Discard first run (JIT warmup)
  outputFile: '.reassure/current.perf',
});
```

### Jest Configuration

Add to `jest.config.js`:
```javascript
module.exports = {
  // ... existing config
  projects: [
    '<rootDir>/jest.config.js',        // Regular tests
    '<rootDir>/jest.perf.config.js',   // Performance tests
  ],
};
```

Create `jest.perf.config.js`:
```javascript
module.exports = {
  preset: 'react-native',
  testMatch: ['**/*.perf-test.{ts,tsx}'],
  setupFilesAfterFramework: ['reassure/setup'],
};
```

## Writing Performance Tests

### Basic Render Count Test

```typescript
// src/components/__perf__/FeedItem.perf-test.tsx
import { measureRenders } from 'reassure';
import { FeedItem } from '../FeedItem';

test('FeedItem renders efficiently', async () => {
  const mockItem = { id: '1', title: 'Test', image: 'https://...' };
  
  await measureRenders(
    <FeedItem item={mockItem} onPress={() => {}} />,
    { scenario: async () => { /* no interaction needed for static render test */ } }
  );
});
```

### Interaction Test (Scroll Simulation)

```typescript
// src/screens/__perf__/HomeScreen.perf-test.tsx
import { measurePerformance } from 'reassure';
import { fireEvent, screen } from '@testing-library/react-native';
import { HomeScreen } from '../HomeScreen';

test('HomeScreen scroll performance', async () => {
  await measurePerformance(
    <HomeScreen />,
    {
      scenario: async () => {
        // Simulate scroll interaction
        const list = screen.getByTestId('feed-list');
        fireEvent.scroll(list, {
          nativeEvent: { contentOffset: { y: 500 } },
        });
        // Wait for re-renders to settle
        await new Promise(r => setTimeout(r, 100));
      },
    }
  );
});
```

### Navigation Test

```typescript
// src/navigation/__perf__/TabSwitch.perf-test.tsx
import { measurePerformance } from 'reassure';
import { fireEvent, screen } from '@testing-library/react-native';
import { AppNavigator } from '../AppNavigator';

test('Tab switch performance', async () => {
  await measurePerformance(
    <AppNavigator />,
    {
      scenario: async () => {
        const profileTab = screen.getByTestId('tab-profile');
        fireEvent.press(profileTab);
        await screen.findByTestId('profile-screen');
      },
    }
  );
});
```

## Running Locally

```bash
# Generate baseline (run on main branch)
npx reassure --baseline

# Generate current measurement (on feature branch)
npx reassure

# Compare
npx reassure compare
```

Output:
```
┌─────────────────────┬────────┬─────────┬──────────┐
│ Test                │ Baseline│ Current │ Change   │
├─────────────────────┼────────┼─────────┼──────────┤
│ FeedItem renders    │ 2      │ 2       │ 0%       │
│ HomeScreen scroll   │ 4      │ 12      │ +200% ⚠️ │
│ Tab switch          │ 3      │ 3       │ 0%       │
└─────────────────────┴────────┴─────────┴──────────┘
```

## CI Integration (GitHub Actions)

```yaml
# .github/workflows/perf.yml
name: Performance Regression Check

on:
  pull_request:
    branches: [main]

jobs:
  perf:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npm ci

      # Generate baseline from main branch
      - name: Checkout base branch
        run: git checkout ${{ github.event.pull_request.base.sha }}
      
      - name: Generate baseline
        run: npx reassure --baseline

      # Generate current from PR branch
      - name: Checkout PR branch
        run: git checkout ${{ github.event.pull_request.head.sha }}
      
      - name: Generate current
        run: npx reassure

      # Compare and report
      - name: Compare performance
        run: npx reassure compare --output-format markdown > perf-report.md

      - name: Comment PR
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const report = fs.readFileSync('perf-report.md', 'utf8');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## Performance Report\n\n${report}`
            });
```

## Thresholds and Failure Criteria

Configure in `reassure.config.ts`:
```typescript
configure({
  // ...
  thresholds: {
    renderCount: {
      warn: 1.5,    // Warn if renders increase >50%
      fail: 3.0,    // Fail if renders increase >200%
    },
    renderDuration: {
      warn: 1.5,    // Warn if duration increases >50%
      fail: 2.0,    // Fail if duration doubles
    },
  },
});
```

## Best Practices

1. **Test the hot paths** — Focus on screens/components that users interact with most
2. **Keep scenarios realistic** — Simulate actual user interactions, not synthetic stress tests
3. **Run on CI, not locally** — Local results vary with machine load. CI provides consistent environment.
4. **Update baselines intentionally** — When you intentionally add renders (new feature), update the baseline explicitly
5. **Don't test everything** — 5-10 perf tests for critical paths is better than 100 flaky ones

## Directory Structure

```
src/
├── components/
│   ├── FeedItem.tsx
│   └── __perf__/
│       └── FeedItem.perf-test.tsx
├── screens/
│   ├── HomeScreen.tsx
│   └── __perf__/
│       └── HomeScreen.perf-test.tsx
.reassure/
├── current.perf           # Current branch measurements
└── baseline.perf          # Main branch measurements (committed)
```
