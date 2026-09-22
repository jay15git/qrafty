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
- Single test file: `pnpm exec vitest run features/qr-code/model/state.test.ts`
- Single test by name: `pnpm exec vitest run features/qr-code/model/state.test.ts -t "builds svg options from the default state"`

## App Structure
- `app/layout.tsx` defines the root shell, Geist/Bricolage Grotesque/Manrope fonts, and global CSS.
- `app/page.tsx` is the home route; renders the marketing landing (`LandingHeroText` + `LandingCardWheel`).
- `/design` is the active desktop workspace (`DesktopWorkspace` → `WorkspaceSurface` canvas + `FloatingToolbar` settings). `/desktop` redirects to `/design`.
- `/new`, `/dashboard`, and `/settings` have been removed. Do not re-add features or fixes there unless explicitly asked.
- `features/qr-code/model/state.ts` is the core QR state and mapper layer. Update this first when adding new controls, defaults, or renderer options.
- Desktop QR settings live in `features/desktop-shell/components/FloatingToolbar.tsx` and `features/desktop-shell/inspector/DesktopNewSettingsPanel.tsx`.
- Element-layer settings use `features/desktop-shell/components/DesktopElementInspector.tsx` with `SettingsFillPopover` / `DesktopNewFillPicker`.
- Shared workspace helpers live in `features/workspace/components/workspace-surface-helpers.ts` and `features/workspace/components/pane-layer-geometry.ts`.
- `lib/utils.ts` only provides `cn()`.

## MCP Tools
- **Use available MCP tools for every task** instead of falling back to raw bash commands when a tool fits.
- `context7_*` for library/framework docs; `pencil_*` for `.pen` design files in `designs/`; `deepwiki` for GitHub repo docs.
- If a tool exists for the job, use it. Do not manually `cat`, `grep`, or `sed` when a structured tool is available.

