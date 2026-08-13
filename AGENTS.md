# TravelAtlas Agent Rules

> Scope: `E:\AI_Workspace\MediaLab\ProductionLab\04_Project\TravelAtlas`

## Read First

In the owner's MediaLab workspace, read the two parent rules first when they exist:

1. `E:\AI_Workspace\MediaLab\AGENTS.md`
2. `E:\AI_Workspace\MediaLab\ProductionLab\AGENTS.md`

In every workspace, including a standalone open-source clone, always continue with the local files in this order:

1. `TravelAtlas_README.md`
2. `TravelAtlas_Handoff.md` when present
3. `00_Index/00_TravelAtlas_index.md` when present
4. `01_Web/AGENTS.md`

Missing MediaLab parent files are expected in a standalone clone and are not a blocker. Local TravelAtlas rules remain authoritative for product and media-import work.

## Fast Task Routing

### Cesium ion token, map access, or deployment

When a user asks about Cesium ion, tokens, missing online imagery, open-source setup, or deployment:

1. Explain the two supported states first: no token keeps TravelAtlas runnable with bundled low-resolution Natural Earth II imagery; an ion token enables online global imagery and consumes the deploying account's quota.
2. Distinguish roles. Ordinary visitors use the deployed site's configuration and do not obtain a token. Every person who clones and deploys TravelAtlas supplies an app-specific token from their own ion account; never reuse or distribute the original author's token.
3. Never ask the user to paste a complete token into chat, and never read, echo, screenshot, log, copy, or store its value. Guide the user to enter it directly into ignored `01_Web/.env.local` for development or the hosting platform's environment settings for production.
4. Treat `VITE_CESIUM_ION_TOKEN` as a public-client credential: keeping it out of Git prevents repository disclosure, but a built static website necessarily exposes it to browser requests. Do not describe a Vite environment variable as a server-side secret.
5. Recommend separate development and production tokens from the same account. Explain that they share one account quota; separation exists for different Allowed URLs, per-token usage attribution, independent rotation, and limited revocation impact.
6. For production, require an app-specific token with only `assets:read`, only the required assets, and exact Allowed URLs for the final canonical domain. If the final domain or deployment target is unknown, explain the preparation but do not invent restrictions or request a production token yet.
7. When checking configuration, verify only file presence, Git-ignore coverage, or a masked/non-secret health result. Never inspect or report the complete value.

### Personal photo or drone-media import

When a user mentions uploading, importing, organizing, or adding travel photos or drone media:

1. Read `02_Assets/MediaInbox/README.md` first, then read `03_Reference/TravelAtlas_media_import_protocol.md` before inspecting or changing media.
2. If the user only asks how to upload, explain the folder workflow first; do not modify files or run the import.
3. If the user asks to perform the import, verify that every item has a reliable existing country and city, and that drone metadata is sufficient for the requested result.
4. If a country, city, media type, date, coordinate, privacy status, or intended use is missing or uncertain, ask the smallest necessary question and stop. Without a reliable answer, do not guess, copy, convert, catalog, or import that item. A zero-exit preflight does not override this stop rule when its warnings reveal unresolved data.
5. Source media inside `MediaInbox` is immutable. The only Agent-writable Inbox files are the private control sidecars `country.json` and city-level `media.json`; conversions and other derivatives must never be written there.

## Project Boundary

- This folder is the unique active home of TravelAtlas.
- The previous workspace at `E:\AI_Workspace\TravelAtlas` is a short-term rollback backup. Do not modify it unless the user explicitly asks.
- The runnable application lives in `01_Web/`; run all npm commands from that directory.
- Git is rooted at this project folder so code, project documentation, tests, and process records share one history.
- Do not create a second active TravelAtlas copy.

## Map Architecture

- Cesium is the primary Map implementation.
- Daily map, route, marker, camera, and drone-media work targets `01_Web/src/components/CesiumAtlasGlobe.tsx` and related Cesium components.
- `01_Web/src/components/AtlasGlobe.tsx` is legacy/frozen react-globe code. Keep it for rollback reference and change it only when explicitly requested.
- Preserve the existing Map / Journey / About structure and shared theme state unless the user asks for a structural change.

## Working Method

1. Read the current Handoff and choose one bounded task.
2. Inspect only relevant files; do not recursively scan `node_modules`, `dist`, `.git`, or large media folders.
3. Make surgical changes and verify them with `npm run lint` and `npm run build` from `01_Web/`.
4. Keep visual checks focused. Do not leave unbounded browser, terminal, or watcher sessions running.
5. Update `TravelAtlas_Handoff.md` after substantive work.

## Local Preview

Use the standard Vite entry from `01_Web/`:

```powershell
npm run dev -- --host 127.0.0.1 --port 5174
```

- Do not use a Node API wrapper to start Vite.
- Do not use `--host 0.0.0.0` unless explicitly requested.
- Check whether a port is already occupied before starting another server.
- Do not stop or interfere with servers belonging to other projects.

## Assets and Secrets

- Original project-owned media belongs under `02_Assets/`; browser-ready copies belong under `01_Web/public/`.
- Do not commit personal travel media to a future public template without an explicit publication review.
- Never read, print, copy, or commit `.env.local`, tokens, cookies, credentials, or secrets.
- Never ask a user to paste a complete token into chat or task output; direct entry by the user is the only acceptable configuration path.
- Document required variables only in `01_Web/.env.example`.

## Git

- Work on the current feature branch unless the user requests another branch.
- Do not push without explicit approval.
- Keep generated output, local review screenshots, dependencies, and environment files out of Git.

## Structure Links

- Project entry: [[TravelAtlas_README]]
- Project index: [[00_TravelAtlas_index]]
- Project handoff: [[TravelAtlas_Handoff]]
- ProductionLab projects: [[ProductionLab_project_index]]
