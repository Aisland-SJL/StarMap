# StarMap Web Application

This directory contains the runnable React, TypeScript, Vite, and Cesium application.

## Setup

```powershell
npm ci
npm run dev -- --host 127.0.0.1 --port 5174
```

Use port 5175 when the read-only rollback project is still occupying 5174.

## One Product, Two Runtime States

StarMap is one codebase, not separate public and editor editions:

- `npm run dev -- --host 127.0.0.1 --port 5175` starts the **local editing state**. Small settings controls appear beside Country Maps, City Cards, City Photos, and Drone Media. Changes are saved directly to ignored local data, with backups and atomic writes; photo uploads enter the immutable `MediaInbox` first and then use the existing three-tier importer.
- `npm run build` creates the **public display state**. Editing controls are not rendered and the local write middleware does not exist. The output is a static website containing only the data and media deliberately included in that build.

Every person who clones the open-source project receives the same local editing capability. No DeepSeek Harness, chat-command relay, or AI service is required for deterministic edits. An Agent remains useful when a country, city, date, coordinate, media type, or privacy decision is uncertain, but the editor never guesses those values.

Local editor data is stored in `src/data/generated/editor-state.local.json`. It records display order, hidden items, photo covers, and media order; it is ignored by Git together with private travel and media catalogs. Country creation uses one Chinese / English / ISO-code autocomplete field backed by the bundled country catalog, then derives the canonical names, code, flag, and map center from the selected result. City creation appears only after entering a country; the user enters a name and explicitly presses Search, then the editor uses that country's ISO code to constrain an online OpenStreetMap Nominatim lookup and derives the selected city's bilingual names and coordinates. Dates remain explicit user input. Hiding is non-destructive: source records and Inbox originals remain untouched.

The editor separates two similar-looking recovery actions:

- **Undo this round** returns the current unsaved ordering and hide/show draft to the state that existed when the editor was opened. It does not erase previously saved data.
- **Restore hidden items** explicitly removes saved hide flags, writes that change to the ignored local state, and reloads the page. It still does not delete or reconstruct source records.

