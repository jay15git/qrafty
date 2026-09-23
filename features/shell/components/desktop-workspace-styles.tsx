const WORKSPACE_SURFACE_STYLES = `
      html:has([data-slot="desktop-workspace"]),
      body:has([data-slot="desktop-workspace"]) {
        overflow: hidden;
        overscroll-behavior: none;
        height: 100%;
      }

      [data-slot="desktop-workspace"] [data-slot="drafting-surface"] {
        --canvas-dot-rgb: 15 23 42;
        --canvas-dot-opacity: 0.055;
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

      [data-slot="desktop-workspace"] [data-slot="drafting-surface"] > * {
        grid-row: 1;
        grid-column: 1;
        min-height: 0;
        min-width: 0;
      }

      [data-slot="desktop-workspace"] [data-slot="desktop-canvas-viewport"] {
        overscroll-behavior: auto;
      }

      [data-slot="desktop-workspace"] [data-slot="desktop-compose-surface"] {
        overscroll-behavior: none;
      }

      [data-slot="desktop-workspace"] [data-slot="desktop-compose-surface"],
      [data-slot="desktop-workspace"] [data-slot="desktop-compose-canvas"],
      [data-slot="desktop-workspace"] [data-slot="desktop-compose-canvas"] [data-layer-id],
      [data-slot="desktop-workspace"] [data-slot="drafting-layer-resize-frame"],
      [data-slot="desktop-workspace"] [data-slot="drafting-layer-multi-select-frame"] {
        touch-action: none;
      }

      [data-slot="desktop-workspace"] [data-slot="drafting-surface"]:focus,
      [data-slot="desktop-workspace"] [data-slot="drafting-surface"]:focus-visible,
      [data-slot="desktop-workspace"] [data-slot="desktop-compose-surface"]:focus,
      [data-slot="desktop-workspace"] [data-slot="desktop-compose-surface"]:focus-visible,
      [data-slot="desktop-workspace"] [data-slot="qr-pane"]:focus,
      [data-slot="desktop-workspace"] [data-slot="qr-pane"]:focus-visible,
      [data-slot="desktop-workspace"] [data-slot="desktop-compose-canvas"]:focus,
      [data-slot="desktop-workspace"] [data-slot="desktop-compose-canvas"]:focus-visible {
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

      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="drafting-surface"] {
        --canvas-dot-rgb: 15 23 42;
        --canvas-dot-opacity: 0.055;
        background: var(--canvas-bg, #f0f1f2);
      }

      [data-slot="desktop-workspace"][data-desktop-theme="dark"] [data-slot="drafting-surface"] {
        background: #000000;
      }

      [data-slot="desktop-workspace"][data-desktop-theme="dark"] [data-slot="desktop-floating-inspector"] {
        --scroll-edge-fade-color: #000000;
      }

      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="desktop-compose-surface"] {
        background-color: var(--canvas-bg, #f0f1f2) !important;
        border: 0 !important;
        border-radius: 0 !important;
        box-shadow: 0 8px 8px rgba(15, 23, 42, 0.08) !important;
      }

      [data-slot="desktop-workspace"][data-desktop-theme="dark"] [data-slot="desktop-compose-surface"] {
        background-color: var(--canvas-bg, #000000) !important;
        border: 0 !important;
        border-radius: 0 !important;
        box-shadow: none !important;
      }

      [data-slot="desktop-workspace"] [data-slot="elastic-slider"],
      body:has([data-slot="desktop-workspace"]) [data-slot="elastic-slider"] {
        --elastic-slider-bg: rgba(255, 255, 255, 0.095);
        --elastic-slider-fill: rgba(255, 255, 255, 0.13);
        --elastic-slider-fill-active: rgba(255, 255, 255, 0.2);
        --elastic-slider-hash: rgba(255, 255, 255, 0.24);
        --elastic-slider-handle: rgba(255, 255, 255, 0.7);
        --elastic-slider-label: rgba(255, 255, 255, 0.58);
        --elastic-slider-focus: rgba(255, 255, 255, 0.82);
      }

      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="elastic-slider"],
      body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) [data-slot="elastic-slider"] {
        --elastic-slider-bg: rgba(15, 23, 42, 0.035);
        --elastic-slider-fill: rgba(15, 23, 42, 0.052);
        --elastic-slider-fill-active: rgba(15, 23, 42, 0.085);
        --elastic-slider-hash: rgba(15, 23, 42, 0.13);
        --elastic-slider-handle: rgba(15, 23, 42, 0.46);
        --elastic-slider-label: rgba(15, 23, 42, 0.56);
        --elastic-slider-focus: rgba(15, 23, 42, 0.78);
      }

      [data-slot="desktop-workspace"] [data-slot="desktop-floating-toolbar-root"] {
        position: absolute;
        inset: 0;
        z-index: 60;
        min-height: 100dvh;
        background: transparent !important;
        pointer-events: none;
      }

      [data-slot="desktop-workspace"] [data-toolbar-appearance="desktop-glass"] {
        backdrop-filter: none !important;
      }

      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-toolbar-appearance="desktop-glass"]:not(
          [data-slot="desktop-dynamic-island"],
          [data-slot="desktop-utility-toolbar"],
          [data-slot="desktop-compose-toolbar"]
        ) {
        background: #ffffff !important;
        border-color: rgba(15, 23, 42, 0.16) !important;
        box-shadow: 0 4px 8px rgba(15, 23, 42, 0.08) !important;
      }

      body:has([data-slot="desktop-workspace"]) button:not(:disabled):not([data-slot="draggable-list-handle"]):not([data-slot="drafting-layer-resize-handle"]):not([data-slot="drafting-layer-resize-edge"]),
      body:has([data-slot="desktop-workspace"]) summary,
      body:has([data-slot="desktop-workspace"]) select:not(:disabled),
      body:has([data-slot="desktop-workspace"]) input[type="color"] {
        cursor: pointer;
      }

      body:has([data-slot="desktop-workspace"]) button:disabled {
        cursor: not-allowed;
      }

      body:has([data-slot="desktop-workspace"]) [data-slot="draggable-list-handle"]:not(:disabled) {
        cursor: grab;
      }

      body:has([data-slot="desktop-workspace"]) [data-slot="draggable-list-handle"]:not(:disabled):active {
        cursor: grabbing;
      }

      [data-slot="desktop-workspace"] [data-slot="desktop-floating-toolbar"],
      [data-slot="desktop-workspace"] [data-slot="desktop-floating-inspector"],
      [data-slot="desktop-workspace"] [data-slot="desktop-action-toolbar"],
      [data-slot="desktop-workspace"] [data-slot="desktop-resize-toolbar"],
      [data-slot="desktop-workspace"] [data-slot="desktop-document-toolbar"],
      [data-slot="desktop-workspace"] [data-slot="desktop-utility-toolbar"],
      [data-slot="desktop-workspace"] [data-slot="desktop-dynamic-island-anchor"],
      [data-slot="desktop-workspace"] [data-slot="desktop-utility-toolbar-anchor"],
      [data-slot="desktop-workspace"] [data-slot="desktop-top-chrome"],
      [data-slot="desktop-workspace"] [data-slot="desktop-dynamic-island"],
      [data-slot="desktop-workspace"] [data-slot="desktop-theme-toggle"],
      [data-slot="desktop-workspace"] [data-slot="desktop-left-toolbar-shell"] {
        pointer-events: auto;
      }

      [data-slot="desktop-workspace"] [data-toolbar-appearance="desktop-glass"] button,
      [data-slot="desktop-workspace"] button[data-toolbar-appearance="desktop-glass"] {
        transform: none !important;
        translate: none !important;
        scale: none !important;
        rotate: none !important;
      }

      body:has([data-slot="desktop-workspace"]) [data-slot="drafting-layer-floating-toolbar"][data-toolbar-appearance="desktop-glass"] button,
      body:has([data-slot="desktop-workspace"]) [data-slot="drafting-layer-context-menu"][data-toolbar-appearance="desktop-glass"] button {
        transform: none !important;
        translate: none !important;
        scale: none !important;
        rotate: none !important;
      }

      [data-slot="desktop-workspace"] [data-toolbar-appearance="desktop-glass"] button:hover,
      [data-slot="desktop-workspace"] [data-toolbar-appearance="desktop-glass"] button:active,
      [data-slot="desktop-workspace"] button[data-toolbar-appearance="desktop-glass"]:hover,
      [data-slot="desktop-workspace"] button[data-toolbar-appearance="desktop-glass"]:active {
        transform: none !important;
        translate: none !important;
        scale: none !important;
        rotate: none !important;
      }

      body:has([data-slot="desktop-workspace"]) [data-slot="drafting-layer-floating-toolbar"][data-toolbar-appearance="desktop-glass"] button:hover,
      body:has([data-slot="desktop-workspace"]) [data-slot="drafting-layer-floating-toolbar"][data-toolbar-appearance="desktop-glass"] button:active,
      body:has([data-slot="desktop-workspace"]) [data-slot="drafting-layer-context-menu"][data-toolbar-appearance="desktop-glass"] button:hover,
      body:has([data-slot="desktop-workspace"]) [data-slot="drafting-layer-context-menu"][data-toolbar-appearance="desktop-glass"] button:active {
        transform: none !important;
        translate: none !important;
        scale: none !important;
        rotate: none !important;
      }`

