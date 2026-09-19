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
- Typecheck: `pnpm exec tsc --noEmit` (`package.json` has no `typecheck` script)
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

## Mobile FamilyDrawer
- Mobile settings are **horizontal rails inside a fixed 50%-viewport drawer**, not vertical stacks of the desktop grids. Shared desktop sections are rendered through adaptive primitives, never forked per surface.
- Primitives live in `features/desktop-shell/inspector/mobile-settings-rail.tsx`:
  - `SettingsOptionShelf` — fixed-column grid on desktop, horizontal rail on mobile. Use this instead of a bare `grid grid-cols-6` for any option collection.
  - `MobileSettingsRail` / `MobileCardRail` / `MobileChipRail` — square tiles, landscape cards (4:3), and text chips.
  - `useSettingsOptionTileClass()` — fluid tile on desktop, fixed tile in a rail.
- Rail geometry is CSS-driven in `features/desktop-shell/inspector/mobile-inspector.css` (`.dn-mobile-rail`, `.dn-mobile-card-rail`, `.dn-settings-shelf`). Rail rows are `min-width: max-content` and children are fixed-width, so the shelf overflows and peeks instead of compressing.
- The drawer cap is `MOBILE_DRAWER_MAX_VIEWPORT_RATIO = 0.5` in `features/desktop-shell/components/MobileFamilyDrawer.tsx`. At ~390×844 every family fits the cap with no vertical overflow; at 320×568 the cap is only 284px, so families fall back to vertical scrolling. **Never set the capped frame to `overflow-y: hidden`** — that hides controls instead of scrolling them.
- Layer style uses a category rail (`features/desktop-shell/components/MobileLayerStyleInspector.tsx`) backed by the `category` prop on `DesktopLayerStyleInspector`. Mobile renders one category per screen; desktop passes no `category` and renders all of them.
- To re-check layouts, drive the drawer in a phone viewport and assert `scrollHeight === clientHeight` per family, plus `[data-slot="mobile-settings-rail"]` present and `[class*="grid-cols-6"]` absent. `FloatingToolbar.test.tsx` covers the rails and the six-column regression guard.

## Testing Notes
- Current tests only cover `features/qr-code/model/state.ts` and a growing set of adjacent modules.
- Vitest is configured with `environment: "node"`, so browser/client behavior is not covered by default.
- If you change React UI behavior, do not assume existing tests cover it.
- The repo has **87 pre-existing failing tests** across 15 files (as of commit `bfa0211`). Compare your run against that baseline before claiming a regression or a fix; `main` is not green.

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
- Internal QR library lives in `packages/qr/`. One package, three component families used by QRafty:
  - `@qrafty/qr/react` — `QraftyQrCode`
  - `@qrafty/qr/animated` — `AnimatedQr`
  - `@qrafty/qr/shaders` — `PaperShaderLayer`
  - `@qrafty/qr` — shared types and `QraftyQrCode` re-export
- QRafty-only code (SVG scene emit, export, scene schema, vendored renderers) is imported via `@qrafty/qr-internal/*` paths in `tsconfig.json`. These are **not** in `packages/qr/package.json` exports.
- Vendored fork: `packages/qr/vendor/react-qr-code`.
- Build library: `pnpm build:packages` (or `pnpm --filter @qrafty/qr build`).

## Search / Editing Gotchas
- Exclude `.next` and `node_modules` when searching; they create noisy false positives.
- Ignore generated/runtime directories and local artifacts covered by `.gitignore`, especially `.next/`, `node_modules/`, `coverage/`, `build/`, and `.env*`.

