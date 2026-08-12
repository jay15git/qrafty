# DesktopNew Settings Popovers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce `/desktopnew` settings to focused popover controls matching requested QR, logo, card, scene, and motion flows.

**Architecture:** Keep local prototype state in `DesktopNewSettingsPanel.tsx`. Reuse `SettingsRowPopover` for primary controls and add a focused color-popover primitive. Tune `SegmentTabs` and scoped tokens so active states invert correctly per theme.

**Tech Stack:** Next.js 16.2.3, React 19, Tailwind CSS 4, Radix Popover, shadcn/ui.

## Global Constraints

- Preserve existing unrelated worktree changes.
- Keep all interactive state inside existing `"use client"` components.
- Use `pnpm`, then run lint, typecheck, tests, and production build.
- `/desktopnew` scene exposes paper shaders and shader settings only.
- QR Style exposes module, eye, and frame shape controls only.
- Colors is a separate accordion directly below QR Style, with Static and Animated tabs.

---

### Task 1: Shared settings primitives

**Files:**

- Modify: `features/desktopnew/settings-ui.tsx:89-180`
- Modify: `features/desktopnew/desktopnew.css:3-74`

**Interfaces:**

- Consumes: Radix `Popover` components, scoped `desktopnew-root` theme tokens.
- Produces: full-width `SegmentTabs`; theme-aware active tabs; `SettingsColorPopover` for color settings.

- [ ] **Step 1: Write failing visual assertions**

Use browser inspection to verify tabs fill container, only active tabs have a background, dark active tab is white, and light active tab is dark.

- [ ] **Step 2: Confirm current failures**

Run: open `http://localhost:3000/desktopnew`, open QR Style.
Expected: segmented control has inset background; active colors do not match requested theme behavior.

- [ ] **Step 3: Implement primitives**

```tsx
export function SegmentTabs(...) {
  return <div className="flex w-full ... bg-transparent p-0" role="tablist">...</div>
}

export function SettingsColorPopover(...) {
  return <Popover>...</Popover>
}
```

```css
.desktopnew-root { --dn-tab-active: #ffffff; --dn-tab-active-fg: #0a0a0a; }
.desktopnew-root[data-theme="light"] { --dn-tab-active: #171717; --dn-tab-active-fg: #ffffff; }
```

- [ ] **Step 4: Verify primitive behavior**

Run: `pnpm exec tsc --noEmit`.
Expected: exits 0.

- [ ] **Step 5: Commit**

```bash
git add features/desktopnew/settings-ui.tsx features/desktopnew/desktopnew.css
git commit -m "refine desktopnew settings primitives"
```

### Task 2: Focused section flows

**Files:**

- Modify: `features/desktopnew/DesktopNewSettingsPanel.tsx:75-323`

**Interfaces:**

- Consumes: `SettingsRowPopover`, `SettingsColorPopover`, `SegmentTabs`, existing local state.
- Produces: QR shape/color popovers for Module, Eye, Frame; icon/color logo popovers; type/color card popovers; paper-shader-only Scene; Motion color popover.

- [ ] **Step 1: Write failing visual assertions**

Use browser inspection to verify: Eye and Frame expose Shape and Colors rows; Logo has Icon and Color rows only; Card has Type and Color rows; Scene contains no Canvas, Layers, Effects, Background, or Patterns; Motion Color opens a separate popover.

- [ ] **Step 2: Confirm current failures**

Run: open each accordion section on `http://localhost:3000/desktopnew`.
Expected: inline controls and forbidden scene tabs are visible.

- [ ] **Step 3: Implement focused popover flow**

```tsx
<SettingsRowPopover hint="Icon" title="Icon" trigger={selectedIcon}>...</SettingsRowPopover>
<SettingsColorPopover hint="Color" color={logoColor}>...</SettingsColorPopover>
```

```tsx
<SettingsRowPopover hint="Type" title="Card type" trigger={shape}>...</SettingsRowPopover>
<SettingsColorPopover hint="Color" color={cardColor}>...</SettingsColorPopover>
```

- [ ] **Step 4: Verify section interactions**

Run: `pnpm lint && pnpm exec tsc --noEmit`.
Expected: both exit 0.

- [ ] **Step 5: Commit**

```bash
git add features/desktopnew/DesktopNewSettingsPanel.tsx
git commit -m "simplify desktopnew settings flows"
```

### Task 3: Full verification

**Files:**

- Verify: `features/desktopnew/DesktopNewSettingsPanel.tsx`
- Verify: `features/desktopnew/settings-ui.tsx`
- Verify: `features/desktopnew/desktopnew.css`

