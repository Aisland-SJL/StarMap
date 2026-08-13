# TravelAtlas Handoff

## Current Task

Complete the responsive three-tier media pipeline, City Cards navigation, and adaptive Toledo photo viewer.

## Status

Completed on `feature/cesium-globe-prototype` and preserved by annotated tag `checkpoint-2026-08-14-media-pipeline-gallery`. Toledo now demonstrates the complete thumbnail / preview / original pipeline, clickable City Cards, an aspect-aware two-mode album, and optimized Drone Media previews.

## Completed

- Upgraded the private media importer to schema v2 with content-hashed resource folders and three explicit still-image variants: a `640 px` WebP thumbnail for cards, a `2400 px` WebP preview for the photo viewer, and an untouched original for full-detail or panorama use. EXIF orientation and intrinsic dimensions are preserved in the generated local catalog.
- Re-imported the current four Toledo photos and two panoramas without modifying their source Inbox originals. The current thumbnails total about `0.16 MiB` and previews about `2.34 MiB`, replacing full-resolution decoding during city entry and album browsing.
- Connected every relevant surface to the lightest adequate variant: City Info, City Cards, City Photos, filmstrip, and Drone Media use thumbnails; the focused photo viewer uses previews; the 360 viewer retains the original panorama.
- Made Spain's right-side City Cards fully interactive, with restrained glass hover/focus/press feedback and the same city-selection path as the left city list.
- Rebuilt the Cards overview as a responsive four-column masonry-style album that preserves every photo's native aspect ratio, uses smaller cards, and avoids horizontal overflow; focused Viewer images also preserve their own intrinsic proportions.
- Enlarged the Cards / Viewer switch, made Drone Media `01/02` badges white with rounded white borders, and enlarged the shared View label and expansion icon.
- Browser-verified City Card navigation, four-photo mixed-orientation Cards layout, focused portrait rendering, thumbnail/preview routing, Drone Media badges/actions, and zero album horizontal overflow.

- Linked the completed 2026-08-13 album/Journey, Cesium ion token-boundary, private-media, and private-repository work back to [[2026-08-13]] in DiaryLab; no implementation, token, or private photo content was changed.

- Added a centered glass `CityPhotoGalleryModal` with two persistent modes: clicking an individual City Photos tile opens that photo as the main image with previous/next controls and a bottom thumbnail strip; clicking the City Photos heading or panel background opens the four-photo card overview.
- Added restrained spring-like opening and photo-switch transitions, backdrop blur, outside-click/Escape close, keyboard left/right navigation, visible focus states, short-viewport CSS fallbacks, and a motion-reduction fallback without changing the underlying private media catalog.
- Reworked Toledo's two Drone Media previews into taller `4:3` center-cropped images, increased the `01/02` badges, removed the date row, and shortened `View 360` to `View`; the existing panorama selection and 360 viewer flow remain intact.
- Browser-verified both album entry paths, Cards/Viewer switching, direct card-to-photo navigation, thumbnail switching (`02 / 04` state), four real imported images, absence of Drone Media dates, and the responsive modal dimensions at the active viewport.
- Passed `git diff --check`, `npm run privacy:check`, `npm run media:check`, `npm run lint`, and the production `npm run build`; the sandboxed build first hit the known Windows native Tailwind permission condition, then passed outside the sandbox with only the existing non-blocking panorama chunk-size warning.

- Reconciled a user-initiated Toledo photo replacement: the Inbox already contained 4 new smaller JPEGs (about `2.0–4.6 MiB` each), so these new originals were preserved instead of being deleted.
- Removed only the 8 stale generated website copies from `01_Web/public/media/user/spain/toledo/photo/` (about `244 MiB` total) by sending them to the Windows Recycle Bin; the two panorama sources, `media.json`, and all other media remained untouched.
- Re-ran media preflight and import against the new set. The current private catalog now contains 4 ordinary Toledo photos plus the original 2 panoramas, with 4 matching local website copies and no large-file warning.

- Renamed Spain's section from `Memory Cards` to `City Cards` and retained the scoped two-column country-view experiment.
- Rebalanced every Spain city card around a true `4:3` image region, compressed its supporting text region, moved the two-digit index to the right of the Chinese city name, and increased the index from `9 px` to `11 px`.
- Preflighted and imported the 8 JPEG files supplied under the Toledo ordinary-photo folder. The importer matched Spain / Toledo without ambiguity and preserved all Inbox originals unchanged.
- Replaced Toledo's former city-index cards with a true `City Photos` album: eight two-column `4:3` image-only tiles with no title, date, or lower metadata region and internal vertical scrolling.
- Kept the generated web copies and `user-media.local.json` catalog outside Git under the existing private-media boundary; `npm run privacy:check` confirmed no owner photo or local catalog is exposed.
- Browser verification confirmed Spain's image ratio at exactly `4:3`, the name/index pairing at `12 px / 11 px`, all 8 Toledo images loaded at their native `7680 x 4320` or rotated dimensions, and the album tiles contain no text.
- Verified the default viewport plus a short `1365 x 768` viewport; City Info, album scrolling, Drone Media, and the bottom mouse guide retain separate regions without horizontal overflow.
- Passed `git diff --check`, `npm run privacy:check`, `npm run media:check`, `npm run lint`, and the production `npm run build`; only the existing non-blocking panorama chunk-size warning remains.

- Created the requested pre-experiment checkpoint before touching the Map layout: commit `669e22d`, annotated tag `checkpoint-2026-08-13-journey-redesign`.
- Scoped the new Memory Cards behavior to the Spain country view and Toledo city view only, leaving all other current countries and cities on the existing horizontal layout for direct comparison.
- Replaced the horizontal track with a compact two-column vertical card grid, reduced image and typography density, and assigned overflow to an internal vertical scrollbar instead of expanding the sidebar indefinitely.
- Renamed Toledo's section from `Memory Cards` to `City Photos`, preserving the existing card data while testing the requested city-photo information hierarchy.
- Replaced Toledo's `Panorama 01/02` header blocks with lazy-loaded previews from the real panorama sources, retaining the number, date, selection behavior, and `View 360` action without adding or exposing new media files.
- Browser-verified Spain and Toledo at the default viewport plus a short `1365 x 768` layout: the grid remains two columns, overflow stays inside the card region, both panorama thumbnails load, and City Info / Drone Media / the bottom mouse guide do not overlap.
- Passed `git diff --check` and `npm run lint`. The production `npm run build` passed outside the managed sandbox after the first sandbox attempt was blocked by the known Windows native Tailwind module / child-process permission condition; only the existing non-blocking panorama chunk-size warning remains.

- Removed the generic `.glass-panel` override from annual groups so their intended Timeline-derived gradient is no longer replaced by the darker opaque shared surface.
- Matched the Timeline panel's computed background gradients, border, `16 px` radius, inset/drop shadows, and `blur(28px) saturate(1.24)` backdrop filter exactly.
- Replaced the annual stack's `32 px` spacing with `18 px`, matching the measured command-panel-to-2026 gap; browser measurements confirmed top and inter-year gaps are all exactly `18 px`.
- Restored the annual heading and secondary-label colors explicitly after removing the generic glass inheritance, keeping `2026` legible on the more transparent surface.
- Browser verification confirmed identical Timeline/annual material values, no horizontal overflow, and no browser errors.
- Passed `git diff --check`, `npm run lint`, `npx tsc -b --pretty false`, and the full production `npm run build`; only the existing non-blocking panorama chunk-size warning remains.

- Added a shared `38 px` circular image-based flag to the left of each Year Cards country name, shifting the two-line country title group right while retaining the existing accent indicator.
- Removed the standalone `Year Cards` label above the annual groups and removed its reserved top padding.
- Browser geometry confirmed the first annual panel moved upward by `44 px`: its top edge now matches the Timeline section exactly with a `0 px` delta.
- Browser audit confirmed `15/15` country cards have loaded flag images, the redundant label count is zero, and neither wide nor `820 x 720` layouts produce document/card overflow or browser errors.
- Passed `git diff --check`, `npm run lint`, `npx tsc -b --pretty false`, and the full production `npm run build`; only the existing non-blocking panorama chunk-size warning remains.

