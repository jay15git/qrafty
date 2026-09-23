const WORKSPACE_SURFACE_STYLES = `
      html:has([data-slot="workspace"]),
      body:has([data-slot="workspace"]) {
        overflow: hidden;
        overscroll-behavior: none;
        height: 100%;
      }

      [data-slot="workspace"] [data-slot="drafting-surface"] {
        position: absolute;
        inset: 0;
        height: 100dvh;
        min-height: 100dvh;
        display: grid;
        grid-template: 1fr / 1fr;
        grid-template-rows: 1fr;
        grid-template-columns: 1fr;
        overflow: hidden;
        overscroll-behavior: none;
        background: var(--canvas-page-bg);
      }

      [data-slot="workspace"] [data-slot="drafting-surface"] > * {
        grid-row: 1;
        grid-column: 1;
        min-height: 0;
        min-width: 0;
      }

      [data-slot="workspace"] [data-slot="desktop-canvas-viewport"] {
        overscroll-behavior: auto;
      }

      [data-slot="workspace"] [data-slot="desktop-compose-surface"] {
        overscroll-behavior: none;
      }

      [data-slot="workspace"] [data-slot="desktop-compose-surface"],
      [data-slot="workspace"] [data-slot="desktop-compose-canvas"],
      [data-slot="workspace"] [data-slot="desktop-compose-canvas"] [data-layer-id],
      [data-slot="workspace"] [data-slot="drafting-layer-resize-frame"],
      [data-slot="workspace"] [data-slot="drafting-layer-multi-select-frame"] {
        touch-action: none;
      }

      [data-slot="workspace"] [data-slot="drafting-surface"]:focus,
      [data-slot="workspace"] [data-slot="drafting-surface"]:focus-visible,
      [data-slot="workspace"] [data-slot="desktop-compose-surface"]:focus,
      [data-slot="workspace"] [data-slot="desktop-compose-surface"]:focus-visible,
      [data-slot="workspace"] [data-slot="qr-pane"]:focus,
      [data-slot="workspace"] [data-slot="qr-pane"]:focus-visible,
      [data-slot="workspace"] [data-slot="desktop-compose-canvas"]:focus,
      [data-slot="workspace"] [data-slot="desktop-compose-canvas"]:focus-visible {
        outline: none !important;
      }

      [data-slot="drafting-layer-resize-frame"],
      [data-slot="drafting-layer-multi-select-frame"] {
        --canvas-resize-corner-hit: 16px;
        --canvas-resize-edge-hit: 8px;
      }

      @media (pointer: coarse) {
        [data-slot="drafting-layer-resize-frame"],
        [data-slot="drafting-layer-multi-select-frame"] {
          --canvas-resize-corner-hit: 28px;
          --canvas-resize-edge-hit: 22px;
        }

        [data-slot="drafting-layer-resize-handle"],
        [data-slot="drafting-layer-rotate-handle"] {
          width: var(--canvas-resize-corner-hit) !important;
          height: var(--canvas-resize-corner-hit) !important;
        }

        [data-slot="drafting-layer-resize-handle-knob"],
        [data-slot="drafting-layer-rotate-handle-knob"] {
          width: 10px;
          height: 10px;
        }
      }

      [data-slot="workspace"][data-shell-theme="light"] [data-slot="drafting-surface"] {
        background: var(--canvas-bg, #f0f1f2);
      }

      [data-slot="workspace"][data-shell-theme="dark"] [data-slot="drafting-surface"] {
        background: var(--canvas-bg);
      }

      [data-slot="workspace"][data-shell-theme="dark"] [data-slot="floating-inspector"] {
        --scroll-edge-fade-color: #000000;
      }

      [data-slot="workspace"][data-shell-theme="light"] [data-slot="desktop-compose-surface"] {
        background-color: var(--canvas-bg, #f0f1f2) !important;
        border: 0 !important;
        border-radius: 0 !important;
        box-shadow: 0 8px 8px rgb(var(--canvas-ink-rgb) / 0.08) !important;
      }

      [data-slot="workspace"][data-shell-theme="dark"] [data-slot="desktop-compose-surface"] {
        background-color: var(--canvas-bg, #000000) !important;
        border: 0 !important;
        border-radius: 0 !important;
        box-shadow: none !important;
      }

      [data-slot="workspace"] [data-slot="elastic-slider"],
      body:has([data-slot="workspace"]) [data-slot="elastic-slider"] {
        --elastic-slider-bg: rgba(255, 255, 255, 0.095);
        --elastic-slider-fill: rgba(255, 255, 255, 0.13);
        --elastic-slider-fill-active: rgba(255, 255, 255, 0.2);
        --elastic-slider-hash: rgba(255, 255, 255, 0.24);
        --elastic-slider-handle: rgba(255, 255, 255, 0.7);
        --elastic-slider-label: rgba(255, 255, 255, 0.58);
        --elastic-slider-focus: rgba(255, 255, 255, 0.82);
      }

      [data-slot="workspace"][data-shell-theme="light"] [data-slot="elastic-slider"],
      body:has([data-slot="workspace"][data-shell-theme="light"]) [data-slot="elastic-slider"] {
        --elastic-slider-bg: rgba(15, 23, 42, 0.035);
        --elastic-slider-fill: rgba(15, 23, 42, 0.052);
        --elastic-slider-fill-active: rgba(15, 23, 42, 0.085);
        --elastic-slider-hash: rgba(15, 23, 42, 0.13);
        --elastic-slider-handle: rgba(15, 23, 42, 0.46);
        --elastic-slider-label: rgba(15, 23, 42, 0.56);
        --elastic-slider-focus: rgba(15, 23, 42, 0.78);
      }

      [data-slot="workspace"] [data-slot="floating-toolbar-root"] {
        position: absolute;
        inset: 0;
        z-index: 60;
        min-height: 100dvh;
        background: transparent !important;
        pointer-events: none;
      }

      [data-slot="workspace"] [data-toolbar-appearance="glass"] {
        backdrop-filter: none !important;
      }

      [data-slot="workspace"][data-shell-theme="light"] [data-toolbar-appearance="glass"]:not(
          [data-slot="dynamic-island"],
          [data-slot="utility-toolbar"],
          [data-slot="desktop-compose-toolbar"]
        ) {
        background: var(--canvas-page-bg) !important;
        border-color: rgb(var(--canvas-ink-rgb) / 0.16) !important;
        box-shadow: 0 4px 8px rgb(var(--canvas-ink-rgb) / 0.08) !important;
      }

      body:has([data-slot="workspace"]) button:not(:disabled):not([data-slot="draggable-list-handle"]):not([data-slot="drafting-layer-resize-handle"]):not([data-slot="drafting-layer-resize-edge"]),
      body:has([data-slot="workspace"]) summary,
      body:has([data-slot="workspace"]) select:not(:disabled),
      body:has([data-slot="workspace"]) input[type="color"] {
        cursor: pointer;
      }

      body:has([data-slot="workspace"]) button:disabled {
        cursor: not-allowed;
      }

      body:has([data-slot="workspace"]) [data-slot="draggable-list-handle"]:not(:disabled) {
        cursor: grab;
      }

      body:has([data-slot="workspace"]) [data-slot="draggable-list-handle"]:not(:disabled):active {
        cursor: grabbing;
      }

      [data-slot="workspace"] [data-slot="floating-toolbar"],
      [data-slot="workspace"] [data-slot="floating-inspector"],
      [data-slot="workspace"] [data-slot="action-toolbar"],
      [data-slot="workspace"] [data-slot="resize-toolbar"],
      [data-slot="workspace"] [data-slot="document-toolbar"],
      [data-slot="workspace"] [data-slot="utility-toolbar"],
      [data-slot="workspace"] [data-slot="dynamic-island-anchor"],
      [data-slot="workspace"] [data-slot="utility-toolbar-anchor"],
      [data-slot="workspace"] [data-slot="top-chrome"],
      [data-slot="workspace"] [data-slot="dynamic-island"],
      [data-slot="workspace"] [data-slot="theme-toggle"],
      [data-slot="workspace"] [data-slot="left-toolbar-shell"] {
        pointer-events: auto;
      }

      [data-slot="workspace"] [data-toolbar-appearance="glass"] button,
      [data-slot="workspace"] button[data-toolbar-appearance="glass"] {
        transform: none !important;
        translate: none !important;
        scale: none !important;
        rotate: none !important;
      }

      body:has([data-slot="workspace"]) [data-slot="drafting-layer-floating-toolbar"][data-toolbar-appearance="glass"] button,
      body:has([data-slot="workspace"]) [data-slot="drafting-layer-context-menu"][data-toolbar-appearance="glass"] button {
        transform: none !important;
        translate: none !important;
        scale: none !important;
        rotate: none !important;
      }

      [data-slot="workspace"] [data-toolbar-appearance="glass"] button:hover,
      [data-slot="workspace"] [data-toolbar-appearance="glass"] button:active,
      [data-slot="workspace"] button[data-toolbar-appearance="glass"]:hover,
      [data-slot="workspace"] button[data-toolbar-appearance="glass"]:active {
        transform: none !important;
        translate: none !important;
        scale: none !important;
        rotate: none !important;
      }

      body:has([data-slot="workspace"]) [data-slot="drafting-layer-floating-toolbar"][data-toolbar-appearance="glass"] button:hover,
      body:has([data-slot="workspace"]) [data-slot="drafting-layer-floating-toolbar"][data-toolbar-appearance="glass"] button:active,
      body:has([data-slot="workspace"]) [data-slot="drafting-layer-context-menu"][data-toolbar-appearance="glass"] button:hover,
      body:has([data-slot="workspace"]) [data-slot="drafting-layer-context-menu"][data-toolbar-appearance="glass"] button:active {
        transform: none !important;
        translate: none !important;
        scale: none !important;
        rotate: none !important;
      }`;

