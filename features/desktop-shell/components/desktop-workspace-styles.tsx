export function DesktopWorkspaceStyles() {
  return (
    <style>{`
      [data-slot="desktop-workspace"] [data-slot="drafting-surface"] {
        --ws-canvas-dot-rgb: 15 23 42;
        --ws-canvas-dot-opacity: 0.055;
        position: absolute;
        inset: 0;
        height: 100dvh;
        min-height: 100dvh;
        grid-template-rows: 1fr;
        overflow: hidden;
        background: var(--workspace-page);
      }

      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="drafting-surface"] {
        --ws-canvas-dot-rgb: 15 23 42;
        --ws-canvas-dot-opacity: 0.055;
        background: var(--ws-workspace-bg, #f0f1f2);
      }

      [data-slot="desktop-workspace"][data-desktop-theme="dark"] [data-slot="drafting-surface"] {
        background: #07080a;
      }

      [data-slot="desktop-workspace"][data-desktop-theme="dark"] [data-slot="desktop-floating-inspector"] {
        --scroll-edge-fade-color: #000000;
      }

      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="desktop-compose-surface"] {
        background-color: var(--ws-workspace-bg, #f0f1f2) !important;
        border: 0 !important;
        border-radius: 0 !important;
        box-shadow: 0 8px 8px rgba(15, 23, 42, 0.08) !important;
      }

      [data-slot="desktop-workspace"][data-desktop-theme="dark"] [data-slot="desktop-compose-surface"] {
        background-color: var(--ws-canvas-bg, #1f1f1f) !important;
        border: 0 !important;
        border-radius: 0 !important;
        box-shadow: none !important;
      }

      [data-slot="desktop-workspace"] [data-slot="desktop-compose-surface"][data-grid-visible="false"] {
        background-image: none !important;
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

      [data-slot="desktop-workspace"] [data-slot="drafting-pane-layout"] [data-slot="resizable-panel"] {
        flex: 1 1 0 !important;
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

      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-toolbar-appearance="desktop-glass"] {
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
      }

      [data-slot="desktop-workspace"] [data-toolbar-appearance="desktop-glass"] button svg,
      [data-slot="desktop-workspace"] button[data-toolbar-appearance="desktop-glass"] svg {
        transform-origin: center;
        transition: transform 220ms cubic-bezier(0.16, 1, 0.3, 1), color 180ms ease, opacity 180ms ease;
      }

      body:has([data-slot="desktop-workspace"]) [data-slot="drafting-layer-floating-toolbar"][data-toolbar-appearance="desktop-glass"] button svg,
      body:has([data-slot="desktop-workspace"]) [data-slot="drafting-layer-context-menu"][data-toolbar-appearance="desktop-glass"] button svg {
        transform-origin: center;
        transition: transform 220ms cubic-bezier(0.16, 1, 0.3, 1), color 180ms ease, opacity 180ms ease;
      }

      [data-slot="desktop-workspace"] [data-toolbar-appearance="desktop-glass"] button:active svg,
      [data-slot="desktop-workspace"] button[data-toolbar-appearance="desktop-glass"]:active svg {
        transform: scale(0.84) !important;
      }

      /* Settings sidebar kept desktop-settings appearance — restore press scale on rail + inspector. */
      [data-slot="desktop-workspace"] [data-slot="desktop-left-toolbar-shell"] button {
        transform: none !important;
        translate: none !important;
        scale: none !important;
        rotate: none !important;
      }

      [data-slot="desktop-workspace"] [data-slot="desktop-left-toolbar-shell"] button svg {
        transform-origin: center;
        transition: transform 220ms cubic-bezier(0.16, 1, 0.3, 1), color 180ms ease, opacity 180ms ease;
      }

      [data-slot="desktop-workspace"] [data-slot="desktop-left-toolbar-shell"] button:active svg {
        transform: scale(0.84) !important;
      }

      /* Option tiles already use soft preview scale — don't also squash their glyphs. */
      [data-slot="desktop-workspace"] [data-slot="desktop-left-toolbar-shell"] [data-slot="desktop-floating-inspector"] button:is([data-desktop-preview-option="true"], [data-desktop-content-type-option="true"], [data-desktop-motion-loader-option="true"], [data-desktop-option-tile="true"]):active svg {
        transform: none !important;
      }

      [data-slot="desktop-workspace"] [data-slot="desktop-left-toolbar-shell"] [data-slot="desktop-floating-inspector"] button:is([data-desktop-preview-option="true"], [data-desktop-content-type-option="true"], [data-desktop-motion-loader-option="true"], [data-desktop-option-tile="true"]) svg {
        transition: color 180ms ease, opacity 180ms ease !important;
      }

      body:has([data-slot="desktop-workspace"]) [data-slot="drafting-layer-floating-toolbar"][data-toolbar-appearance="desktop-glass"] button:active svg,
      body:has([data-slot="desktop-workspace"]) [data-slot="drafting-layer-context-menu"][data-toolbar-appearance="desktop-glass"] button:active svg {
        transform: scale(0.84) !important;
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
        border-radius: 12px !important;
      }

      [data-slot="desktop-workspace"] [data-slot="desktop-utility-toolbar"],
      [data-slot="desktop-workspace"] [data-slot="desktop-action-toolbar"],
      [data-slot="desktop-workspace"] [data-slot="desktop-resize-toolbar"],
      [data-slot="desktop-workspace"] [data-slot="desktop-document-toolbar"] {
        border-radius: 10px !important;
      }

      [data-slot="desktop-workspace"] [data-slot="desktop-compose-toolbar"][data-toolbar-appearance="desktop-glass"] button {
        position: relative !important;
        border-radius: 6px !important;
        cursor: pointer !important;
        overflow: hidden !important;
        transform: none !important;
        translate: none !important;
        scale: none !important;
        rotate: none !important;
        color: rgba(255, 255, 255, 0.78) !important;
        transition: color 180ms ease !important;
      }

      [data-slot="desktop-workspace"] [data-slot="desktop-compose-toolbar"][data-toolbar-appearance="desktop-glass"] button::before {
        position: absolute;
        inset: 0;
        border-radius: inherit;
        background: rgba(255, 255, 255, 0);
        transform: scale(1);
        opacity: 0;
        transition: none;
        content: "";
      }

      [data-slot="desktop-workspace"] [data-slot="desktop-compose-toolbar"][data-toolbar-appearance="desktop-glass"] button > svg {
        position: relative;
        z-index: 1;
      }

      [data-slot="desktop-workspace"] [data-slot="desktop-compose-toolbar"][data-toolbar-appearance="desktop-glass"] button svg {
        transform-origin: center;
        transition: transform 220ms cubic-bezier(0.16, 1, 0.3, 1), color 180ms ease, opacity 180ms ease;
      }

      [data-slot="desktop-workspace"] [data-slot="desktop-compose-toolbar"][data-toolbar-appearance="desktop-glass"] button:active svg {
        transform: scale(0.84) !important;
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

      [data-slot="desktop-workspace"] [data-slot="desktop-compose-toolbar"][data-toolbar-appearance="desktop-glass"] button:hover::before {
        background: rgba(255, 255, 255, 0.11);
        opacity: 1;
      }

      [data-slot="desktop-workspace"] [data-slot="desktop-compose-toolbar"][data-toolbar-appearance="desktop-glass"] button[aria-pressed="true"] {
        background: transparent !important;
        color: rgba(255, 255, 255, 0.96) !important;
        box-shadow: none !important;
      }

      [data-slot="desktop-workspace"] [data-slot="desktop-compose-toolbar"][data-toolbar-appearance="desktop-glass"] button[aria-pressed="true"]::before {
        background: rgba(255, 255, 255, 0.16);
        opacity: 1;
      }

      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="desktop-resize-toolbar"],
      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="desktop-document-toolbar"],
      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="desktop-utility-toolbar"],
      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="desktop-dynamic-island"],
      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="desktop-action-toolbar"],
      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="drafting-layer-context-menu"],
      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="drafting-layer-size-value"],
      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="drafting-layer-rotation-value"],
      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="desktop-compose-toolbar"][data-toolbar-appearance="desktop-glass"] {
        background: var(--desktop-glass-bg) !important;
        border-color: rgba(15, 23, 42, 0.12) !important;
        color: rgba(15, 23, 42, 0.76) !important;
        box-shadow: 0 24px 64px rgba(15, 23, 42, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.86) !important;
      }

      [data-slot="desktop-workspace"][data-desktop-theme="dark"] [data-slot="desktop-resize-toolbar"],
      [data-slot="desktop-workspace"][data-desktop-theme="dark"] [data-slot="desktop-document-toolbar"],
      [data-slot="desktop-workspace"][data-desktop-theme="dark"] [data-slot="desktop-utility-toolbar"],
      [data-slot="desktop-workspace"][data-desktop-theme="dark"] [data-slot="desktop-action-toolbar"],
      [data-slot="desktop-workspace"][data-desktop-theme="dark"] [data-slot="desktop-compose-toolbar"][data-toolbar-appearance="desktop-glass"] {
        box-shadow: var(--desktop-glass-shadow) !important;
      }

      [data-slot="desktop-workspace"] [data-slot="desktop-dynamic-island"],
      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="desktop-dynamic-island"],
      [data-slot="desktop-workspace"][data-desktop-theme="dark"] [data-slot="desktop-dynamic-island"] {
        box-shadow: none !important;
      }

      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="drafting-layer-context-menu"] {
        background: rgb(255, 255, 255) !important;
      }

      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="drafting-layer-floating-toolbar"],
      body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) [data-slot="drafting-layer-floating-toolbar"] {
        background: rgb(255, 255, 255) !important;
        border-color: rgba(15, 23, 42, 0.12) !important;
        color: rgba(15, 23, 42, 0.76) !important;
        box-shadow: 0 24px 64px rgba(15, 23, 42, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.86) !important;
      }

      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="drafting-layer-floating-toolbar"],
      body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) [data-slot="drafting-layer-floating-toolbar"] {
        --ws-layer-toolbar-button-hover-bg: rgba(15, 23, 42, 0.08);
        --ws-layer-toolbar-button-hover-text: rgba(15, 23, 42, 0.95);
      }

      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="desktop-resize-toolbar"] button,
      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="desktop-document-toolbar"] button,
      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="desktop-utility-toolbar"] button,
      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="desktop-dynamic-island"] button,
      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="desktop-theme-toggle"],
      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="desktop-action-toolbar"] button,
      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="drafting-layer-floating-toolbar"] button,
      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="drafting-layer-context-menu"] button,
      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="drafting-layer-size-value"],
      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="drafting-layer-rotation-value"],
      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="desktop-compose-toolbar"][data-toolbar-appearance="desktop-glass"] button {
        color: rgba(15, 23, 42, 0.76) !important;
      }

      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="drafting-layer-context-menu"] button:hover,
      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="desktop-compose-toolbar"][data-toolbar-appearance="desktop-glass"] button:hover {
        background: transparent !important;
        color: rgba(15, 23, 42, 0.95) !important;
      }

      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="desktop-resize-toolbar"] button:hover,
      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="desktop-document-toolbar"] button:hover,
      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="desktop-utility-toolbar"] button:hover,
      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="desktop-theme-toggle"]:hover,
      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="desktop-dynamic-island"] button:hover,
      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="desktop-action-toolbar"] button:hover,
      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="drafting-layer-floating-toolbar"] button:hover {
        background-color: rgba(15, 23, 42, 0.08) !important;
        color: rgba(15, 23, 42, 0.95) !important;
      }

      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="desktop-compose-toolbar"][data-toolbar-appearance="desktop-glass"] button:hover::before {
        background: rgba(15, 23, 42, 0.08);
        opacity: 1;
      }

      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="desktop-compose-toolbar"][data-toolbar-appearance="desktop-glass"] button[aria-pressed="true"] {
        background: transparent !important;
        color: rgba(15, 23, 42, 0.95) !important;
        box-shadow: none !important;
      }

      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="desktop-compose-toolbar"][data-toolbar-appearance="desktop-glass"] button[aria-pressed="true"]::before {
        background: rgba(15, 23, 42, 0.12);
        opacity: 1;
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

      body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) [data-slot="desktop-compose-toolbar"][data-toolbar-appearance="desktop-glass"] button:hover::before {
        background: rgba(15, 23, 42, 0.08);
        opacity: 1;
      }

      body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) [data-slot="desktop-compose-toolbar"][data-toolbar-appearance="desktop-glass"] button[aria-pressed="true"] {
        background: transparent !important;
        color: rgba(15, 23, 42, 0.95) !important;
        box-shadow: none !important;
      }

      body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) [data-slot="desktop-compose-toolbar"][data-toolbar-appearance="desktop-glass"] button[aria-pressed="true"]::before {
        background: rgba(15, 23, 42, 0.12);
        opacity: 1;
      }

      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="desktop-resize-toolbar"] button[aria-label="Reset canvas size"] {
        border-color: rgba(15, 23, 42, 0.12) !important;
      }

      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="drafting-layer-context-menu-separator"],
      [data-slot="desktop-workspace"][data-desktop-theme="light"] [data-slot="drafting-layer-toolbar-separator"] {
        background: rgba(15, 23, 42, 0.12) !important;
      }

      body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) [data-slot="drafting-layer-context-menu"] {
        background: rgb(255, 255, 255) !important;
        border-color: rgba(15, 23, 42, 0.12) !important;
        color: rgba(15, 23, 42, 0.76) !important;
        box-shadow: 0 24px 64px rgba(15, 23, 42, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.86) !important;
      }

      body:has([data-slot="desktop-workspace"][data-desktop-theme="dark"]) [data-slot="drafting-layer-context-menu"] {
        background: rgb(23, 23, 23) !important;
        border-color: rgba(255, 255, 255, 0.06) !important;
        color: rgba(255, 255, 255, 0.84) !important;
        box-shadow: var(--desktop-glass-shadow) !important;
      }

      body:has([data-slot="desktop-workspace"][data-desktop-theme="dark"]) [data-slot="drafting-layer-floating-toolbar"] {
        background: rgb(23, 23, 23) !important;
        border-color: rgba(255, 255, 255, 0.06) !important;
        color: rgba(255, 255, 255, 0.84) !important;
        box-shadow: var(--desktop-glass-shadow) !important;
      }

      body:has([data-slot="desktop-workspace"][data-desktop-theme="dark"]) [data-slot="drafting-layer-size-value"],
      body:has([data-slot="desktop-workspace"][data-desktop-theme="dark"]) [data-slot="drafting-layer-rotation-value"] {
        border-color: rgba(255, 255, 255, 0.06) !important;
        box-shadow: var(--desktop-glass-shadow) !important;
      }

      body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) [data-slot="drafting-layer-context-menu"] button {
        color: rgba(15, 23, 42, 0.76) !important;
      }

      body:has([data-slot="desktop-workspace"][data-desktop-theme="dark"]) [data-slot="drafting-layer-context-menu"] button {
        color: rgba(255, 255, 255, 0.84) !important;
      }

      body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) [data-slot="drafting-layer-context-menu"] button:hover {
        background-color: rgba(15, 23, 42, 0.08) !important;
        color: rgba(15, 23, 42, 0.95) !important;
      }

      body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) [data-slot="drafting-layer-floating-toolbar"] button:hover {
        background-color: rgba(15, 23, 42, 0.08) !important;
        color: rgba(15, 23, 42, 0.95) !important;
      }

      body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) [data-slot="drafting-layer-floating-toolbar-button"]:hover {
        background-color: rgba(15, 23, 42, 0.08) !important;
        color: rgba(15, 23, 42, 0.95) !important;
      }

      body:has([data-slot="desktop-workspace"][data-desktop-theme="dark"]) [data-slot="drafting-layer-context-menu"] button:hover {
        background-color: rgba(255, 255, 255, 0.11) !important;
        color: rgba(255, 255, 255, 0.96) !important;
      }

      body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) [data-slot="drafting-layer-context-menu-separator"] {
        background: rgba(15, 23, 42, 0.12) !important;
      }

      body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) [data-slot="desktop-layer-appearance-popover"],
      body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) [data-slot^="desktop-appearance-"][data-slot$="-popover"],
      body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) [data-slot="desktop-scan-safety-popover"],
      body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) [data-slot="desktop-zoom-popover"],
      body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) [data-slot="desktop-insert-menu-popover"] {
        background: rgba(255, 255, 255, 0.86) !important;
        border-color: rgba(15, 23, 42, 0.12) !important;
        color: rgba(15, 23, 42, 0.82) !important;
        box-shadow: 0 24px 64px rgba(15, 23, 42, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.9) !important;
      }

      body:has([data-slot="desktop-workspace"][data-desktop-theme="dark"]) [data-slot="desktop-layer-appearance-popover"],
      body:has([data-slot="desktop-workspace"][data-desktop-theme="dark"]) [data-slot^="desktop-appearance-"][data-slot$="-popover"],
      body:has([data-slot="desktop-workspace"][data-desktop-theme="dark"]) [data-slot="desktop-scan-safety-popover"],
      body:has([data-slot="desktop-workspace"][data-desktop-theme="dark"]) [data-slot="desktop-zoom-popover"],
      body:has([data-slot="desktop-workspace"][data-desktop-theme="dark"]) [data-slot="desktop-insert-menu-popover"] {
        border-color: rgba(255, 255, 255, 0.06) !important;
        box-shadow: var(--desktop-glass-shadow) !important;
      }

      body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) [data-slot="desktop-layer-appearance-popover"] p,
      body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) [data-slot="desktop-layer-appearance-popover"] span,
      body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) [data-slot="desktop-layer-appearance-popover"] label,
      body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) [data-slot^="desktop-appearance-"][data-slot$="-popover"] p,
      body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) [data-slot^="desktop-appearance-"][data-slot$="-popover"] span,
      body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) [data-slot^="desktop-appearance-"][data-slot$="-popover"] label,
      body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) [data-slot="desktop-scan-safety-popover"] p,
      body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) [data-slot="desktop-scan-safety-popover"] span,
      body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) [data-slot="desktop-insert-menu-popover"] p {
        color: rgba(15, 23, 42, 0.72) !important;
      }

      body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) [data-slot="desktop-zoom-popover"] button,
      body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) [data-slot="desktop-insert-menu-popover"] button {
        color: rgba(15, 23, 42, 0.82) !important;
      }

      body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) [data-slot="desktop-zoom-popover"] button:hover,
      body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) [data-slot="desktop-insert-menu-popover"] button:hover {
        background: rgba(15, 23, 42, 0.08) !important;
        color: rgba(15, 23, 42, 0.95) !important;
      }

      body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) [data-slot="desktop-insert-menu-popover"] input {
        background: rgba(15, 23, 42, 0.07) !important;
        border-color: rgba(15, 23, 42, 0.12) !important;
        color: rgba(15, 23, 42, 0.9) !important;
      }

      body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) [data-slot="desktop-insert-menu-popover"] input::placeholder {
        color: rgba(15, 23, 42, 0.42) !important;
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

      body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) [data-slot="desktop-compose-toolbar"][data-toolbar-appearance="desktop-glass"] button:hover::before {
        background: rgba(15, 23, 42, 0.08) !important;
      }

      body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) [data-slot="desktop-compose-toolbar"][data-toolbar-appearance="desktop-glass"] button[aria-pressed="true"]::before {
        background: rgba(15, 23, 42, 0.12) !important;
      }

      @media (max-width: 1100px) {
        [data-slot="desktop-workspace"] [data-slot="desktop-dynamic-island"] {
          max-width: calc(100vw - 15rem);
          overflow-x: auto;
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
    `}</style>
  )
}
