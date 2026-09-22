# QRafty architecture

Universal structure + rules. `AGENTS.md` links here; treat this as law for new code.
Migration of existing code is tracked in `docs/superpowers/plans/2026-09-22-repo-cleanup-architecture.md`.

## Vocabulary (one word per concept)

See `CONTEXT.md` for the full glossary. Canonical terms:

| Term | Meaning | NOT these |
|---|---|---|
| **Canvas** | The editing surface where layers live | `Surface`, `Pane`, `WorkspaceSurface` |
| **Layer** | An editable element on the canvas | `Pane` (when it means layer) |
| **Inspector** | The settings/properties panel that edits the selection | `settings-ui`, `desktopnew-*` |
| **Workspace** | The whole editor shell (canvas + inspector + toolbars) | `Desktop` (unless truly desktop-only) |
| **Document** | Serializable workspace state (what autosave/history persist) | `draft`, `snapshot` for the same thing |
| **Pane** | A saved/persistable document variant (real domain object) | — |
| **Rail** | Mobile bottom settings strip | `FamilyDrawer`, `MobileDrawer` |
| **Scene** | Background/composition template behind the QR | `wallpaper`, `template` (ambiguous) |

Banned in new names: `Surface`, `New`, `desktopnew`, `Manager`, `Helper`, `Utils` (as a filename), `Stuff`, `Common`, `Shared` (as a directory).

## Folder structure

```
app/                      # routes only. No logic beyond page composition + metadata.
  api/                    # route handlers. GET handlers are read-only — no side effects.
components/
  ui/                     # design-system primitives ONLY (shadcn, radix wrappers). No feature imports.
  vendor/                 # vendored third-party components. Untouched upstream where possible.
features/
  <domain>/               # vertical slice. Owns everything it needs.
    components/           # React components for this domain
    canvas/               # (workspace) the editing surface + its hooks
    inspector/            # (desktop-shell) settings panels
    model/                # state, types, reducers, pure functions — no React, no DOM
    lib/                  # domain utilities (pure functions preferred)
    api/                  # domain route handlers / server calls
    AGENTS.md             # domain rules, if the domain needs them
lib/                      # cross-feature utilities. If only one feature uses it, move it into that feature.
hooks/                    # cross-feature hooks ONLY. Feature-scoped hooks live in the feature.
packages/qr/              # vendored @qrafty/qr library
```

### Placement decision tree

1. Used by one feature → lives in that feature.
2. Used by 2+ features → `lib/` or `components/ui/`.
3. Used by routes only → `app/` local file.
4. If you can't name the feature it belongs to, the concept is wrong — fix the name first.

## Import direction

```
app → features → components/ui → lib
```

- Features may not import from other features' internals; share via `lib/` or lift the type.
- `components/ui/` must not import from `features/` or `app/`.
- `model/` files must not import React, DOM APIs, or `components/` — keeps them testable in `environment: "node"`.
- No barrel `index.ts` re-export churn for feature internals (graphify showed ~512 collapsed edges of barrel noise).

## Size limits (ratchet)

- Component file: **≤ 400 lines**. Hook file: **≤ 200**. Model file: **≤ 500**.
- React function component body: **≤ 150 lines** of logic before JSX.
- >30 `useRef`/nested functions in one component → extract a hook.
- New code must obey limits. Existing violations are tracked in the plan, not grandfathered silently.

## React rules (react-doctor enforced)

- No `ref.current` reads/writes during render — effects or events only.
- No side effects inside state updaters.
- Every `useEffect` cleans up its subscriptions/timers.
- No dynamic HTML injection without sanitization.
- GET route handlers are read-only.
- No layout-property animations (use transform/opacity via Framer Motion).
- No array-index keys on dynamic lists.
- Keep `framer-motion` imports lazy where the component isn't above the fold.

## Naming rules

- Component files: `PascalCase.tsx` matching the exported component.
- Hooks: `use-<domain>-<thing>.ts` (e.g. `use-drafting-history.ts`).
- Model files: noun (`document.ts`, `layers.ts`), not verbs or `helpers`.
- One type, one canonical home — `fallow` flags duplicates (see `GradientStop` ADR).
- `data-slot` names use `kebab-case` prefixed by domain (`mobile-rail-option`, `drafting-canvas`).

## Verification

Before claiming any refactor done: `pnpm typecheck` + focused tests + `npx react-doctor . --scope changed` (see AGENTS.md for baselines). Baseline: 62 test failures (14 real after polyfills), react-doctor 47/100, lint 214 errors.