- Removed the Toledo/Madrid-only preview gate and promoted the approved layout to the shared Timeline card used by all records.
- Every card now renders an image-based circular national flag, bold Chinese/English city line, and aligned regular-weight Chinese/English country line at `opacity: 0.5`.
- Removed generic journey titles, small trailing country labels, duplicate English-city summaries, and duplicate date ranges from every Timeline card; the left date column remains the single date source.
- Browser audit confirmed `51/51` cards, `51/51` loaded flag images, `51/51` country lines at `0.5` opacity, zero old title/summary nodes, and a maximum city/country left-alignment delta of `0 px`.
- Verified a representative first/middle/last sample and an `820 x 720` viewport with zero card or document horizontal overflow and no browser errors.
- Passed `git diff --check`, `npm run lint`, and the full production `npm run build`; only the existing non-blocking panorama chunk-size warning remains.

- Increased Timeline year markers from `13 px` to `15 px` and left-column dates from `12 px` to `14 px` without changing their spacing or color.
- Detected and reversed an initial over-broad numeric replacement before completion; browser measurements confirm the Map subtitle remains `13 px`, Map tabs remain `12 px`, and only the intended Timeline labels changed.
- Browser verification confirmed `15 px` year markers, `14 px` dates, and no document horizontal overflow.
- Passed `git diff --check`, `npm run lint`, and the full production `npm run build`; only the existing non-blocking panorama chunk-size warning remains.

- Reduced the complete `西班牙 Spain` line to `opacity: 0.5` on the Toledo and Madrid preview cards without changing its size, alignment, font family, or regular weight.
- Kept the city line at full opacity and bold weight, widening the visual hierarchy using a single restrained property instead of adding another size or color token.
- Browser verification confirmed the computed country-line opacity is exactly `0.5`; `npm run lint` and the full production `npm run build` passed with only the existing non-blocking panorama chunk-size warning.

- Increased Timeline year markers from `10 px` to `13 px` and all left-column dates from `10 px` to `12 px`.
- Added an explicit compact-preview state to Toledo and Madrid so their typography can be tuned without changing other Timeline records.
- Aligned the city and country lines to the same `x` coordinate and unified all four labels at `14 px` with the same color and line height.
- Set both Chinese and English city labels to `650` weight while setting both country labels to `500`, creating hierarchy through weight alone.
- Browser measurements confirmed matching `14 px` size/color, identical Chinese-line start position, correct `650/500` weights, and zero console errors.
- Passed `git diff --check`, `npm run lint`, `npx tsc -b --pretty false`, and the full production `npm run build`; only the existing non-blocking lazy panorama chunk-size warning remains.

- Added a deliberately scoped Toledo/Madrid Timeline preview: line one is Chinese city plus English city, and line two is Chinese country plus English country.
- Removed the small trailing `Spain`, generic `2026 欧洲旅行` title, duplicate English city, and duplicate date summary from only those two cards.
- Replaced the unreliable flag Emoji on the two preview cards with a `24 px` circular image-based Spanish flag, reusing the project's existing `flagCode` source.
- Browser-verified the first two cards have the new layout and real flag image while the following Portugal card retains the old layout for direct comparison; no browser errors were produced.
- Passed `git diff --check`, `npm run lint`, `npx tsc -b --pretty false`, and the full production `npm run build`; only the existing non-blocking lazy panorama chunk-size warning remains.

- Replaced the Drone-city Info panel's competing `flex: 1` override with a shrinkable content-sized rule, removing the empty vertical expansion that had pushed Drone Media toward the bottom guide.
- Preserved the DOM order and the persistent three-item mouse guide; Toledo now renders City Info, Drone Media, and the mouse guide as three continuous regions in both `1600 x 900` and `1280 x 720` viewports.
- Increased shared Panorama number badges from `10 px` to `12 px` and lowered the badge group by `3 px`, improving its alignment with the Panorama title/date block for all Drone Media cities.
- Browser verification confirmed both Panorama cards, all three mouse-guide items, `0 px` City Info-to-Drone gap, and zero new console errors.
- Passed `git diff --check`, `npm run lint`, `npx tsc -b --pretty false`, and the full production `npm run build`; only the existing non-blocking lazy panorama chunk-size warning remains.

