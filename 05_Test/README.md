# TravelAtlas Verification

## Required Commands

Run from `../01_Web/`:

```powershell
npm run privacy:check
npm run media:check
npm run lint
npm run build
```

## Manual Smoke Test

- Map opens with Cesium imagery or the configured fallback.
- Country and city selectors update camera focus and InfoCard content.
- Day / Night state is shared across Map, Journey, and About.
- Journey Year Cards and Timeline switch correctly.
- A city with local drone records opens its Drone Media entries and 360 viewer.
- Short viewport heights keep the Drone Media card readable while Memory Cards remain internally scrollable.
- Night World overview keeps the globe center fixed and renders the authored celestial layer; Day removes it cleanly.
- Reset clears selection and restores Globe Scale to `3.25`.
- A clean Media Inbox passes `npm run media:check`; imported city photos appear in City Info and Memory Cards after preview restart.
- Drone media with complete date, resolution, and coordinates joins the existing Drone Media panel; incomplete metadata remains inactive rather than being guessed.
- Fast mouse movement produces a direction-aware comet tail over the existing pointer glow; the tail does not intercept Cesium drag, zoom, country, or city interactions and is absent under reduced-motion preferences.
- With the private local travel file present, the owner's country list and configured overview target remain unchanged.
- With `VITE_TRAVEL_ATLAS_DATA_MODE=sample`, the application runs independently on the neutral North Atlantic sample and exposes no personal Drone Media.
- `npm run privacy:check` confirms no current private Inbox, local data, generated media, local catalog, or real environment file is tracked.

## Structure Links

- Project entry: [[TravelAtlas_README]]
- Project index: [[00_TravelAtlas_index]]
- Web workspace: [[ProductionLab/04_Project/TravelAtlas/01_Web/README|Web README]]
- Project handoff: [[TravelAtlas_Handoff]]
- Media import protocol: [[TravelAtlas_media_import_protocol]]
- Open-source privacy boundary: [[TravelAtlas_open_source_privacy_boundary]]
