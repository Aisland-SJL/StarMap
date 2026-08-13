# TravelAtlas Assets

## Boundary

- The legacy `SourceMedia/` continuity copy was retired after the private `MediaInbox` workflow became the canonical source-media boundary.
- `MediaInbox/` is the private bulk-delivery entrance for new user photos and drone media. Source media is immutable; only Agent-authored `country.json` and city-level `media.json` control sidecars may be created or updated there. Only the template and instructions are tracked.
- Browser-ready personal media is generated under `../01_Web/public/media/user/` and remains local-only. Each supported still image is stored by content hash with `thumb.webp`, `preview.webp`, and an `original` tier so list screens never decode full-resolution files.
- `PrivateData/` is an ignored local archive for migration backups that are not part of the runtime or the eventual public repository.
- The previous workspace remains the short-term rollback source and was not changed during migration.

## Bulk Import

Users copy `_country-template/`, rename it to a TravelAtlas country, create one folder per city, and place that city's media into its `photos/` and `drone/` branches. If any country, city, media type, coordinate, privacy status, or intended use is uncertain, the Agent asks before acting and leaves the item unimported until it has a reliable answer. From `01_Web/`, the Agent runs `npm run media:check` before `npm run media:import`.

The complete folder contract, conversion rules, metadata requirements, and no-delete behavior are documented in [[TravelAtlas_media_import_protocol]].

## Public Release Rule

TravelAtlas is intended to become an open-source website shell. Personal travel media never enters the public template. Only explicitly licensed or generated sample assets may be included in a clean public repository; see [[TravelAtlas_open_source_privacy_boundary]].

## Structure Links

- Project entry: [[TravelAtlas_README]]
- Project index: [[00_TravelAtlas_index]]
- Web workspace: [[ProductionLab/04_Project/TravelAtlas/01_Web/README|Web README]]
- Media Inbox: [[ProductionLab/04_Project/TravelAtlas/02_Assets/MediaInbox/README|Media Inbox README]]
- Import protocol: [[TravelAtlas_media_import_protocol]]
- Open-source privacy boundary: [[TravelAtlas_open_source_privacy_boundary]]
