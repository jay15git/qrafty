<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes. Read the relevant guide in `node_modules/next/dist/docs/` before writing Next.js code, and heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Stack

- Single-package `pnpm` app using Next.js `16.2.3`, React `19`, Tailwind CSS `4`, Vitest `4`, shadcn/ui (`radix-nova`), and `@qrafty/qr` (vendored react-qr + scene tooling).
- Use `pnpm`; the repo is locked with `pnpm-lock.yaml`.

## Commands

- Dev server: `pnpm dev`
- Lint: `pnpm lint`
- Typecheck: `pnpm typecheck` (or `pnpm exec tsc --noEmit`)
- Tests: `pnpm test`
- Production build: `pnpm build`
- Single test file: `pnpm exec vitest run features/qr/model/state.test.ts`
- Single test by name: `pnpm exec vitest run features/qr/model/state.test.ts -t "builds svg options from the default state"`

## App Structure

- `app/layout.tsx` defines the root shell, Geist/Bricolage Grotesque/Manrope fonts, and global CSS.
- `app/page.tsx` is the home route; renders the marketing landing (`LandingHeroText` + `LandingCardWheel`).
- `/design` is the active workspace (`Workspace` → `CanvasSurface` canvas + `WorkspaceChrome` overlay). `/desktop` redirects to `/design`.
- `/new`, `/dashboard`, and `/settings` have been removed. Do not re-add features or fixes there unless explicitly asked.
- `features/qr/model/state.ts` is the core QR state and mapper layer. Update this first when adding new controls, defaults, or renderer options.
- Desktop QR settings live in `features/shell/components/WorkspaceChrome.tsx` and `features/shell/settings/SettingsPanel.tsx` (hosted by `features/shell/settings/DesktopSettingsPanel.tsx` inside `DesktopSettingsShell`).
- Element-layer settings use `features/shell/components/ElementSettingsPanel.tsx` with `SettingsFillPopover` / `SettingsFillPicker` (`features/shell/settings/FillPicker.tsx`).
- Shared workspace helpers live in `features/canvas/components/canvas-operations.ts` and `features/canvas/components/canvas-layer-geometry.ts`.
- `use-canvas-view-model.ts` is the workspace state machine. Its pure derivations live in `canvas-resolvers.ts`, the scan-safety probe in `use-canvas-scan-safety.ts`, and the `ToolbarController` assembly in `chrome-controller.ts` (grouped by concern: core / qrSettings / scene / canvas / element / export / layers). Add new controller fields to the matching group, not to the hook.
- `lib/utils.ts` only provides `cn()`.

## MCP Tools

- **Use available MCP tools for every task** instead of falling back to raw bash commands when a tool fits.
- `context7_*` for library/framework docs; `pencil_*` for `.pen` design files in `designs/`; `deepwiki` for GitHub repo docs.
- If a tool exists for the job, use it. Do not manually `cat`, `grep`, or `sed` when a structured tool is available.

## Mobile Settings Rail