City lookup requires an internet connection and follows the public [Nominatim usage policy](https://operations.osmfoundation.org/policies/nominatim/) with explicit user-triggered searches, serialized requests, a local in-memory cache, country filtering, and visible OpenStreetMap attribution. Do not replace it with autocomplete-on-every-keystroke traffic or bulk geocoding. The country catalog is supplied by the ODbL-licensed [`world-countries`](https://github.com/mledoze/countries) package and is used only by the loopback editor middleware, so it is not shipped in the public client bundle.

## Verification

```powershell
npm run privacy:check
npm run lint
npm run build
```

## Public Sample and Private Data

StarMap has two data layers:

- `src/data/travel-map.sample.json` is a tracked neutral North Atlantic demonstration used by a clean open-source clone.
- `src/data/generated/travel-map.local.json` is an ignored local overlay containing the owner's countries, cities, routes, coordinates, and display rules.

When the local file exists it wins automatically, so personal use remains unchanged. Set `VITE_TRAVEL_ATLAS_DATA_MODE=sample` in `.env.local` to force the public demonstration during release QA. In a development preview, `?data=sample` provides the same temporary override without changing local settings. New users copy the sample shape into the ignored local path and replace its records with their own; navigation is generated from that data.

Run `npm run privacy:check` before preparing any public repository. See the [open-source privacy boundary](../03_Reference/TravelAtlas_open_source_privacy_boundary.md) for the clean-history rule and deployment options.

## Import Personal Media

Users can simply ask an Agent to read the StarMap rules and explain how to import their photos. The Agent starts with the short [Media Inbox README](../02_Assets/MediaInbox/README.md), checks that every item has a reliable existing country and city, and asks before proceeding whenever required information is missing or uncertain.

After the files follow the tracked Inbox template, run:

```powershell
npm run media:check
npm run media:import
```

The first command is read-only and reports unresolved countries, cities, formats, or drone metadata. After a clean preflight, the second command preserves a local original copy and generates two WebP derivatives for every still image: a `640 px` thumbnail for city/sidebar/card surfaces and a `2400 px` preview for the photo viewer. Full-resolution photos and panoramas are requested only by explicit viewing actions. All three tiers use stable, hash-based paths inside the ignored local user library, and the ignored catalog records their dimensions. Restart the preview after importing.

Inbox source media must never be moved, renamed, overwritten, or deleted. Agents may create or update only the private mapping sidecars `country.json` and city-level `media.json`; supported still formats are optimized outside the Inbox by the importer, while unsupported formats still require a separate user-approved conversion step.

See [`../03_Reference/TravelAtlas_media_import_protocol.md`](../03_Reference/TravelAtlas_media_import_protocol.md) for the complete user and Agent contract.

## Environment and Cesium ion

StarMap remains runnable without Cesium ion: when `VITE_CESIUM_ION_TOKEN` is empty, the app uses the bundled low-resolution Natural Earth II map. To enable online global imagery, the person who develops or deploys this copy of StarMap must use an app-specific token from their own Cesium ion account. Website visitors do not configure tokens, and a clean open-source clone never inherits the project author's token.

For local development, copy `.env.example` to the ignored `.env.local` and enter the value there yourself. Create your own token at [Cesium ion Access Tokens](https://ion.cesium.com/tokens). An Agent may guide the setup, but it must never ask you to paste the complete token into chat or read it back. For production, configure `VITE_CESIUM_ION_TOKEN` in the hosting platform. Never commit or paste a real token into chat, source code, documentation, logs, screenshots, or examples.

A Vite client variable is excluded from Git but is still observable by users of the built website. Use separate development and production tokens, keep only the public `assets:read` permission and required assets, restrict the production token to the final Allowed URLs, monitor per-token usage, and rotate only the affected token when necessary. Both tokens consume the same ion account quota; separation provides control and diagnostics, not additional quota.

## Public Interface Defaults

The public template uses the neutral `StarMap` identity. Its enlarged primary navigation contains only Map and Journey. The document language defaults to `zh-CN`; no Chinese/English selector is rendered. The center-bottom dock contains three equal icon buttons: hide/show sidebars, summon a meteor shower, and open version updates. The meteor button is a single-click action rather than a toggle: it directly reuses the previously approved implementation to summon a dense three-second shower with its original trajectories, luminous heads, fading tails, timing, and density.

The public interface deliberately uses neutral copy that a new user can replace with their own identity.

## GitHub Release Updates

The official build checks `Aisland-SJL/StarMap` by default. A fork can override the source with:

```text
VITE_GITHUB_REPOSITORY=your-name/your-fork
```

The app compares its `package.json` version with the latest GitHub Release at most once every 12 hours. An unseen newer Release gives the bottom update button a breathing-light signal. Its full update page contains the update guide, Release announcement, version notes, and a guarded AI-update prompt the user can copy. It never downloads code or overwrites local files automatically.

The update button is a reversible page control: its first click opens the update page, and its next click returns to the exact Map or Journey page that was active before.

For each public update, bump the package version, create a matching semantic-version Release such as `v0.2.0`, and describe any migration steps in the Release notes. AI-assisted updates must merge around ignored environment files, private overlays, personal media, and uncommitted work, then run the project's required checks.

## Architecture

- `src/components/CesiumAtlasGlobe.tsx` is the primary map implementation.
- `src/components/AtlasGlobe.tsx` is the frozen legacy react-globe implementation.
- `src/data/travelAtlas.ts` selects the ignored private overlay when present and otherwise loads the tracked public sample.
- `src/data/mediaCatalog.ts` loads only the ignored personal media catalog; `src/data/droneMedia.ts` contains no built-in user media.
- `scripts/local-editor-plugin.mjs` provides the loopback-only Vite editing middleware during `serve`; it is excluded from the production runtime.
- `src/data/editorState.ts` applies ignored local ordering, visibility, and cover choices without rewriting imported source records.
- Project-level context and handoff live one directory above this web workspace.

## Documentation

- Public guide: [`../README.md`](../README.md)
- Chinese guide: [`../README.zh.md`](../README.zh.md)
- Web Agent rules: [`AGENTS.md`](AGENTS.md)
- Media import protocol: [`../03_Reference/TravelAtlas_media_import_protocol.md`](../03_Reference/TravelAtlas_media_import_protocol.md)
- Open-source privacy boundary: [`../03_Reference/TravelAtlas_open_source_privacy_boundary.md`](../03_Reference/TravelAtlas_open_source_privacy_boundary.md)
