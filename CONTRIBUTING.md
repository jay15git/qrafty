# Contributing to QRafty

Thanks for taking the time to contribute. This document covers how to get set up, what the codebase expects, and what a pull request needs to pass.

## Requirements

- Node.js 20.9 or newer
- pnpm 10.28.0 (pinned via `packageManager`; run `corepack enable` to pick it up)

## Setup

```bash
pnpm install
pnpm dev
```

The landing page is at [http://localhost:3000](http://localhost:3000); the workspace is at [http://localhost:3000/design](http://localhost:3000/design).

No environment variables are required for local development.

## Commands

| Command          | What it does                                        |
| ---------------- | --------------------------------------------------- |
| `pnpm dev`       | Start the dev server                                |
| `pnpm build`     | Production build (type checking runs as part of it) |
| `pnpm lint`      | ESLint                                              |
| `pnpm format`    | Prettier write (`pnpm format:check` is a CI gate)   |
| `pnpm typecheck` | `tsc --noEmit`                                      |
| `pnpm test`      | Full Vitest suite                                   |
| `pnpm check`     | `typecheck` + `knip` + `fallow dead-code`           |
| `pnpm knip`      | Report unused files, exports, and dependencies      |

Run a single test file with `pnpm exec vitest run path/to/file.test.ts`, or a single test with `pnpm exec vitest run path/to/file.test.ts -t "test name"`.

## Before you write code

Read these first. They are not suggestions.

- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — the law. Vocabulary, folder structure, import direction, size limits, React rules. New code must obey it.
- **[CONTEXT.md](CONTEXT.md)** — the domain glossary. One word per concept; new names must use these terms.
- **[docs/adr/](docs/adr/)** — architectural decisions already made. Do not re-litigate them in a PR; open an issue if you think one is wrong.

### The rules that catch most PRs

- **Import direction is one-way:** `app → features → components/ui → lib`. A feature may not reach into another feature's internals; share through `lib/` or lift the type.
- **`model/` files must not import React, DOM APIs, or components.** They stay testable in Vitest's `node` environment.
- **Size limits are a ratchet:** component file ≤ 400 lines, hook ≤ 200, model ≤ 500; a component body ≤ 150 lines of logic before JSX.
- **Never hand-write a `DraftingCanvasLayer` object literal.** Use `createDraftingShapeLayer` / `createDraftingTextLayer` / `createDraftingImageLayer` / `createDraftingShaderLayer`. Raw literals desync the legacy and modern representations and your styling silently disappears.
- **Banned names:** `Surface`, `New`, `desktopnew`, `Manager`, `Helper`, `Utils` (as a filename), `Stuff`, `Common`, `Shared` (as a directory).

## Tests

Tests live next to the code they cover. Vitest runs with `environment: "node"` by default; a test that needs the DOM declares `// @vitest-environment jsdom` in a docblock at the top of the file.

A test earns its place only if a plausible bug would fail it. That means:

- Assert **observable behavior**, not implementation. Do not assert exact class strings, source text, internal wiring, or field copies.
- Do not write a test just so a change "has tests". If a throwaway script proves the behavior, that is enough.
- Do not weaken an assertion to get green. If a test is wrong, fix or delete it and say why.
- Do not add a test that depends on a live network call. Stub the network layer.

## Pull requests

1. **Keep the change scoped.** The QR state model (`features/qr/model/state.ts`), the workspace layer model, and the desktop inspector are shared by many surfaces — a change there has a wide blast radius.
2. **Run the gates locally** and make sure they pass:
   ```bash
   pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm check
   ```
3. **Update the docs the change invalidates.** If you change a convention, update `docs/ARCHITECTURE.md`. If you make an architectural decision, add an ADR. If you add a control or renderer option, start at `features/qr/model/state.ts`.
4. **Write a commit message that explains why**, not just what. The diff shows what changed.
5. **No dead code.** Remove what your change obsoletes — old call sites, aliases, re-exports, deprecated paths. `pnpm knip` and `fallow dead-code` will catch what you miss.

### Review

Every PR is reviewed on two axes, reported separately:

- **Standards** — does the code follow the conventions in `docs/ARCHITECTURE.md` and `CONTEXT.md`?
- **Spec** — does it do what the issue asked, and only that?

A change can pass one and fail the other. Both must pass before merge.

## Reporting bugs

Include:

- What you did, what you expected, what happened.
- The route (`/` or `/design`) and whether it is desktop or mobile.
- Browser and version.
- A minimal reproduction if you can produce one — a payload string plus the styling settings that trigger it is usually enough for a QR rendering bug.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
