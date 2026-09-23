---
name: QRafty
description: Industrial drafting surface for shaping QR codes into visual assets — monochrome field, charcoal ink, dense black selected states.
colors:
  # ── Primary ──
  ink: "oklch(0.18 0 0)"                    # --foreground / --primary (light)
  ink-on-primary: "oklch(0.99 0 0)"         # --primary-foreground (light)
  canvas-ink: "#0f172a"                     # --canvas-ink, workspace ink (rgb 15 23 42)
  inspector-ink: "#18181b"                  # dn --fg / --accent, light inspector theme
  inspector-ink-inverse: "#fafafa"          # dn --accent on dark inspector theme
  # ── Accent (functional, not decorative) ──
  focus-blue: "#6B97FF"                     # --focus-ring, global :focus-visible outline
  canvas-affordance-blue: "#18a0fb"         # --canvas-resize-frame: selection frame, snap guides, resize knobs
  destructive: "oklch(0.577 0.245 27.325)"  # --destructive (light)
  settings-error: "rgba(220, 38, 38, 0.88)" # --settings-error, light chrome
  # ── Neutral ──
  paper: "oklch(0.99 0 0)"                  # --background (light)
  card-white: "#FFFFFF"                     # --card / --popover / --surface-3..8 (light)
  canvas-field: "#f0f1f2"                   # --canvas-bg / --canvas-surface-bg
  inspector-paper: "#ffffff"                # dn --bg, light inspector
  inspector-surface: "#fafafa"              # dn --surface, light inspector
  control-fill: "#f6f6f6"                   # dn --settings-control, light inspector
  control-fill-alpha: "rgb(15 23 42 / 0.04)"# --settings-control-bg, workspace
  hairline: "oklch(0.9 0 0 / 0.9)"          # --border (light)
  inspector-hairline: "#ececee"             # dn --line, light inspector
  canvas-line: "rgb(15 23 42 / 0.12)"       # --canvas-line / --dropdown-border
  muted-ink: "oklch(0.5 0 0)"               # --muted-foreground (light)
  inspector-muted: "#8a8a8e"                # dn --muted, light inspector
  canvas-ink-muted: "rgb(15 23 42 / 0.55)"  # --canvas-ink-muted
  selected-grey: "#D4D4D4"                  # --selected (light)
  hover-wash: "rgb(0 0 0 / 0.04)"           # --hover (light)
  active-wash: "rgb(0 0 0 / 0.07)"          # --active (light)
  glass-bg: "rgba(255, 255, 255, 0.78)"     # --glass-bg, light floating chrome
  glass-border: "rgba(15, 23, 42, 0.12)"    # --glass-border, light chrome
  glass-ink: "rgba(15, 23, 42, 0.68)"       # --glass-fg, light chrome
  # ── Dark workspace (documented; light is source of truth) ──
  dark-field: "#000000"                     # --canvas-bg, dark workspace
  dark-glass: "rgba(29, 29, 29, 0.95)"      # --glass-bg, dark chrome
  inspector-dark-bg: "#161616"              # dn --bg, dark inspector (standalone default)
  inspector-dark-surface: "#1d1d1d"         # dn --surface, dark inspector
  inspector-dark-control: "#232323"         # dn --settings-control, dark inspector
  inspector-dark-ink: "#f5f5f5"             # dn --fg, dark inspector
  inspector-dark-line: "#2c2c2c"            # dn --line, dark inspector
  inspector-dark-muted: "#6b6b6b"           # dn --muted, dark inspector
