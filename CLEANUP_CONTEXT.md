# QRafty Deep Cleanup — Context & Execution Plan

> Status: **executed through T4.7.** T1 (`986b114`), T1b (`9235f99`), T1c (`ae0ccc5`), T2 (`0b04881`), T3 (`27d5c2d`), T4.0 (`6c840d1`), T4.1 (`343a7d9`), T4.2 (`5215ebf`), T4.3 (`0c3610f`), T4.4 (`efd9f5f`), T4.5 (`1fe8429b`), T4.6 (`1764773`), T4.7 (`b75591f`). Remaining: plan item 9 (test rewrite) and the T5 manual prop pass.
> Every tier is one commit and must leave `pnpm typecheck && pnpm test && pnpm lint && pnpm knip && pnpm exec fallow dead-code && pnpm build` green.

---

## 1. Goal

Make the repo lean. The app looks fine on the surface, but the code carries 4 months of revisions: dead chains that are still imported, CSS for components that no longer exist, three token layers, legacy "glass" chrome, saved-draft persistence nobody wants, and half-removed features (scene templates, icon rail).

knip/fallow report "clean" because:

- dead chains are still _imported_ (just never rendered/read),
- CSS selectors and `var(--x)` live in strings/CSS, which those tools don't analyze,
- the `ToolbarController` is assembled from spreads, so dropped consumers never cause a type error.

The audit used custom detectors (kept in `.audit-tmp/`, re-runnable, delete when done):

| Script                                    | What it finds                                                              |
| ----------------------------------------- | -------------------------------------------------------------------------- |
| `.audit-tmp/slot-audit.mjs`               | CSS `[data-slot="x"]` selectors whose slot is never rendered               |
| `.audit-tmp/dead-rules.mjs`               | CSS rules where _every_ selector targets a dead slot/class (+ line counts) |
| `.audit-tmp/token-map.mjs`                | CSS custom properties defined but never `var()`-read, pure aliases         |
| `.audit-tmp/ctrl-fields.mjs`              | `ToolbarController` fields no consumer reads                               |
| `.audit-tmp/dead-props.cjs`               | TS property signatures written but never read (TS language service)        |
| `.audit-tmp/never-set.cjs`                | optional props that are read but never passed (noisy — spreads)            |
| `.audit-tmp/filter-props.mjs`             | filters `dead-props.txt` to strong candidates                              |
| `pnpm exec fallow dead-code --production` | exports/files only reachable from tests                                    |

## 2. Baseline (measured 2026-09-28)

- Product code: **~98.8k LOC** (TS/TSX/CSS, excl. tests + vendored qrcodegen). Tests: **~20k LOC** (126 files).
- `features/canvas` 36.2k · `features/shell` 26.3k · `features/qr` 13.6k · `components` 14.3k · `packages/qr` 8.5k · `lib` 1.4k.
- CSS: 5,051 lines + 532-line runtime-injected CSS string (`workspace-styles.tsx`). **373 `!important`**.
- Tests 942/942, lint 0 errors / 202 warnings, react-doctor 100/100, build green.

## 3. Locked decisions

| Topic                       | Decision                                                                                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Features                    | All stay (wallpapers, illustrations, logo search, cropper, emoji picker, QR animation/coloring/shaders/export) **except** the two below           |
| Draft persistence           | **Remove.** No saving the design across reloads (IndexedDB/localStorage). Reload = fresh default document                                         |
| Undo / redo                 | **Keep exactly as is** (in-memory snapshot stack in `use-canvas-history.ts`)                                                                      |
| Scene templates             | **Remove** the old scene-template system (layout presets, template preview mode, `sceneCompositionByNodeId`)                                      |
| Size presets                | **Keep** (`size-templates.ts`, `CanvasRatioPresetRow`, canvas ratio presets)                                                                      |
| Chrome style                | **Flat.** No glass, no backdrop-blur. **Only desktop popovers keep a shadow**                                                                     |
| Theme                       | **`next-themes` stays** and becomes the single theme source                                                                                       |
| Primitives                  | Target is **Base UI only**, but the Radix→Base UI swap is a _later_ separate tier (it is a rewrite, not a deletion). Ark UI goes in T1 (1 import) |
| Icons                       | Remove unused/animated icons. Keep lucide (main) + `react-icons/si` (brand logos, lucide has none). Hugeicons: decide later (8 files)             |
| Preferences in localStorage | Theme + sound on/off stay (they are preferences, not the document)                                                                                |
| Mobile                      | Keeps dedicated UX (rail, drill-down, drawer); shares store/model/controls                                                                        |
| Parity                      | No visual/behavior regressions except the intentional flat-chrome change. T4 is gated by golden snapshots                                         |

