# TravelAtlas Web Application

This directory contains the runnable React, TypeScript, Vite, and Cesium application.

## Setup

```powershell
npm ci
npm run dev -- --host 127.0.0.1 --port 5174
```

Use port 5175 when the read-only rollback project is still occupying 5174.

## Verification

```powershell
npm run privacy:check
npm run lint
npm run build
```

## Public Sample and Private Data

TravelAtlas has two data layers:

- `src/data/travel-map.sample.json` is a tracked neutral North Atlantic demonstration used by a clean open-source clone.
- `src/data/generated/travel-map.local.json` is an ignored local overlay containing the owner's countries, cities, routes, coordinates, and display rules.

When the local file exists it wins automatically, so personal use remains unchanged. Set `VITE_TRAVEL_ATLAS_DATA_MODE=sample` in `.env.local` to force the public demonstration during release QA. In a development preview, `?data=sample` provides the same temporary override without changing local settings. New users copy the sample shape into the ignored local path and replace its records with their own; navigation is generated from that data.

Run `npm run privacy:check` before preparing any public repository. See [[TravelAtlas_open_source_privacy_boundary]] for the clean-history rule and deployment options.

## Import Personal Media

Users can simply ask an Agent to read the TravelAtlas rules and explain how to import their photos. The Agent starts with the short [[ProductionLab/04_Project/TravelAtlas/02_Assets/MediaInbox/README|Media Inbox README]], checks that every item has a reliable existing country and city, and asks before proceeding whenever required information is missing or uncertain.

After the files follow the tracked Inbox template, run:

```powershell
npm run media:check
npm run media:import
```

The first command is read-only and reports unresolved countries, cities, formats, or drone metadata. After a clean preflight, the second command preserves a local original copy and generates two WebP derivatives for every still image: a `640 px` thumbnail for city/sidebar/card surfaces and a `2400 px` preview for the photo viewer. Full-resolution photos and panoramas are requested only by explicit viewing actions. All three tiers use stable, hash-based paths inside the ignored local user library, and the ignored catalog records their dimensions. Restart the preview after importing.

Inbox source media must never be moved, renamed, overwritten, or deleted. Agents may create or update only the private mapping sidecars `country.json` and city-level `media.json`; supported still formats are optimized outside the Inbox by the importer, while unsupported formats still require a separate user-approved conversion step.

See [[TravelAtlas_media_import_protocol]] for the complete user and Agent contract.

## Environment

TravelAtlas remains runnable without Cesium ion: when `VITE_CESIUM_ION_TOKEN` is empty, the app uses the bundled low-resolution Natural Earth II map. To enable online global imagery, the person who develops or deploys this copy of TravelAtlas must use an app-specific token from their own Cesium ion account. Website visitors do not configure tokens, and a clean open-source clone never inherits the project author's token.

For local development, copy `.env.example` to the ignored `.env.local` and enter the value there yourself. For production, configure `VITE_CESIUM_ION_TOKEN` in the hosting platform. Never commit or paste a real token into chat, source code, documentation, logs, screenshots, or examples.

A Vite client variable is excluded from Git but is still observable by users of the built website. Use separate development and production tokens, keep only the public `assets:read` permission and required assets, restrict the production token to the final Allowed URLs, monitor per-token usage, and rotate only the affected token when necessary. Both tokens consume the same ion account quota; separation provides control and diagnostics, not additional quota.

## Architecture

- `src/components/CesiumAtlasGlobe.tsx` is the primary map implementation.
- `src/components/AtlasGlobe.tsx` is the frozen legacy react-globe implementation.
- `src/data/travelAtlas.ts` selects the ignored private overlay when present and otherwise loads the tracked public sample.
- `src/data/mediaCatalog.ts` loads only the ignored personal media catalog; `src/data/droneMedia.ts` contains no built-in user media.
- Project-level context and handoff live one directory above this web workspace.

## Structure Links

- Project entry: [[TravelAtlas_README]]
- Project index: [[00_TravelAtlas_index]]
- Project handoff: [[TravelAtlas_Handoff]]
- Web Agent rules: [[ProductionLab/04_Project/TravelAtlas/01_Web/AGENTS|Web Agent Rules]]
- Media import protocol: [[TravelAtlas_media_import_protocol]]
- Open-source privacy boundary: [[TravelAtlas_open_source_privacy_boundary]]