typography:
  inspector-body:
    fontFamily: '"Inter", system-ui, sans-serif'
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "-0.015em"
  inspector-value:
    fontFamily: '"Inter", system-ui, sans-serif'
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "-0.015em"
  inspector-label:
    fontFamily: '"Inter", system-ui, sans-serif'
    fontSize: "0.6875rem"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.015em"
  inspector-caption:
    fontFamily: '"Inter", system-ui, sans-serif'
    fontSize: "0.625rem"
    fontWeight: 500
    lineHeight: 1
  inspector-section:
    fontFamily: '"Inter", system-ui, sans-serif'
    fontSize: "1rem"
  workspace-input:
    fontFamily: '"Inter", system-ui, sans-serif'
    fontSize: "1rem"
    lineHeight: 1.45
  ui-default:
    fontFamily: 'system-ui, sans-serif'
    fontSize: "0.875rem"
    fontWeight: 500
  brand:
    fontFamily: 'var(--font-caveat-family), cursive'
    fontSize: "2rem"
    fontWeight: 600
rounded:
  inspector-xs: "10px"   # dn --radius-xs, squircle
  inspector-sm: "12px"   # dn --radius-sm, squircle
  inspector-md: "14px"   # dn --radius-md / --radius-lg, squircle
  ui-sm: "4px"           # shadcn rounded-sm (button xs / icon-xs)
  ui-md: "6px"           # shadcn rounded-md (SecondaryButton)
  ui-lg: "8px"           # shadcn rounded-lg (Button, Input)
  knob: "2px"            # canvas resize-handle knob
  popover-panel: "20px"  # dn accordion popover panel (1.25rem squircle)
  full: "9999px"         # pills, toolbar icon buttons, mobile rail circles
spacing:
  stack: "0.625rem"      # dn --space-stack: vertical rhythm inside inspector sections
  inline: "0.375rem"     # dn --space-inline: gap between option tiles
  row-px: "0.75rem"      # dn --settings-row-px: row horizontal padding
  control-height: "2.25rem"        # dn --settings-control-height
  control-height-compact: "2rem"   # dn --settings-control-height-compact
  tab-height: "2rem"               # dn --settings-tab-height
  preview-tile: "3.5rem"           # dn --settings-preview-tile
  icon-hit: "2rem"                 # dn --settings-icon-hit
  toolbar-button: "2.25rem"        # floating-toolbar button (size-9)
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ink-on-primary}"
    rounded: "{rounded.ui-lg}"
    height: "2rem"
    padding: "8px 12px"
    typography: "{typography.ui-default}"
  button-primary-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ink-on-primary}"
  button-secondary:
    backgroundColor: "rgb(0 0 0 / 0.012)"
    textColor: "rgb(0 0 0 / 0.45)"
    rounded: "{rounded.ui-md}"
    height: "2.5rem"
    padding: "0 16px"
    typography: "{typography.ui-default}"
  button-secondary-selected:
    backgroundColor: "#111111"
    textColor: "#ffffff"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.ui-lg}"
  inspector-primary:
    backgroundColor: "{colors.inspector-ink}"
    textColor: "{colors.inspector-paper}"
    rounded: "{rounded.inspector-xs}"
    height: "{spacing.control-height}"
  input-inspector:
    backgroundColor: "{colors.control-fill}"
    textColor: "{colors.inspector-ink}"
    rounded: "{rounded.inspector-xs}"
    height: "{spacing.control-height}"
    typography: "{typography.inspector-value}"
  input-ui:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.ui-lg}"
    height: "2rem"
    padding: "4px 10px"
  option-tile:
    backgroundColor: "{colors.control-fill}"
    textColor: "{colors.inspector-muted}"
    rounded: "{rounded.inspector-xs}"
    size: "{spacing.preview-tile}"
  option-tile-selected:
    backgroundColor: "{colors.control-fill}"
    textColor: "{colors.inspector-ink}"
  segment-tab-selected:
    backgroundColor: "#171717"
    textColor: "#ffffff"
    rounded: "{rounded.full}"
    height: "{spacing.tab-height}"
  toolbar-icon-button:
    backgroundColor: "transparent"
    textColor: "{colors.glass-ink}"
    rounded: "{rounded.full}"
    size: "{spacing.toolbar-button}"
  canvas-resize-knob:
    backgroundColor: "#ffffff"
    textColor: "{colors.canvas-affordance-blue}"
    rounded: "{rounded.knob}"
    size: "8px"
  popover-panel:
    backgroundColor: "{colors.inspector-surface}"
    textColor: "{colors.inspector-ink}"
    rounded: "{rounded.inspector-md}"
