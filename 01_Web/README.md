# StarMap Web Application

This directory contains the runnable React, TypeScript, Vite, and Cesium application.

## Setup

```powershell
npm ci
npm run dev:public
```

Open `http://127.0.0.1:5173/`. Codex uses 5173; the separate DSH mirror uses 5174.

## One Product, Two Runtime States

StarMap is one codebase, not separate public and editor editions:

- `npm run dev:personal` starts the **personal editing profile**. It loads only the external private layer, enables the loopback editor, and writes changes there with backups and atomic replacement.
- `npm run dev:public` starts the **public preview profile**. It loads only tracked neutral sample data and exposes no editor.
- `npm run build:public` creates the public static build. `npm run build:personal` creates a private build for an owner-controlled deployment and copies the external personal media into that build only.

Every person who clones the open-source project receives the same local editing capability. No DeepSeek Harness, chat-command relay, or AI service is required for deterministic edits. An Agent remains useful when a country, city, date, coordinate, media type, or privacy decision is uncertain, but the editor never guesses those values.

The official maintenance workspace keeps editor data in `StarMap/06_private/data/editor-state.local.json`; a standalone clone may set `STARMAP_PRIVATE_ROOT` or use its ignored `06_private/` fallback. This state records display order, hidden items, photo covers, and media order. Country creation uses one Chinese / English / ISO-code autocomplete field backed by the bundled country catalog, then derives the canonical names, code, flag, and map center from the selected result. City creation appears only after entering a country; the user enters a name and explicitly presses Search. With a personal Cesium token whose public scopes include `geocode`, the loopback editor queries Cesium ion first. It falls back to a country-filtered OpenStreetMap Nominatim lookup when ion is unavailable, has no result, or times out. Both providers derive bilingual names and coordinates from the selected result; manual latitude/longitude entry remains available when online lookup cannot identify the city. Dates remain explicit user input. Hiding is non-destructive: source records and Inbox originals remain untouched.

The editor separates two similar-looking recovery actions:

- **Undo this round** returns the current unsaved ordering and hide/show draft to the state that existed when the editor was opened. It does not erase previously saved data.
- **Restore hidden items** explicitly removes saved hide flags, writes that change to the ignored local state, and reloads the page. It still does not delete or reconstruct source records.

