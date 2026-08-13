# TravelAtlas Migration and Performance Audit

> Date: 2026-08-09 | Source: `E:\AI_Workspace\TravelAtlas\01_Web` | Target: `ProductionLab/04_Project/TravelAtlas`

## Decision

Create a copy-based migration. Keep the previous workspace unchanged as a short-term rollback source, preserve Git history, and continue active development only in ProductionLab.

## Measured Baseline

| Check | Result |
| --- | --- |
| Vite ready time | 657 ms |
| Local HTTP response | 157 ms |
| Source file search | 40 ms |
| Git status | 101 ms |
| ESLint | 4.4 s |
| Source files outside generated folders | 44 |
| `node_modules` | about 484 MiB / 19,169 files |
| Build output | about 37 MiB, including Cesium assets and two panoramas |

## Findings

- Multi-hour simple tasks were not explained by normal project commands; the measured commands were all seconds or milliseconds.
- The previous workspace had ownership differences between the sandbox account and the Windows user, which caused Git and TypeScript write failures and retries.
- The long-running Codex task contained extensive history, screenshots, and repeated browser debugging, increasing agent context and app instability.
- `CesiumAtlasGlobe.tsx` and `index.css` were each over 1,100 lines, increasing reasoning and patch risk.
- Cesium renders a full-screen high-DPI scene and can keep the browser/GPU busy even when repository commands remain fast.
- The panorama viewer was eagerly included in the application import graph even when closed.
- Local review screenshots and duplicated source/public media increased workspace noise.

## Migration Optimizations

- Excluded dependencies, build output, logs, local screenshots, and real environment files.
- Added a clean ProductionLab project boundary with a single Git root.
- Separated source media from the runnable web workspace.
- Scoped linting to relevant source files.
- Lazy-loaded the 360 panorama viewer.

## Verification After Migration

| Check | Result |
| --- | --- |
| Clean dependency install | Passed (`npm ci`) |
| Warm lint | Passed in about 4.9 s |
| Production build | Passed in about 10 s total; Vite bundle phase 1.34 s |
| Initial application JS | Reduced from about 934 KB to about 343 KB |
| Panorama viewer JS | Split into a separate about 592 KB chunk, loaded on demand |

## Deferred Optimizations

These should be done only as separate behavior-preserving tasks:

1. Split Cesium camera/debug logic from entity rendering.
2. Split map, journey, and shared theme CSS.
3. Evaluate Cesium request-render mode with explicit visual regression checks.
4. Lazy-load non-Map pages if bundle measurements justify it.
5. Replace personal media with a public sample-data workflow before open source release.

## Structure Links

- Project entry: [[TravelAtlas_README]]
- Project index: [[00_TravelAtlas_index]]
- Project handoff: [[TravelAtlas_Handoff]]