---

# Design System: QRafty

## Overview

**Creative North Star: "The Drafting Table"**

QRafty is a QR-creation surface that behaves like a drafting table, not a dashboard. The workspace is a flat monochrome field (`#f0f1f2`) ruled by a faint dot grid (2.4px dots on a 30px pitch at 5.5% ink opacity). Everything on it is ink on paper: charcoal text, hairline borders, and controls printed so faintly they read as part of the surface until they are needed. The memorable gesture is condensation — an inactive control is a whisper of ink (4–7% black wash); a selected control collapses into dense black mass (`#111111` fill, white text, or a 2px ink ring that scales in from 90%).

Two token realities coexist and both are normative. `app/globals.css` owns the shadcn layer (`--background`, `--primary`, `--muted-foreground`, `--border`, `--ring`, …) plus the QRafty layer (`--surface-1..8`, `--shadow-1..8`, `--hover`, `--active`, `--selected`, `--qr-*`), bridged into Tailwind via `@theme inline`. The Inspector runs its own scoped layer in `features/shell/inspector/inspector.css` on `.desktopnew-root` (`--bg`, `--fg`, `--line`, `--settings-control`, `--type-*`, `--radius-*`, `--space-*`, `--settings-*`), which remaps itself onto the shadcn roles inside its scope. Floating chrome adds a third layer: `--glass-*` and `--settings-fg-*` in `features/shell/components/desktop-chrome.css`, and canvas tokens (`--canvas-*`) in `features/canvas/workspace-tokens.css`. New Inspector styles use `dn` tokens; new primitives use shadcn tokens; canvas chrome uses `--canvas-*`/`--glass-*`. Do not bridge them ad hoc.

Light mode is the source of truth (PRODUCT.md). Dark mode exists as a full parallel token set (`.dark`, `[data-desktop-theme="dark"]`, `.desktopnew-root[data-theme="dark"]`) and must stay wired, but design decisions are made in light. Note: the standalone Inspector defaults to dark (`color-scheme: dark` on `.desktopnew-root`); the workspace overrides it per theme.

**Key Characteristics:**

- Monochrome ink on paper; the only hues are functional: focus blue (`#6B97FF`), canvas-manipulation blue (`#18a0fb`), destructive red.
- Inactive controls are nearly invisible (4–8% ink washes); selected state is dense black mass or a 2px ink ring.
- Inspector geometry is squircle (`corner-shape: squircle`, radii 10–14px); shadcn primitives stay `rounded-lg` (8px); canvas affordances stay sharp (2px knobs, 1px guides).
- Depth is physical: a `--shadow-1..8` scale that always begins with a 1px ring, plus one heavy glass shadow for floating chrome.
- Structure is shown through linework — dot grid, hairline separators, dashed empty-state frames — never through decoration.

## Colors

The palette is a single ink ramp over paper, plus three functional hues. There is no decorative accent.

### Primary

- **Dense Ink** (`oklch(0.18 0 0)`): `--foreground`/`--primary` in light mode. Primary button fill, selected-state mass, primary text. In the Inspector this role is `#18181b` (`--fg`/`--accent`); on the canvas it is `#0f172a` (`--canvas-ink`, rgb 15 23 42 — a slate-leaning black used for all canvas ink alphas).
- **Paper Inverse** (`oklch(0.99 0 0)`): `--primary-foreground`. Text and glyphs sitting on Dense Ink.

### Accent (functional only)

