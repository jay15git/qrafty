# DesktopNew Settings Motion Pass

> **For implementation:** Apply the `transitions-dev` and `transitions-polish` guidance only to `/desktopnew`. Keep the present information architecture, control values, and layout intact.

**Goal:** Make settings changes deliberate and consistent: one focused accordion, anchored popovers, a moving segmented-control indicator, tactile selection rings, and accessible reduced-motion behavior.

**Architecture:** Keep all new behavior inside the DesktopNew surface. Reuse the existing Radix controls and CSS data attributes; do not change the shared `Accordion`, `Popover`, `Switch`, or slider primitives. Add a small amount of state only where layout measurement is necessary for the segmented-control indicator and where a switch needs to know it has been user-interacted with.

**Tech stack:** React 19, Radix UI, Tailwind CSS 4, Motion/Framer-based existing sliders, scoped CSS in `features/desktopnew/desktopnew.css`.

## Guardrails

- Do not alter labels, settings content, selected values, popover placement, or the mutually-exclusive / all-closeable accordion behavior.
- Do not add a motion library. CSS plus existing Radix lifecycle attributes are sufficient.
- Do not use `transition: all`. Animate only `transform`, `opacity`, `filter`, `box-shadow`, `background-color`, and `color` where each is needed.
- Do not animate text values, labels, colour values, or the entire page when a setting changes.
- Keep all new class names `dn-*` or `desktopnew-*`. Generic UI primitives must remain unchanged so `/desktop` and other screens do not inherit this pass.
- Every new motion rule needs a `prefers-reduced-motion: reduce` fallback. Motion reduction means no geometric motion, no blur transition, and no selection-ring expansion; state changes must remain immediate and visible.

## Current findings

| Surface | Current behavior | Problem | Planned result |
| --- | --- | --- | --- |
| Accordion | Radix open/close keyframes plus generic `transition-all` trigger; custom focus fade is 180 ms | Mixed timing and duplicated motion language | One 250 ms symmetric content reveal; chevron flips vertically; focused open section stays sharp while the rest fade/blur together. |
| Segment tabs | Per-button colour transition only | Active fill appears/disappears instead of moving | One background indicator slides/resizes under the active label; inactive tabs have no fill. |
| Popovers | Generic fade/zoom/slide defaults | No DesktopNew timing, easing, or shared anchored feel | 250 ms anchored open and 150 ms anchored close from Radix’s transform origin. |
| Tile choices | Card uses a shadow/ring transition; most other tiles are static | Selection feedback is inconsistent, including the Card vs Paper Shader difference | A single outer-ring pattern for selectable tiles; Paper Shader and Card retain the same expanding feeling. |
| Switch | Generic `transition-all` and simple thumb travel | Too broad a transition and no tuned interaction response | Track snaps state; thumb gets a restrained interaction-only settle. |
| Sliders | Existing shared Motion springs | Already responsive, but not explicitly covered by DesktopNew reduced-motion policy | Preserve current slider feel; verify it does not conflict with the new surrounding CSS and document the current limitation if it does. |

## Implementation plan

### 1. Establish DesktopNew motion tokens and reduced-motion policy

**Files:**

- Modify `features/desktopnew/desktopnew.css`

1. Add a namespaced `:root` token block near the existing DesktopNew tokens. Use `--dn-duration-quick: 150ms`, `--dn-duration-fast: 250ms`, `--dn-ease-smooth-out: cubic-bezier(0.22, 1, 0.36, 1)`, `--dn-ease-in-out: ease-in-out`, `--dn-scale-medium: 0.97`, `--dn-scale-tiny: 0.99`, and `--dn-blur-small: 2px`.
2. Replace the current hard-coded 180 ms focus-fade rule with the namespaced fast duration and smooth-out easing.
3. Add one bottom-of-file reduced-motion block covering all new `.dn-*` and `.desktopnew-popover-content` animation / transition selectors. Leave opacity and visibility changes immediate; do not hide state changes.
4. Keep the theme swap itself instant. A theme toggle changes an entire token system, so a broad page colour transition would be noisy and violate the property-specific rule.

**Acceptance:** No DesktopNew style uses a generic `transition-all`; the route has one documented timing / easing vocabulary; reduced motion produces no moving indicator, popover scale, accordion reveal, blur, ring expansion, or switch bounce.

### 2. Make the accordion reveal one coherent focused state

**Files:**

- Modify `features/desktopnew/settings-ui.tsx`
- Modify `features/desktopnew/desktopnew.css`