Online city lookup is explicit rather than autocomplete-on-every-keystroke. Each provider is limited to nine seconds, requests are cached in memory, and OpenStreetMap calls are serialized, country-filtered, visibly attributed, and follow the public [Nominatim usage policy](https://operations.osmfoundation.org/policies/nominatim/). A Chinese Nominatim result is accepted only when its returned Chinese or English city name exactly matches the query, preventing misleading substring matches; retry with the local/English name or use manual coordinates when necessary. Do not turn this path into bulk geocoding. The country catalog is supplied by the ODbL-licensed [`world-countries`](https://github.com/mledoze/countries) package and is used only by the loopback editor middleware, so it is not shipped in the public client bundle.

## Verification

```powershell
npm run privacy:check
npm run lint
npm run build:public
npm run release:check
```

## Public Sample and Private Data

StarMap has two data layers:

- `src/data/travel-map.sample.json` is a tracked neutral North Atlantic demonstration used by a clean open-source clone.
- `<private-root>/data/travel-map.local.json` is the external private overlay containing the owner's countries, cities, routes, coordinates, and display rules.

The private overlay is considered only in the explicit personal profile. Public preview and public build ignore it even when it exists. New users can copy the sample shape into their private data path and replace its records with their own; navigation is generated from that data.

Run `npm run privacy:check` before preparing any public repository. See the [open-source privacy boundary](../03_Reference/TravelAtlas_open_source_privacy_boundary.md) for the clean-history rule and deployment options.

## Import Personal Media

Users can simply ask an Agent to read the StarMap rules and explain how to import their photos. The Agent starts with the short [Media Inbox README](../02_Assets/MediaInbox/README.md), checks that every item has a reliable existing country and city, and asks before proceeding whenever required information is missing or uncertain.

After real files follow the tracked template inside `<private-root>/MediaInbox/`, run:

```powershell
npm run media:check
npm run media:import
```

The first command is read-only and reports unresolved countries, cities, formats, or drone metadata. After a clean preflight, the second command preserves a local original copy and generates two WebP derivatives for every still image: a `640 px` thumbnail for city/sidebar/card surfaces and a `2400 px` preview for the photo viewer. Full-resolution photos and panoramas are requested only by explicit viewing actions. All three tiers use stable, hash-based paths inside the ignored local user library, and the ignored catalog records their dimensions. Restart the preview after importing.

Inbox source media must never be moved, renamed, overwritten, or deleted. Agents may create or update only the private mapping sidecars `country.json` and city-level `media.json`; supported still formats are optimized outside the Inbox by the importer, while unsupported formats still require a separate user-approved conversion step.

See [`../03_Reference/TravelAtlas_media_import_protocol.md`](../03_Reference/TravelAtlas_media_import_protocol.md) for the complete user and Agent contract.

## Environment and Cesium ion

StarMap remains runnable without Cesium ion: when `VITE_CESIUM_ION_TOKEN` is empty, the app uses the bundled low-resolution Natural Earth II map. To enable online global imagery, the person who develops or deploys this copy of StarMap must use an app-specific token from their own Cesium ion account. Website visitors do not configure tokens, and a clean open-source clone never inherits the project author's token.

For personal development, copy `.env.example` to `<private-root>/config/.env.local` and enter the value there yourself. Create your own token at [Cesium ion Access Tokens](https://ion.cesium.com/tokens). An Agent may guide the setup, but it must never ask you to paste the complete token into chat or read it back. For production, configure `VITE_CESIUM_ION_TOKEN` in the hosting platform. Never commit or paste a real token into chat, source code, documentation, logs, screenshots, or examples.

A Vite client variable is excluded from Git but is still observable by users of the built website. Use separate development and production tokens, keep only the public `assets:read` permission and required assets, restrict the production token to the final Allowed URLs, monitor per-token usage, and rotate only the affected token when necessary. Both tokens consume the same ion account quota; separation provides control and diagnostics, not additional quota.

## Multiple Imagery Sources

StarMap uses Cesium as its 3D engine and can draw imagery from Cesium ion, Tianditu, or the bundled Natural Earth II fallback. Configure both online credentials in `<private-root>/config/.env.local` when needed, then choose the initial source with `VITE_MAP_SOURCE=auto|cesium|tianditu|local`. `auto` keeps the existing priority of Cesium, then Tianditu, then local fallback.

Tianditu is integrated through Cesium's WMTS imagery provider as an imagery base layer plus a Chinese annotation layer. The bottom map dock always shows a Layers button and all three source rows. Cesium and Tianditu use a steady green status light when their environment value is present and a red light when it is absent; the bundled local fallback is always green. Unconfigured online rows remain visible but disabled. The control stores the user's available selection in browser local storage and never asks for, displays, writes, or validates credential contents. Production deployments must define the selected variables before the static build.

## Public Interface Defaults

The public template uses the neutral `StarMap` identity. Its enlarged primary navigation contains only Map and Journey. The document language defaults to `zh-CN`; no Chinese/English selector is rendered. The center-bottom dock contains icon buttons for hide/show sidebars, map-source selection, summon a meteor shower, and version updates. The meteor button is a single-click action rather than a toggle: it directly reuses the previously approved implementation to summon a dense three-second shower with its original trajectories, luminous heads, fading tails, timing, and density.

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
- `src/data/travelAtlas.ts` selects private data only from the profile-specific virtual module and otherwise loads the tracked public sample.
- `src/data/mediaCatalog.ts` receives personal media only in personal mode; `src/data/droneMedia.ts` contains no built-in user media.
- `scripts/private-profile.mjs` resolves the external private root without reading or printing secrets.
- `scripts/local-editor-plugin.mjs` provides the loopback-only editor in personal development and injects no private data in public mode.
- `scripts/public-release-check.mjs` rebuilds a clean Git archive in the OS temporary directory, so public-release verification cannot see the private layer.
- Project-level context and handoff live one directory above this web workspace.

## Documentation

- Public guide: [`../README.md`](../README.md)
- Chinese guide: [`../README.zh.md`](../README.zh.md)
- Web Agent rules: [`AGENTS.md`](AGENTS.md)
- Media import protocol: [`../03_Reference/TravelAtlas_media_import_protocol.md`](../03_Reference/TravelAtlas_media_import_protocol.md)
- Open-source privacy boundary: [`../03_Reference/TravelAtlas_open_source_privacy_boundary.md`](../03_Reference/TravelAtlas_open_source_privacy_boundary.md)