- **Focus Blue** (`#6B97FF`): `--focus-ring`. The global `:focus-visible` outline (1px solid, 2px offset). Never used decoratively.
- **Manipulation Blue** (`#18a0fb`): `--canvas-resize-frame`. Selection frames, snap guides, and resize-knob borders on the canvas — the Figma-style affordance color. Dark mode shifts it to `#4ab8ff`. It belongs to the canvas only; never in panels or buttons.
- **Destructive Red** (`oklch(0.577 0.245 27.325)`): `--destructive` for destructive actions and `aria-invalid` borders; `--settings-error` (`rgba(220,38,38,0.88)`) is the light-chrome variant, `--destructive-light` (`#FEF2F2`) its wash.

### Neutral

- **Paper** (`oklch(0.99 0 0)`): `--background`. App ground.
- **Card White** (`#FFFFFF`): `--card`, `--popover`, `--surface-3..8`. Raised surfaces; the light surface ramp is nearly flat (`#FAFAFA` → `#FFFFFF`) because separation is carried by shadow rings, not fill steps.
- **Canvas Field** (`#f0f1f2`): `--canvas-bg`/`--canvas-surface-bg`. The drafting table itself; dot grid and artboards sit on it.
- **Control Fill** (`#f6f6f6` Inspector / `rgb(15 23 42 / 0.04)` workspace): `--settings-control`/`--settings-control-bg`. The "printed into the surface" fill for inactive inputs, tiles, and rows.
- **Hairline** (`oklch(0.9 0 0 / 0.9)`): `--border`. Default structural line. Inspector uses `#ececee` (`--line`); canvas uses `rgb(15 23 42 / 0.12)` (`--canvas-line`).
- **Muted Ink** (`oklch(0.5 0 0)`): `--muted-foreground`. Secondary text; Inspector `#8a8a8e`, canvas `rgb(15 23 42 / 0.55)`, chrome `rgba(15,23,42,0.38–0.66)` in four steps (`--settings-fg-muted/tertiary/secondary/primary`).
- **Selected Grey** (`#D4D4D4`): `--selected`. Non-ink selection fill where black mass would be too heavy.
- **Hover/Active Wash** (`rgb(0 0 0 / 0.04)` / `/0.07`): `--hover`/`--active`. The lightest possible state change.
- **Glass** (`rgba(255,255,255,0.78)` bg, `rgba(15,23,42,0.12)` border, `rgba(15,23,42,0.68)` fg): `--glass-*`. Floating toolbars and popovers over the canvas.

### Dark workspace (parallel set, not the source of truth)

Canvas field drops to pure black (`#000000`), glass to `rgba(29,29,29,0.95)`, ink inverts to `#f5f5f5`, and the Inspector runs `#161616`/`#1d1d1d`/`#232323` surfaces with `#2c2c2c` lines. Dark shadows switch from drop rings to inset highlight + drop (`--qr-hi-*`, `--qr-ring-*`, `--qr-drop`).

### Named Rules

**The One Hue Per Job Rule.** Blue is already spoken for twice — focus (`#6B97FF`) and canvas manipulation (`#18a0fb`). No third accent may be introduced; state is expressed with ink density, not color.
**The Printed Control Rule.** A resting control's fill must stay within the 4–8% ink wash band (`--hover` to `--settings-control-bg`). If a control is visible at rest, it is too loud.

## Typography

**Inspector Font:** Inter (`"Inter", system-ui, sans-serif`, `cv11`/`ss01` features, antialiased) — the entire settings surface.
**App/marketing fonts:** Manrope (body, `--font-body`), Bricolage Grotesque (display, `--font-display`), Kodchasan (hero support, `--font-kodchasan`), Caveat (brand mark, `--font-caveat-family` — the "QRafty" wordmark at 2rem/600), Geist Mono (`--font-geist-mono`, code).

**Character:** small, tight, tabular. The Inspector scale runs 10–13px with `-0.015em` tracking and `tabular-nums` on every value — instrument labeling, not editorial prose.

### Hierarchy