## 4. Size estimate

| Tier                            | LOC cut                                           |
| ------------------------------- | ------------------------------------------------- |
| T1 dead code                    | ~4–5k                                             |
| T1b remove draft persistence    | ~0.8k (+ tests)                                   |
| T1c remove scene templates      | ~0.5–0.8k                                         |
| T2 dead CSS                     | ~0.8–1k                                           |
| T3 flat chrome + tokens + theme | ~1–1.5k                                           |
| **T1–T3 subtotal**              | **~7.5–9k**                                       |
| T4 architecture                 | ~25–30k product, ~10k tests                       |
| Later: Radix → Base UI          | ~0 (swap)                                         |
| **End state**                   | product **~99k → ~60–65k**, tests **~20k → ~10k** |

---

## 5. Execution plan

### T1 — Dead code (no behavior change)

**T1.1 Dead icon-rail chain (~2.1k LOC, measured 2,085)**
`TOOLBAR_TOOLS` (icons for the old left icon rail) is built every render but `renderIcon` is never called; `visibleToolbarTools` / `activeToolConfig` are never read.

- Delete `features/shell/model/toolbar-tools.tsx`.
- Delete animated icons only it uses: `components/ui/{download,layers,message-circle,play,receipt-text,grip}.tsx`, `components/ui/animated-icon-controls.tsx`.
- Delete `components/vendor/animate-ui/` entirely (icon runner, `blocks`, `slot`, `use-is-in-view`; 1,414 LOC).
- Delete `features/canvas/model/workspace-editing-mode.ts` + its test (`getVisibleToolbarToolIds` returns a constant).
- Remove `ToolbarTool`, `ToolbarGroup` from `features/shell/model/toolbar-types.ts`.
- Remove unused `TOOLBAR_TOOLS` import in `features/shell/components/WorkspaceChrome.tsx`.
- **Keep** `components/ui/search-icon.tsx` (rendered in the logo picker search).

**T1.2 Settings-model fallback (~250 LOC)**
`use-toolbar-settings-model.ts` keeps its own local state (`useSettingsSlices`, `useContentState`) for when no controller is passed. Production always passes one (`Workspace.tsx`); only tests rely on it.

- Make `controller` required in `useToolbarSettingsModel` and `WorkspaceChrome`.
- Delete `useSettingsSlice`, `useSettingsSlices`, `useContentState`, the `overrideFields` tuple mapping; map `actual*` straight from the controller (`?? noop` for optional handlers).
- Remove model fields no consumer reads: `actualEncodedContentValue`, `actualAccessibilitySettings`, `actualBackgroundSettingsTab`, `actualEffectsSettings`, `actualLayoutSettings`, `actualSceneTemplateSettings`, `actualTextSettings`, `activeToolConfig`, `visibleToolbarTools`, `onAccessibilitySettingsChange`, `onBackgroundSettingsTabChange`, `onEffectsSettingsChange`, `onLayoutSettingsChange`, `onTextSettingsChange`.
- Tests that pass partial/no controller (`WorkspaceChrome.test.tsx`, `ElementSettingsPanel.test.tsx`, `CanvasSurface.test.tsx`) switch to `createToolbarController()` from `test-utils/toolbar-controller.ts`.

**T1.3 Unconsumed `ToolbarController` fields (~400–900 LOC incl. cascade)**
Fields produced in `features/canvas/components/chrome-controller.ts` but never read by any UI:

- `encodedContentValue`, `accessibilitySettings`, `effectsSettings`, `layoutSettings`, `textSettings`, `backgroundSettingsTab`
- every `on*Reset`: `onContentReset`, `onPatternReset`, `onLogoReset`, `onCornersReset`, `onShapeReset`, `onMotionReset`, `onEncodingReset`, `onAccessibilityReset`, `onImageReset`, `onBackgroundReset`, `onEffectsReset`, `onLayersReset`, `onExportReset`, `onTextReset`, `onResetDefaults`
- `onAccessibilitySettingsChange`, `onEffectsSettingsChange`, `onTextSettingsChange`, `onBackgroundSettingsTabChange`, `onLayoutPresetSelect`, `onLayoutSettingsChange`
- `canvasTool`, `onCanvasToolChange`, `onAddTextLayerAt`, `canRemoveQrCode`, `onRemoveQrCode`, `onSave` (verify each with grep before deleting — `sceneTemplateSettings` looked dead to TS but IS read by `MobileLayerToolbar` / `WorkspaceChrome`; keep it)

Steps:

