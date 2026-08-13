# AGENTS.md

## 本地预览 / Dev Server

TravelAtlas 是 Vite React 项目。

每次需要本地预览时，必须在项目根目录内启动：

```bash
npm run dev -- --host 127.0.0.1
```

项目根目录是：

```text
E:\AI_Workspace\MediaLab\ProductionLab\04_Project\TravelAtlas\01_Web
```

禁止事项：

1. 不要在 `C:\Users\SJL` 或其他目录运行 `npm run dev`；
2. 不要使用 Node API 临时启动 Vite；
3. 不要使用自定义 `.vite-cache` / `vite-dev-cache`；
4. 不要使用 `--host 0.0.0.0`，避免触发 Windows 防火墙和管理员权限弹窗；
5. 不要反复启动多个 dev server；
6. 如果 `localhost:5173` 白屏，优先检查 Vite 缓存 / 依赖预构建问题，而不是先改业务代码；
7. 如果需要强制刷新依赖，优先使用：

```bash
npm run dev -- --host 127.0.0.1 --force
```

以后启动预览时，只使用标准方式：

```bash
npm run dev -- --host 127.0.0.1
```

不要再使用临时 Vite 启动脚本或自定义缓存路径。

Port 5174 被只读回滚项目占用时，使用 5175；不要停止或修改旧项目。

## Cesium ion Token Boundary

- A missing `VITE_CESIUM_ION_TOKEN` is a supported state: TravelAtlas must remain runnable with the bundled low-resolution Natural Earth II map.
- Online global imagery uses the token and quota of the person who develops or deploys that copy. Ordinary website visitors do not configure tokens; open-source users must never inherit the original author's token.
- Never ask for, read, echo, screenshot, log, copy, or store a complete token. The user enters development values directly into ignored `.env.local` and production values directly into the hosting platform.
- A Vite environment variable stays out of Git but is observable in the built browser application. Production safety comes from an app-specific token, `assets:read` only, required-asset selection, exact Allowed URLs, monitoring, and rotation.
- Development and production tokens share the same ion account quota. Keep them separate for environment-specific restrictions, usage attribution, independent rotation, and smaller revocation impact.
- Do not create or configure a production token until the final deployment domain is known. Verification may check only presence, ignore coverage, masked output, and map behavior; never inspect the full value.

## Primary Map Implementation

- From now on, the Cesium implementation is the primary Map implementation.
- Daily map development must target `src/components/CesiumAtlasGlobe.tsx` and related Cesium components.
- The old `src/components/AtlasGlobe.tsx` react-globe implementation is legacy and frozen.
- Do not modify the legacy react-globe Map unless the user explicitly asks for legacy map changes.
- When the user says "map", "globe", "route", "city marker", or "camera", assume they mean the Cesium implementation.

## Personal Media Import

- Treat any request about uploading, importing, organizing, or adding photos or drone media as a routed media-import task. Read the short [[ProductionLab/04_Project/TravelAtlas/02_Assets/MediaInbox/README|Media Inbox README]] first, then [[TravelAtlas_media_import_protocol]] before execution.
- If the user only asks how to upload, explain the folder workflow and stop; do not modify files or run the import.
- If any country, city, media type, date, coordinate, privacy status, or intended use is missing or uncertain, ask one focused question and stop. Without a reliable answer, never guess or import that item; a preflight warning about unresolved data remains blocking even when the command exits successfully.
- Treat `02_Assets/MediaInbox/<real-country>/`, `public/media/user/`, and `src/data/generated/*.local.json` as private local data; never add them to Git.
- Run `npm run media:check` before `npm run media:import`.
- Never guess an unresolved country, city, or drone coordinate, and never delete source media or generated history without explicit confirmation.
- Ordinary city photos feed City Info and Memory Cards. Drone items require complete metadata before they may enter Drone Media.
- Source media in `MediaInbox` is immutable. The only Agent-writable Inbox files are `country.json` and city-level `media.json`; conversions and all other derivatives must stay outside Inbox.

## Public Template and Private Overlay

- Read [[TravelAtlas_open_source_privacy_boundary]] before changing travel data, publication structure, or deployment.
- The tracked `src/data/travel-map.sample.json` must remain neutral, runnable, and free of owner data.
- Personal countries, cities, routes, coordinates, and display rules belong only in ignored `src/data/generated/travel-map.local.json`.
- Do not add built-in personal items to `droneMedia.ts`, personal coordinate tables, or tracked public media paths.
- Run `npm run privacy:check` before any public-release preparation.
- Never publish this repository's existing `.git` history. Create the eventual public repository from the documented allowlist with a fresh history.

## Structure Links

- Project entry: [[TravelAtlas_README]]
- Project index: [[00_TravelAtlas_index]]
- Project rules: [[ProductionLab/04_Project/TravelAtlas/AGENTS|TravelAtlas Agent Rules]]
- Web workspace: [[ProductionLab/04_Project/TravelAtlas/01_Web/README|Web README]]
- Media import protocol: [[TravelAtlas_media_import_protocol]]
- Open-source privacy boundary: [[TravelAtlas_open_source_privacy_boundary]]