- **Section** (1rem, `--type-section`): Inspector section titles.
- **Body** (400, 0.8125rem, 1.55, -0.015em): `--type-body` / `.dn-type-body`. Explanatory text inside settings.
- **Value** (500, 0.75rem, 1, -0.015em, tabular-nums): `--type-value` / `.dn-type-value`. Inputs, readouts, row labels — the workhorse size.
- **Label/Meta** (400, 0.6875rem, 1): `--type-meta` / `.dn-type-label`. Control labels at 44–46% foreground (`--type-label-color`).
- **Caption** (500, 0.625rem, 1): `--type-caption` / `.dn-type-caption`, `.dn-type-chip`. Chips and micro-labels.
- **Workspace input** (1rem, 1.45): `--type-input` / `.ws-type-input` — 16px on canvas inputs to prevent iOS zoom; **control label** (0.875rem, 1.2): `--type-control-label`.
- **UI default** (500, 0.875rem): shadcn `text-sm font-medium` on buttons and menus.

### Named Rules

**The Instrument Scale Rule.** Inside the Inspector nothing exceeds 1rem and nothing is lighter than 400. Hierarchy comes from weight (400 label / 500 value) and color (46% fg label / full fg value), never from size jumps.
**The Tabular Rule.** Any rendered number uses `font-variant-numeric: tabular-nums` — values must not jitter while scrubbing.

## Layout

The workspace is a single full-viewport grid cell (`100dvh`, `grid-template: 1fr / 1fr`, `overflow: hidden`, `overscroll-behavior: none`) — every region layers onto the same cell. The canvas fills it; floating chrome (top toolbar, document/action/utility toolbars, dynamic island, left inspector shell) positions absolutely over it with `pointer-events` managed per element.

- **Canvas:** dot grid `radial-gradient(circle, rgb(15 23 42 / 0.055) 2.4px, transparent 3px)` on a 30px pitch, artboards centered, `touch-action: none` on the compose surface.
- **Inspector:** a `--settings-panel-width` column (100% when embedded in the left toolbar shell) that is a named container (`container-name: dn-settings`) — option grids collapse 4→3 columns under 280px. Internal rhythm: `--space-stack` (0.625rem) vertical gaps, `--space-inline` (0.375rem) tile gaps, `--settings-row-px` (0.75rem) row padding, fixed 2.25rem control height (2rem compact/tab).
- **Tile hit areas:** option tiles bleed half the gap into their neighbors (`margin-inline: -gap/2`) so the pointer never dead-zones between tiles.
- **Mobile:** the Inspector becomes a bottom rail/drawer (`[data-mobile-inspector]`) — horizontal shelves of fixed 3.5rem tiles, circular icon-over-label nav, docked tab bar, `env(safe-area-inset-bottom)` padding.
- **Scroll chrome:** thin scrollbars (10px track, 8% overlay thumb), scroll-edge fades (`--scroll-edge-fade-color`, 48px mask) instead of visible tracks where content scrolls under chrome.

## Elevation & Depth

Depth is physical, not atmospheric. The system has two shadow grammars: a measured `--shadow-1..8` scale for surfaces, and one heavy drop for floating glass chrome.

### Shadow Vocabulary

- **Surface scale** (`--shadow-1` … `--shadow-8`): every step starts with `0 0 0 1px rgb(0 0 0 / 0.06)` — a ring, not a blur — then stacks doubling blurs (1px, 3px, 6px … 96px) at half-height offsets. Use the lowest step that separates the surface; `--shadow-1` alone is the default "lifted card" read.
- **Canvas rest/hover/active** (`0 2px 8px` / `0 4px 12px` / `0 1px 4px` at 6–10% ink): `--canvas-shadow-*`. Buttons on the canvas lift on hover (`-1px` translate + hover shadow) and compress on press.
- **Canvas selected** (`0 0 22px 2px` at 14% ink): `--canvas-shadow-selected` — a bloom, the only diffuse shadow, reserved for the selected artboard.
- **Glass chrome** (`0 24px 64px rgba(15,23,42,0.14)` + `inset 0 1px 0 rgba(255,255,255,0.86)`): `--glass-shadow`. The heaviest shadow in the system; only floating toolbars/popovers over the canvas may use it.
- **Inspector popover** (`0 12px 40px rgb(0 0 0 / 18%)`): portalled settings panels; flat in-tree (`dn-popover-flat` strips border and shadow entirely).
- **Dark mode:** drop rings become `inset 0 1px 0` highlight + `inset` ring + drop (`--qr-hi-*`, `--qr-ring-*`, `--qr-drop`); the compose surface drops its shadow entirely.