1. Remove the fields from `ToolbarController`.
2. Remove matching params from `CoreControllerParams` / `QrSettingsControllerParams` / `SceneControllerParams` / `CanvasControllerParams` / `ExportControllerParams` / `LayersControllerParams` and their literal wiring in `buildCanvasWorkspaceController`.
3. Remove now-unused snapshot outputs in `features/canvas/components/chrome-settings-snapshots.ts` (accessibility, effects, layout, text…).
4. Re-run `pnpm knip` + `fallow dead-code` and delete the cascade (e.g. `resetDesktop*`, `updateDesktopAccessibilitySettings`, `updateDesktopTextSettings`, `resetCanvasWorkspace` in `use-canvas-actions.ts`; unused `DEFAULT_DESKTOP_*` in `toolbar-defaults.ts`; now-unused types `AccessibilitySettings`, `EffectsSettings`, `LayoutSettings`, `TextSettings`, `BackgroundSettingsTab`). Repeat until clean.

**T1.4 Test-only production code (~1k LOC)**
`fallow dead-code --production` lists 4 files + 64 exports reachable only from tests. Delete the code _and_ the tests that pin it. Highlights:

- Files: `lib/svg-path-to-vertices.ts` (→ drop `svg-path-commander` dep), `features/qr/styles/qr-style-option-preview.utils.tsx` (check the preview generator script first).
- Legacy "dashboard" helpers: `createDashboardSurfaceQrState`, `buildDashboardQrNodePayload`, `stripXmlDeclaration` (`qr-svg.ts`).
- `ElementSettingsPanel` + `TransformPanel` components (only `LayerStyleSettings` / `TransformSection` are used by `LayerSettingsPanel`); then check whether `components/vendor/kokonutui/file-upload*` becomes dead.
- `MobileOptionRail` component (only `MobileOptionShelf` / `MobileOptionCardRail` are used).
- Iconstack test hooks (`resetIconstackRequestQueue`, `clearIconstackSvgCache`, `getIconstackSelectionCacheKey`), `SCENE_LAYOUT_PRESETS`, `SIZE_TEMPLATE_GROUPS`/`getSizeTemplatesByGroup`/`formatAspectRatio` (verify against size presets UI), `clampDotMatrixAnimation*`, `motionColorRgbHex`, `MOTION_OPACITY_ANCHORS`, `getFinderCornerRegions`, `getQrSvgNumCells`, `buildGradientSliderTrackStyle`, `clampGradientOffset`, `normalizeGradientOffsetRange`, `appendTiltSkewToSvgTransform`, `syncCornerRadiusFields`, `createCanvasShaderLayer` (keep if AGENTS rule needs it — it is the canonical factory; add a real use or keep), `resetSettingsSectionTabsForTests`, `resetPersistedElementScrollForTests`, cuelume constants.
- Rule: if an export exists only so a test can reach it, delete both unless the test guards real behavior through a public path.

**T1.5 Dead `lib/` scaffolding (~250 LOC)**
Vendored "beui"-style context system:

- `lib/shape-context.tsx`: `ShapeProvider` is not exported → `useShape()` always returns `shapeMap.rounded`. Replace with a constant, delete provider/transition code and the `html.transitioning` block + `--shape-input-radius` fallback in `app/globals.css`.
- `lib/surface-context.tsx`, `lib/elevated.tsx`, `lib/surface-classes.ts`: only `components/ui/select/content.tsx` uses `Elevated`. Inline the resulting classes, delete the three files.
- `lib/size-context.tsx`: `SizeProvider` used by `select/root.tsx` only; `setSize`/uncontrolled mode never used → shrink to a plain map + prop.
- `lib/icon-context.tsx`: verify, likely inline.

**T1.6 Never-read data fields (~200 LOC)**

- `BrandIconEntry.keywords` (87 entries, `features/qr/assets/brand-icons.ts`) — never read.
- `PlatformDef.collection` (58 entries, `features/qr/content/intents/*`) — never read.
- Wallpaper `sourceUrl` (~70 entries in `raycast/mac/qrafty/scene-wallpapers.ts`) — original download location, only the sync scripts write it. Stop emitting it into app manifests (`scripts/lib/wallpaper-sync.mjs`, `scripts/sync-*-wallpapers.mjs`), keep it script-side only.
- Minor: `ContrastResult.wcag/apca`, 6 unused `GradientPickerState` members, `IconstackSvgResponse.fullId`, `StoredCanvasWorkspaceRecord.updatedAt` (goes with T1b anyway).

**T1.7 Small duplicates / deps**

- `components/ui/button.tsx`: replace `ark` factory + `tailwind-variants` with a plain `button` + `cva` (already used 3×) → drop `@ark-ui/react`, `tailwind-variants`.
- Merge the two undo/redo icon pairs (`features/shell/components/toolbar-icons.tsx` `UndoIcon/RedoIcon` vs `MobileHistoryIcons.tsx`) into one.