- Replaced the ambiguous “higher quota / production usage” environment comment with the two supported runtime states: no token uses bundled low-resolution Natural Earth II, while a deployer-owned token enables Cesium ion online global imagery.
- Clarified the three roles throughout the project entry and Web guide: ordinary website visitors configure nothing, every independent deployer uses an app-specific token from their own ion account, and the original author's token never enters the open-source repository.
- Documented that a Vite client variable is excluded from Git but observable in browser requests, so production protection depends on an app-specific `assets:read` token, required-asset selection, exact Allowed URLs, monitoring, and rotation rather than false server-secret language.
- Explained that development and production tokens share one account quota and are separated only for environment-specific restrictions, usage attribution, independent rotation, and smaller revocation impact.
- Added a prominent Cesium token/deployment router to root `AGENTS.md` and a matching Web-level boundary: Agents must never request, read, echo, screenshot, log, copy, or store complete tokens; the user enters values directly into ignored `.env.local` or hosting settings.
- Kept runtime code, the current local environment, and the active preview unchanged; no real token was read or modified.
- Passed `git diff --check`, `npm run privacy:check`, `npm run lint`, and the full production `npm run build`; only the existing non-blocking lazy panorama chunk-size warning remains.
- Created pre-change rollback checkpoint commit `e988e89` with annotated tag `checkpoint-2026-08-13-map-mouse-controls` before starting the Journey redesign.
- Kept one Cesium viewer and one constellation/galaxy/aurora/moon/meteor scene mounted across Map and Journey; Journey hides only the Earth, map imagery, routes, markers, and camera input, so the background does not jump or restart during navigation.
- Added a coordinated Map/Journey transition using a non-linear `cubic-bezier(0.32, 0.72, 0, 1)` curve: both sidebars retract toward their nearest edge while the Journey foreground fades and rises from below, with the reverse motion on return to Map.
- Rebuilt Journey as translucent glass foreground panels over the shared animated night sky and forced Map/Journey to use the exact same header geometry, preventing title and navigation movement between tabs.
- Reversed the Journey timeline globally to newest-first; browser verification confirmed the opening sequence starts at `2026-05-19`, then proceeds backward through prior records.
- Restyled Timeline and Year Cards into the same restrained dark-glass language as Map, including responsive cards, view controls, statistics, hover/pressed states, reduced-motion behavior, and a scrollable short-viewport layout without horizontal overflow.
- Browser-verified Map → Journey and Journey → Map mid-transition states, persistent canvas identity, stable header geometry, both Journey views, and a compact viewport. A clean reload starts normally; the dev log contains only stale hot-reload diagnostics from the implementation session and the existing non-blocking Resium imagery-provider warning.
- Passed `npm run lint`, `npx tsc -b --pretty false`, `npm run privacy:check`, `npm run media:check`, `git diff --check`, and the full production `npm run build`; only the existing non-blocking lazy panorama chunk-size warning remains.
- Enabled Cesium tilt input at World scale while retaining the existing pre-render camera recentering, so middle-mouse orbit changes the viewing angle without allowing the globe center to drift; country and city camera behavior remain unchanged.
- Added a compact shared `MouseControlGuide` at the right-sidebar bottom with three custom vector mouse icons that illuminate the left button, middle button, or wheel for Drag, Rotate, and Zoom respectively.
- Matched the established Night and Day glass materials, kept the guide visually subordinate to City Info, synchronized its labels with the Chinese/English toggle, and removed it automatically with the sidebars on narrow layouts.
- Preserved short-viewport priority for City Info and Drone Media: the guide compresses to a `53 px` control strip at `720 px` height while Memory Cards retain their existing scroll ownership.
- Browser-verified overview, Toledo with Drone Media, `720 px` short viewport, narrow-screen sidebar collapse, and both language states. The only browser warning remains the existing Resium imagery-provider recreation notice.
- Passed `npm run lint`, `npm run privacy:check`, `npm run media:check`, `git diff --check`, and the full production `npm run build`; only the existing non-blocking panorama chunk-size warning remains.
- Added `.drone-media-entry` to the shared city-card glass, hover, active, focus, and pressed-state rules without changing its subordinate inset or typography size.
- Shortened the shared label from `无人机影像 / Drone Media` to `无人机 / Drone Media`, keeping the existing `11 px` type scale while eliminating ellipsis at the current sidebar width.
- Kept the Drone icon, selection behavior, city selection, map camera, and right-side Drone Media panel unchanged.
- Scoped both changes to shared `CountrySelector` and CSS rules, so all current and future cities with Drone Media receive the same result.
- Recorded full-view and normalized focused evidence in `design-qa.md`; no P0/P1/P2 findings remain.
- Passed `npm run lint`, `npx tsc -b --pretty false`, `npm run privacy:check`, `npm run media:check`, and `npm run build`; only the existing non-blocking panorama chunk-size warning remains.
- Removed the separate enclosing background from the shared Drone Media card so its transparency and map visibility match the right sidebar above and below it.
- Retained Panorama item cards as distinct interactive surfaces while removing only the mismatched section-level fill.
- Strengthened the existing top boundary into a full-width theme-aware divider between City Info and Drone Media.
- Scoped the rule to the shared `.drone-media-card` in `.atlas-right-stack`, so it automatically applies to all current and future Drone Media cities.
- Recorded full-view and normalized focused evidence in `design-qa.md`; no P0/P1/P2 findings remain.
- Passed `npm run lint`, `npx tsc -b --pretty false`, `npm run privacy:check`, `npm run media:check`, and `npm run build`; only the existing non-blocking panorama chunk-size warning remains.
- Removed the visible Chinese label from the fullscreen return action while retaining its English accessible name for assistive technology.
- Changed the control to a `44 x 44 px` circular glass button with a `20 px` Lucide arrow and a lighter `1.8` stroke weight.
- Increased the standard fullscreen inset from `18 px` to `32 px` on both top and left; compact viewports use `20 px` instead of `12 px`.
- Visually verified the new fullscreen position and confirmed the arrow returns to the still-open windowed panorama modal.
- Passed `npm run lint`, `npx tsc -b --pretty false`, `npm run privacy:check`, `npm run media:check`, and `npm run build`; only the existing non-blocking panorama chunk-size warning remains.
- Removed resolution from every Drone Media item card and promoted the date from `9 px` to `11 px`, directly beneath and aligned with its Panorama title.
- Consolidated the panorama modal's filename, middle separator, and resolution into one metadata line using a single muted color token.
- Preserved full provenance inside the modal while leaving panorama selection, loading, responsive sizing, fullscreen return, and map/city behavior unchanged.
- Recorded full-view and normalized focused comparisons for both supplied screenshots in `design-qa.md`; the pass has no remaining P0/P1/P2 findings.
- Passed `npm run lint`, `npx tsc -b --pretty false`, `npm run privacy:check`, `npm run media:check`, and `npm run build`; only the existing non-blocking panorama chunk-size warning remains.
- Kept the timeline marker inside a city-card-sized positioning wrapper, so Toledo and all future Drone Media cities retain the same center-left alignment as ordinary cities.
- Increased the panorama envelope from the previous `1280 x 760 px` cap to a responsive `94vw x 92dvh` layout capped at `1680 x 1120 px`, with a near-full-viewport fallback on narrow or short browsers.
- Retained filename provenance while reducing it to secondary metadata; media identity and loading remain data-driven and do not depend on the visible filename label.
- Added a subtle upper-left fullscreen return control that exits to the still-open windowed panorama modal; native Escape fullscreen handling no longer closes the modal in the same keystroke.
- Browser measurements confirmed the Toledo marker/card center delta improved from about `23.82 px` to `0.0065 px`; wide, compact, and fullscreen screenshots are recorded in `design-qa.md`.
- Passed `npm run lint`, `npx tsc -b --pretty false`, `npm run privacy:check`, `npm run media:check`, and `npm run build`; a cold preview reload and panorama open produced no new browser warnings or errors, and only the existing non-blocking panorama chunk-size warning remains.
- Added a prominent media-import task router near the top of root `AGENTS.md`; standalone clones now skip absent MediaLab parent rules and continue from local TravelAtlas documentation.
- Added one-sentence Chinese and English requests to the project entry and Media Inbox guide so users do not need to memorize commands or metadata rules.
- Separated the short user workflow, short Agent workflow, detailed execution protocol, and open-source privacy boundary into a clear progressive-disclosure hierarchy.
- Made uncertainty a blocking condition: an Agent must ask the smallest necessary question and must not guess, copy, convert, catalog, or import unresolved items, even when preflight exits successfully with a warning.
- Replaced the contradictory “Inbox is completely read-only” wording with one consistent rule: original media is immutable, while private `country.json` and city-level `media.json` are the only Agent-writable control sidecars.
- Reconciled documentation with the real importer: automated import supports only current browser-ready formats and existing private travel-data countries/cities; unsupported conversion and new-place creation are separate, user-approved tasks.
- Added root rules and media documentation to the documented clean-public-repository allowlist so unfamiliar Agents receive the same discovery path after cloning.
- Passed the stranger-Agent route assertions, JSON parsing, `git diff --check`, `npm run media:check`, `npm run privacy:check`, `npm run lint`, and the full production `npm run build`; only the existing non-blocking panorama chunk-size warning remains.
- Restored the `4 px` slider-to-label margin and increased Globe Scale bottom padding by `8 px`, so the complete control group moves upward rather than merely becoming denser.
- Browser measurement confirmed a `10 px` endpoint-label-to-panel-bottom distance and retained separation between the slider and labels.
- Passed `npm run lint`, `npx tsc -b --pretty false`, and `npm run build`; the existing panorama chunk-size warning remains non-blocking.
- Renamed the visible accordion heading from `Image Tuning` to `Map Tuning`; accessible slider labels remain technically precise to the Earth imagery layer.
- Passed `npm run lint`, `npx tsc -b --pretty false`, and `npm run build`; the existing panorama chunk-size warning remains non-blocking.
- Reduced the Globe Scale endpoint-label top margin from `8 px` to `4 px`; slider behavior and panel geometry remain otherwise unchanged.
- Passed `npm run lint`, `npx tsc -b --pretty false`, and `npm run build`; the existing panorama chunk-size warning remains non-blocking.
- Reversed the accordion cue to the requested action-oriented convention: up when collapsed, down when expanded.
- Reserved a non-interactive `36 px` Reset slot while collapsed so both chevrons retain the exact same horizontal coordinate through state changes.
- Browser measurement confirmed both chevrons remain at `x = 245.21 px` before and after toggling; hidden Reset actions produce no button or focus target.
- Passed `npm run lint`, `npx tsc -b --pretty false`, and `npm run build`; the existing panorama chunk-size warning remains non-blocking.
- Added independent accessible accordion state to Image Tuning and Globe Scale with `aria-expanded` and `aria-controls` relationships.
- Defaulted Image Tuning closed and Globe Scale open; slider and Reset controls are removed from the interaction tree while their panel is collapsed.
- Reused the same heading typography and spacing for both states, added a restrained `160 ms` chevron rotation and `140 ms` content reveal, and disabled both under reduced-motion preferences.
- Browser-verified both defaults, independent open/close behavior, repeated restoration to defaults, and the absence of current runtime errors.
- Passed `npm run lint`, `npx tsc -b --pretty false`, `npm run privacy:check`, `npm run media:check`, and `npm run build`; the existing panorama chunk-size warning remains non-blocking.
- Replaced the shared header title and subtitle only, preserving the existing banner position, typography scale, navigation spacing, and effects.
- Visually verified the longer subtitle remains a centered single line at the current wide preview without colliding with the navigation.
- Passed `npm run lint`, `npx tsc -b --pretty false`, and `npm run build`; the existing panorama chunk-size warning remains non-blocking.
- Added a dedicated `LanguageToggle` in the Map control dock, preserving the proven segmented-control size and interaction style while replacing Day/Night with `中文 / English`.
- Locked only the Map page to Night through an effective page theme; Journey and About retain their existing Day/Night capability to keep this first pass surgical.
- Connected the language selection to `html[lang]` (`zh-CN` / `en`) and retained the current mixed-language content until the broader copy architecture is approved.
- Browser-verified Chinese/English selection, Journey Day mode, return-to-Map Night locking, language-state retention, and zero current runtime errors.
- Passed `npm run lint`, `npx tsc -b --pretty false`, `npm run privacy:check`, `npm run media:check`, and `npm run build`; the existing panorama chunk-size warning remains non-blocking.
- Matched Image Tuning's heading, icon, internal padding, heading height, and Reset button to the sibling Globe Scale panel rather than maintaining a second miniature hierarchy.
- Browser measurements confirm both headings use identical typography and both Reset controls render at the same `35.99 × 35.99 px` size with an `8 px` radius.
- Added `Brightness` (`0.40–1.40`) below Contrast and connected all three controls directly to Cesium's imagery-layer properties.
- Replaced the Image Tuning summary pair with a compact glass Reset button that restores the current theme only.
- Preserved the existing Night defaults (`S 0.86 / C 1.08 / B 0.68`) and independent Day defaults (`1.00 / 1.00 / 1.00`).
- Hardened live development updates by merging each theme's stored tuning values with its defaults, preventing a newly introduced tuning property from producing an undefined render.
- Visually verified the three-row layout, Reset control, Day/Night defaults, Night restoration after theme switching, and a successful cold reload.
- Passed `npm run lint`, `npx tsc -b --pretty false`, `npm run privacy:check`, `npm run media:check`, and `npm run build`; the existing panorama chunk-size warning remains non-blocking.
- Replaced the enlarged hard-edged hover point with a cached SVG marker whose layer order guarantees the radial glow stays beneath the original core dot and white outline.
- Preserved the original `7 px` overview core and `12 px` selected-country core while giving only the soft gradient a larger `38 px` visual footprint.
- Visually inspected the Turkey markers at enlarged scale: the central color and white ring remain intact, the glow has no hard perimeter, pointer exit restores the native Cesium point, and runtime errors remain at zero.
- Passed `npm run lint`, `npx tsc -b --pretty false`, and `npm run build`; the existing panorama chunk-size warning remains non-blocking.
- Added a transient `hoveredCountryId` path from `CountrySelector` through `App` to the Cesium marker renderer, without reusing or mutating selection state.
- Limited activation to mouse pointer entry/exit on country buttons so touch interactions do not retain a false hover state.
- Applied a restrained country-accent marker halo (`11 px` point, `4 px` translucent outline) to all mapped cities in the hovered country while preserving selected-city priority.
- Visually verified Turkey: all three mapped points respond together, pointer exit restores them, `aria-expanded` remains `false`, and the overview state does not change.
- Passed `npm run lint`, `npx tsc -b --pretty false`, `npm run privacy:check`, `npm run media:check`, and `npm run build`; the existing panorama chunk-size warning remains non-blocking.
- Replaced the Moon's separate `czm_sunDirectionEC` shading with the globe's `czm_lightDirectionEC` Lambert formula (`0.9` diffuse multiplier and `0.48` shadow floor).
- Switched the Moon appearance to flat material output and disabled face-forward normals, preventing Cesium's camera-biased Phong pass from lighting the Moon a second time.
- Visually verified at a Moon-visible overview angle that the Earth and Moon share the same brighter-left / darker-right orientation while retaining the lunar surface texture.
- Passed `npm run lint`, `npx tsc -b --pretty false`, `npm run privacy:check`, `npm run media:check`, and `npm run build`; the existing panorama chunk-size warning remains non-blocking.
- Linked the 2026-08-12 DiaryLab work record to the project README for the UI/UX, media import, and privacy-boundary update; no application source was changed.
- Established `ProductionLab/04_Project/TravelAtlas/` as the new active project home.
- Preserved the existing Git history, branch, tags, and the current uncommitted right-panel experiment.
- Kept `E:\AI_Workspace\TravelAtlas` unchanged as a short-term rollback backup.
- Separated the runnable website (`01_Web`) from original media (`02_Assets`).
- Excluded `node_modules`, `dist`, logs, `.codex` review screenshots, and real environment files from migration.
- Scoped linting to the website source and Vite config.
- Changed the 360 panorama viewer to load only when a panorama is opened.
- Added project-level rules, navigation, performance notes, and verification boundaries.
- Installed a clean dependency tree in the new workspace.
- Passed `npm run lint` and `npm run build` after migration.
- Reduced the initial application JavaScript chunk from about 934 KB to about 343 KB by separating the panorama viewer.
- Made Drone Media a content-sized first row above the City InfoCard so its heading, both panorama entries, and both View 360 actions remain fully visible.
- Made the City InfoCard consume only the remaining right-column height and moved short-viewport compression and vertical scrolling into Memory Cards.
- Added compact behavior below 760 px viewport height and an extreme fallback below 680 px that removes only the decorative preview while preserving city metadata and Memory Cards.
- Verified the layout at 1440×900, 1440×700, and 1440×650 CSS viewports on local port 5175.
- Verified Drone item selection, camera-triggering state, and opening/closing the 360 panorama modal without browser errors.
- Passed `npm run lint` and `npm run build` after the right-column change.
- Created rollback checkpoint commit `e67b4b7` and annotated tag `checkpoint-2026-08-11-before-sidebar-layout` before the redesign.
- Replaced the centered Map title treatment with a full-width translucent, frosted-glass banner.
- Converted Country Maps and City Info into full-height left and right sidebars while keeping the Cesium globe and camera surface unobstructed in the center.
- Removed the two per-panel eye controls and added one bottom-center control that shows or hides both sidebars.
- Added automatic sidebar collapse below 1100 px and preserved manual drawer access at low widths.
- Preserved the Drone Media-above-City Info layout and verified Memory Cards scrolling at a 950 × 900 CSS viewport.
- Added `design-qa.md` and passed the side-by-side visual comparison against the annotated reference.
- Passed final `npm run lint` and `npm run build` for the sidebar redesign.
- Converted the top banner and both sidebars from rounded floating patches into a continuous viewport-docked frame with square outer corners.
- Changed drawer transitions to pure horizontal side slides without card-style opacity fades.
- Unified the right Drone Media and City Info surfaces into one drawer with a divider instead of a floating-panel gap.
- Added state-aware Cesium credit positioning: 12 px beyond the open left drawer, native lower-left when closed, and above the control dock at low widths.
- Limited Memory Cards height on tall viewports while preserving flexible compression and internal scrolling at short heights.
- Re-ran wide overview, drawer collapse, 950 × 900 manual reopen, Toledo Drone Media, logo clearance, overflow, and browser-console checks.
- Updated `design-qa.md` with equal-dimension full-view and focused logo comparisons; final result passed.
- Passed final `npm run lint` and `npm run build` for the edge-docked drawer refinement.
- Used the installed `awesome-design-md` skill to synthesize SpaceX, Linear, and Raycast references into a TravelAtlas-specific visual direction.
- Replaced the washed-out light drawer treatment with a continuous deep-space black and titanium-charcoal surface ladder so the Cesium map remains the visual protagonist.
- Unified the Banner, Country Maps, City Info, Drone Media, Memory Cards, and bottom controls around hairline borders, compact internal radii, off-white typography, and a restrained ice-blue focus color.
- Preserved country marker colors as data accents while removing competing cyan fills and heavy card shadows from the interface chrome.
- Verified Day overview, Toledo Drone Media, Night, and collapsed-drawer states with no document, left-drawer, or right-stack overflow at the current wide preview.
- Saved final visual evidence to `C:\Users\SJL\AppData\Local\Temp\travelatlas-frontier-ui-wide.png`, `travelatlas-frontier-ui-drone.png`, and `travelatlas-frontier-ui-night.png`.
- Updated `design-qa.md`; the frontier visual polish pass reports `final result: passed`.
- Passed `npm run lint` and `npm run build` after the visual-only polish.
- Created checkpoint commit `a9e840e` and annotated tag `checkpoint-2026-08-11-frontier-ui` before changing Globe Scale behavior.
- Removed the Overview-only camera-scale override so an unselected map now uses the same existing City / Country / World scale thresholds as selected states.
- Verified Overview Globe Scale from `3.15` to `1.00`: the camera zoomed while both country and city selection remained empty.
- Verified the existing selected-country path remained intact: selecting Spain restored `1.95`, and moving to City scale still selected Barcelona at `1.00`.
- Passed `npm run lint` and `npm run build` after the one-line camera-scale fix.
- Added a compact reset control to the right side of the Globe Scale heading, aligned exactly with the slider and World endpoint.
- Styled the control with the existing titanium surface, hairline border, muted icon, ice-blue hover/focus state, and pressed feedback.
- Wired Reset to clear country, city, and Drone Media selection, restore the overview scale, and replay the initial overview camera even when already in Overview.
- Verified select-Spain then Reset, repeated Overview Reset, accessible labeling, and zero document horizontal overflow in the open browser preview.
- Added normalized source/implementation evidence to `design-qa.md`; the reset-control pass reports `final result: passed`.
- Passed final `npm run lint` and `npm run build`; the existing lazy panorama chunk-size warning remains non-blocking.
- Created pre-MVP rollback checkpoint commit `b3b360b` and annotated tag `checkpoint-2026-08-11-before-constellation-mvp`.
- Added a Night-only Cesium celestial layer with 30 circular point primitives and two compact six-star constellations built from short branching lines.
- Placed the constellation layer in Cesium world space so it follows the existing 360-degree camera, remains naturally occluded by the globe, and does not intercept pointer input.
- Added a restrained `0.12 degrees/second` idle rotation and disabled it for `prefers-reduced-motion`.
- Kept Day mode, globe imagery, route markers, sidebars, camera controls, reset behavior, and all existing selection interactions unchanged.
- Hardened constellation cleanup so repeated Day/Night switching does not touch a destroyed Cesium viewer or blank the application.
- Verified the two-constellation overview, globe drag, natural occlusion, Reset, Day/Night removal and recreation, and absence of new runtime errors after the cleanup fix.
- Added OpenCLI/TravelAtlas full-view comparison evidence to `design-qa.md`; the Camera-Space Constellation MVP pass reports `final result: passed`.
- Passed final `npm run lint` and `npm run build`; the existing lazy panorama chunk-size warning remains non-blocking.
- Created rollback checkpoint commit `ac33905` and annotated tag `checkpoint-2026-08-11-drone-media-polish` before the dual-theme redesign.
- Changed the overview/reset distance from `3.15` to the slider maximum `3.25`; verified the input reports `value = max = 3.25` and the reset action returns to World overview.
- Aligned the Drone Media icon and content to the same 18 px right-drawer edge as Memory Cards and Panorama cards, enlarged the icon, and raised the two-line header to the City Info title hierarchy.
- Enlarged Panorama labels and their `01` / `02` number badges while retaining the existing two-column card layout and View 360 actions.
- Replaced the country-list bottom-divider rows with complete 16 px rounded liquid-glass buttons in both Day and Night themes, including full borders, inner highlights, depth, hover/selected states, and safe right inset for the colored glow dots.
- Changed Day map chrome from the shared dark system to a white translucent theme across the banner, tabs, drawers, panels, country buttons, bottom controls, and slider.
- Rejected and fully removed the fixed generated Milky Way experiment from the project because it did not belong to Cesium camera space.
- Restored Cesium's opaque scene background and native sky rendering so Night remains camera-relative and rotates with the globe view.
- Rebuilt Day Banner, tabs, both sidebars, nested information surfaces, country rows, and bottom controls around milky translucent glass, map-derived color, inner highlights, edge refraction, and a restrained cyan focus color.
- Used the installed `awesome-design-md` references with Apple as the primary glass/typography direction and Linear as the hierarchy/contrast guardrail.
- Verified Day World overview, Day Toledo with City Info and Drone Media, Night Toledo, Night World overview, theme switching, and Reset to `3.25` in the browser.
- Verified the final post-reload browser log window contains zero warnings or errors.
- Passed final `npm run lint` and `npm run build`; the existing lazy panorama chunk-size warning remains non-blocking.
- Passed final `npm run lint` and `npm run build`; the existing lazy panorama chunk-size warning remains non-blocking.
- Made the entire open right drawer intercept pointer input so blank space below Drone Media no longer clicks through to Cesium or changes the current city selection.
- Added Panorama toggle-off behavior: clicking the selected item again clears the media selection while preserving the Toledo City Info and automatic Drone Media card.
- Removed the selected-card vertical offset and added track breathing room so the complete ice-blue selection border remains visible on every edge.
- Removed DJI filenames from the compact Drone Media cards and enlarged the Panorama labels; filenames remain available in the 360 viewer header.
- Simplified every Drone Media header to the two-line `Drone Media` plus localized media title hierarchy, removing the redundant English city line.
- Converted the 360 viewer from a deep-blue replacement screen into a centered dialog over the dimmed original TravelAtlas map; outside-click and existing close controls dismiss it.
- Verified the six requested interaction and visual states in the browser, including Panorama select/deselect, blank-area interception, complete active outline, preserved dialog metadata, and zero console warnings or errors.
- Passed final `npm run lint` and `npm run build`; the existing lazy panorama chunk-size warning remains non-blocking.
- Prepared annotated checkpoint tag `checkpoint-2026-08-11-globe-reset-control` for this completed state.
- Reordered the right drawer so City Info remains first and Drone Media appears directly below its Focus row.
- Preserved the exact normal Toledo City Info position: before and after closing Drone Media, the InfoCard top, bottom, and height are identical.
- Changed the Drone Media divider from a bottom edge to a top edge so the visual boundary follows the new order.
- Verified the wide Toledo state, Drone Media toggle-off state, Panorama 01 selection, 360 viewer open/close, and browser console with no errors.
- Verified the short-viewport fallback keeps Drone Media fully visible while Memory Cards own internal scrolling and the document keeps zero overflow.
- Added normalized source/implementation evidence to `design-qa.md`; the City Info-before-Drone pass reports `final result: passed`.
- Passed final `npm run lint` and `npm run build`; the existing lazy panorama chunk-size warning remains non-blocking.
- Changed Drone Media panel visibility to derive from the selected city's media availability instead of the separate Drone Media focus state.
- Verified selecting Barcelona shows only City Info, while selecting Toledo immediately adds the unchanged Drone Media card below City Info.
- Preserved initial city-camera behavior: automatic card display leaves the Drone Media focus control inactive until the user explicitly activates it.
- Verified toggling Drone Media focus on and off no longer hides the card, and browser console checks returned no errors.
- Passed final `npm run lint` and `npm run build`; the existing lazy panorama chunk-size warning remains non-blocking.
- Expanded the Night celestial layer to 312 procedural Cesium point primitives: 240 ambient stars plus 72 nodes forming 12 compact constellations.
- Kept every authored star circular and vector/WebGL-rendered; no star image or bitmap background was introduced.
- Disabled Cesium's native Night skybox and changed the Night scene to a clean near-black field so the new constellation geometry is visible without the former low-resolution star texture.
- Locked the World-scale camera direction to the globe center on every render while preserving rotation and zoom; look, tilt, and translation remain available after entering country or city scale.
- Verified a long horizontal World drag retains the World overview state and slider maximum, then verified Spain and Toledo still transition to their existing `1.95` and `1.40` camera scales.
- Verified Toledo City Info and the automatic Drone Media panel remain complete after the World-only camera constraint, with zero browser errors.
- Passed final `npm run lint` and `npm run build`; the existing lazy panorama chunk-size warning remains non-blocking.
- Created checkpoint commit `cefe190` and annotated tag `checkpoint-2026-08-12-fixed-axis-vector-sky` before differentiating the zodiac constellations.
- Replaced the repeated six-node constellation template with twelve independent simplified bright-star topologies for Aries through Pisces, each with its own node count, edges, scale, rotation, and cyan/violet emphasis.
- Arranged the zodiac constellations around a tilted 360-degree belt so different silhouettes enter the visible sky as the user rotates the globe; no labels, bitmap art, or fixed page background were added.
- Expanded the deterministic environment field to 4,800 circular WebGL star points: 1,600 sparse base stars, 2,800 inclined-band stars, and 400 local-cluster stars.
- Added non-uniform density through two seeded voids, a narrow/broad galaxy-band mixture, four local clusters, and heavily weighted size/brightness variation.
- Increased idle celestial rotation from `0.10` to `0.32 degrees/second` (3.2x) while preserving the reduced-motion fallback.
- Verified multiple World rotations expose visibly different constellation outlines, the globe center remains fixed, and no new browser errors occur.
- Verified Spain `1.95`, Toledo `1.40`, City Info, automatic Drone Media, Day/Night switching, and Reset to World `3.25` remain intact.
- Passed final `npm run lint` and `npm run build`; the existing panorama chunk-size warning remains non-blocking.
- Created checkpoint commit `c23f321` and annotated tag `checkpoint-2026-08-12-zodiac-sky-motion` before adding the next celestial effects.
- Added a real Cesium geometry sphere for the Moon using Cesium's bundled lunar surface texture and a restrained diffuse/emissive material so crater detail remains visible at Night.
- Anchored the Moon in the initial camera view, then attached it to the same slow celestial rotation as the vector sky; camera rotation creates parallax and the Earth naturally occludes the Moon when their paths overlap.
- Added a 360-degree abstract Milky Way wash from three feathered WebGL ribbon layers in green, cyan, and violet, avoiding the hard neon core of Cesium's stock polyline-glow material.
- Added a pointer-following two-scale radial illumination layer that softly brightens both empty star field and globe imagery without intercepting drag, click, zoom, or sidebar input.
- Verified Night World overview, pointer illumination over space and Earth, globe drag with celestial parallax, natural lunar occlusion, Spain selection, Reset, and the absence of new browser warnings or errors.
- Passed final `npm run lint` and `npm run build`; the existing lazy panorama chunk-size warning remains non-blocking.
- Widened and strengthened all three feathered Milky Way ribbons while preserving their existing camera-relative rotation and soft edge falloff.
- Added a celestial-body-only expanded Earth-silhouette shader mask with a 96 km limb allowance so lunar overlap now respects the atmosphere/model outline instead of appearing inserted into the globe.
- Verified the Moon mask with a temporary direct-overlap position, then restored the intended upper-right composition after confirming only the properly occluded lunar cap remained visible.
- Added a procedural three-dimensional Sun to the Night celestial layer, using the real Sun/Moon physical radius-to-distance relationship so its apparent disk is only slightly larger than the Moon from the atlas viewpoint.
- Added a soft depth-tested radial corona around the Sun without introducing a fixed sky bitmap; the Sun, Moon, galaxy, stars, and constellations continue to share the same celestial motion system.
- Rechecked the final Night overview and browser runtime log, then passed final `npm run lint` and `npm run build`; the existing lazy panorama chunk-size warning remains non-blocking.
- Reworked the Sun from a warm textured sphere into a white-hot emissive core with a high-intensity inner bloom and a much broader feathered gold corona, without casting light onto the map or UI.
- Reduced the Earth-limb occlusion allowance from 96 km to 48 km, the midpoint between native geometry clipping and the previous expanded mask.
- Temporarily moved the Moon across the globe at several heights to verify the 48 km mask: a partial lunar cap now meets the atmospheric rim without the visible floating gap produced by the previous value, then the intended upper-right Moon position was restored.
- Added three softly animated WebGL aurora ribbons in emerald, cyan, and restrained violet; they sit behind the globe, share celestial rotation, remain depth-occluded, and do not intercept input.
- Tuned the aurora down from the first oversized top-edge test, moved it lower into the night sky, and extended the paths beyond the viewport so no hard ribbon endpoints remain visible.
- Reverified Spain focus at `1.95`, Reset at `3.25`, final Night overview composition, and an empty browser warning/error log.
- Fully removed the rejected custom Sun: geometry, apparent-size constants, emissive material, generated core/corona canvases, billboard collection, rotation updates, and cleanup branches are no longer present.
- Expanded the aurora from three to seven WebGL ribbons with broader horizontal reach and greater vertical coverage across the Night sky.
- Gave each aurora layer an independent tilt, wave amplitude, phase, width, opacity, and emerald/cyan/violet tone so the denser field reads as interleaved curtains instead of evenly spaced parallel stripes.
- Preserved the accepted 48 km Moon/Earth limb mask, Moon position, Milky Way, stars, constellations, World camera lock, and all existing map interactions.
- Reverified Spain focus at `1.95`, Reset at `3.25`, final expanded-aurora overview, and an empty browser warning/error log.
- Passed final `npm run lint` and `npx tsc -b`; the final `npm run build` invocation was blocked before execution by the desktop approval service's usage limit, while the immediately preceding celestial version's full build had passed with only the known lazy-panorama chunk warning.
- Kept the accepted seven-layer aurora bank at its existing proportions and replicated it into six independent banks at 60-degree intervals around the celestial Z axis, producing 42 animated ribbons around the full globe instead of stretching one local bank.
- Added bank-specific phase, height, wave-amplitude, and alternating tilt offsets so adjacent sectors overlap without exposing seams or reading as exact copies.
- Verified the aurora remains present across multiple globe rotations from the initial Africa view through Asia and the reverse side; the ring becomes naturally edge-on when viewed toward the polar axis.
- Reverified Spain focus at `1.95`, Reset at `3.25`, and an empty browser warning/error log after the 360-degree distribution.
- Reduced every aurora bank from seven ribbons to five, lowering the 360-degree field from 42 to 30 ribbons while retaining broad emerald atmosphere, cyan highlights, violet transition, and mint edge light.
- Added a shader-based longitudinal alpha feather over the first and last 24% of every ribbon so endpoints dissolve progressively instead of ending as visible rectangular cuts.
- Forced a clean Day/Night celestial-layer remount and inspected the aurora after additional horizontal World rotation to confirm the new endpoint treatment is active rather than a stale hot-reload primitive.
- Reverified Spain focus at `1.95`, Reset at `3.25`, and an empty browser warning/error log after the five-layer simplification.
- Passed final `npm run lint` and `npx tsc -b`; full `npm run build` remains unavailable because the desktop approval service usage limit is exhausted, while the immediately preceding celestial version's full build passed with only the known lazy-panorama chunk warning.
- Created checkpoint commit `700a8fa` and annotated tag `checkpoint-2026-08-12-five-layer-aurora-fade` before changing celestial vertical composition.
- Shifted all three Milky Way glow paths 7 degrees south while preserving their widths, tilt, animation, colors, and Earth occlusion.
- Lowered the Moon's initial camera-relative vertical offset from `0.29` to `0.18`, preserving its right-side placement, radius, surface texture, rotation, and 48 km Earth-limb mask.
- Kept the 360-degree aurora ring at its accepted height so the trial isolates the Milky Way and Moon as the only composition variables.
- Verified the rebuilt Night World overview after a full Day/Night remount: the Milky Way now crosses lower behind the globe and the Moon sits closer to the upper-right Earth limb without touching it.
- Reverified Spain focus at `1.95`, Reset at `3.25`, TypeScript compilation, linting, and an empty page warning/error log; country-scale focus naturally fills the map canvas and therefore still leaves little celestial background visible.
- The final `npm run build` reached Vite after TypeScript but remains blocked by the managed desktop sandbox (`EPERM` while loading the Tailwind native binding); no build error originates from the changed source.
- Changed the World overview target from latitude `25`, longitude `45` to Egypt-centered latitude `26.8`, longitude `30.8`, affecting only the initial and Reset overview camera.
- Made Night the default map theme so the celestial opening, including the Moon, is visible immediately on every fresh page entry; the Day toggle remains available and unchanged.
- Replaced the Moon's load-timing-dependent camera anchor with a deterministic position calculated from the fixed Egypt overview camera frame, eliminating variation caused by sampling the camera 360 ms into its opening flight.
- Passed the overview latitude, longitude, and camera height into the celestial layer so future overview-camera tuning keeps the opening Moon composition synchronized rather than duplicating hidden coordinates.
- Verified two consecutive fresh reloads produce the same Africa/Europe globe face and the same upper-right Moon placement.
- Reverified Egypt country focus at `1.95`, Reset to the Egypt overview at `3.25`, Day/Night recreation, and a separate clean page load with zero browser warnings or errors.
- Passed final `npm run lint` and `npx tsc -b`; full Vite build remains blocked by the managed desktop sandbox's existing Tailwind native-binding `EPERM` condition.
- Created checkpoint commit `aacb57b` and annotated tag `checkpoint-2026-08-12-egypt-moon-opening` before the new material experiment.
- Rebuilt the Night banner as translucent dark glass with 34 px frost, saturation, inner-edge scattering, and a restrained lower refraction line so the moving map and galaxy diffuse underneath it.
- Set both Night sidebars to roughly 80% transparency; the left drawer receives light frost while the right drawer remains an opacity-only surface as requested.
- Rebuilt country rows as roughly half-opaque frosted cards while preserving their existing hover, selected, and data-accent states.
- Reduced the opacity of right-side City Info, Memory Cards, and Drone Media surfaces without introducing blur into that drawer.
- Added a brighter Day equivalent with stronger frost and slightly denser nested surfaces so text remains legible over bright terrain.
- Verified World overview, Spain, Toledo with Drone Media, Day/Night switching, drawer collapse/reopen, and Reset returning Globe Scale to `3.25`.
- Passed `npm run lint` and `npx tsc -b`; full Vite build remains blocked before bundling by the managed desktop sandbox's existing Tailwind native-binding `EPERM` condition.
- Matched the Night left Sidebar base exactly to the right Sidebar at `rgba(2, 7, 14, 0.18)` with no backdrop blur, allowing stars and celestial color to remain sharp in the empty A region.
- Preserved the B-region country cards as layered half-opacity glass with `blur(20px) saturate(1.4)` and unchanged hover/selected treatments.
- Applied the same left/right base equality in Day mode using the existing brighter `rgba(236, 247, 253, 0.28)` opacity-only surface.
- Removed the Banner's bottom border color, lower inset highlight, and decorative `::after` refraction line in both themes while retaining its frosted body and upper glass highlight.
- Verified Day/Night material parity, Hide/Show both sidebars, Reset to `3.25`, and an empty browser warning/error log.
- Added an equal-size source/implementation comparison to `design-qa.md`; the transparent-base and borderless-Banner pass reports `final result: passed`.
- Passed `npm run lint` and `npx tsc -b --pretty false`; full Vite build remains blocked by the same managed sandbox Tailwind native-binding `UNLOADABLE_DEPENDENCY` / `spawn EPERM` condition.
- Created checkpoint commit `3638ca5` and annotated tag `checkpoint-2026-08-12-transparent-sidebar-borderless-banner` before removing the Banner container and adding the meteor trial.
- Removed every Map header surface layer in both themes: fill, blur, border, shadow, and decorative pseudo-elements; title, subtitle, and functional tabs remain in their existing positions.
- Added a low-frequency Night-only shooting star to `CesiumConstellationSky`: a white/cyan dual-point head and nine-segment tapered tail rendered as native Cesium primitives.
- Scheduled the first meteor approximately 4–7 seconds after entry, with a `1.18–1.52 second` pass followed by randomized `8–18.5 second` quiet intervals.
- Anchored each meteor path in three-dimensional world space from the current camera frame, preserving camera-relative projection instead of introducing a fixed page overlay.
- Disabled meteor scheduling when `prefers-reduced-motion: reduce` is active and added complete primitive cleanup on Night-layer remount.
- Raised Night imagery brightness from `0.58` to `0.62` and terrain `vertexShadowDarkness` from `0.30` to `0.38`, revealing more dark-side detail without removing the terminator.
- Captured a full Night overview and multiple meteor keyframes, then verified Spain `1.95`, Toledo near `1.38` with City Info and Drone Media, Day/Night remount, Reset `3.25`, and an empty browser warning/error log.
- Added visual and motion evidence to `design-qa.md`; the transparent-header, shooting-star, and night-limb pass reports `final result: passed` with motion review verdict `Approve`.
- Passed `npm run lint` and `npx tsc -b --pretty false`; full Vite build remains blocked by the managed desktop sandbox's existing Tailwind native-binding `UNLOADABLE_DEPENDENCY` / `spawn EPERM` condition.
- Extended only the left and right Sidebar base materials through the former 132 px header band; drawer content, scrolling, selection, and camera coordinates remain unchanged at their existing `top = 132 px` positions.
- Moved the complete central title group down 12 px as one unit, preserving its typography, copy, tab dimensions, and centered alignment.
- Increased shooting-star cadence from an `8-18.5 s` post-pass quiet interval to `3.2-7.8 s`, and shortened the first-entry wait to approximately `2.8-5.0 s`.
- Lengthened each shooting-star event to approximately `2.25-2.50 s` and routed it through the open sky lane beside the globe from the upper region into the lower half, while retaining the accepted head/tail luminance and perceived speed.
- Verified Night and Day full-height materials, Hide/Show transitions for both extended surfaces, Spain `1.95`, Toledo near `1.38` with City Info and Drone Media, and Reset to `3.25`.
- Passed final `npm run lint` and `npx tsc -b --pretty false`; `npm run build` again reached Vite after TypeScript and remains blocked only by the managed sandbox's existing Tailwind native-binding `UNLOADABLE_DEPENDENCY` / `spawn EPERM` condition.
- Lowered the complete title, supporting copy, and three-button cluster by another `12 px`, producing a cumulative `24 px` offset from the original containerless header position without changing its internal spacing or dimensions.
- Replaced the single repeated shooting-star lane with five upper-left-to-lower-right trajectory families, seeded with per-event position, size, duration, and path jitter while preventing immediate track repetition.
- Added two independent meteor slots so a second meteor can follow after `0.55-1.30 s`; ordinary follow-up starts remain randomized across `1.8-5.0 s`, allowing brief paired appearances without turning the sky into continuous noise.
- Kept shooting stars in Cesium world space and moved their spawn plane closer to the camera so both open-sky and over-globe trajectories remain readable while still responding spatially to camera movement.
- Added a smooth lunar half-shadow driven by Cesium's `czm_sunDirectionEC`, matching the same solar direction used by the globe and retaining a `0.48` shadow floor so crater detail remains visible.
- Raised Night imagery brightness from `0.62` to `0.68` and terrain `vertexShadowDarkness` from `0.38` to `0.48`; the terminator remains intact while the rear hemisphere is more legible.
- Verified multiple meteor lanes over the globe and open right sky, synchronized lunar shading, Day/Night removal and recreation, Spain at `1.95`, Toledo at `1.40` with automatic Drone Media, Reset at `3.25`, and an empty application warning/error log.
- Passed final `npm run lint` and `npx tsc -b --pretty false`; `npm run build` reached Vite after TypeScript and remains blocked only by the known managed-sandbox Tailwind native-binding `UNLOADABLE_DEPENDENCY` / `spawn EPERM` condition.
- Registered every first-party project Markdown file in `00_Index/00_TravelAtlas_index.md` and added a backlink from each file to the project index and entry.
- Used vault-relative path-qualified Wikilinks for the repeated `README.md` and `AGENTS.md` filenames, avoiding ambiguous Obsidian targets without renaming conventional files.
- Reconciled `TravelAtlas_README.md`, the Web README, and the verification README with the current Night-default Cesium, fixed-center World, celestial, sidebar, Reset, and Drone Media behavior.
- Verified `01_Web/AGENTS.md` is valid UTF-8 at the byte level; the apparent mojibake came from shell rendering, so its rule body was preserved and only navigation/port guidance was added.
- Completed the `neat-freak` documentation inventory and link-integrity pass without changing application source, environment files, generated folders, or the read-only rollback project.
- Raised both Night Sidebar bases and their top extensions from `rgba(2, 7, 14, 0.18)` to `rgba(2, 7, 14, 0.24)`, and both Day equivalents from `rgba(236, 247, 253, 0.28)` to `rgba(236, 247, 253, 0.34)`.
- Verified equal left/right and top-extension computed materials in Day and Night at `1600 x 900`, with unchanged nested cards, layout, map interaction, and an empty application warning/error log.
- Removed the selected-country `3 px` left rail and default focus outline; the selected state now uses an even low-contrast boundary, internal cyan/violet glass light, a country-accent radial glow, and an enlarged status point.
- Moved the country accent custom property to the country button so each selected surface can inherit its own data color without adding JavaScript state or a new component.
- Rebuilt city options in both themes with `16 px` backdrop blur, `12 px` internal radii, layered translucent gradients, inner highlights, restrained shadows, and a quieter glass selected state.
- Added `130-150 ms` press feedback and pointer-gated country hover movement while preserving reduced-motion behavior, keyboard focus visibility on unselected controls, disclosure timing, and all selection callbacks.
- Verified Night Spain, Night Toledo, Day Toledo, city selection, Drone Media availability, map camera changes, computed materials, and an empty browser warning/error log.
- Added `02_Assets/MediaInbox/` as the only user-facing bulk delivery location, using the city-aligned `country / city / photos + drone` structure with Chinese/English folder aliases.
- Added read-only `npm run media:check` and guarded `npm run media:import` commands. The importer matches existing TravelAtlas countries and cities, hashes file contents into stable paths, reports unresolved files, never overwrites source media, and refuses to apply while structural errors remain.
- Kept new Inbox media, generated browser copies, and generated `*.local.json` catalogs out of Git while preserving all pre-existing Toledo prototype media.
- Connected imported ordinary city photos to City Info previews and Memory Cards, and merged metadata-complete panorama / aerial-photo entries into the existing Drone Media data flow.
- Added the durable [[TravelAtlas_media_import_protocol]], JSON Schema, privacy boundary, failure rules, Agent instructions, and project/index documentation links.
- Added a speed-sensitive, direction-aware comet tail to the existing pointer glow. It scales length and thickness with mouse movement, fades after motion stops, stays `pointer-events: none`, retains a quieter Day treatment, and disables under `prefers-reduced-motion`.
- Verified the new `country / city / photos + drone` parser with a temporary Spain / Toledo fixture: one city photo and one metadata-complete panorama were recognized correctly in read-only preflight, then the test fixture was removed.
- Verified in the live 5175 preview that the comet tail activates with a direction/length vector, Spain and Toledo remain clickable, Toledo City Info and Drone Media still open, and the trail cannot intercept pointer input.
- Passed `npm run media:check`, `npm run lint`, and `npx tsc -b --pretty false`. `npm run build` again reaches Vite after TypeScript and is blocked only by the existing managed-sandbox Tailwind native-binding `UNLOADABLE_DEPENDENCY` / `spawn EPERM` condition.
- Removed the obsolete tracked `02_Assets/SourceMedia/` folder after explicit user approval. It contained only the two duplicate Toledo panoramas (24.03 MiB total). Future source delivery goes only through the private, source-preserving `MediaInbox` workflow.
- Created checkpoint commit `093179f` and annotated tag `checkpoint-2026-08-12-before-privacy-split` before changing the data-loading architecture.
- Migrated all 105 owner travel records, their display rules, overview target, country codes, and 51 resolved coordinates into ignored `01_Web/src/data/generated/travel-map.local.json`.
- Replaced the tracked personal travel export with a five-record North Atlantic public sample and made the application prefer the private local overlay unless sample mode is explicitly forced.
- Removed owner-specific country allowlists, country flags, Azores handling, hidden-city logic, initial overview coordinates, and journey grouping from application code; these are now data-driven private display settings.
- Moved unused legacy personal journey/mock data into ignored `02_Assets/PrivateData/legacy/` rather than discarding it.
- Copied the two Toledo panoramas into the source-preserving private Inbox, imported hash-stable browser copies into ignored `public/media/user/`, and generated an ignored `user-media.local.json` catalog with the existing stable item IDs and metadata.
- Removed tracked Toledo runtime photos and built-in Toledo entries from `droneMedia.ts`; all personal Drone Media now comes from the private catalog.
- Replaced owner-specific debug camera methods with a generic `flyToDroneItem(itemId, height)` development API.
- Added `travel-map.schema.json`, [[TravelAtlas_open_source_privacy_boundary]], `npm run privacy:check`, and public/private data instructions across project docs and Web Agent rules.
- Replaced every publishable Inbox and prototype example with the neutral Iceland / Reykjavik sample while keeping the owner's ignored personal Inbox unchanged.
- Added a development-only `?data=sample` override for release QA without editing `.env.local`; returning to the base URL restores the normal local-first personal mode.
- Verified personal mode on port 5175: Spain and Portugal remain present, Iceland is absent, Toledo City Info still exposes both imported Panorama entries, and View 360 opens as a dialog over the original page with its DJI filename retained in the viewer header.
- Verified public sample mode on the same preview: only Iceland and Faroe Islands appear, Reykjavik opens normally, and no personal Spain or Drone Media content is present.
- Passed `npm run privacy:check`, `npm run media:check`, `npm run lint`, `npx tsc -b --pretty false`, JSON parsing, and `git diff --check`. The final `npm run build` passed outside the managed sandbox; the sandbox-only first attempt hit the known Windows native-binding `EPERM` restriction.
- Replaced the single rotated CSS streak with a DPR-aware Canvas trail that retains up to 620 px / 680 ms of recent mouse history and smooths real pointer samples with a Catmull–Rom curve.
- Added progressive width, alpha, three-layer cyan-white glow, and a radial head so the path narrows and dissolves toward its tail instead of ending as a flat rectangle.
- Added coalesced-pointer fallback, a 96-point rendering ceiling, animation-frame scheduling, automatic idle fade, Day/Night strength tuning, and complete reduced-motion cleanup; the canvas remains `pointer-events: none`.
- Used a temporary slow-fade QA mode to inspect the complete curve in the live 5175 preview, then removed the QA path and restored the production `680 ms` history / `320 ms` fade values.
- Reverified that Spain and Toledo remain selectable through the overlay and that no temporary `debugCursorTrail` behavior remains in the application.
- Passed final `npm run lint`, `npx tsc -b --pretty false`, `npm run privacy:check`, `npm run media:check`, and the full production `npm run build`; a clean post-reload browser window reported zero warnings or errors.
- Replaced the trail's cyan/blue segmented strokes with three pure-white continuous tapered ribbon passes: a crisp core plus two progressively softer white bloom layers.
- Rebuilt each ribbon as one filled outline instead of many short stroked segments, eliminating visible joins and producing a cleaner edge on curved pointer paths.
- Kept the accepted cyan/green ambient cursor illumination unchanged; only the moving comet trail and its head are now pure white.
- Moved pointer sampling from the Cesium shell's React handler to a passive capture listener on the current window, so the trail remains continuous over the Travel Atlas title, supporting copy, and tabs without intercepting them.
- Used a temporary slow-fade inspection to confirm the white path crosses the title region, then restored the production `680 ms` history / `320 ms` fade values and removed all QA-only timing.
- Passed `npm run lint`, `npx tsc -b --pretty false`, `npm run privacy:check`, `npm run media:check`, `git diff --check`, and the full production `npm run build`; only the existing non-blocking lazy panorama chunk-size warning remains.