### Named Rules

**The Ring-First Rule.** A surface shadow always includes its 1px ring term. A bare blur without the ring is off-system — the ring is what makes elevation read as a cut edge rather than a glow.
**The Flat Inspector Rule.** Inside the Inspector, `box-shadow: none` is enforced (`!important` in places). Depth inside panels comes from fill steps and hairlines only; shadows are for things that float over the canvas.

## Shapes

Three corner languages, each scoped to its layer — do not mix them.

- **Inspector: squircle.** `corner-shape: squircle` over `--radius-xs/sm/md/lg` (10/12/14/14px) via `.dn-squircle-*`; falls back to `round` where unsupported. Option tiles, inputs, sliders, popover shells, and the 1.25rem accordion panel all share it.
- **Primitives: standard radius.** shadcn components keep Tailwind radii — `rounded-lg` (8px) buttons/inputs, `rounded-md` (6px) secondary buttons, `rounded-sm` (4px) xs sizes, `rounded-full` for pills and icon buttons.
- **Canvas: sharp.** Resize knobs are 8px squares with 2px radius and 2px blue border; snap guides are 1px lines; the compose surface is forced to `border-radius: 0`. Empty/placeholder layers use dashed hairline frames (`1px dashed` / `border-dashed`).

Selection geometry: a 2px `--fg` ring drawn on `::after`, inset 0, scaling 0.9→1 over 340ms — the "planted" marker for option tiles and preview tiles.

## Components

### Buttons

- **Shape:** `rounded-lg` (8px) default; `pill` variant goes `rounded-full`; xs/icon-xs drop to `rounded-sm`.
- **Primary:** Dense Ink fill, Paper Inverse text, `h-8 px-3`, `text-sm font-medium`, `shadow-sm` tinted `primary/24`. Hover: `bg-primary/90`. Press: `scale-[0.98]` (clickEffect, off for `aria-haspopup`).
- **Secondary (canvas):** the drafting-table button — `h-10 px-4 rounded-md`, resting at 1.2% ink fill / 45% ink text, hover lifts `-1px` into 2.4% fill / 65% ink, press flattens back, **selected condenses to `#111111` fill + white text**. This is the signature state contrast.
- **Inspector primary:** inverted ink (`--fg` bg, `--bg` text) at full control height — a black bar row.
- **Ghost/outline/link:** transparent or hairline-bordered, hover fills `--accent` wash.
- **Focus:** `ring-[3px] ring-ring/32` on primitives; `1px solid #6B97FF` outline globally; glass buttons use `ring-2` in `--glass-button-focus-ring`.

### Option Tiles (signature)

- **Style:** square (`--settings-preview-tile`, 3.5rem) or aspect-square grid cells; `control-fill` background, muted-ink glyph, 2px transparent border, squircle-xs corners.
- **Selected:** text snaps to full ink and a 2px ink ring scales in on `::after` (340ms, `--ease-press`). Background does not change — the ring is the state.
- **Canvas variant:** no tile chrome at all — bare muted glyph that gains `--settings-panel-bg-hover` wash and full ink on hover.

### Segment Tabs

