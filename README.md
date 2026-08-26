<p align="center"><b>English</b> · <a href="README.zh.md">简体中文</a></p>

# Travel Atlas

An open-source, local-first 3D travel atlas for turning places, journeys, photographs, and aerial media into an interactive personal map.

Travel Atlas is built with React, TypeScript, Vite, and Cesium. A clean clone opens with neutral sample data. Your own journeys, media, editor state, and environment values stay in Git-ignored local files by default.

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
git clone https://github.com/Aisland-SJL/TravelAtlas.git
cd TravelAtlas/01_Web
npm ci
Copy-Item .env.example .env.local
npm run dev -- --host 127.0.0.1 --port 5175
```

Open `http://127.0.0.1:5175/`. macOS and Linux users can replace `Copy-Item` with `cp`.

## Cesium ion token — start here

Travel Atlas can start without a token by using its bundled low-resolution Natural Earth II fallback. For Cesium ion online global imagery:

1. Sign in or create an account at [Cesium ion](https://ion.cesium.com/).
2. Open [Access Tokens](https://ion.cesium.com/tokens) and create an app-specific public token.
3. For the easiest local start, keep the normal public scopes; keep every private scope disabled. For a production site, restrict Allowed URLs and accessible assets to what the deployment actually needs.
4. Open `01_Web/.env.local` and enter the value after `VITE_CESIUM_ION_TOKEN=`.
5. Restart the development server.

Never commit a token or paste it into an AI chat, issue, screenshot, log, or README. A browser-side production token is observable by visitors, so use a separate production token with URL and asset restrictions.

If you want AI assistance, give your Agent this prompt:

> Read `AGENTS.md`, `README.md`, and `01_Web/README.md`. Guide me through creating my own Cesium ion token before configuring Travel Atlas. Do not ask me to paste or reveal the token. Tell me exactly where I should enter it in `01_Web/.env.local`, verify only that the variable exists, and then start the local site. Preserve all ignored private data and media.

## Add your journeys and media

Development mode includes local editing controls. Use them to add or reorder countries and cities, hide or restore items, choose photo covers, and import city or drone media. Production builds do not include these write controls.

When drone files are selected, Travel Atlas immediately reads available EXIF/XMP metadata and displays it per file. Values found in the file are locked as file-derived facts. Only missing values become editable; a missing date must be supplied, while coordinates and altitude can be left blank.

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

`npm run build` creates a static public-display build in `01_Web/dist/`. Serve that folder with any static host. Configure `VITE_CESIUM_ION_TOKEN` in the hosting platform before building if online ion imagery is required.

## Updates

The bottom-right version button checks the latest [GitHub Release](https://github.com/Aisland-SJL/TravelAtlas/releases) at most once every 12 hours. A newer unseen version activates a breathing light and shows release notes plus a guarded AI-update prompt. It never overwrites your project automatically.

Forks can point the checker at their own Releases by setting `VITE_GITHUB_REPOSITORY=owner/repository`.

## Project layout

| Path | Purpose |
| --- | --- |
| `01_Web/` | React, TypeScript, Vite, and Cesium application |
| `02_Assets/MediaInbox/` | Private, source-preserving media intake template |
| `03_Reference/` | Architecture, privacy, and media workflow references |
| `04_Process/` | Design and implementation records |
| `05_Test/` | Verification guidance |

## Privacy and security

- Real tokens belong only in ignored local or hosting environment configuration.
- Personal travel data and user media are ignored by default.
- Run `npm run privacy:check` before every public contribution or deployment.
- Never push `.env.local`, private media, generated personal catalogs, or credentials.

## License

[MIT](LICENSE)
