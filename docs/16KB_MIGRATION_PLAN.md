# 16 KB Page-Size Compliance — Expo SDK 52 → 54 Migration Plan

## Why

Google Play (enforced 1 Nov 2025) requires every native `.so` in the bundle to have
ELF load segments aligned to **16 KB** for apps targeting Android 15+. Our 1.0.10
bundle has **21 of 22** native libs aligned to 4 KB (`0x1000`) — non-compliant.

React Native only ships 16 KB-aligned prebuilt core libs from **0.77+**. We are on
**RN 0.76.9 (Expo SDK 52)**, whose prebuilt `libhermes`, `libreactnative`, `libjsi`,
`libfbjni`, `libc++_shared` and Fresco libs are 4 KB — and cannot be re-aligned
locally. Therefore a framework upgrade is mandatory.

**Target: Expo SDK 54 (RN 0.81)** — latest fully-compliant line; avoids a near-term
re-upgrade. New Architecture is already enabled (`newArchEnabled=true`), so the
New-Arch-only deps below are compatible.

## Non-compliant libs and their source

| Source | Libs | Fixed by |
| --- | --- | --- |
| RN core (prebuilt) | hermes, hermestooling, reactnative, jsi, fbjni, c++_shared | RN ≥ 0.77 (SDK 54) |
| Fresco (via RN) | imagepipeline, gifimage, static-webp, native-filters, native-imagetranscoder | RN ≥ 0.77 (SDK 54) |
| Built from source | appmodules, react_codegen_*, androidx.graphics.path | NDK r27+ + rebuild |
| react-native-mmkv | reactnativemmkv | **v2 → v3** (New-Arch only) |
| react-native-reanimated | reanimated, worklets | **v3 → v4** (New-Arch only) |
| screens / gesture-handler / svg | rnscreens, gesturehandler, rnsvg | SDK-54-matched versions |

## Dependency audit (current → SDK 54 target)

| Package | Current | SDK 54 target | Notes |
| --- | --- | --- | --- |
| expo | ~52.0.46 | ^54 | `expo install expo@^54` |
| react-native | 0.76.9 | 0.81.x | via SDK 54 |
| react | 18.3.1 | 19.x | RN 0.81 uses React 19 |
| react-native-reanimated | ~3.16.1 | 4.x | **breaking**: worklets split, babel plugin change |
| react-native-worklets | (none) | added | new peer of reanimated 4 |
| react-native-mmkv | ^2.1.0 | 3.x | **breaking**: New-Arch only, minor API changes |
| react-native-screens | ~4.4.0 | SDK-54 pin | |
| react-native-gesture-handler | ~2.20.2 | SDK-54 pin | |
| react-native-svg | ^15.8.0 | SDK-54 pin | |
| react-native-safe-area-context | 4.12.0 | SDK-54 pin | |
| @react-native-community/datetimepicker | 8.2.0 | SDK-54 pin | |
| expo-* (splash-screen, etc.) | SDK 52 | SDK 54 | `expo install --fix` |
| ndkVersion (android/build.gradle) | 26.1.10909125 | 27.x+ | 16 KB default alignment |

## Steps

1. **Branch**: `chore/android-16kb-sdk54` (done).
2. **Bump Expo + RN**: `npx expo install expo@^54` then `npx expo install --fix`
   (pins every Expo-managed dep to SDK-54-compatible, 16 KB-aligned versions).
3. **Reanimated v4 migration**:
   - Add `react-native-worklets`.
   - `babel.config.js`: replace `react-native-reanimated/plugin` with
     `react-native-worklets/plugin` (must stay last in the plugins list).
   - Review any deprecated Reanimated 3 APIs.
4. **MMKV v3 migration**: verify the redux-persist MMKV storage adapter
   (`app/store/mmkvStorage.ts`) still compiles against v3; adjust if the constructor
   / getter signatures changed.
5. **Native config**: bump `ndkVersion` to the SDK-54 default (27.x+). Regenerate
   `android/` (`npx expo prebuild -p android --clean`) **after** re-confirming the
   release signing config and version (1.0.10/vc10) are preserved (they live in
   `android/app/build.gradle` + `gradle.properties` / keystore — re-apply if prebuild
   overwrites them).
6. **Build**: `cd android && ./gradlew bundleRelease`.
7. **Verify 16 KB**: extract `base/lib/arm64-v8a/*.so`, run `llvm-readelf -lW` and
   confirm every first `LOAD` segment is `0x4000`+ (16384). Expect **0 non-compliant**.
8. **Re-verify app**: install on emulator, log in, confirm the Reports screen
   (zone6 May card, unit switch, list) still works after the upgrade.
9. **Bump version**: 1.0.10 → 1.0.11 / versionCode 11 for the compliant release.

## Risks

- **RN 0.76→0.81 is a 5-minor jump**: expect breaking changes (React 19, New Arch
  strictness, deprecated APIs). Budget iterative build/fix cycles.
- **Reanimated v4** drops legacy APIs and moves to `react-native-worklets`.
- **MMKV v3** is New-Arch-only (we have it) but persisted storage adapter must be
  re-checked to avoid wiping users' MMKV-persisted Redux state.
- **prebuild --clean** can overwrite custom native edits / signing — verify before
  and after.
- Third-party libs without an SDK-54 / 16 KB-aligned release would block the build;
  `expo install --fix` surfaces these.

## Rollback

All work is isolated on `chore/android-16kb-sdk54`. The shippable 1.0.10 bundle
(reports fix, pre-upgrade) remains on `refactor-for-better-nav-exp`.