### T1b — Remove draft persistence (keep undo/redo)

Current flow: `use-canvas-history.ts` autosaves the document 240 ms after every change via `features/canvas/model/storage.ts` (IndexedDB `qrafty-canvas-workspace` / store `drafts`, fallback localStorage `qrafty:canvas-workspace:new`). On mount, `workspace-bootstrap.ts` reads the draft back through `document/parse.ts` + `document/normalize.ts`.

Steps:

1. Delete `features/canvas/model/storage.ts` and `features/canvas/model/workspace-bootstrap.ts`.
2. In `features/canvas/canvas/use-canvas-history.ts`:
   - delete the autosave effect, `AUTOSAVE_DEBOUNCE_MS`, `autosaveTimerRef`, `save()`;
   - replace the async bootstrap effect with synchronous init from `createDefaultCanvasWorkspaceDocument()` (history stack seeded with it);
   - remove `isWorkspaceReady` / `setIsWorkspaceReady` if nothing else needs the async gate (check `use-canvas-actions.ts`, `WorkspaceEntrance`).
   - **keep** `undo`, `redo`, `canUndo`, `canRedo`, snapshot capture, `HISTORY_LIMIT`, debounce, `shouldReplaceCurrentEntryRef`.
3. Remove `handleSaveCanvasWorkspace` (`use-canvas-actions.ts`) and `onSave` (controller).
4. Delete `features/canvas/model/document/parse.ts` + `normalize.ts` if nothing else imports them (today only `storage.ts` does). `serializeCanvasWorkspaceDocument` / `cloneCanvasWorkspaceDocument` stay (history uses them for equality/cloning).
5. Delete tests for draft parsing/loading; keep/adjust history tests.
6. Optional: one-time cleanup of the stale IndexedDB DB/localStorage key is **not** needed — just stop reading it.
7. Keep: theme (`use-workspace-theme-sync.ts`) and sound (`features/shell/audio/cuelume.ts`) preferences in localStorage.

Note: `features/canvas/components/use-canvas-persistence.ts` is **not** disk persistence — it's in-memory per-layer QR-state mirroring (the "QR state stored 4×" issue). Leave for T4; rename then.

### T1c — Remove scene-template remnants (size presets stay)

Leftovers from "Add unified QR scene template system" / "template authoring layer", later collapsed. No UI can pick a template; layout is always "flat".

Steps:

1. **First verify** what the default scene composition renders: `createDefaultSceneComposition()` background (`solid #f4f4f5`) and `SceneCompositionTransform` / `SceneBackgroundLayer` in `canvas-workspace-chrome.tsx`, `scene-background-styles.ts`, `build-scene-ir.ts` (export). If the background or transform is visible/exported, replace with a plain constant so output is identical.
2. Delete `features/canvas/model/scene-templates.ts`, `apply-scene-template.ts`, `template-preview-fit.ts` (+ tests).
3. Remove `sceneCompositionByNodeId` from the document (`document.ts`, `canvas-document.ts`), reducer (`canvas-reducer.ts`), resolvers (`canvas-resolvers.ts`), actions (`use-canvas-actions.ts`), chrome-controller (`activeSceneComposition`, `onLayoutPresetSelect`, `onLayoutSettingsChange`), snapshots, `CanvasBoard` / `CanvasWorkspace` props (~47 refs).
4. Remove template preview mode: `previewLocked`, `fitCanvasToViewport` (if only template), `canvasAppearance: "template"`, `data-slot="template-edit-zone"`, `computeTemplatePreviewFit` usage in `use-canvas-interactions.ts`, and the props threaded through `Canvas` → `CanvasBoard` → `canvas-viewport`.
5. Remove `SceneLayoutPreset`/`LayoutSettings` types and `DEFAULT_DESKTOP_LAYOUT_SETTINGS`.
6. **Do not touch** `size-templates.ts`, `CanvasRatioPresetRow`, `onSceneTemplateSizeChange`, `onSceneTemplateSizeTemplateSelect`, `sceneTemplateSettings` (these are the size presets; rename to `canvasSize*` in T4).

### T2 — Dead CSS (visually identical)

Measured by `.audit-tmp/dead-rules.mjs`: **~480 lines of fully dead rules** + 48 dead selectors inside live rules.

