# StarMap Verification

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
- Map and Journey navigation works; the bottom version button opens the update page and a second click returns to the previously active Map or Journey view.
- Journey Year Cards and Timeline switch correctly.
- A city with local drone records opens its Drone Media entries and 360 viewer.
- Short viewport heights keep the Drone Media card readable while Memory Cards remain internally scrollable.
- Night World overview keeps the globe center fixed and renders the authored celestial layer; Day removes it cleanly.
- Reset clears selection and restores Globe Scale to `3.25`.
- A clean Media Inbox passes `npm run media:check`; imported city photos appear in City Info and Memory Cards after preview restart.
- Selecting drone files immediately displays embedded date, GPS, altitude, relative altitude, and camera metadata. Only missing values are editable; date is required, while coordinates and altitude are optional. Items without coordinates join Drone Media without creating a map marker or camera target.
- Landscape and portrait photos both fit completely inside the large Viewer without clipping.
- Fast mouse movement produces a direction-aware comet tail over the existing pointer glow; the tail does not intercept Cesium drag, zoom, country, or city interactions and is absent under reduced-motion preferences.
- With the private local travel file present, the owner's country list and configured overview target remain unchanged.
- With `VITE_TRAVEL_ATLAS_DATA_MODE=sample`, the application runs independently on the neutral North Atlantic sample and exposes no personal Drone Media.
- `npm run privacy:check` confirms no current private Inbox, local data, generated media, local catalog, or real environment file is tracked.

## Documentation

- Public guide: [`../README.md`](../README.md)
- Web workspace: [`../01_Web/README.md`](../01_Web/README.md)
- Media import protocol: [`../03_Reference/TravelAtlas_media_import_protocol.md`](../03_Reference/TravelAtlas_media_import_protocol.md)
- Open-source privacy boundary: [`../03_Reference/TravelAtlas_open_source_privacy_boundary.md`](../03_Reference/TravelAtlas_open_source_privacy_boundary.md)