1. Keep `SettingsAccordion` backed by the existing Radix `Accordion` with `type="single"` and `collapsible`. Do not introduce a default value.
2. Give the content a dedicated nested inner wrapper, e.g. `dn-accordion-content-inner`, rather than relying on the generic primitive’s padding. This keeps the centre-column alignment already requested while giving motion a single overflow-safe inner surface.
3. Override only the DesktopNew content instance with the grid-row disclosure recipe: outer content transitions from `grid-template-rows: 0fr` to `1fr` over 250 ms with `--dn-ease-smooth-out`; inner content transitions opacity from 0 to 1 and filter from `blur(var(--dn-blur-small))` to `none` over the same duration. Use `min-height: 0` and `overflow: hidden` to prevent content from leaking during collapse.
4. Remove the competing generic Accordion keyframe effect for this scoped instance (`animation: none` on the DesktopNew content selector). The one grid transition must handle both opening and closing so timing is symmetric.
5. Override the DesktopNew chevron only: 250 ms transform transition, `scaleY(1)` closed and `scaleY(-1)` open. Do not alter the shared accordion icon rule.
6. Retain the current focus mode but tune it as one grouped state: while any DesktopNew accordion is open, every closed peer transitions to `opacity: .4` and `filter: blur(var(--dn-blur-small))` over 250 ms; the open item remains fully opaque and unblurred. Closed peers must remain clickable so a user can switch sections directly.
7. Leave focus rings intact and unblurred where possible. Test keyboard focus on a faded trigger, then ensure it remains legible enough to operate; if not, add a focused-peer override restoring opacity and removing blur for `:focus-visible` only.

**Acceptance:** Opening one section visibly reveals only that body; opening another closes the first; clicking the open header closes all sections; no stale body remains; focus mode never blocks clicks or keyboard focus.

### 3. Give every DesktopNew popover the same anchored lifecycle

**Files:**

- Modify `features/desktopnew/settings-ui.tsx`
- Modify `features/desktopnew/desktopnew.css`

1. Keep both `SettingsColorPopover` and `SettingsRowPopover` on the present Radix `PopoverContent`; append a shared `dn-popover-content` class to their existing `desktopnew-popover-content` class.
2. In CSS, set `transform-origin: var(--radix-popover-content-transform-origin)` and define exactly two scoped keyframes:
   - Open: opacity 0 to 1 and scale 0.97 to 1 in 250 ms with smooth-out easing.
   - Close: opacity 1 to 0 and scale 1 to 0.99 in 150 ms with ease-in-out.
3. Bind those keyframes to `data-state="open"` and `data-state="closed"`. This deliberately overrides the generic component’s route-agnostic animation only for DesktopNew popovers.
4. Do not add lateral travel. The popover is already positioned by Radix; origin-based scaling keeps it visually pinned to its trigger regardless of side or viewport collision.
5. Verify rapid open/close and opening a second popover immediately after the first. There must be no stranded frame, stale transform, or delayed focus return.

**Acceptance:** Shape type, card colour, logo icon, logo colour, shader, QR shape/style, and colour popovers all open/close with identical timing and an anchored origin.

### 4. Replace static segmented-tab fills with one moving active indicator

**Files:**

- Modify `features/desktopnew/settings-ui.tsx`
- Modify `features/desktopnew/desktopnew.css`

1. Upgrade `SegmentTabs` to render an `aria-hidden` indicator element inside the relative tablist, behind the buttons.
2. Measure the active button’s `offsetLeft` and `offsetWidth` with a `ref` map plus `useLayoutEffect`; update those measurements on selected value, item changes, and a `ResizeObserver` on the tablist.
3. Store only indicator geometry (`left`, `width`, `ready`). First placement must set `ready=false`, so hydration and the initial opening of an accordion do not animate from an incorrect location.
4. Once ready, animate indicator `transform: translateX(...)` and `width` for 250 ms using smooth-out easing. Give buttons a 150 ms explicit `color` transition only. Keep active text above the indicator with a stacking context.
5. Move active background styling from individual tabs to the indicator. Preserve the requested palette: active white in dark mode; active dark in light mode; unselected buttons transparent with no background.
6. Apply this component-level behavior to all current uses automatically: QR module/eye/frame tabs, static/animated colours, solid/gradient card colour controls, background Shader/Image/Color tabs, and motion colour tabs.
7. In reduced motion, place the indicator at its new geometry immediately and preserve active text contrast.

**Acceptance:** The active fill slides and resizes between tabs; labels never jump or overlap; first render is static; resizing / changing theme preserves the correct indicator position; tabs remain fully keyboard-operable.

### 5. Standardize selection feedback across tiles, chips, lists, and icons