1. Delete rules/selectors targeting slots never rendered (39 slots), e.g. `action-toolbar`, `resize-toolbar`, `document-toolbar`, `floating-toolbar`, `canvas-toolbar`, `canvas-toolbar-anchor`, `top-chrome`, `qr-pane`, `draggable-list-handle`, `canvas-layer-size-value`, `layer-appearance-popover`, `layer-{transform,style,border,shadows,effects}-popover`, `[data-slot^="appearance-"][data-slot$="-popover"]`, `[data-slot^="layer-"][data-slot$="-popover"]`, `scan-safety-popover`, `zoom-popover`, `shader-settings-popover`, `settings-filter-trigger`, `settings-filter-menu`, `settings-dropdown-menu`, `dropdown-menu-radio-item*`, `tabs-subtle-icon-rail-*`, `*-preset-shelf-scrollbar`, `keyboard-shortcuts-scrollbar`, `effect-row-body`, `appearance-filter-select-*`, `fill-swatch-button`, `canvas-layer-text-typography-settings`, `pattern-preset-shelf-scroll-area`.
   - `workspace-toolbar.css`: 41/69 rules dead. `workspace-styles.tsx`: 25/70. `settings.css`: 12. `mobile-settings.css`: 3. `settings-toolbar-motion.css`: 3. `settings-design-system.css`: 1.
   - Dead classes: `ds-morph-filter`, `ds-type-body`, `ds-option-scroll-row(--fill)`, `ds-option-scroll-tile`, `ds-option-scroll-chip`.
2. Delete duplicate blocks: the `desktop-settings-panel-host` input/placeholder/focus block exists in both `settings-design-system.css` and `workspace-toolbar.css`; duplicate declarations (`--elevated` ×2 in both theme blocks, `--control-hover` ×2).
3. Fix self-referential tokens in `settings-design-system.css` (`--type-caption: var(--type-caption, …)`, same for `--type-label`/`--type-value` — cycles = invalid at runtime; check computed values before/after).
4. Delete dead tokens: `--secondary-button-*` (8), `--button-shadow-*` (5), `--color-focus-ring`, `--header-bg`, `--card-foreground`, `--canvas-shadow-shell` (verify), bogus `--tw-*` overrides in `settings.css`/`workspace-toolbar.css`. **Keep** `--frimousse-*` (read by the emoji library).
5. Move the surviving `workspace-styles.tsx` CSS string into a real CSS file (e.g. `features/shell/components/workspace.css`) and delete the injector.
6. Delete tests that pin CSS text or assert removed slots are absent: `app/design/page.test.tsx` ("keeps portaled appearance popovers…"), `app/theme-contract.test.ts` string checks, ~30 `toBeNull()` assertions on removed slots in `WorkspaceChrome.test.tsx` / `CanvasSurface.test.tsx`.
7. Verify with a before/after screenshot pass of `/design` (desktop light/dark, mobile) — no visual change expected.

### T3 — Flat chrome, one theme source, one token scale

1. **Flat chrome**
   - Rename `--glass-bg/-border/-fg/-button-hover-bg/-button-hover-fg/-button-focus-ring` → `--chrome-*` (defined in `workspace-toolbar.css`; used in `UtilityToolbar`, `utility-toolbar.constants.ts`, `IslandCard`, `DownloadButton`, `ExportDownloadPopover`, `MobileTopBar`, `DesktopSettingsShell`, `canvas-workspace-chrome.tsx`, `CanvasQrLayerContent`).
   - Remove every `backdrop-blur*` class on chrome (IslandCard, MobileTopBar, ExportDownloadPopover, canvas-workspace-chrome).
   - `--glass-shadow` → `--popover-shadow`, applied **only to desktop popovers**. Remove shadows from toolbars, island, pills, size/rotation badges, mobile surfaces.
   - Delete `data-toolbar-appearance="glass"` attributes and all selectors that exist to undo glass (`backdrop-filter: none !important`, `transform/translate/scale/rotate: none !important` blocks).
   - Target: bring `!important` count down drastically (373 today).
2. **Theme: next-themes is the single source**
   - Today 4 mechanisms: `next-themes` (`components/theme-provider.tsx`, class attr, fixed "light", nothing calls `useTheme`), `BlurFadeThemeTransition` toggling `.dark` on `<html>` manually, `data-shell-theme` on the workspace, `data-theme` on `.ds-root`.
   - Make `BlurFadeThemeTransition` call `setTheme` from `next-themes` instead of touching `classList`; derive `data-shell-theme`/`data-theme` from `useTheme()` (or replace their selectors with `.dark`); fold `use-workspace-theme-sync.ts` (own localStorage key + cookie) into next-themes storage. Keep SSR initial theme (cookie read in `app/design/page.tsx`) working.