const WORKSPACE_SIDEBAR_STYLES = `

      /* Settings sidebar — glass chrome resets icon-button transforms so
         no press/hover scale sneaks back in. */
      [data-slot="workspace"] [data-slot="left-toolbar-shell"] button {
        transform: none !important;
        translate: none !important;
        scale: none !important;
        rotate: none !important;
      }

      [data-slot="workspace"] [data-slot="document-toolbar"][data-toolbar-appearance="glass"],
      [data-slot="workspace"] [data-slot="utility-toolbar"][data-toolbar-appearance="glass"],
      [data-slot="workspace"] [data-slot="dynamic-island"][data-toolbar-appearance="glass"],
      [data-slot="workspace"] [data-slot="action-toolbar"][data-toolbar-appearance="glass"],
      [data-slot="workspace"] [data-slot="resize-toolbar"][data-toolbar-appearance="glass"],
      [data-slot="workspace"] [data-slot="desktop-compose-toolbar"][data-toolbar-appearance="glass"] {
        cursor: pointer;
      }

      [data-slot="workspace"] [data-slot="action-toolbar"][data-toolbar-appearance="glass"] button,
      [data-slot="workspace"] [data-slot="resize-toolbar"][data-toolbar-appearance="glass"] button {
        cursor: pointer !important;
      }

      [data-slot="workspace"] [data-slot="dynamic-island"] {
        border-radius: 0 !important;
      }

      [data-slot="workspace"] [data-slot="dynamic-island"] button:is([aria-pressed="true"], [data-state="open"]),
      [data-slot="floating-toolbar-root"] [data-slot="dynamic-island"] button:is([aria-pressed="true"], [data-state="open"]) {
        position: relative !important;
        overflow: visible !important;
      }

      [data-slot="workspace"] [data-slot="dynamic-island"] button:is([aria-pressed="true"], [data-state="open"])::after,
      [data-slot="floating-toolbar-root"] [data-slot="dynamic-island"] button:is([aria-pressed="true"], [data-state="open"])::after {
        content: "";
        position: absolute;
        bottom: 3px;
        left: 50%;
        width: 3px;
        height: 3px;
        border-radius: 9999px;
        background: currentColor;
        transform: translateX(-50%);
        pointer-events: none;
      }

      [data-slot="workspace"] [data-slot="utility-toolbar"],
      [data-slot="workspace"] [data-slot="action-toolbar"],
      [data-slot="workspace"] [data-slot="resize-toolbar"],
      [data-slot="workspace"] [data-slot="document-toolbar"] {
        border-radius: 10px !important;
      }

      [data-slot="workspace"] [data-slot="desktop-compose-toolbar"][data-toolbar-appearance="glass"] button {
        --compose-toolbar-fg: rgba(255, 255, 255, 0.78);
        --compose-toolbar-fg-hover: rgba(255, 255, 255, 0.96);
        position: relative !important;
        border-radius: 0 !important;
        cursor: pointer !important;
        overflow: visible !important;
        transform: none !important;
        translate: none !important;
        scale: none !important;
        rotate: none !important;
        color: var(--compose-toolbar-fg) !important;
        transition: color 180ms ease !important;
      }

      [data-slot="workspace"] [data-slot="desktop-compose-toolbar"][data-toolbar-appearance="glass"] button::before {
        content: none !important;
      }

      [data-slot="workspace"] [data-slot="desktop-compose-toolbar"][data-toolbar-appearance="glass"] button > svg {
        position: relative;
        z-index: 1;
      }

      [data-slot="workspace"] [data-slot="desktop-compose-toolbar"][data-toolbar-appearance="glass"] button:hover {
        background: transparent !important;
        color: var(--compose-toolbar-fg-hover) !important;
        transform: none !important;
        translate: none !important;
        scale: none !important;
        rotate: none !important;
      }

      [data-slot="workspace"] [data-slot="desktop-compose-toolbar"][data-toolbar-appearance="glass"] button:active {
        transform: none !important;
        translate: none !important;
        scale: none !important;
        rotate: none !important;
      }

      [data-slot="workspace"] [data-slot="desktop-compose-toolbar"][data-toolbar-appearance="glass"] button[aria-pressed="true"] {
        background: transparent !important;
        color: var(--compose-toolbar-fg-hover) !important;
        box-shadow: none !important;
      }

      [data-slot="workspace"][data-shell-theme="light"] [data-slot="resize-toolbar"],
      [data-slot="workspace"][data-shell-theme="light"] [data-slot="document-toolbar"],
      [data-slot="workspace"][data-shell-theme="light"] [data-slot="action-toolbar"],
      [data-slot="workspace"][data-shell-theme="light"] [data-slot="drafting-layer-size-value"],
      [data-slot="workspace"][data-shell-theme="light"] [data-slot="drafting-layer-rotation-value"] {
        background: var(--glass-bg) !important;
        border-color: var(--glass-border) !important;
        color: var(--chrome-fg) !important;
        box-shadow: var(--glass-shadow) !important;
      }

      [data-slot="workspace"][data-shell-theme="light"] [data-slot="utility-toolbar"],
      [data-slot="workspace"][data-shell-theme="light"] [data-slot="dynamic-island"],
      [data-slot="workspace"][data-shell-theme="light"] [data-slot="desktop-compose-toolbar"][data-toolbar-appearance="glass"] {
        background: transparent !important;
        border-color: transparent !important;
        color: var(--chrome-fg) !important;
        box-shadow: none !important;
      }`;

