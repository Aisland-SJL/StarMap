<p align="center"><b>English</b> · <a href="README.zh.md">简体中文</a></p>

# StarMap

An open-source, local-first 3D travel atlas for turning places, journeys, photographs, and aerial media into an interactive personal map.

StarMap is built with React, TypeScript, Vite, and Cesium. A clean clone opens with neutral sample data. Your own journeys, media, editor state, and environment values stay in Git-ignored local files by default.

## Product preview

<table>
  <tr>
    <td width="68%"><img src="docs/images/01-globe-overview.webp" alt="StarMap globe overview"></td>
    <td width="32%"><strong>Explore the whole globe</strong><br><br>Start from a complete world view and travel to any corner of the Earth. Visited countries, cities, and journey routes remain visible on the globe.</td>
  </tr>
  <tr>
    <td width="68%"><img src="docs/images/02-meteor-galaxy-closeup.webp" alt="Meteor shower, Milky Way, and close globe view"></td>
    <td width="32%"><strong>From the Milky Way to ground tiles</strong><br><br>Move closer to see the meteor shower and Milky Way, then continue zooming toward detailed terrain and imagery tiles on the surface.</td>
  </tr>
  <tr>
    <td width="68%"><img src="docs/images/03-city-location-and-altitude.webp" alt="City panel with precise photo and drone positions"></td>
    <td width="32%"><strong>City-level media positions</strong><br><br>Open a city panel to locate photographs and drone media by their precise coordinates and altitude, while browsing the city's photos and media entries.</td>
  </tr>
  <tr>
    <td width="68%"><img src="docs/images/04-drone-panorama-viewer.webp" alt="Drone 360 panorama Viewer"></td>
    <td width="32%"><strong>Drone 360° panorama Viewer</strong><br><br>Open aerial panoramas inside the built-in Viewer for an immersive, zoomable view without leaving the atlas.</td>
  </tr>
</table>


## Highlights

- Interactive Cesium globe with country, city, route, and camera navigation.
- Map and Journey views with responsive glass UI.
- Local editor for countries, cities, ordering, visibility, city photos, and drone media.
- EXIF-first drone import: selected files are inspected immediately for date, GPS coordinates, absolute altitude, relative altitude, and camera information.
- Missing metadata is requested only when needed. The date is required; coordinates and altitude remain optional.
- Aspect-ratio-safe photo gallery for both landscape and portrait images.
- Three-tier private media pipeline: lightweight thumbnails, viewer previews, and preserved originals.
- One-click meteor shower and an in-app GitHub Release update guide.
- Privacy audit and public/private data separation designed for open-source reuse.

## Quick start

Requirements: Git and a current Node.js LTS release compatible with Vite 8.

```powershell
git clone https://github.com/Aisland-SJL/StarMap.git
cd StarMap/01_Web
npm ci
Copy-Item .env.example .env.local
npm run dev -- --host 127.0.0.1 --port 5175
```

Open `http://127.0.0.1:5175/`. macOS and Linux users can replace `Copy-Item` with `cp`.

## Map credentials — start here

StarMap can start without a token by using its bundled low-resolution Natural Earth II fallback. For Cesium ion online global imagery:

1. Sign in or create an account at [Cesium ion](https://ion.cesium.com/).
2. Open [Access Tokens](https://ion.cesium.com/tokens) and create an app-specific public token.
3. For the easiest local start, keep the normal public scopes; keep every private scope disabled. For a production site, restrict Allowed URLs and accessible assets to what the deployment actually needs.
4. Open `01_Web/.env.local` and enter the value after `VITE_CESIUM_ION_TOKEN=`.
5. Restart the development server.

Never commit a token or paste it into an AI chat, issue, screenshot, log, or README. A browser-side production token is observable by visitors, so use a separate production token with URL and asset restrictions.

If you want AI assistance, give your Agent this prompt:

> Read `AGENTS.md`, `README.md`, `01_Web/AGENTS.md`, `01_Web/README.md`, and `01_Web/.env.example`. Explain the three StarMap imagery sources and ask whether I need Cesium ion, Tianditu, or only the bundled local fallback. Guide me through obtaining any credentials I choose and configuring `VITE_MAP_SOURCE`, `VITE_CESIUM_ION_TOKEN`, and `VITE_TIANDITU_TOKEN`. Never ask me to paste or reveal a complete token or key; tell me exactly where I should enter it in ignored `01_Web/.env.local`, verify only non-secret presence and live map behavior, then start the local site and explain the basic controls. Preserve all ignored private data and media.

## Switch between Cesium and Tianditu

Cesium remains StarMap's 3D globe engine. The source switch changes only the imagery drawn on that globe. Users who need a mainland-China-accessible source can apply for their own key at [Tianditu Developer Resources](https://lbs.tianditu.gov.cn/) and keep both credentials in the ignored `01_Web/.env.local`:

```text
VITE_MAP_SOURCE=tianditu
VITE_CESIUM_ION_TOKEN=
VITE_TIANDITU_TOKEN=
```

`VITE_MAP_SOURCE` accepts `auto`, `cesium`, `tianditu`, or `local`. The Layers button always lists Cesium, Tianditu, and the bundled local fallback. A steady green light means the required value is present (or the local source is built in); a red light means the online source is not configured and cannot be selected. This check never displays or validates the credential itself. The browser remembers the selected available source. Changing `.env.local` still requires restarting the development server. Both online values are public-client credentials in a built static site, so use app-specific keys and apply the provider's production restrictions.

## Add your journeys and media

Development mode includes local editing controls. Use them to add or reorder countries and cities, hide or restore items, choose photo covers, and import city or drone media. Production builds do not include these write controls.

When drone files are selected, StarMap immediately reads available EXIF/XMP metadata and displays it per file. Values found in the file are locked as file-derived facts. Only missing values become editable; a missing date must be supplied, while coordinates and altitude can be left blank.

For bulk media, place source files under `02_Assets/MediaInbox/` following its tracked template, then run:

```powershell
npm run media:check
npm run media:import
```

The importer never rewrites Inbox originals. Personal source media, generated derivatives, local travel records, editor state, and `.env.local` remain ignored by Git.

## Build and verify

From `01_Web/`:

```powershell
npm run lint
npm run build
npm run privacy:check
npm run media:check
```

`npm run build` creates a static public-display build in `01_Web/dist/`. Serve that folder with any static host. Configure `VITE_CESIUM_ION_TOKEN`, `VITE_TIANDITU_TOKEN`, and `VITE_MAP_SOURCE` in the hosting platform before building when their corresponding online imagery is required.

## Updates

The bottom-right version button checks the latest [GitHub Release](https://github.com/Aisland-SJL/StarMap/releases) at most once every 12 hours. A newer unseen version activates a breathing light and shows release notes plus a guarded AI-update prompt. It never overwrites your project automatically.

The button is reversible: click once to open the update page, then click it again to return to the Map or Journey view you were using.

Forks can point the checker at their own Releases by setting `VITE_GITHUB_REPOSITORY=owner/repository`.

## Project layout

| Path | Purpose |
| --- | --- |
| `01_Web/` | React, TypeScript, Vite, and Cesium application |
| `02_Assets/MediaInbox/` | Private, source-preserving media intake template |
| `03_Reference/` | Architecture, privacy, and media workflow references |
| `05_Test/` | Verification guidance |

## Privacy and security

- Real tokens belong only in ignored local or hosting environment configuration.
- Personal travel data and user media are ignored by default.
- Run `npm run privacy:check` before every public contribution or deployment.
- Never push `.env.local`, private media, generated personal catalogs, or credentials.

## License

[MIT](LICENSE)