## Current Functional Baseline

- Cesium is the primary Map implementation.
- Map / Journey / About and shared Day / Night state are present.
- Country and city selectors, routes, camera focus, InfoCard, Drone Media, and 360 panorama flow are present.
- Legacy react-globe files remain frozen under `01_Web/src/components/`.

## Pending

- Review the Spain/Toledo layout sample; if approved, generalize the two-column grid and city-photo naming/data rules to the remaining country and city panels.

- Review the cumulative 24 px title-group offset, randomized meteor density/overlap, lunar half-shadow, and brighter Earth/Moon dark-side balance.
- Continue importing future media through the source-preserving `02_Assets/MediaInbox/` and ignored local data overlay; only private `country.json` and city-level `media.json` sidecars may be Agent-authored there.
- At actual open-source release time, create a new repository from the documented allowlist; never publish this private repository's existing `.git` history.
- A country-level gallery and drone-video player are deliberately deferred; those files are cataloged but not yet surfaced in the current UI.
- Continue the next bounded Cesium camera or map UI task from this fixed-axis, constellation-enabled sidebar baseline.
- Continue camera and UI work only from this ProductionLab project.
- Before public release, create the documented clean-history export, run `npm run privacy:check`, and perform a final media/license audit.

## Required Checks

From `01_Web/`:

```powershell
npm run lint
npm run build
npm run privacy:check
npm run media:check
```

## Notes for the Next Agent

- Read the project and web-level AGENTS files before editing.
- For any photo or drone-media request, follow the root media-import route; explain first, ask when uncertain, and import only after the Inbox preflight is genuinely resolved.
- Do not modify the old workspace unless SJL explicitly requests rollback work.
- Do not copy the old `.env.local`; create a local target environment file manually when needed.
- Preserve the unified sidebar control, right-panel grid, and Memory Cards scroll ownership unless a new visual requirement replaces them.
- `CesiumAtlasGlobe.tsx` and `index.css` are large; split them only in bounded, behavior-preserving phases.

## Structure Links

- Project entry: [[TravelAtlas_README]]
- Project index: [[00_TravelAtlas_index]]
- ProductionLab projects: [[ProductionLab_project_index]]
