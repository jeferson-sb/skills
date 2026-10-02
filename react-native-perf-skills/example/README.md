# Janky Shop

A small Expo product-feed app (Feed → Detail → Settings) used as a practice target for the
[`react-native-perf-skills`](../README.md) DMAIC workflow. Run the skills against it to measure,
diagnose, and fix its performance for yourself.

## Run it

```bash
cd example
npm install
npx expo prebuild        # generates ios/ and android/ (needed for native profiling)
npx expo run:ios         # or: npx expo run:android
```

For a quick JS-only look, `npx expo start` is enough — `prebuild` is only required for the
native-profiling tools.
