# TravelAtlas

> Project: TravelAtlas | Type: interactive travel atlas / Cesium web application | Status: active prototype | Migrated: 2026-08-09

## Metadata

| Field | Value |
| --- | --- |
| Project name | TravelAtlas |
| Product type | Long-term website / open-source travel atlas template |
| Current map engine | Cesium + Resium |
| Application stack | React 19, TypeScript, Vite, Tailwind CSS |
| Active branch | `feature/cesium-globe-prototype` |
| Website workspace | `01_Web/` |
| Previous rollback copy | `E:\AI_Workspace\TravelAtlas` |

## One-Sentence Summary

TravelAtlas is a personal, data-driven 3D travel atlas that is being shaped into a reusable website shell for other people to deploy with their own journeys and media.

## Start Here: Import Photos

A user does not need to memorize commands or metadata rules. One request is enough:

> 请阅读 TravelAtlas 的相关规则，并告诉我如何上传照片。

> Read TravelAtlas's project rules and tell me how to import my photos.

The Agent must route this request through the media-import section in [[ProductionLab/04_Project/TravelAtlas/AGENTS|TravelAtlas Agent Rules]], then guide the user with the short [[ProductionLab/04_Project/TravelAtlas/02_Assets/MediaInbox/README|Media Inbox README]]. The detailed [[TravelAtlas_media_import_protocol]] is only required for execution and edge cases. Missing or uncertain country, city, drone metadata, privacy, or file intent must be clarified before any import; the Agent must never guess.

## Project Structure

| Path | Purpose |
| --- | --- |
| [[00_TravelAtlas_index\|00_Index/]] | Project navigation |
| [[ProductionLab/04_Project/TravelAtlas/01_Web/README\|01_Web/]] | Runnable Vite/Cesium application |
| [[ProductionLab/04_Project/TravelAtlas/02_Assets/README\|02_Assets/]] | Original project-owned media and asset boundary |
| [[ProductionLab/04_Project/TravelAtlas/03_Reference/README\|03_Reference/]] | Technical, licensing, and deployment references |
| [[TravelAtlas_media_import_protocol]] | Private media Inbox and Agent-driven bulk-import contract |
| [[TravelAtlas_open_source_privacy_boundary]] | Open-source template, private overlay, and clean-public-repository contract |
| [[2026-08-09_migration_and_performance_audit\|04_Process/]] | Migration, performance, and implementation records |
| [[ProductionLab/04_Project/TravelAtlas/05_Test/README\|05_Test/]] | Verification notes and future test artifacts |
| [[TravelAtlas_Handoff]] | Current task and next-agent context |
| [[ProductionLab/04_Project/TravelAtlas/AGENTS\|TravelAtlas Agent Rules]] | Project operating rules |

## Run Locally

From `01_Web/`:

```powershell
npm ci
npm run dev -- --host 127.0.0.1 --port 5174
```

Open `http://127.0.0.1:5174/`.

If the read-only rollback project is already using port 5174, start this active workspace on port 5175 instead.

TravelAtlas is a Vite application and must be served over HTTP. Opening `index.html` directly with `file://` will not run the module graph or Cesium assets correctly.

## Environment

TravelAtlas runs in two map-source states:

| Configuration | Result |
| --- | --- |
| No Cesium ion token | The app remains runnable with the bundled low-resolution Natural Earth II map. |
| A deployer's own Cesium ion token | The app enables Cesium ion online global imagery and charges usage to that deployer's ion account. |

Ordinary visitors to an already deployed TravelAtlas website do not create or configure a token. The person who clones and deploys the project supplies a token from their own Cesium ion account; the project author's token is never distributed with the open-source repository.

For local development, copy `01_Web/.env.example` to the ignored `01_Web/.env.local`, then enter the value yourself:

```text
VITE_CESIUM_ION_TOKEN=
```