**Files:**

- Modify `features/desktopnew/settings-ui.tsx`
- Modify `features/desktopnew/desktopnew.css`

1. Add a shared DesktopNew selectable-tile class to the base button in `OptionGrid`, `IconGrid`, and `ColorChips`. Its base state—not only its selected state—must transition `background-color`, `color`, and `box-shadow` explicitly.
2. Use the Paper Shader pattern as the common selected-tile language: a 2 px outer ring plus 2 px offset, expressed through `box-shadow`, which expands / contracts over 250 ms with smooth-out easing. Keep adequate grid gaps so the offset never clips.
3. Apply the same selected class to Card type tiles. This resolves the observed difference: Card selection currently looks static because its normal and selected tiles do not share the same base shadow-transition setup.
4. Give QR shape/style, logo icon, background colour choices, motion colour choices, and export-format grids the same ring response where their selected state is a tile.
5. Keep `PresetList` row selection quieter: 150 ms `background-color` and `color` only. A large ring on an entire list row would be visually louder than its role warrants.
6. Preserve `aria-pressed` / semantic button state and visible keyboard focus rings. Selection motion must never replace focus indication.

**Acceptance:** Changing the Paper Shader and Card type both produce the same subtle ring expansion; every grid follows the same visual language; no tile’s ring clips inside a popover; row lists remain calm.

### 6. Tune controls that already communicate state

**Files:**

- Modify `features/desktopnew/settings-ui.tsx`
- Modify `features/desktopnew/desktopnew.css`

1. In `SettingsSwitchRow`, record `hasInteracted` locally and pass a `dn-settings-switch` class plus an `is-init` marker only after user input. This prevents a bounce when a controlled setting first mounts or updates programmatically.
2. Scope the switch recipe to that class: track changes state immediately; after interaction only, the thumb uses the documented 350 ms settle animation (`translateX(0) scale(1)` to `translateX(16px) scale(1.08)` to `translateX(16px) scale(1)`) when checked, with the reverse equivalent when unchecked. CSS must override the generic broad root transition only inside this surface.
3. Do not add new slider animation. The shared `SliderComfortable` already animates value motion with its `spring.fast` / `spring.moderate` system and is used for size, opacity, spacing, speed, and padding. Verify it remains responsive while surrounding accordions and tabs animate.
4. Explicitly test slider values changed by keyboard and pointer after an accordion closes or changes focus. If Motion’s slider does not honour system reduced motion today, log that as a separate shared-primitive follow-up rather than introducing a DesktopNew-only hack into the value model.

**Acceptance:** Switches feel deliberate after clicks but do not animate on initial render; sliders retain their existing direct-manipulation feel and never lag a form-state update.

### 7. Visual, interaction, and regression verification

**Files:**

- No new source test required unless the project adds a browser-capable UI test harness during implementation.

1. Run `pnpm lint` and `pnpm exec tsc --noEmit` after the UI work. Run `pnpm build` before handoff.
2. Use `/desktopnew` for a manual matrix in both light and dark themes:

| Check | Expected result |
| --- | --- |
| Each accordion | Closed on initial load; only one body open; open item can close itself. |
| Accordion focus state | Peers fade and blur together; direct click and keyboard navigation still work. |
| Segment tabs | Indicator slides/resizes; active contrast is correct; inactive tabs have no fill. |
| Popovers | Anchored open at 250 ms, close at 150 ms; focus returns to trigger. |
| Shader / Card tiles | Same expanding outer-ring response. |
| Switches / sliders | No mount animation; interactive response stays crisp. |
| `prefers-reduced-motion: reduce` | All state changes occur without geometry animation or blur motion. |
| 320 px and wide viewport | Indicator remains aligned; no clipped popover ring or accordion content. |

3. Compare only the intended DesktopNew files with `git diff -- features/desktopnew/settings-ui.tsx features/desktopnew/desktopnew.css`. Do not stage or commit unrelated existing worktree changes.

## Explicit non-goals

- No page-transition, theme-crossfade, scroll animation, decorative hover choreography, or looping motion.
- No change to content hierarchy, popover settings, labels, renderer state, QR output, or export behavior.
- No edits to shared `components/ui/accordion.tsx`, `components/ui/popover.tsx`, `components/ui/switch.tsx`, or `components/ui/slider.tsx` in this pass.

## Handoff order

1. Tokens and reduced-motion policy.
2. Accordion reveal and focus state.
3. Popover lifecycle.
4. Segmented indicator.
5. Selection-ring consistency.
6. Switch tuning, then full visual / accessibility verification.
