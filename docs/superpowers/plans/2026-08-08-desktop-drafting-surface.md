# Desktop Drafting Surface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/desktop` read as a precise mechanical drafting surface and retain usable canvas framing at compact desktop widths.

**Architecture:** Keep existing workspace functionality and tool routing. Consolidate visual overrides around the desktop root, toolbar primitives, and settings shell so canvas, tools, active states, focus, and responsive behavior follow one monochrome system.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, Motion, Vitest.

## Global Constraints

- Preserve all existing QR editing, save, export, and keyboard-shortcut behavior.
- Use `pnpm` commands.
- Avoid soft glass, oversized blur shadows, and capsule toolbar framing on `/desktop`.
- Use structural borders, measured radii, and dense monochrome active states.

---

### Task 1: Unify desktop workspace surface

**Files:**
- Modify: `features/desktop-shell/components/DesktopWorkspace.tsx`

- [ ] Replace desktop-local gray gradient/soft-shadow affordances with flat workspace planes, structural borders, restrained radius, and clear focus rules.
- [ ] Add compact-width rules that reduce chrome intrusion and protect canvas framing.
- [ ] Verify in browser at 1600×900 and 1024×768.

### Task 2: Refine toolbar primitives

**Files:**
- Modify: `features/desktop-shell/components/DesktopUtilityToolbar.tsx`

- [ ] Replace pill shell/button rounding and wide glass shadow with structural rectangular tool groups.
- [ ] Preserve focus, disabled, hover, and active behavior.

### Task 3: Protect compact desktop flow

**Files:**
- Modify: `features/desktop-shell/components/DesktopSettingsToolbarShell.tsx`

- [ ] Reduce expanded inspector width at compact desktop sizes.
- [ ] Keep the canvas usable when settings are visible.

### Task 4: Verify

**Files:**
- Test: `app/desktop/page.test.tsx`

- [ ] Run `pnpm lint`.
- [ ] Run `pnpm exec tsc --noEmit`.
- [ ] Run `pnpm test`.
- [ ] Inspect `/desktop` in browser at wide and compact desktop viewports.