const WORKSPACE_SIDEBAR_STYLES = `

      /* Settings sidebar — glass chrome resets icon-button transforms so
         no press/hover scale sneaks back in. */
      [data-slot="desktop-workspace"] [data-slot="desktop-left-toolbar-shell"] button {
        transform: none !important;
        translate: none !important;
        scale: none !important;
        rotate: none !important;
      }

      [data-slot="desktop-workspace"] [data-slot="desktop-document-toolbar"][data-toolbar-appearance="desktop-glass"],
      [data-slot="desktop-workspace"] [data-slot="desktop-utility-toolbar"][data-toolbar-appearance="desktop-glass"],
      [data-slot="desktop-workspace"] [data-slot="desktop-dynamic-island"][data-toolbar-appearance="desktop-glass"],
      [data-slot="desktop-workspace"] [data-slot="desktop-action-toolbar"][data-toolbar-appearance="desktop-glass"],
      [data-slot="desktop-workspace"] [data-slot="desktop-resize-toolbar"][data-toolbar-appearance="desktop-glass"],
      [data-slot="desktop-workspace"] [data-slot="desktop-compose-toolbar"][data-toolbar-appearance="desktop-glass"] {
        cursor: pointer;
      }

      [data-slot="desktop-workspace"] [data-slot="desktop-action-toolbar"][data-toolbar-appearance="desktop-glass"] button,
      [data-slot="desktop-workspace"] [data-slot="desktop-resize-toolbar"][data-toolbar-appearance="desktop-glass"] button {
        cursor: pointer !important;
      }

      [data-slot="desktop-workspace"] [data-slot="desktop-dynamic-island"] {
        border-radius: 0 !important;
      }

      [data-slot="desktop-workspace"] [data-slot="desktop-dynamic-island"] button:is([aria-pressed="true"], [data-state="open"]),
      [data-slot="desktop-floating-toolbar-root"] [data-slot="desktop-dynamic-island"] button:is([aria-pressed="true"], [data-state="open"]) {
        position: relative !important;
        overflow: visible !important;
      }

      [data-slot="desktop-workspace"] [data-slot="desktop-dynamic-island"] button:is([aria-pressed="true"], [data-state="open"])::after,
      [data-slot="desktop-floating-toolbar-root"] [data-slot="desktop-dynamic-island"] button:is([aria-pressed="true"], [data-state="open"])::after {
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

      [data-slot="desktop-workspace"] [data-slot="desktop-utility-toolbar"],
      [data-slot="desktop-workspace"] [data-slot="desktop-action-toolbar"],
      [data-slot="desktop-workspace"] [data-slot="desktop-resize-toolbar"],
      [data-slot="desktop-workspace"] [data-slot="desktop-document-toolbar"] {
        border-radius: 10px !important;
      }

      [data-slot="desktop-workspace"] [data-slot="desktop-compose-toolbar"][data-toolbar-appearance="desktop-glass"] button {
        position: relative !important;
        border-radius: 0 !important;
        cursor: pointer !important;
        overflow: visible !important;
        transform: none !important;
        translate: none !important;
        scale: none !important;
        rotate: none !important;
        color: rgba(255, 255, 255, 0.78) !important;
        transition: color 180ms ease !important;
      }

      [data-slot="desktop-workspace"] [data-slot="desktop-compose-toolbar"][data-toolbar-appearance="desktop-glass"] button::before {
        content: none !important;
      }

      [data-slot="desktop-workspace"] [data-slot="desktop-compose-toolbar"][data-toolbar-appearance="desktop-glass"] button > svg {
        position: relative;
        z-index: 1;
      }

      [data-slot="desktop-workspace"] [data-slot="desktop-compose-toolbar"][data-toolbar-appearance="desktop-glass"] button:hover {
        background: transparent !important;
        color: rgba(255, 255, 255, 0.96) !important;
        transform: none !important;
        translate: none !important;
        scale: none !important;
        rotate: none !important;
      }

      [data-slot="desktop-workspace"] [data-slot="desktop-compose-toolbar"][data-toolbar-appearance="desktop-glass"] button:active {
        transform: none !important;
        translate: none !important;
        scale: none !important;
        rotate: none !important;
      }

      [data-slot="desktop-workspace"] [data-slot="desktop-compose-toolbar"][data-toolbar-appearance="desktop-glass"] button[aria-pressed="true"] {
        background: transparent !important;
        color: rgba(255, 255, 255, 0.96) !important;
        box-shadow: none !important;
      }

      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="desktop-resize-toolbar"],
      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="desktop-document-toolbar"],
      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="desktop-action-toolbar"],
      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="drafting-layer-size-value"],
      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="drafting-layer-rotation-value"] {
        background: var(--glass-bg) !important;
        border-color: rgba(15, 23, 42, 0.12) !important;
        color: rgba(15, 23, 42, 0.76) !important;
        box-shadow: 0 24px 64px rgba(15, 23, 42, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.86) !important;
      }

      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="desktop-utility-toolbar"],
      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="desktop-dynamic-island"],
      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="desktop-compose-toolbar"][data-toolbar-appearance="desktop-glass"] {
        background: transparent !important;
        border-color: transparent !important;
        color: rgba(15, 23, 42, 0.76) !important;
        box-shadow: none !important;
      }`

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

      [data-slot="desktop-workspace"][data-desktop-theme="dark"] [data-slot="desktop-resize-toolbar"],
      [data-slot="desktop-workspace"][data-desktop-theme="dark"] [data-slot="desktop-document-toolbar"],
      [data-slot="desktop-workspace"][data-desktop-theme="dark"] [data-slot="desktop-action-toolbar"] {
        box-shadow: var(--glass-shadow) !important;
      }

      [data-slot="desktop-workspace"][data-desktop-theme="dark"] [data-slot="desktop-utility-toolbar"],
      [data-slot="desktop-workspace"][data-desktop-theme="dark"] [data-slot="desktop-dynamic-island"],
      [data-slot="desktop-workspace"][data-desktop-theme="dark"] [data-slot="desktop-compose-toolbar"][data-toolbar-appearance="desktop-glass"] {
        background: transparent !important;
        border-color: transparent !important;
        box-shadow: none !important;
      }

      [data-slot="desktop-workspace"] [data-slot="desktop-dynamic-island"],
      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="desktop-dynamic-island"],
      [data-slot="desktop-workspace"][data-desktop-theme="dark"] [data-slot="desktop-dynamic-island"] {
        box-shadow: none !important;
      }


      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="desktop-resize-toolbar"] button,
      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="desktop-document-toolbar"] button,
      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="desktop-utility-toolbar"] button:not([data-slot="desktop-download-trigger"]),
      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="desktop-dynamic-island"] button,
      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="desktop-theme-toggle"],
      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="desktop-action-toolbar"] button,
      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="drafting-layer-size-value"],
      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="drafting-layer-rotation-value"],
      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="desktop-compose-toolbar"][data-toolbar-appearance="desktop-glass"] button {
        color: rgba(15, 23, 42, 0.76) !important;
      }

      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="desktop-compose-toolbar"][data-toolbar-appearance="desktop-glass"] button:hover {
        background: transparent !important;
        color: rgba(15, 23, 42, 0.95) !important;
      }

      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="desktop-resize-toolbar"] button:hover,
      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="desktop-document-toolbar"] button:hover,
      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="desktop-theme-toggle"]:hover,
      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="desktop-action-toolbar"] button:hover {
        background-color: rgba(15, 23, 42, 0.08) !important;
        color: rgba(15, 23, 42, 0.95) !important;
      }

      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="desktop-utility-toolbar"] button:hover:not([data-slot="desktop-download-trigger"]),
      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="desktop-dynamic-island"] button:hover {
        background-color: transparent !important;
        color: rgba(15, 23, 42, 0.95) !important;
      }

      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="desktop-compose-toolbar"][data-toolbar-appearance="desktop-glass"] button[aria-pressed="true"] {
        background: transparent !important;
        color: rgba(15, 23, 42, 0.95) !important;
        box-shadow: none !important;
      }

      body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) .desktop-tooltip-content {
        border-radius: 9999px !important;
        background: rgba(15, 15, 15, 0.94) !important;
        color: rgba(255, 255, 255, 0.96) !important;
        box-shadow: 0 4px 8px rgba(15, 23, 42, 0.18) !important;
      }

      body:has([data-slot="desktop-workspace"][data-desktop-theme="dark"]) .desktop-tooltip-content {
        border-radius: 6px !important;
        background: rgba(255, 255, 255, 0.96) !important;
        color: rgba(15, 15, 15, 0.94) !important;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.28) !important;
      }

      body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) [data-slot="desktop-compose-toolbar"][data-toolbar-appearance="desktop-glass"] button:hover {
        background: transparent !important;
        color: rgba(15, 23, 42, 0.95) !important;
      }

      body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) [data-slot="desktop-compose-toolbar"][data-toolbar-appearance="desktop-glass"] button[aria-pressed="true"] {
        background: transparent !important;
        color: rgba(15, 23, 42, 0.95) !important;
        box-shadow: none !important;
      }

      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="desktop-resize-toolbar"] button[aria-label="Reset canvas size"] {
        border-color: rgba(15, 23, 42, 0.12) !important;
      }


      body:has([data-slot="desktop-workspace"][data-desktop-theme="dark"]) [data-slot="drafting-layer-size-value"],
      body:has([data-slot="desktop-workspace"][data-desktop-theme="dark"]) [data-slot="drafting-layer-rotation-value"] {
        border-color: rgba(255, 255, 255, 0.06) !important;
        box-shadow: var(--glass-shadow) !important;
      }


      body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) [data-slot="desktop-layer-appearance-popover"],
      body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) [data-slot^="desktop-appearance-"][data-slot$="-popover"],
      body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) [data-slot="desktop-scan-safety-popover"],
      body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) [data-slot="desktop-zoom-popover"] {
        background: rgba(255, 255, 255, 0.86) !important;
        border-color: rgba(15, 23, 42, 0.12) !important;
        color: rgba(15, 23, 42, 0.82) !important;
        box-shadow: 0 24px 64px rgba(15, 23, 42, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.9) !important;
      }

      body:has([data-slot="desktop-workspace"][data-desktop-theme="dark"]) [data-slot="desktop-layer-appearance-popover"],
      body:has([data-slot="desktop-workspace"][data-desktop-theme="dark"]) [data-slot^="desktop-appearance-"][data-slot$="-popover"],
      body:has([data-slot="desktop-workspace"][data-desktop-theme="dark"]) [data-slot="desktop-scan-safety-popover"],
      body:has([data-slot="desktop-workspace"][data-desktop-theme="dark"]) [data-slot="desktop-zoom-popover"] {
        border-color: rgba(255, 255, 255, 0.06) !important;
        box-shadow: var(--glass-shadow) !important;
      }

      body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) [data-slot="desktop-layer-appearance-popover"] p,
      body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) [data-slot="desktop-layer-appearance-popover"] span,
      body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) [data-slot="desktop-layer-appearance-popover"] label,
      body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) [data-slot^="desktop-appearance-"][data-slot$="-popover"] p,
      body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) [data-slot^="desktop-appearance-"][data-slot$="-popover"] span,
      body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) [data-slot^="desktop-appearance-"][data-slot$="-popover"] label,
      body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) [data-slot="desktop-scan-safety-popover"] p,
      body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) [data-slot="desktop-scan-safety-popover"] span {
        color: rgba(15, 23, 42, 0.72) !important;
      }

      body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) [data-slot="desktop-zoom-popover"] button {
        color: rgba(15, 23, 42, 0.82) !important;
      }

      body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) [data-slot="desktop-zoom-popover"] button:hover {
        background: rgba(15, 23, 42, 0.08) !important;
        color: rgba(15, 23, 42, 0.95) !important;
      }

      body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) [data-slot="desktop-layer-appearance-popover"] p:first-child {
        color: rgba(15, 23, 42, 0.92) !important;
      }

      body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) [data-slot="desktop-layer-appearance-popover"] label,
      body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) [data-slot="desktop-layer-appearance-popover"] span.rounded-full {
        background: rgba(15, 23, 42, 0.06) !important;
      }

      body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) [data-slot="desktop-layer-appearance-popover"] input[type="number"] {
        background: rgba(15, 23, 42, 0.07) !important;
        color: rgba(15, 23, 42, 0.9) !important;
      }

      body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) [data-slot="desktop-layer-appearance-popover"] input[type="color"] {
        background: rgba(255, 255, 255, 0.72) !important;
      }

      @media (max-width: 1100px) {
        [data-slot="desktop-workspace"] [data-slot="desktop-dynamic-island"],
        [data-slot="desktop-floating-toolbar-root"] [data-slot="desktop-dynamic-island"] {
          max-width: calc(100vw - 15rem);
        }

        [data-slot="desktop-workspace"] [data-slot="desktop-compose-surface"] {
          border-radius: 0 !important;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        [data-slot="desktop-workspace"] *,
        [data-slot="desktop-workspace"] *::before,
        [data-slot="desktop-workspace"] *::after {
          transition-duration: 0.01ms !important;
          animation-duration: 0.01ms !important;
        }
      }
    `

export function DesktopWorkspaceStyles() {
  return (
    <style>
      {WORKSPACE_SURFACE_STYLES + WORKSPACE_SIDEBAR_STYLES + WORKSPACE_CANVAS_MORPH_STYLES}
    </style>
  )
}