## Mobile Settings Rail
- **The mobile FamilyDrawer was removed.** Mobile settings navigation is now a persistent bottom rail of circular icon buttons with a label underneath, rendered by `features/desktop-shell/components/MobileSettingsRail.tsx` (`data-slot="mobile-settings-rail-root"`). `MobileFamilyDrawer.tsx` is gone; do not re-add it.
- The rail is mounted from `FloatingToolbar.tsx` on the mobile branch, alongside `MobileWorkspaceTopBar`. It is a horizontal `ScrollArea` of `role="tab"` buttons over `DESKTOP_SETTINGS_SECTIONS`.
- **The rail swaps in place.** Tapping a family crossfades the rail from the 7 families to that family's row. `AnimatePresence mode="wait"` handles the fade out / fade in, keyed on `railViewKey` (`families` / `family:<id>` / `part:<id>`). A drilled-in row carries no back item; instead a `.dn-mobile-settings-rail__actions` row sits below it with a close (X) button at the left corner, the open family's name (`[data-slot="mobile-rail-family-label"]`) centred between the corners, and a tick at the right corner. Undo/redo stay in `MobileWorkspaceTopBar`. The row's `aria-label` ("QR options", "Module options") is the only thing naming the level now. `.dn-mobile-settings-rail__row` is `width: max-content; min-width: 100%` with `justify-content: space-around`, so a long row scrolls and a short row spreads evenly.
- **Two kinds of family rows.** `MOBILE_FAMILY_OPTIONS` lists static option items (Content's `PICKER_QR_INPUT_TYPES`, Style's part pills). `MOBILE_FAMILY_ROWS` maps a family to a component (`MobileRailRowProps = { model, openDrawer }`) that renders live quick-pick content: **Color** = fill-mode options (see below); **Motion** = Off + loader pills + More; **Shape** = `QR_BACKGROUND_SHAPES` glyph tiles (`ShapeGlyph`/`shapeViewBox` exported from `desktopnew-settings-sections.tsx` — every tile must pass `path={option.path}`, without it the glyph falls back to a `<rect>` that is invisible inside non-24 viewBoxes) + Fill entry; **Background** = fill-mode options; **Elements** = Add/Layers. Shared primitives: `MobileRailSwatchTile`, `MobileRailPickerTile` (pipette tile, shows the current custom fill behind the pipette when it isn't a preset), `MobileRailPill`, `MobileRailCircleOption`. Rail-sized tiles carry `data-slot="mobile-rail-option"`.
- **Fill-mode pills (Color / Background).** `MOBILE_FAMILY_FOOTERS` renders a `.dn-mobile-settings-rail__subrow` of mode pills *under* the options scrollarea — tapping a pill swaps which option set scrolls above it. Modes live in `MobileRailModeContext`: the rail keeps one browsed mode per family (`familyModes` state), falling back to `defaultFamilyMode` (Color: image/palette/radial/linear/solid from `dotsColorMode` + module fill CSS; Background: shader/image from `styleMode`, else solid/linear/radial from `cardFill`). The resolved mode is part of `railViewKey`, so browsing a mode crossfades the option row and resets its scroll. Color modes = Solid/Linear/Radial (presets + pipette → `applyQrFill`, which fans out through `applyUnifiedQrFill` when `gradientLinkMode === "unified"`), Image (upload + `SCENE_WALLPAPERS` → `applyQrImageFill`), Pattern (`DESKTOP_DOTS_PALETTE_PRESETS` → `applyQrPalette`). Background modes = Solid/Linear/Radial (`applyCardFill`), Image (upload + wallpapers → `onImageSettingsChange`), Shader (`getCardGeneratedShaderDefinitions` tiles → `onBackgroundSettingsChange` with `createDefaultDraftingCardPaperShader`). The Background footer mirrors `SceneSection.handleBackgroundTabChange` — a pill press also calls `setInspectorSectionTab("background", …)` + `controller.onCanvasBackgroundTabChange` so the canvas switches mode immediately. `SettingsImageUploadTile` is `React.lazy` (it drags in the image cropper + scene codec); the rail-sized upload tile is `.dn-mobile-settings-rail__upload-tile`.
- **`QR` has a second drill level.** An option with `drillsTo` (`Module`/`Eye`/`Frame`) crossfades the part row into that part's style catalogue, rendered by `QrStylePartOptions` as `[data-slot="mobile-rail-style-option"]` preview tiles (`SETTINGS_PREVIEW_TILE` + `QrStyleOptionPreview`). Tapping a tile applies it straight to the QR and stays in the rail — it does not open the drawer. `Logo` has no `drillsTo`, so it keeps opening `MobileSettingsDrawer`. The catalogues come from `QR_STYLE_PART_DEFINITIONS` in `features/desktop-shell/inspector/qr-style-parts.ts`, which the desktop `QrStyleSection` also reads — do not re-declare the Module/Eye/Frame option lists anywhere else.
- **The corner cross closes the family.** The tick still jumps to the next family with options.
- **Tapping a plain option opens `MobileSettingsDrawer`** with that family's `SettingsSectionBody`. For Content it also calls `model.onContentTypeChange(option.id)` first, so the drawer lands on the right fields. Closing the drawer (X) returns to the drilled-in rail row.
- **Big surfaces open as drawer detail pages.** The rail wraps its whole tree in `MobileInspectorDensityContext` + `MobileDrawerNavigationProvider` (`currentView`/`setView` wired to the rail's `drawerView` state). Anything calling `useMobileDrawerNavigation().openDetail({ title, content })` — rail rows (custom color picker, Add element, Layers) or `useMobileLiveDetail` consumers inside drawer sections (`SettingsFillPopover`, `SettingsRowPopover`) — pushes a `"setting-detail"` view in `MobileSettingsDrawer`. The detail view renders a back/close header plus `MobileDetailStackOutlets`, into which both `entry.content` and `useMobileLiveDetail` portals render. Back pops the stack; closing the drawer runs `MobileDrawerStackReset` → `clearDetails()` (which must bail on an empty stack — a fresh `[]` churns context identity and loops). `FamilyDrawerViewBridge` pushes the outer view into `FamilyDrawerRoot`'s internal `view` — one-way only, `FamilyDrawerRoot` has no controlled view prop and inner→outer reporting caused a mount/unmount flap loop. Heavy detail content (`DesktopNewFillPicker`, `InsertMenuPanelStack`, `DesktopLayersPopoverContent`) is `React.lazy` — the rail must not pay their import cost up front.
- Rail styling lives in the `Mobile settings rail` block at the end of `features/desktop-shell/inspector/mobile-inspector.css` (`.dn-mobile-settings-rail__row/__item/__circle/__label/__actions/__action`). Icon-button fill comes from `--dn-mobile-button-bg`, defined once as `#ffffff` on `[data-mobile-inspector]` and `#000000` on `[data-mobile-inspector][data-theme="dark"]`, and is used by the actions row (cross, family pill, tick). The option circles use `color-mix(in srgb, var(--dn-fg) 16%, transparent)` so they read as a soft grey; labels/icons use `--dn-fg`. Raise the percentage for more contrast, lower it for fainter — the mix resolves lighter in dark and darker in light.
- The rail overrides `--scroll-edge-fade-color` to `var(--ws-workspace-bg, var(--dn-bg))`. That selector must stay at specificity ≥ (0,3,0): `.desktopnew-root[data-theme="light"]` (0,2,0) resets the fade to `var(--dn-bg)`, which is pure white in light mode and visibly wrong against the `#f0f1f2` workspace surface. Dark has no such block, so a (0,1,0) selector looks correct in dark and breaks only in light.
- `MobileSettingsRail` measures itself with a `ResizeObserver` and feeds `syncMobileWorkspaceChromeInsets` so the workspace reserves the rail + layer-toolbar height. `DesktopWorkspaceEntrance` waits on `[data-slot="mobile-settings-rail-root"]` for the mobile entrance.
- `MobileLayerToolbar` is mounted from the rail component.
- `.desktopnew-root` sets `min-height: 100dvh`. Any `position: fixed` host that carries that class **must** reset `min-height: 0; height: auto` — otherwise it stretches to the full viewport and, because it feeds `--desktop-workspace-canvas-inset-bottom`, squashes the canvas to nothing.
- `FloatingToolbar.test.tsx` covers the rail: family list, circular icon + label per item, selected state, scroll fade cues, the keyboard-inset token, and the family → part → style-catalogue drill (including the cross stepping back one level).

## Testing Notes
- Current tests only cover `features/qr-code/model/state.ts` and a growing set of adjacent modules.
- Vitest is configured with `environment: "node"`, so browser/client behavior is not covered by default.
- If you change React UI behavior, do not assume existing tests cover it.
- `pnpm typecheck` is clean and `next.config.ts` no longer sets `typescript.ignoreBuildErrors`, so `pnpm build` runs type checking and passes. The repo still has **62 pre-existing failing tests across 11 files** (851 of 913 passing, browser-dependent UI tests). `pnpm lint` also reports **214 errors**, mostly `react-hooks/*` rules from `eslint-config-next` 16, concentrated in `packages/qr/vendor/`, `.agents/skills/`, and a few client components that read refs during render; `app/` is lint-clean. Compare your run against that baseline before claiming a regression or a fix.

## Dead-code tooling
- `pnpm knip` is authoritative for this repo. `pnpm exec knip --production` is **not** — it fails to resolve the `@qrafty/qr-internal/*` tsconfig aliases and reports ~25 live barrel exports as unused, and it lists nearly every dependency as unused. Verify any `--production` hit against its real import sites before acting.
- `fallow dead-code` complements knip (adds unused type exports, duplicate exports, unreachable files). Config lives in `.fallowrc.json`; keep `ignoreExports` narrow — a whole-file `"exports": ["*"]` entry hides real findings.
- CSS dead-class detection: extract `\.([\w-]+)` selectors per file and require the exact class name to appear in a `.ts`/`.tsx`/`.json`/`.md` file **and** account for dynamic construction (`` `prefix-${x}` ``) before deleting. `components/bento/style-bento.tsx` builds `style-bento-row-${direction}`, which a naive scan marks dead.
- A CSS class can also be dead because its **host attribute** is gone: `.desktop-elastic-slider` never matches because the element carries `data-slot="desktop-elastic-slider"`. Check `data-slot` values, not just class names.

## QR Card Templates

- Every template document is enumerated by `TEMPLATE_REGISTRY` in `features/studio-hub/model/template-registry.ts`. Register new templates there or they are invisible to tooling.
- **Look at your output before claiming a template works.** Two ways:
  - `pnpm render:templates` writes `.render/templates/<id>.png` plus an `index.html` contact sheet.
  - `/dev/templates` renders every template in the running dev server with real fonts.
- `validateTemplateDocument` in `features/workspace/model/validate-template.ts` machine-checks a document. `features/studio-hub/model/template-validation.test.ts` runs it over the whole registry.
- The validator catches what review misses: layers hidden behind opaque layers, shapes with no fill and no stroke, text below WCAG AA contrast, layers off-canvas, anything covering the QR quiet zone, and a QR too small to be the subject.
- **Never hand-write a `DraftingCanvasLayer` object literal.** Use `createDraftingShapeLayer`, `createDraftingTextLayer`, `createDraftingImageLayer`, or `createDraftingShaderLayer`. They route through `patchDraftingCanvasLayer`, which keeps the legacy and modern representations in sync (`cornerRadius`↔`cornerRadii`, `shadow`↔`shadows[]`, `blur`↔`layerFilters[]`). Raw literals silently desync, the renderer reads the modern field, and your styling disappears. The validator reports this as `field-desync`.
- **Authoring new templates:** read `features/workspace/authoring/AGENTS.md` first. Templates are declared with `defineTemplate` (archetype + palette + ratio + slots), never by positioning layers by hand. Authored templates live in `features/studio-hub/model/authored-templates.ts`.

## Repo Conventions
- Use the `@/*` import alias from `tsconfig.json`.
- Tailwind theme tokens and shadcn CSS variables live in `app/globals.css`.
- shadcn config lives in `components.json` and uses the `radix-nova` style.
- There is no checked-in CI workflow, formatter config, or pre-commit hook config in this repo, so verify locally with lint, typecheck, tests, and build before claiming completion.

## `@qrafty/qr` package layout
- Internal QR library lives in `packages/qr/`:
  - `@qrafty/qr` — shared types (`QraftyQrCodeProps`, `QraftyQrConfig`)
  - `@qrafty/qr/react` — `ReactQRCode` (vendored upstream primitive)
  - `@qrafty/qr/shaders` — paper-shader helpers (`buildPaperShaderRenderProps`, render options)
  - `@qrafty/qr/dot-matrix` — `DotMatrixAnimatedSvg` + animation utilities
- QRafty-only code (SVG scene emit, export, scene schema, vendored renderers) is imported via `@qrafty/qr-internal/*` paths in `tsconfig.json`. These are **not** in `packages/qr/package.json` exports.
- Vendored fork: `packages/qr/vendor/react-qr-code`.
- Build library: `pnpm build:packages` (or `pnpm --filter @qrafty/qr build`).

## Search / Editing Gotchas
- Exclude `.next` and `node_modules` when searching; they create noisy false positives.
- Ignore generated/runtime directories and local artifacts covered by `.gitignore`, especially `.next/`, `node_modules/`, `coverage/`, `build/`, and `.env*`.