3. **One token scale**
   - Collapse shadcn layer (`--background`, `--primary`, …), QRafty layer (`--surface-*`, `--shadow-*`, `--hover`…), settings layer (`--bg`, `--fg`, `--control`, `--line`, `--mass`, `--fg-primary/secondary/tertiary/muted`…), canvas layer (`--canvas-*`, `--panel-*`) and chrome layer into one theme-split set exposed via `@theme inline`.
   - Remove re-declarations of shadcn tokens inside `[data-slot="workspace"]` (`workspace-tokens.css`) and inside popover selectors.
4. **Docs**: rewrite `DESIGN.md` token/chrome sections (drop glass, `desktop-glass`, `--settings-fg-*`), mark ADR 0002 superseded, fix `AGENTS.md` drift (it calls `MobileOptionRail` the rail root; update counts/baselines).

### T4 — Architecture (from the original plan; needs golden snapshots first)

0. **Golden safety net** (prerequisite): ~15 fixture documents covering all QR color modes (solid, gradient, palette, image, unified), motion presets, shaders, every layer kind → SVG/PNG export snapshots.
1. **One store**: replace reducer mirror (`canvas-reducer.ts` ~60 `selectedX` fields + setters), `qr-controls.ts`, `use-canvas-persistence.ts` mirroring, `chrome-settings-snapshots.ts` with one QR state store + `updateActiveQr(patch)`. `SettingsModel` collapses into the controller. (~−4k)
2. **Document v2**: single index (drop parallel `*ByNodeId`/`*ByLayerId`), card-as-layer, discriminated-union layers, no legacy fields (`cornerRadius`↔`cornerRadii`, `shadow`↔`shadows[]`, `blur`↔`layerFilters`), drop 176 "dashboard" references. (~−1.5k)
3. **One `Paint` type** replacing picker `Fill`, `QraftyGradient`, CSS strings, layer `fill/fillGradient/fillMode`, `cardFill`; trim the vendored fill-picker (6.4k LOC / 44 files) to what's used. (~−3k)
4. **One layer property schema** rendered by desktop + mobile (today 5 editors: `ElementSettingsPanel`, `FloatingLayerToolbarSettings`, `MobileLayerToolbar`, `AppearanceIsland`, `LayerSettingsPanel`). (~−2–3k)
5. **Pure QR SVG emitter** (matrix → SVG) replacing React→static markup→DOMParser→8 DOM-mutating extensions→serialize; fold `packages/qr` into `features/qr/engine`. (~−4k)
6. **Mobile**: reuse sections, keep layouts; trim the custom vaul wrapper + 1k-line CSS. (~−2.5k)
7. **Catalogs**: `paper-shader-presets.generated.ts` (3,087 lines), `illustration-sets.ts` (2,269 lines) → generated by `scripts/`. (~−5k TS)
8. **Naming**: "toolbar"→settings, `DRAFTING_*`/`Desktop*` prefixes for shared code, `use-canvas-persistence` rename, `sceneTemplate*` → `canvasSize*`.
9. **Tests**: rewrite on behavior + goldens; delete implementation-pinning tests. (~−10k tests)
10. **T5 manual pass**: 732 never-passed optional props (`.audit-tmp/never-set.txt`) and 124 "soft" unread fields — review after T4 when spreads are gone.

### Later — Radix → Base UI

Swap `components/ui/popover.tsx` (13 consumers), `scroll-area.tsx` (19), `dialog.tsx` (image cropper only), `Slot` in `family-drawer/content.tsx` to Base UI equivalents; drop `radix-ui`. `vaul` stays (no Base UI drawer). Net LOC ≈ 0; benefit = one primitive API.

---

## 6. Icon inventory (for T1.1 / later decision)

| Source          | Where                                                                                                                                                                                              |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| lucide          | ~36 files — main set (settings, rows, popovers, `components/ui`)                                                                                                                                   |
| hugeicons       | 8 files — content-type grid icons, `MobileLayerToolbar`, `AppearanceIsland`, `DownloadButton`, `KeyboardShortcutsPopover` (Apple/Windows), `SettingsPanel` keyboard icon, dead `toolbar-tools.tsx` |
| react-icons/si  | brand logos (`brand-icons.ts`, `content-type-icons.ts`) — keep                                                                                                                                     |
| Hand-drawn      | `toolbar-icons.tsx`, `MobileHistoryIcons.tsx` (duplicate undo/redo), `SettingsSectionIcons.tsx`                                                                                                    |
| Animated (dead) | `components/ui/{download,layers,play,grip,receipt-text,message-circle}` + `animate-ui` — only `search-icon.tsx` is live                                                                            |

Open question: replace the 8 hugeicons usages with lucide (drop 2 deps) or keep.

## 7. Repo state

- Branch `main` only, local + remote. `22429fe2` pushed. No worktrees.
- Leftover stash `stash@{0}` "pre-main-merge agent docs" — awaiting decision to drop.
- `.audit-tmp/` untracked (audit scripts) — delete after cleanup.