- **Style:** text tabs over a sliding pill (`.t-tabs-pill`), `--settings-tab-height` (2rem), `--tabs-dur` 180ms `--ease-out`.
- **Selected:** pill is near-black `#171717` (white in dark), selected label inverts to white — the same dense-mass gesture as buttons. Muted variant (`t-tabs--muted`) uses a 10% fg pill instead.

### Inputs / Fields

- **Inspector input:** 2.25rem tall, `control-fill` background, 1px `--line` border (dropped entirely inside content-fields), squircle-xs, value typography (0.75rem/500/tabular). **Focus changes nothing visual** — no ring, no border shift; the field is already "on". Placeholder: `--muted`.
- **UI input:** `h-8 rounded-lg`, transparent bg, `border-input`, focus gets `border-ring` + `ring-3 ring-ring/50`; invalid gets destructive border/ring.
- **Sliders:** squircle track on `--slider-bg`, thin 3px × 1.125rem handle, `ew-resize` cursor — drag is the gesture, no grab hand.

### Navigation / Chrome

- **Floating toolbars:** glass pills (`--glass-bg` + `backdrop-blur`, 1px `--glass-border`, `--glass-shadow`), 2.25rem circular icon buttons, glyphs at 68% ink → 95% on hover → full ink when pressed/active. Icon stroke thickens 1.5→2 on active instead of changing color.
- **Inspector panel:** hairline-edged column (`--line` at 80%), flat, accordion sections separated by 1px inset hairlines at 40% opacity.
- **Mobile rail:** circular white icon buttons over labels in a horizontal shelf; pressed pills take a 16% fg fill.

### Canvas Chrome (signature)

- **Selection frame:** `--canvas-resize-frame` blue — 1px frame, 8px square knobs (2px radius, 2px border, white fill), 1px snap guides, 16px corner / 8px edge hit zones (28/22px on coarse pointers).
- **Context menus / floating layer toolbar:** glass appearance (`data-toolbar-appearance="desktop-glass"`), 1.75rem circular buttons, 78% fg glyphs.
- **Empty layers:** dashed hairline frame + muted 11px label — the "dashed structural line" motif.

## Do's and Don'ts

### Do:

- **Do** express state with ink density: rest ≤8% ink wash, hover deepens the wash, selected is dense `#111111`/`--fg` mass or the 2px scaling ring.
- **Do** use the token layer that owns your surface: `dn --*` inside `.desktopnew-root`, shadcn tokens in `components/ui`, `--canvas-*`/`--glass-*` on workspace chrome. When adding a global token, wire all three places: `@theme inline`, `:root`, `.dark`.
- **Do** keep Inspector type on the instrument scale (0.625–1rem, -0.015em, tabular-nums for numbers).
- **Do** use squircle corners (`dn-squircle-*`) for Inspector surfaces and standard Tailwind radii for primitives — each layer keeps its own geometry.
- **Do** give floating chrome the glass treatment (`--glass-bg`, `--glass-border`, `--glass-shadow`) and keep in-panel surfaces flat.
- **Do** use dashed hairlines for empty/placeholder structure and solid hairlines for real divisions.

### Don't:

- **Don't** introduce a decorative accent color — blue is reserved for focus and canvas manipulation; everything else is ink.
- **Don't** put shadows inside the Inspector or on resting controls; elevation is for surfaces floating over the canvas, and always ring-first.
- **Don't** use Manipulation Blue (`#18a0fb`) outside canvas affordances, or Focus Blue (`#6B97FF`) for anything but `:focus-visible`.
- **Don't** add soft cards, glow, gradients, or rounded-pill styling to panel interiors (PRODUCT.md anti-references); pills belong to glass toolbars and segment tabs only.
- **Don't** restyle `desktopnew-*`/Inspector surfaces with shadcn utilities — the token remap already routes `bg-primary` etc. to dn values inside that scope; bypassing it breaks both themes.
- **Don't** enlarge Inspector controls below their hit tokens: 2.25rem control height, 2rem icon hit, 3.5rem preview tile are the density contract.