- **The mobile FamilyDrawer was removed.** Mobile settings navigation is now a persistent bottom rail of circular icon buttons with a label underneath, rendered by `features/shell/settings/MobileOptionRail.tsx` (`data-slot="mobile-settings-rail-root"`). `MobileFamilyDrawer.tsx` is gone; do not re-add it.
- The rail is mounted from `WorkspaceChrome.tsx` on the mobile branch, alongside `MobileTopBar`. It is a horizontal `ScrollArea` of `role="tab"` buttons over `SETTINGS_SECTIONS`.
- **The rail swaps in place.** Tapping a family crossfades the rail from the 7 families to that family's row. `AnimatePresence mode="wait"` handles the fade out / fade in, keyed on `railViewKey` (`families` / `family:<id>` / `part:<id>`). A drilled-in row carries no back item; instead a `.ds-mobile-settings-rail__actions` row sits below it with a close (X) button at the left corner, the open family's name (`[data-slot="mobile-rail-family-label"]`) centred between the corners, and a tick at the right corner. Undo/redo stay in `MobileTopBar`. The row's `aria-label` ("QR options", "Module options") is the only thing naming the level now. `.ds-mobile-settings-rail__row` is `width: max-content; min-width: 100%` with `justify-content: space-around`, so a long row scrolls and a short row spreads evenly.
- **Two kinds of family rows.** `MOBILE_FAMILY_OPTIONS` lists static option items (Content's `PICKER_QR_INPUT_TYPES`, Style's part pills). `MOBILE_FAMILY_ROWS` maps a family to a component (`MobileRailRowProps = { model, openDrawer }`) that renders live quick-pick content: **Color** = fill-mode options (see below); **Motion** = Off + loader pills + More; **Shape** = `QR_BACKGROUND_SHAPES` glyph tiles (`ShapeGlyph` exported from `SettingsSections.tsx`, `shapeViewBox` from `features/qr/styles/background-shapes.ts` — every tile must pass `path={option.path}`, without it the glyph falls back to a `<rect>` that is invisible inside non-24 viewBoxes) + Fill entry; **Background** = fill-mode options; **Elements** = Add/Layers. Shared primitives: `MobileRailSwatchTile`, `MobileRailPickerTile` (pipette tile, shows the current custom fill behind the pipette when it isn't a preset), `MobileRailPill`, `MobileRailCircleOption`. Rail-sized tiles carry `data-slot="mobile-rail-option"`. Family rows live in `features/shell/components/mobile-settings-rail/rows/`; rail state and context in the sibling `rail-*.ts` modules.
- **Fill-mode pills (Color / Background).** `MOBILE_FAMILY_FOOTERS` renders a `.ds-mobile-settings-rail__subrow` of mode pills _under_ the options scrollarea — tapping a pill swaps which option set scrolls above it. Modes live in `MobileRailModeContext`: the rail keeps one browsed mode per family (`familyModes` state), falling back to `defaultFamilyMode` (Color: image/palette/radial/linear/solid from `dotsColorMode` + module fill CSS; Background: shader/image from `styleMode`, else solid/linear/radial from `cardFill`). The resolved mode is part of `railViewKey`, so browsing a mode crossfades the option row and resets its scroll. Color modes = Solid/Linear/Radial (presets + pipette → `applyQrFill`, which fans out through `applyUnifiedQrFill` when `gradientLinkMode === "unified"`), Image (upload + `SCENE_WALLPAPERS` → `applyQrImageFill`), Pattern (`DOTS_PALETTE_PRESETS` → `applyQrPalette`). Background modes = Solid/Linear/Radial (`applyCardFill`), Image (upload + wallpapers → `onImageSettingsChange`), Shader (`getCardGeneratedShaderDefinitions` tiles → `onBackgroundSettingsChange` with `createDefaultCanvasCardPaperShader`). The Background footer mirrors `SceneSection.handleBackgroundTabChange` — a pill press also calls `setSettingsSectionTab("background", …)` + `controller.onCanvasBackgroundTabChange` so the canvas switches mode immediately. `SettingsImageUploadTile` is `React.lazy` (it drags in the image cropper + scene codec); the rail-sized upload tile is `.ds-mobile-settings-rail__upload-tile`.
- **`QR` has a second drill level.** An option with `drillsTo` (`Module`/`Eye`/`Frame`) crossfades the part row into that part's style catalogue, rendered by `QrStylePartOptions` as `[data-slot="mobile-rail-style-option"]` preview tiles (`SETTINGS_PREVIEW_TILE` + `QrStyleOptionPreview`). Tapping a tile applies it straight to the QR and stays in the rail — it does not open the drawer. `Logo` has no `drillsTo`, so it keeps opening `MobileSettingsDrawer`. The catalogues come from `QR_STYLE_PART_DEFINITIONS` in `features/shell/settings/qr-style-parts.ts`, which the desktop `QrStyleSection` also reads — do not re-declare the Module/Eye/Frame option lists anywhere else.
- **The corner cross closes the family.** The tick still jumps to the next family with options.
- **Tapping a plain option opens `MobileSettingsDrawer`** with that family's `SettingsSectionBody`. For Content it also calls `model.onContentTypeChange(option.id)` first, so the drawer lands on the right fields. Closing the drawer (X) returns to the drilled-in rail row.
- **Big surfaces open as drawer detail pages.** The rail wraps its whole tree in `MobileSettingsDensityContext` + `MobileDrawerNavigationProvider` (`currentView`/`setView` wired to the rail's `drawerView` state). Anything calling `useMobileDrawerNavigation().openDetail({ title, content })` — rail rows (custom color picker, Add element, Layers) or `useMobileLiveDetail` consumers inside drawer sections (`SettingsFillPopover`, `SettingsRowPopover`) — pushes a `"setting-detail"` view in `MobileSettingsDrawer`. The detail view renders a back/close header plus `MobileDetailStackOutlets`, into which both `entry.content` and `useMobileLiveDetail` portals render. Back pops the stack; closing the drawer runs `MobileDrawerStackReset` → `clearDetails()` (which must bail on an empty stack — a fresh `[]` churns context identity and loops). `FamilyDrawerViewBridge` pushes the outer view into `FamilyDrawerRoot`'s internal `view` — one-way only, `FamilyDrawerRoot` has no controlled view prop and inner→outer reporting caused a mount/unmount flap loop. Heavy detail content (`SettingsFillPicker`, `InsertMenuPanelStack`, `LayersPopoverContent`) is `React.lazy` in `mobile-settings-rail/lazy-details.tsx` — the rail must not pay their import cost up front.
- Rail styling lives in the `Mobile settings rail` block at the end of `features/shell/settings/mobile-settings.css` (`.ds-mobile-settings-rail__row/__item/__circle/__label/__actions/__action`). Icon-button fill comes from `--rail-button-bg`, defined once as `#ffffff` on `[data-mobile-settings]` and `#161616` on `[data-mobile-settings][data-theme="dark"]`, and is used by the actions row (cross, family pill, tick) and the option circles. Labels/icons use `--fg`; pressed pills mix `var(--fg) 16%` over the button fill.
- The rail overrides `--scroll-edge-fade-color` to `var(--canvas-bg, var(--bg))`. That selector must stay at specificity ≥ (0,3,0): `.ds-root[data-theme="light"]` (0,2,0) resets the fade to `var(--bg)`, which is pure white in light mode and visibly wrong against the `#f0f1f2` workspace surface. Dark has no such block, so a (0,1,0) selector looks correct in dark and breaks only in light.
- `MobileOptionRail` measures itself with a `ResizeObserver` and feeds `syncMobileWorkspaceChromeInsets` so the workspace reserves the rail + layer-toolbar height. `WorkspaceEntrance` waits on `[data-slot="mobile-settings-rail-root"]` for the mobile entrance.
- `MobileLayerToolbar` is mounted from the rail component.
- `.ds-root` sets `min-height: 100dvh`. Any `position: fixed` host that carries that class **must** reset `min-height: 0; height: auto` — otherwise it stretches to the full viewport and, because it feeds `--canvas-inset-bottom`, squashes the canvas to nothing.
- `WorkspaceChrome.test.tsx` covers the rail: family list, circular icon + label per item, selected state, scroll fade cues, the keyboard-inset token, and the family → part → style-catalogue drill (including the cross stepping back one level).

## Testing Notes

- Tests cover `features/qr/model/state.ts` plus a wide set of adjacent modules and components (126 files).
- Vitest is configured with `environment: "node"`, so browser/client behavior is not covered by default.
- If you change React UI behavior, do not assume existing tests cover it.
- `pnpm typecheck` is clean and `next.config.ts` no longer sets `typescript.ignoreBuildErrors`, so `pnpm build` runs type checking and passes. `pnpm test` is **942/942 green across 126 files**; `pnpm lint` reports **0 errors / 202 warnings** (mostly `react-hooks/*` advisories from `eslint-config-next` 16 in client components; `app/` is lint-clean). `pnpm check` runs typecheck + knip + fallow dead-code and exits 0. Baselines live in `docs/superpowers/plans/`.
- **`react-doctor` is a standalone CLI** (`pnpm doctor`, devDependency `react-doctor`), not an ESLint plugin. Current score: **100/100, 0 issues** — keep it there; `react-doctor.yml` gates PRs on new errors. It reads suppression comments from source, so use its native directive: `// react-doctor-disable-next-line react-doctor/<rule> -- <reason>`. The `// eslint-disable-next-line react-doctor/<rule>` form makes ESLint fail with `Definition for rule ... was not found` — never use it.

## Dead-code tooling

- `pnpm knip` is authoritative for this repo. `pnpm exec knip --production` is **not** — it fails to resolve the `@qrafty/qr-internal/*` tsconfig aliases and reports ~25 live barrel exports as unused, and it lists nearly every dependency as unused. Verify any `--production` hit against its real import sites before acting.
- `fallow dead-code` complements knip (adds unused type exports, duplicate exports, unreachable files). Config lives in `.fallowrc.json`; keep `ignoreExports` narrow — a whole-file `"exports": ["*"]` entry hides real findings.
- CSS dead-class detection: extract `\.([\w-]+)` selectors per file and require the exact class name to appear in a `.ts`/`.tsx`/`.json`/`.md` file **and** account for dynamic construction (`` `prefix-${x}` ``) before deleting.
- A CSS class can also be dead because its **host attribute** is gone: `.desktop-elastic-slider` never matches because the element carries `data-slot="desktop-elastic-slider"`. Check `data-slot` values, not just class names.

## Canvas layers

- **Never hand-write a `CanvasLayer` object literal.** Use `createCanvasShapeLayer`, `createCanvasTextLayer`, `createCanvasImageLayer`, or `createCanvasShaderLayer`. They route through `patchCanvasLayer`, which keeps the legacy and modern representations in sync (`cornerRadius`↔`cornerRadii`, `shadow`↔`shadows[]`, `blur`↔`layerFilters[]`). Raw literals silently desync, the renderer reads the modern field, and your styling disappears.

## Architecture rules

- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) is the law**: canonical vocabulary (Canvas/Layer/Settings/Workspace/Document/Mode), folder structure, import direction, size limits, React rules. Follow it for all new code and any file you touch.
- Domain glossary lives in `CONTEXT.md`; architectural decisions in `docs/adr/`.

## Repo Conventions

- Use the `@/*` import alias from `tsconfig.json`.
- Tailwind theme tokens and shadcn CSS variables live in `app/globals.css`.
- shadcn config lives in `components.json` and uses the `radix-nova` style.
- CI lives in `.github/workflows/ci.yml` (typecheck, lint, `pnpm format:check`, knip + fallow, test, build) plus `.github/workflows/react-doctor.yml` (react-doctor PR gate). Prettier is configured in `.prettierrc` — run `pnpm format` before committing; CI fails on unformatted files.

## `@qrafty/qr` package layout

- Internal QR library lives in `packages/qr/`:
  - `@qrafty/qr` — shared types (`QraftyQrCodeProps`, `QraftyQrConfig`)
  - `@qrafty/qr/react` — `ReactQRCode` (vendored upstream primitive)
  - `@qrafty/qr/shaders` — paper-shader helpers (`buildPaperShaderRenderProps`, render options)
  - `@qrafty/qr/dot-matrix` — `DotMatrixAnimatedSvg` + the dot-matrix animation modules (`animation-presets`, `animation-keyframes`, `run-dot-matrix-animation`, `loader-to-preset`, …)
- QRafty-only code (SVG scene emit, export, scene schema, vendored renderers) is imported via `@qrafty/qr-internal/*` paths in `tsconfig.json`. These are **not** in `packages/qr/package.json` exports.
- Vendored fork: `packages/qr/vendor/react-qr-code`.
- Build library: `pnpm build:packages` (or `pnpm --filter @qrafty/qr build`).

## Search / Editing Gotchas

- Exclude `.next` and `node_modules` when searching; they create noisy false positives.
- Ignore generated/runtime directories and local artifacts covered by `.gitignore`, especially `.next/`, `node_modules/`, `coverage/`, `build/`, and `.env*`.