## 8. Verification (every tier)

```bash
pnpm typecheck && pnpm test && pnpm lint && pnpm knip && pnpm exec fallow dead-code && pnpm build && pnpm format:check && pnpm doctor
```

Plus for T2/T3: manual `/design` check desktop light/dark + mobile. For T4: goldens.

## 9. Key paths

- Controller/model: `features/canvas/components/chrome-controller.ts`, `chrome-settings-snapshots.ts`, `canvas-reducer.ts`, `use-canvas-actions.ts`, `features/shell/hooks/use-toolbar-settings-model.ts`, `features/shell/model/toolbar-types.ts`, `toolbar-defaults.ts`
- History/persistence: `features/canvas/canvas/use-canvas-history.ts`, `features/canvas/model/storage.ts`, `workspace-bootstrap.ts`, `document/parse.ts`, `document/normalize.ts`
- Templates: `features/canvas/model/scene-templates.ts`, `apply-scene-template.ts`, `template-preview-fit.ts`, `features/canvas/components/SceneBackgroundLayer.tsx`
- CSS: `app/globals.css`, `features/canvas/workspace-tokens.css`, `features/shell/components/{workspace-toolbar,settings-design-system,settings-toolbar-motion,workspace-entrance}.css`, `workspace-styles.tsx`, `features/shell/settings/{settings,mobile-settings}.css`
- Rules: `docs/ARCHITECTURE.md`, `AGENTS.md`, `DESIGN.md`, `docs/adr/`

---

## 10. Execution report (what actually landed)

All phases committed on `main`, every commit left the §8 verification suite green. Diff totals per commit:

| Phase | Commit     | Files | +/−           | Scope                                                                                                                                          |
| ----- | ---------- | ----- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| T1    | `986b114`  | 80    | +700 / −5,265 | Dead icon-rail chain, `animate-ui` vendor, settings-model fallback, unconsumed controller fields, test-only code                               |
| T1b   | `9235f99`  | 15    | +40 / −1,135  | Draft persistence removed (IndexedDB/localStorage); reload = fresh document; in-memory undo/redo kept                                          |
| T1c   | `ae0ccc5`  | 25    | +59 / −528    | Scene-template remnants: `scene-templates.ts`, `apply-scene-template.ts`, preview mode, `sceneCompositionByNodeId`                             |
| T2    | `0b04881`  | 10    | +380 / −1,009 | Dead CSS rules/slots/tokens; `workspace-styles.tsx` CSS extracted to `features/shell/components/workspace.css`                                 |
| T3    | `27d5c2d`  | 27    | +130 / −422   | Flat chrome (glass removed, popover-only shadows), token consolidation, `next-themes` single source, docs                                      |
| T4.0  | `6c840d1`  | 37    | +8,643 / −1   | Golden safety net: 17 fixtures × (`.svg` + `.ir.json`) deterministic export snapshots                                                          |
| T4.1  | `343a7d9`  | 30    | +1,264 / −922 | One QR store: `qr-draft.ts` projection replaces reducer mirror; `qr-controls.ts` + `use-canvas-persistence.ts` deleted                         |
| T4.2  | `5215ebf`  | 31    | +264 / −796   | Document v2: dropped all `*ByNodeId` maps + `activeQrNodeId` (board dimension was vestigial); flat `cardState` + `canvasLayers`                |
| T4.3  | `0c3610f`  | 41    | +676 / −438   | Canonical `Paint` union replaces layer `fill/fillGradient/fillMode` + card `fill` string; legacy fill fold in normalizers                      |
| T4.4  | `efd9f5f`  | 7     | +252 / −213   | Shared layer tools: `layer-panel-tools.ts` + `layer-text-format.ts`; mobile toolbar reuses desktop pieces                                      |
| T4.5  | `1fe8429b` | 33    | +1,776 / −286 | Pure QR SVG emitter (`emit-markup.ts`) + SVG IR (`svg-element.ts`); no React SSR / DOMParser / XMLSerializer in export path                    |
| T4.6  | `1764773`  | 1     | −7            | Residual mobile dedup (rest already absorbed by T4.4); last dead CSS block                                                                     |
| T4.7  | `b75591f`  | 73    | +470 / −464   | Naming: `sceneTemplate*`→`canvasSize*`, `ToolbarController`→`SettingsController`, `DEFAULT_DRAFTING_*`→`DEFAULT_*`; `gen:paper-presets` script |
| —     | `92cd3d2`  | 1     | +1 / −1       | Status line (this doc)                                                                                                                         |