const WORKSPACE_CANVAS_MORPH_STYLES = `

      /* ── canvas ratio morph ─────────────────────────────────
         Picking a size preset flips data-ratio-morph on the compose
         canvas for ~640ms; every box that carries the new shape —
         stage, camera, layers, selection chrome — eases width,
         height and position on the same curve so the canvas reads
         as one crop changing rather than parts snapping.

         Width and height, NEVER a scale: a scaled box drags its
         corner radius with it. Numbers from Bencho's Aspect block —
         520ms, cubic-bezier(0.22, 1, 0.36, 1). */
      [data-slot="desktop-compose-canvas"][data-ratio-morph="true"] [data-slot="desktop-compose-artboard-stage"],
      [data-slot="desktop-compose-canvas"][data-ratio-morph="true"] [data-slot="desktop-compose-artboard"] {
        transition:
          width 520ms cubic-bezier(0.22, 1, 0.36, 1),
          height 520ms cubic-bezier(0.22, 1, 0.36, 1),
          border-radius 520ms cubic-bezier(0.22, 1, 0.36, 1),
          transform 520ms cubic-bezier(0.22, 1, 0.36, 1) !important;
      }

      [data-slot="desktop-compose-canvas"][data-ratio-morph="true"] [data-layer-id],
      [data-slot="desktop-compose-canvas"][data-ratio-morph="true"] [data-layer-ids] {
        transition:
          left 520ms cubic-bezier(0.22, 1, 0.36, 1),
          top 520ms cubic-bezier(0.22, 1, 0.36, 1),
          width 520ms cubic-bezier(0.22, 1, 0.36, 1),
          height 520ms cubic-bezier(0.22, 1, 0.36, 1),
          transform 520ms cubic-bezier(0.22, 1, 0.36, 1),
          border-radius 520ms cubic-bezier(0.22, 1, 0.36, 1) !important;
      }

      @media (prefers-reduced-motion: reduce) {
        [data-slot="desktop-compose-canvas"][data-ratio-morph="true"] [data-slot="desktop-compose-artboard-stage"],
        [data-slot="desktop-compose-canvas"][data-ratio-morph="true"] [data-slot="desktop-compose-artboard"],
        [data-slot="desktop-compose-canvas"][data-ratio-morph="true"] [data-layer-id],
        [data-slot="desktop-compose-canvas"][data-ratio-morph="true"] [data-layer-ids] {
          transition-duration: 1ms !important;
        }
      }

      [data-slot="workspace"][data-shell-theme="dark"] [data-slot="resize-toolbar"],
      [data-slot="workspace"][data-shell-theme="dark"] [data-slot="document-toolbar"],
      [data-slot="workspace"][data-shell-theme="dark"] [data-slot="action-toolbar"] {
        box-shadow: var(--glass-shadow) !important;
      }

      [data-slot="workspace"][data-shell-theme="dark"] [data-slot="utility-toolbar"],
      [data-slot="workspace"][data-shell-theme="dark"] [data-slot="dynamic-island"],
      [data-slot="workspace"][data-shell-theme="dark"] [data-slot="desktop-compose-toolbar"][data-toolbar-appearance="glass"] {
        background: transparent !important;
        border-color: transparent !important;
        box-shadow: none !important;
      }

      [data-slot="workspace"] [data-slot="dynamic-island"],
      [data-slot="workspace"][data-shell-theme="light"] [data-slot="dynamic-island"],
      [data-slot="workspace"][data-shell-theme="dark"] [data-slot="dynamic-island"] {
        box-shadow: none !important;
      }


      [data-slot="workspace"][data-shell-theme="light"] [data-slot="resize-toolbar"] button,
      [data-slot="workspace"][data-shell-theme="light"] [data-slot="document-toolbar"] button,
      [data-slot="workspace"][data-shell-theme="light"] [data-slot="utility-toolbar"] button:not([data-slot="download-trigger"]),
      [data-slot="workspace"][data-shell-theme="light"] [data-slot="dynamic-island"] button,
      [data-slot="workspace"][data-shell-theme="light"] [data-slot="theme-toggle"],
      [data-slot="workspace"][data-shell-theme="light"] [data-slot="action-toolbar"] button,
      [data-slot="workspace"][data-shell-theme="light"] [data-slot="drafting-layer-size-value"],
      [data-slot="workspace"][data-shell-theme="light"] [data-slot="drafting-layer-rotation-value"],
      [data-slot="workspace"][data-shell-theme="light"] [data-slot="desktop-compose-toolbar"][data-toolbar-appearance="glass"] button {
        color: var(--chrome-fg) !important;
      }

      [data-slot="workspace"][data-shell-theme="light"] [data-slot="desktop-compose-toolbar"][data-toolbar-appearance="glass"] button:hover {
        background: transparent !important;
        color: var(--glass-button-hover-fg) !important;
      }

      [data-slot="workspace"][data-shell-theme="light"] [data-slot="resize-toolbar"] button:hover,
      [data-slot="workspace"][data-shell-theme="light"] [data-slot="document-toolbar"] button:hover,
      [data-slot="workspace"][data-shell-theme="light"] [data-slot="theme-toggle"]:hover,
      [data-slot="workspace"][data-shell-theme="light"] [data-slot="action-toolbar"] button:hover {
        background-color: var(--glass-button-hover-bg) !important;
        color: var(--glass-button-hover-fg) !important;
      }

      [data-slot="workspace"][data-shell-theme="light"] [data-slot="utility-toolbar"] button:hover:not([data-slot="download-trigger"]),
      [data-slot="workspace"][data-shell-theme="light"] [data-slot="dynamic-island"] button:hover {
        background-color: transparent !important;
        color: var(--glass-button-hover-fg) !important;
      }

      [data-slot="workspace"][data-shell-theme="light"] [data-slot="desktop-compose-toolbar"][data-toolbar-appearance="glass"] button[aria-pressed="true"] {
        background: transparent !important;
        color: var(--glass-button-hover-fg) !important;
        box-shadow: none !important;
      }

      body:has([data-slot="workspace"][data-shell-theme="light"]) .tooltip-content {
        border-radius: 9999px !important;
        background: var(--tooltip-bg) !important;
        color: var(--tooltip-fg) !important;
        box-shadow: var(--tooltip-shadow-sm) !important;
      }

      body:has([data-slot="workspace"][data-shell-theme="dark"]) .tooltip-content {
        border-radius: 6px !important;
        background: var(--tooltip-bg) !important;
        color: var(--tooltip-fg) !important;
        box-shadow: var(--tooltip-shadow-sm) !important;
      }

      body:has([data-slot="workspace"][data-shell-theme="light"]) [data-slot="desktop-compose-toolbar"][data-toolbar-appearance="glass"] button:hover {
        background: transparent !important;
        color: var(--glass-button-hover-fg) !important;
      }

      body:has([data-slot="workspace"][data-shell-theme="light"]) [data-slot="desktop-compose-toolbar"][data-toolbar-appearance="glass"] button[aria-pressed="true"] {
        background: transparent !important;
        color: var(--glass-button-hover-fg) !important;
        box-shadow: none !important;
      }

      [data-slot="workspace"][data-shell-theme="light"] [data-slot="resize-toolbar"] button[aria-label="Reset canvas size"] {
        border-color: var(--glass-border) !important;
      }


      body:has([data-slot="workspace"][data-shell-theme="dark"]) [data-slot="drafting-layer-size-value"],
      body:has([data-slot="workspace"][data-shell-theme="dark"]) [data-slot="drafting-layer-rotation-value"] {
        border-color: var(--glass-border) !important;
        box-shadow: var(--glass-shadow) !important;
      }


      body:has([data-slot="workspace"][data-shell-theme="light"]) [data-slot="layer-appearance-popover"],
      body:has([data-slot="workspace"][data-shell-theme="light"]) [data-slot^="appearance-"][data-slot$="-popover"],
      body:has([data-slot="workspace"][data-shell-theme="light"]) [data-slot="scan-safety-popover"],
      body:has([data-slot="workspace"][data-shell-theme="light"]) [data-slot="zoom-popover"] {
        background: rgba(255, 255, 255, 0.86) !important;
        border-color: var(--glass-border) !important;
        color: rgba(15, 23, 42, 0.82) !important;
        box-shadow: 0 24px 64px rgba(15, 23, 42, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.9) !important;
      }

      body:has([data-slot="workspace"][data-shell-theme="dark"]) [data-slot="layer-appearance-popover"],
      body:has([data-slot="workspace"][data-shell-theme="dark"]) [data-slot^="appearance-"][data-slot$="-popover"],
      body:has([data-slot="workspace"][data-shell-theme="dark"]) [data-slot="scan-safety-popover"],
      body:has([data-slot="workspace"][data-shell-theme="dark"]) [data-slot="zoom-popover"] {
        border-color: var(--glass-border) !important;
        box-shadow: var(--glass-shadow) !important;
      }

      body:has([data-slot="workspace"][data-shell-theme="light"]) [data-slot="layer-appearance-popover"] p,
      body:has([data-slot="workspace"][data-shell-theme="light"]) [data-slot="layer-appearance-popover"] span,
      body:has([data-slot="workspace"][data-shell-theme="light"]) [data-slot="layer-appearance-popover"] label,
      body:has([data-slot="workspace"][data-shell-theme="light"]) [data-slot^="appearance-"][data-slot$="-popover"] p,
      body:has([data-slot="workspace"][data-shell-theme="light"]) [data-slot^="appearance-"][data-slot$="-popover"] span,
      body:has([data-slot="workspace"][data-shell-theme="light"]) [data-slot^="appearance-"][data-slot$="-popover"] label,
      body:has([data-slot="workspace"][data-shell-theme="light"]) [data-slot="scan-safety-popover"] p,
      body:has([data-slot="workspace"][data-shell-theme="light"]) [data-slot="scan-safety-popover"] span {
        color: rgba(15, 23, 42, 0.72) !important;
      }

      body:has([data-slot="workspace"][data-shell-theme="light"]) [data-slot="zoom-popover"] button {
        color: rgba(15, 23, 42, 0.82) !important;
      }

      body:has([data-slot="workspace"][data-shell-theme="light"]) [data-slot="zoom-popover"] button:hover {
        background: rgba(15, 23, 42, 0.08) !important;
        color: var(--glass-button-hover-fg) !important;
      }

      body:has([data-slot="workspace"][data-shell-theme="light"]) [data-slot="layer-appearance-popover"] p:first-child {
        color: rgba(15, 23, 42, 0.92) !important;
      }

      body:has([data-slot="workspace"][data-shell-theme="light"]) [data-slot="layer-appearance-popover"] label,
      body:has([data-slot="workspace"][data-shell-theme="light"]) [data-slot="layer-appearance-popover"] span.rounded-full {
        background: rgba(15, 23, 42, 0.06) !important;
      }

      body:has([data-slot="workspace"][data-shell-theme="light"]) [data-slot="layer-appearance-popover"] input[type="number"] {
        background: rgba(15, 23, 42, 0.07) !important;
        color: rgba(15, 23, 42, 0.9) !important;
      }

      body:has([data-slot="workspace"][data-shell-theme="light"]) [data-slot="layer-appearance-popover"] input[type="color"] {
        background: rgba(255, 255, 255, 0.72) !important;
      }

      @media (max-width: 1100px) {
        [data-slot="workspace"] [data-slot="dynamic-island"],
        [data-slot="floating-toolbar-root"] [data-slot="dynamic-island"] {
          max-width: calc(100vw - 15rem);
        }

        [data-slot="workspace"] [data-slot="desktop-compose-surface"] {
          border-radius: 0 !important;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        [data-slot="workspace"] *,
        [data-slot="workspace"] *::before,
        [data-slot="workspace"] *::after {
          transition-duration: 0.01ms !important;
          animation-duration: 0.01ms !important;
        }
      }
    `;

export function WorkspaceStyles() {
  return (
    <style>
      {WORKSPACE_SURFACE_STYLES + WORKSPACE_SIDEBAR_STYLES + WORKSPACE_CANVAS_MORPH_STYLES}
    </style>
  );
}
