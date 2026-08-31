# StarMap Media Inbox

This tracked directory documents the single user-facing media workflow and provides a neutral template. Real personal photos and drone media belong in the external private layer's `MediaInbox/`, never in this Git repository.

## One Request Is Enough

Users do not need to memorize commands. Ask:

> 请阅读 StarMap 的相关规则，并告诉我如何上传照片。

> Read StarMap's project rules and tell me how to import my photos.

The Agent must explain the folder placement first. It must not modify files or run the import unless the user also asks it to perform the import.

## User Workflow

1. Copy `_country-template/` and rename the copy to a country already present in StarMap, for example `Iceland` or `冰岛`.
2. Rename `example-city/` to a city already present in that country, for example `Reykjavik` or `雷克雅未克`. Add one city folder for every additional city.
3. Put ordinary city photos in `<city-name>/photos/`.
4. Put that city's drone photos, 360 panoramas, and drone videos in `<city-name>/drone/`. Do not create more type folders.
5. Ask the Agent to inspect and import the delivery. The Agent performs the checks and tells the user what, if anything, still needs clarification.

```text
MediaInbox/
└─ Iceland/
   ├─ country.json            optional Agent-authored country mapping
   └─ Reykjavik/
      ├─ photos/
      ├─ drone/
      └─ media.json           optional Agent-authored drone metadata
```

Country and city folder names must match the active `<private-root>/data/travel-map.local.json`. A new country or city must be added to the private travel data in a separate task before its media can be imported.

## Agent Workflow

1. Read the project media-import route in `AGENTS.md`, then read the full [media import protocol](../../03_Reference/TravelAtlas_media_import_protocol.md).
2. Confirm that every file has a reliable existing country and city. For drone media, read embedded metadata first and confirm the media type, date, and resolution. Coordinates and altitude improve map behavior but are optional.
3. If any country, city, media type, date, coordinate, privacy status, or intended use is missing or uncertain, ask the smallest necessary question and stop. Without a reliable answer, do not guess, copy, convert, catalog, or import that item.
4. From `01_Web/`, run `npm run media:check`. Any `需要处理` result or warning caused by unresolved required data blocks the import, even if the command exits successfully.
5. Only after a clean preflight, run `npm run media:import`. The importer creates hash-stable `thumb`, `preview`, and `original` tiers outside the Inbox; restart the preview and verify City Info, City Cards/Photos, Drone Media, and the 360 Viewer as applicable.
6. Finish with `npm run privacy:check`, `npm run lint`, and `npm run build:personal`, then report imported counts and unresolved items. Before any public release, run `npm run release:check` separately from a clean source worktree.

## Source Preservation and Sidecars

Original media in `MediaInbox` is immutable by default: never move, rename, overwrite, delete, or edit it. The only deletion exception is an explicit, confirmed **Delete hidden media** action in the local editor; it removes the selected hidden source files, their generated web variants, sidecar entries, and catalog records. Two private control sidecars are the normal Agent-writable exceptions:

- `<country>/country.json` maps an ambiguous country folder to an existing `countryId`.
- `<country>/<city>/media.json` records drone type and capture metadata using `media.example.json` as the shape reference.

These JSON files are metadata, not media derivatives. Converted, resized, optimized, or otherwise derived media must never be written into the Inbox.

## Supported Inputs and Stop Conditions

- Automated import supports JPEG, PNG, WebP, AVIF, MP4, and WebM.
- Supported still formats are automatically oriented and optimized into a `640 px` WebP thumbnail plus a `2400 px` WebP viewer preview while retaining the original tier. HEIC, HEIF, TIFF, RAW, and MOV are not converted by the current importer; leave them unchanged, explain the limitation, and ask before separate conversion work.
- Ordinary city photos need no extra metadata. A filename beginning with `cover` becomes the preferred City Info image.
- Drone items need a reliable kind, date, and resolution before they become active Drone Media. The Agent must read EXIF/XMP first and may write the sidecar for missing facts, but must ask rather than invent them. A `panorama360` still must be close to the standard 2:1 equirectangular ratio; mismatches are blocked with guidance to select **Aerial photo** or provide the correct panorama. Geographic position and altitude are optional: an item without coordinates can appear in Drone Media but does not create a map marker or camera target.
- Unknown countries, unknown cities, unresolved files, or media placed outside `photos/` and `drone/` must remain unimported.

## Privacy Boundary

- `<private-root>/MediaInbox/<real-country>/`: private source delivery and sidecars; physically outside the source Git repository.
- `<private-root>/media/user/`: generated website media; physically outside the source Git repository.
- `<private-root>/data/*.local.json`: generated personal catalogs and travel data; physically outside the source Git repository.
- `_country-template/`, rules, schema, and scripts: safe to publish with the open-source repository.

Never place credentials, tickets, identity documents, hotel addresses, booking references, or private family material in the Inbox. Never add private Inbox files, generated user media, or local catalogs to Git.

## Documentation

- Public guide: [`../../README.md`](../../README.md)
- Project rules: [`../../AGENTS.md`](../../AGENTS.md)
- Assets boundary: [`../README.md`](../README.md)
- Full Agent protocol: [`../../03_Reference/TravelAtlas_media_import_protocol.md`](../../03_Reference/TravelAtlas_media_import_protocol.md)
- Open-source privacy boundary: [`../../03_Reference/TravelAtlas_open_source_privacy_boundary.md`](../../03_Reference/TravelAtlas_open_source_privacy_boundary.md)