**Gross: ~14.7k inserted / ~11.5k deleted.** The insertions are dominated by the golden snapshot fixtures (+8.3k) and the new T4 architecture code (`qr-draft.ts`, `emit-markup.ts`, `svg-element.ts`, parity test).

### Final numbers vs §4 estimate

| Metric                                | Before           | After            | Delta     |
| ------------------------------------- | ---------------- | ---------------- | --------- |
| Product LOC (ts/tsx/css, excl. tests) | ~101.6k          | ~96.9k           | **−4.6k** |
| Test LOC                              | ~20.1k           | ~20.2k           | ~0        |
| Golden snapshot fixtures (checked in) | 0                | 8.3k             | +8.3k     |
| `pnpm test`                           | 942/942          | 1023/1023        | +81       |
| Lint                                  | 0 err / 202 warn | 0 err / 137 warn | −65 warn  |

### Why net is −4.6k, not ~40k

The §4 estimate assumed several cuts that turned out to be already done, already clean, or data that must stay:

- **Fill-picker trim (−6.4k projected)**: all 44 files were already reachable/live before cleanup — nothing to delete.
- **Mobile CSS/vaul (−2.5k projected)**: `mobile-settings.css` audits at ~1 dead class; the family-drawer wrapper is load-bearing (drawer view stack). Absorbed earlier.
- **Catalogs → `scripts/` (−5k projected)**: `paper-shader-presets.generated.ts` and `illustration-sets.ts` are runtime data — they stay checked in either way. A real generator (`scripts/gen-paper-presets.mjs`, `pnpm gen:paper-presets`, byte-identical output) replaced the lost `/tmp` one. `illustration-sets.ts` labels are curated keyword lists (multi-word phrases, a `"fork. spoon"` typo, truncated ids) — not filename-derivable, so it is not safely regenerable and stays hand-maintained.
- **T4.5 (−4k projected)**: _added_ ~1.5k. The plan's "replace the 8 DOM-mutating extensions" was executed as retype-to-IR, not rewrite-to-emitter — extension logic runs verbatim on `QrSvgElementLike` so all golden SVGs stay byte-identical. Folding extension behavior into emitter options (deleting `svg-extension/` entirely) is the remaining ~3.5–4k cut, deferred as the riskiest item.
- **Vendored `react-qr-code`**: still present — the pure emitter proved byte-parity, but `ReactQRCode` remains exported for preview paths; deleting it is part of the deep T4.5 cut.
- **Test rewrite (−10k projected)**: not done. Suite is largely behavior-pinned already and doubles as the regression net for the refactor.

### What T4 actually delivered (the point of the phase)

- One QR state store per layer; no `selectedX` mirror fields; `setSelected*` → `UPDATE_QR_DRAFT` patch.
- Flat document: `layers`, `qrStateByLayerId`, `cardState`, `contentTypeByLayerId` — no parallel node/layer maps.
- One `Paint` union (`{kind, solid, gradient, image, palette}`) across layers + card, with latent-gradient memory preserved.
- QR markup path is now `state → props → emit-markup (pure) → [extensions on SVG IR] → serialize` — no React SSR, no DOMParser/XMLSerializer in the export path. Real DOM still used by runtime motion (`seekDotMatrixAnimation`, `canvas-svg-adapter`) by design.
- `SettingsController` naming aligned to `docs/ARCHITECTURE.md` vocabulary.
- Golden snapshots pin all of it: 17 fixtures across color modes, motion presets, shaders, layer kinds — byte-identical through every phase.

### Bugs fixed along the way

- `ariaLabel` is carried through the QR draft (T4.1); the old `persistence` fold dropped it.
- Line-layer stroke derivation fixed during T4.3 to read `DEFAULT_SHAPE_LAYER.fill` (matches pre-Paint behavior; briefly read `.stroke`).
- T4.5 emulated real DOM quirks the extensions depend on, found via golden diffs: `#id` selectors in the IR parser (a broken match was silently deleting the background + finder-outer paths), `xmlns:ns1`/`ns1:` prefixing for `setAttributeNS`, XML attribute whitespace folding, and self-closing-vs-explicit close-tag serialization.

### Remaining work

- **Deep T4.5** (~3.5–4k): fold the 8 extension modules into emitter options, delete `svg-extension/` + `svg-element.ts`, delete vendored React QR if no runtime consumer remains.
- **Plan item 9** (test rewrite): targeted audit of implementation-pinning tests only — the suite is the refactor's safety net.
- **T5 manual pass**: 732 never-set props + 124 soft fields (`.audit-tmp/never-set.txt` + `filter-props` output).
- **Radix → Base UI**: deferred separate tier.
- Housekeeping: `stash@{0}` (stale agent docs — safe to drop), `.audit-tmp/` (delete once T5 review is done).
