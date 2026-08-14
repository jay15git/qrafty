<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes. Read the relevant guide in `node_modules/next/dist/docs/` before writing Next.js code, and heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Stack
- Single-package `pnpm` app using Next.js `16.2.3`, React `19`, Tailwind CSS `4`, Vitest `4`, shadcn/ui (`radix-nova`), and `@new-qr/qr` (vendored react-qr + scene tooling).
- Use `pnpm`; the repo is locked with `pnpm-lock.yaml`.

## Commands
- Dev server: `pnpm dev`
- Lint: `pnpm lint`
- Typecheck: `pnpm exec tsc --noEmit` (`package.json` has no `typecheck` script)
- Tests: `pnpm test`
- Production build: `pnpm build`
- Single test file: `pnpm exec vitest run components/qr/qr-studio-state.test.ts`
- Single test by name: `pnpm exec vitest run components/qr/qr-studio-state.test.ts -t "builds svg options from the default state"`

## App Structure
- `app/layout.tsx` defines the root shell, Geist/Bricolage Grotesque/Manrope fonts, and global CSS.
- `app/page.tsx` is the home route; renders `HomePromptShell` from `components/home/`.
- `/desktop` is the active desktop workspace.
- `/new`, `/dashboard`, and `/settings` have been removed. Do not re-add features or fixes there unless explicitly asked.
- `features/qr-code/model/state.ts` is the core QR state and mapper layer. Update this first when adding new controls, defaults, or renderer options.
- `components/qr/qr-control-sections.tsx` is the large control-surface form. Follow its existing inline `setState` pattern unless there is a clear reason to refactor.
- `components/drafting/drafting-surface.tsx` is the shared drafting UI used by `/desktop`.
- `lib/utils.ts` only provides `cn()`.

## MCP Tools
- **Use available MCP tools for every task** instead of falling back to raw bash commands when a tool fits.
- **Codebase intelligence:** use GitNexus only. Do not configure or run other repository indexing/search tools.
- **Other MCPs:** `context7_*` for library/framework docs; `pencil_*` for `.pen` design files in `designs/`.
- **Do not use in this repo:** `paper`, `react-grab-mcp`, `supabase_*`, `cocoindex-code`, `ccc`, `codedb`, `graphify`, `code-review-graph`.
- If a tool exists for the job, use it. Do not manually `cat`, `grep`, or `sed` when a structured tool is available.

## Testing Notes
- Current tests only cover `components/qr/qr-studio-state.ts` and a growing set of adjacent modules.
- Vitest is configured with `environment: "node"`, so browser/client behavior is not covered by default.
- If you change React UI behavior, do not assume existing tests cover it.

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

## `@new-qr/qr` package layout
- Internal QR library lives in `packages/qr/`. One package, three component families used by the studio:
  - `@new-qr/qr/react` — `NewQrCode`
  - `@new-qr/qr/animated` — `AnimatedQr`
  - `@new-qr/qr/shaders` — `PaperShaderLayer`
  - `@new-qr/qr` — shared types and `NewQrCode` re-export
- Studio-only code (SVG scene emit, export, scene schema, vendored renderers) is imported via `@new-qr/qr-internal/*` paths in `tsconfig.json`. These are **not** in `packages/qr/package.json` exports.
- Vendored fork: `packages/qr/vendor/react-qr-code`.
- Build library: `pnpm build:packages` (or `pnpm --filter @new-qr/qr build`).

## Search / Editing Gotchas
- Exclude `.next` and `node_modules` when searching; they create noisy false positives.
- Ignore generated/runtime directories and local artifacts covered by `.gitignore`, especially `.next/`, `node_modules/`, `coverage/`, `build/`, and `.env*`.
- GitNexus local data lives in `.gitnexus/` (gitignored).

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **new-qr** (6589 symbols, 18321 relationships, 300 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> Index stale? Run `node .gitnexus/run.cjs analyze` from the project root — it auto-selects an available runner. No `.gitnexus/run.cjs` yet? `npx gitnexus analyze` (npm 11 crash → `npm i -g gitnexus`; #1939).

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows. For regression review, compare against the default branch: `detect_changes({scope: "compare", base_ref: "main"})`.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `query({search_query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `context({name: "symbolName"})`.
- For security review, `explain({target: "fileOrSymbol"})` lists taint findings (source→sink flows; needs `analyze --pdg`).

## Never Do

- NEVER edit a function, class, or method without first running `impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `rename` which understands the call graph.
- NEVER commit changes without running `detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/new-qr/context` | Codebase overview, check index freshness |
| `gitnexus://repo/new-qr/clusters` | All functional areas |
| `gitnexus://repo/new-qr/processes` | All execution flows |
| `gitnexus://repo/new-qr/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
