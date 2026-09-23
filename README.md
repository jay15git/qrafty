# QRafty

**[qrafty.app](https://qrafty.app)** — live app

A design studio for QR codes. QRafty turns a plain black-and-white code into a finished visual asset: pick a payload, style the modules, build a scene on a drafting canvas, then export a still or a looping animation.

The workspace is a single drafting surface rather than a stack of forms — the QR, the card behind it, and every element you place on top are layers you can move, restyle, and reorder.

## Features

**Content**

- 80+ payload types: text, links, phone, email, SMS, Wi-Fi, vCard, events, coupons, UPI and crypto payments, map locations, and documents.
- Platform deep links for the usual suspects — Instagram, WhatsApp, X, TikTok, YouTube, LinkedIn, Telegram, Snapchat, Threads, Pinterest, Discord, Reddit, Twitch, Bluesky, Mastodon, Tumblr, Messenger, Signal, LINE, Skype, GitHub, GitLab, Notion, Medium, Substack, app stores, music services, booking and payment links, and meeting links.
- Paste a URL, a Wi-Fi string, a vCard, an email, or a phone number and QRafty resolves the matching payload type for you.

**QR styling**

- Independent shape sets for modules, eyes (corners), and frames, plus custom corner-dot shapes.
- Solid, linear gradient, radial gradient, palette, and image fills, with a unified-fill mode that pushes one treatment across every QR part.
- Logo and image embedding, background shapes, and scan-safety checks that flag styling which would break the code.

**Canvas**

- Layer kinds: `card`, `qr`, `text`, `image`, `shader`, `shape`, `group`.
- Insert text, shapes, emoji, images, illustrations, and up to ten additional QR codes per document.
- Layers panel, drag and resize handles, per-layer effects (fills, strokes, shadows, blur, filters), keyboard shortcuts, and undo/redo.
- Canvas ratio presets, size templates, and scene layout presets (tilt, top-down, hero zoom, floating, angled).

**Backgrounds**

- Solid, gradient, and image fills, plus a bundled wallpaper library (macOS, Raycast, and QRafty sets).
- 29 animated paper shaders — mesh gradient, grain gradient, warp, waves, dot orbit, voronoi, smoke ring, neuro noise, metaballs, god rays, spiral, swirl, dithering, paper texture, water, fluted glass, and more.

**Motion and export**

- Animated dot-matrix QR with animation presets.
- Export stills as SVG, PNG, JPEG, or WebP, and animations as MP4 or WebM.
- Layered SVG output and a video pipeline that composites shader frames, QR frames, and photo assets.

**Shells**

- Desktop workspace at `/design` with a floating toolbar and inspector panels.
- Mobile layout with a persistent settings rail and drawer detail pages.

## Tech stack

| Layer     | Choice                                                                     |
| --------- | -------------------------------------------------------------------------- |
| Framework | Next.js 16 (App Router, Turbopack)                                         |
| UI        | React 19, Tailwind CSS 4, shadcn/ui (`radix-nova`), Radix, Base UI, Ark UI |
| Motion    | `motion` / `framer-motion`                                                 |
| Shaders   | `@paper-design/shaders`                                                    |
| Tests     | Vitest 4                                                                   |
| Workspace | pnpm workspaces, `@qrafty/qr` internal package                             |

## Requirements

- Node.js 20.9 or newer
- pnpm 10.28.0 (pinned via `packageManager`; `corepack enable` will pick it up)

No environment variables are required to run the app locally.

## Getting started

Use the hosted app at [qrafty.app](https://qrafty.app), or run it locally:

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) for the landing page, or [http://localhost:3000/design](http://localhost:3000/design) for the workspace.

### Scripts

| Command                           | What it does                                        |
| --------------------------------- | --------------------------------------------------- |
| `pnpm dev`                        | Start the dev server                                |
| `pnpm build`                      | Production build (type checking runs as part of it) |
| `pnpm start`                      | Serve the production build                          |
| `pnpm lint`                       | ESLint                                              |
| `pnpm format`                     | Prettier write                                      |
| `pnpm format:check`               | Prettier check (CI gate)                            |
| `pnpm doctor`                     | react-doctor health scan (100/100 baseline)         |
| `pnpm test`                       | Full Vitest suite                                   |
| `pnpm build:packages`             | Build the `@qrafty/qr` workspace package            |
| `pnpm knip`                       | Report unused files, exports, and dependencies      |
| `pnpm sync:mac-wallpapers`        | Refresh the macOS wallpaper set                     |
| `pnpm sync:raycast-wallpapers`    | Refresh the Raycast wallpaper set                   |
| `pnpm sync:qrafty-wallpapers`     | Refresh the QRafty wallpaper set                    |
| `pnpm generate:qr-shape-previews` | Regenerate QR shape preview assets                  |
| `pnpm generate:qr-style-previews` | Regenerate QR style preview assets                  |
| `pnpm render:landing-wheel`       | Regenerate landing card-wheel assets                |

Run a single test file with `pnpm exec vitest run path/to/file.test.ts`, or a single test with `pnpm exec vitest run path/to/file.test.ts -t "test name"`.

## Routes

| Route               | Purpose                                       |
| ------------------- | --------------------------------------------- |
| `/`                 | Marketing landing page                        |
| `/design`           | Desktop workspace (canvas + floating toolbar) |
| `/desktop`          | Permanent redirect to `/design`               |
| `/api/icons/search` | Icon lookup used by the insert menu           |

## Project structure

```
app/                 Next.js App Router routes, root layout, global CSS
components/          Shared UI: design-system primitives (ui/), vendored components (vendor/)
features/
  shell/             Workspace shell: floating toolbar, inspector panels, mobile rail and drawer
  qr/                QR state model, content types, styles, rendering, motion, export
  canvas/            Drafting canvas, layers model, scene templates, export pipeline
  marketing/         Landing page hero, card wheel, effects
packages/qr/         @qrafty/qr — QR primitives, dot-matrix animation, paper shaders
lib/                 Shared utilities and hooks
public/              Fonts, wallpapers, illustrations, generated preview assets
scripts/             Wallpaper sync and asset generation scripts
```

`features/qr/model/state.ts` is the core QR state and mapper layer — start there when adding controls, defaults, or renderer options.

## Quality gates

Verified against the current `main`:

| Command                      | State                                        |
| ---------------------------- | -------------------------------------------- |
| `pnpm typecheck`             | Clean                                        |
| `pnpm build`                 | Passes, and type checking runs as part of it |
| `pnpm test`                  | 942 of 942 tests pass across 126 files       |
| `pnpm lint`                  | 0 errors, 202 warnings                       |
| `pnpm format:check`          | Clean                                        |
| `pnpm doctor`                | 100/100, 0 issues                            |
| `pnpm knip`                  | Clean                                        |
| `pnpm exec fallow dead-code` | Clean                                        |

`pnpm check` runs typecheck + knip + fallow and exits 0.

The remaining lint warnings are `react-hooks/*` advisories from `eslint-config-next` 16 in client components. `app/` is lint-clean.

## Contributing

Contributions are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md) for setup, the conventions this codebase expects, and the pull-request checklist.

In short: run `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm check` before opening a PR, keep changes scoped (the QR state model, the workspace layer model, and the desktop inspector are shared by many surfaces), and read `docs/ARCHITECTURE.md` before writing new code.

## License

[MIT](LICENSE) © 2026 Jayant Acharya