**Interfaces:**

- Consumes: updated desktopnew controls.
- Produces: verified responsive dark and light settings UI.

- [ ] **Step 1: Inspect desktop UI**

Open dark and light `/desktopnew` variants. Exercise every revised popover and verify no collapsed controls render underneath.

- [ ] **Step 2: Run automated verification**

Run: `pnpm test && pnpm build`.
Expected: both exit 0.

- [ ] **Step 3: Run change impact review**

Run: GitNexus `detect_changes({scope: "all"})`.
Expected: only desktopnew prototype symbols and no unexpected flows.

## Self-review

- Coverage: QR tabs, Eye/Frame popovers, full-width segments, theme-aware active tabs, Logo simplification, Card split popovers, Scene reduction, Motion color popover.
- Placeholder scan: none.
- Type consistency: existing local React state and primitive props only.

### Task 4: Separate QR colors

**Files:**

- Modify: `features/desktopnew/DesktopNewSettingsPanel.tsx:23-330`

**Interfaces:**

- Consumes: `SettingsAccordion`, `SegmentTabs`, `SettingsColorPopover`, existing local color controls.
- Produces: a Colors accordion after QR Style; Static and Animated color tabs; QR Style without color controls.

- [ ] **Step 1: Remove QR Style colors**

```tsx
function QrStyleSection() {
  return (
    <div className="flex flex-col gap-3">
      <SegmentTabs items={["Module", "Eye", "Frame"]} value={tab} onChange={setTab} />
      <SettingsRowPopover hint="Style" title={`${tab} style`} trigger={part.shape}>...</SettingsRowPopover>
    </div>
  )
}
```

- [ ] **Step 2: Add Colors after QR Style**

```tsx
const SECTIONS = ["Content", "QR Style", "Colors", "Logo", "Card", "Scene", "Motion", "Export"] as const

function ColorsSection() {
  return <SegmentTabs items={["Static", "Animated"]} value={mode} onChange={setMode} />
}
```

- [ ] **Step 3: Verify colors interaction**

Run: open `/desktopnew`, expand Colors, switch both tabs, then reopen QR Style.
Expected: Colors is directly below QR Style, both tabs work, and QR Style has no Colors row.

- [ ] **Step 4: Verify build**

Run: `pnpm lint -- features/desktopnew/DesktopNewSettingsPanel.tsx && pnpm build`
Expected: both exit 0.

### Task 5: Focused accordion state

**Files:**

- Modify: `features/desktopnew/settings-ui.tsx:55-94`
- Modify: `features/desktopnew/DesktopNewSettingsPanel.tsx:321-336`
- Modify: `features/desktopnew/desktopnew.css:70-88`

**Interfaces:**

- Consumes: Radix single, collapsible accordion state.
- Produces: no default open section; one open section maximum; blurred and faded closed sections when a section is open.

- [ ] **Step 1: Make accordion state optional**

```tsx
const [openSection, setOpenSection] = useState<string | undefined>()

<Accordion collapsible type="single" value={openSection} onValueChange={onOpenSectionChange} />
```

- [ ] **Step 2: Add focused state styles**

```css
.dn-settings-accordion:has(.dn-settings-accordion-item[data-focused="true"])
  .dn-settings-accordion-item:not([data-focused="true"]) {
  filter: blur(1.25px);
  opacity: 0.4;
}
```

- [ ] **Step 3: Verify behavior**

Run: open `/desktopnew`, expand one section, switch to another, then collapse it.
Expected: one section maximum is open; closed sections fade while a section is open; all sections return sharp when none is open.

### Task 6: Accordion label alignment

**Files:**

- Modify: `features/desktopnew/settings-ui.tsx:86-390`

**Interfaces:**

- Consumes: accordion content and all settings primitive controls.
- Produces: controls that align with the accordion label inset.

- [ ] **Step 1: Match accordion content inset to its label**

```tsx
<AccordionContent className="px-2 pb-5 pt-1">
  <div className="flex w-full flex-col gap-3">{renderSection(section)}</div>
</AccordionContent>
```

- [ ] **Step 2: Explicitly stretch primitive controls**

```tsx
<Input className="h-9 w-full ..." />
<SliderComfortable className="w-full ..." />
```

- [ ] **Step 3: Verify visual width**

Run: open each `/desktopnew` accordion.
Expected: tabs, rows, sliders, inputs, grids, and primary actions start and end on the same inset as the accordion label.
