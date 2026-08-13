# TravelAtlas Media Inbox

This is the single user-facing entrance for personal photos and drone media. Users organize files only by country, city, and the two media folders shown below; an Agent handles validation and import.

## One Request Is Enough

Users do not need to memorize commands. Ask:

> 请阅读 TravelAtlas 的相关规则，并告诉我如何上传照片。

> Read TravelAtlas's project rules and tell me how to import my photos.

The Agent must explain the folder placement first. It must not modify files or run the import unless the user also asks it to perform the import.

## User Workflow

1. Copy `_country-template/` and rename the copy to a country already present in TravelAtlas, for example `Iceland` or `冰岛`.
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

Country and city folder names must match the active private `01_Web/src/data/generated/travel-map.local.json`. A new country or city must be added to the private travel data in a separate task before its media can be imported. In a clean open-source clone, the folders match the neutral sample until the user creates a local travel file.

## Agent Workflow

1. Read the project media-import route in `AGENTS.md`, then read the full [[TravelAtlas_media_import_protocol]].
2. Confirm that every file has a reliable existing country and city. For drone media, also confirm the media type and the metadata required for the requested display.
3. If any country, city, media type, date, coordinate, privacy status, or intended use is missing or uncertain, ask the smallest necessary question and stop. Without a reliable answer, do not guess, copy, convert, catalog, or import that item.
4. From `01_Web/`, run `npm run media:check`. Any `需要处理` result or warning caused by unresolved required data blocks the import, even if the command exits successfully.
5. Only after a clean preflight, run `npm run media:import`. The importer creates hash-stable `thumb`, `preview`, and `original` tiers outside the Inbox; restart the preview and verify City Info, City Cards/Photos, Drone Media, and the 360 Viewer as applicable.
6. Finish with `npm run privacy:check`, `npm run lint`, and `npm run build`, then report imported counts and unresolved items.

## Source Preservation and Sidecars

Original media in `MediaInbox` is immutable: never move, rename, overwrite, delete, or edit it. Two private control sidecars are the only Agent-writable exceptions:

- `<country>/country.json` maps an ambiguous country folder to an existing `countryId`.
- `<country>/<city>/media.json` records drone type and capture metadata using `media.example.json` as the shape reference.

These JSON files are metadata, not media derivatives. Converted, resized, optimized, or otherwise derived media must never be written into the Inbox.

## Supported Inputs and Stop Conditions

- Automated import supports JPEG, PNG, WebP, AVIF, MP4, and WebM.
- Supported still formats are automatically oriented and optimized into a `640 px` WebP thumbnail plus a `2400 px` WebP viewer preview while retaining the original tier. HEIC, HEIF, TIFF, RAW, and MOV are not converted by the current importer; leave them unchanged, explain the limitation, and ask before separate conversion work.
- Ordinary city photos need no extra metadata. A filename beginning with `cover` becomes the preferred City Info image.
- Drone items need a reliable kind, date, resolution, and valid geographic position before they become active Drone Media. The Agent may read EXIF/XMP and write the sidecar, but must ask rather than invent missing values.
- Unknown countries, unknown cities, unresolved files, or media placed outside `photos/` and `drone/` must remain unimported.

## Privacy Boundary

- `02_Assets/MediaInbox/<real-country>/`: private source delivery and sidecars; ignored by Git.
- `01_Web/public/media/user/`: generated website media; ignored by Git.
- `01_Web/src/data/generated/*.local.json`: generated personal catalogs and travel data; ignored by Git.
- `_country-template/`, rules, schema, and scripts: safe to publish with the open-source repository.

Never place credentials, tickets, identity documents, hotel addresses, booking references, or private family material in the Inbox. Never add private Inbox files, generated user media, or local catalogs to Git.

## Structure Links

- Project entry: [[TravelAtlas_README]]
- Project index: [[00_TravelAtlas_index]]
- Project rules: [[ProductionLab/04_Project/TravelAtlas/AGENTS|TravelAtlas Agent Rules]]
- Assets boundary: [[ProductionLab/04_Project/TravelAtlas/02_Assets/README|Assets README]]
- Full Agent protocol: [[TravelAtlas_media_import_protocol]]
- Open-source privacy boundary: [[TravelAtlas_open_source_privacy_boundary]]