For a public deployment, configure the same variable in the hosting platform rather than Git. Because TravelAtlas is a static browser application, a production token is a public-client credential and can be observed in browser requests even when it came from a hosting environment variable. Protect it with a separate app-specific production token, `assets:read` only, access to only the required assets, exact Allowed URLs for the final domain, usage monitoring, and rotation when needed. Development and production tokens share one account quota; separating them provides independent restrictions, usage attribution, and revocation rather than additional quota.

Never paste a complete token into chat or ask an Agent to store it. An Agent may explain where the user should enter it and may verify configuration only without reading or revealing the complete value. The real value must never enter Git, source code, documentation, logs, screenshots, examples, or task output.

## Current Product State

- Cesium is the primary map engine.
- Map, Journey, and About use a shared header; Map is Night-only in the current prototype while Journey and About retain their Day/Night state.
- Country and city selectors drive camera focus, route highlighting, Globe Scale, Reset, and City Info content through edge-docked sidebars.
- Map Tuning provides live saturation, contrast, and brightness adjustment plus a one-click reset; it defaults collapsed, while the sibling Globe Scale accordion defaults expanded.
- The Map control dock includes a Chinese/English selector shell; broader content translation remains a later design pass.
- Cities with imported drone records automatically show Drone Media below City Info and open each 360 panorama in a dialog over the map.
- World scale keeps the globe center fixed while the authored Cesium celestial layer supplies vector stars, differentiated zodiac figures, Milky Way and aurora ribbons, the Moon, and randomized shooting stars.
- Pointer illumination keeps its existing cyan/green ambient glow while adding a pure-white, speed-sensitive comet trail. The trail follows the sampled mouse path as a continuous tapered ribbon with a clean core and soft white bloom, remains active across the full viewport including the title and tabs, never intercepts globe input, and disables itself under reduced-motion preferences.
- The legacy react-globe implementation remains frozen for historical reference.
- Short viewports compress and scroll Memory Cards while keeping the map, camera, City Info, and Drone Media interactions intact.
- A private `MediaInbox` now follows `country / city / photos + drone`, matching the website's city-level display model. After preflight, the importer preserves originals and automatically generates a `640 px` thumbnail plus `2400 px` viewer preview for each supported still image; City Info, City Cards/Photos, and Drone Media therefore avoid decoding full-resolution files until an explicit viewing action. All personal derivatives remain outside Git.
- Personal travel records and display rules now load from ignored `travel-map.local.json`; a tracked neutral North Atlantic sample takes over automatically when no private overlay exists.
- Personal media is served only from ignored `public/media/user/` through an ignored local catalog. The application contains no built-in personal media record or tracked personal media path.
- `npm run privacy:check` enforces the current-tree boundary, while final open-source publication must use a new repository without this private project's Git history.

## Migration Notes

The project was copied, not moved, from `E:\AI_Workspace\TravelAtlas\01_Web`. Git history, branches, and tags were retained. Dependencies, build output, logs, local screenshots, and `.env.local` were deliberately excluded.

The old workspace remains untouched as a short-term rollback source. New development should happen only here.

## Relations

| Related location | Direction | Notes |
| --- | --- | --- |
| [[ProductionLab_project_index\|ProductionLab]] | Home | This folder is the unique active ProductionLab project |
| [[2026-08-12]] | Source ← | DiaryLab record for the UI/UX update, media import protocol, and public/private repository boundary work |
| [[2026-08-13]] | Source ← | DiaryLab record for the album upload UI, Journey design, Cesium ion token separation, private-media boundary, and private GitHub backup |
| `E:\AI_Workspace\TravelAtlas` | Historical backup | Read-only rollback copy during migration confidence period |

## Tags

#Project #Production #TravelAtlas #Cesium #React #Travel #OpenSource

## Structure Links

- ProductionLab: [[00_productionlab_index]]
- Project category: [[ProductionLab_project_index]]
- Project index: [[00_TravelAtlas_index]]
- Project Handoff: [[TravelAtlas_Handoff]]
- Media import protocol: [[TravelAtlas_media_import_protocol]]
- Open-source privacy boundary: [[TravelAtlas_open_source_privacy_boundary]]
