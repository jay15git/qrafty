/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from "vitest"

import { resolveDesktopSoundZone } from "@/lib/desktop-interaction-sound"

describe("resolveDesktopSoundZone", () => {
  it("maps left inspector buttons to panel", () => {
    document.body.innerHTML = `
      <section data-slot="desktop-workspace">
        <div data-slot="desktop-left-toolbar-shell">
          <button type="button" id="panel-btn">Pattern</button>
        </div>
      </section>
    `

    const button = document.getElementById("panel-btn")
    expect(button).not.toBeNull()
    expect(resolveDesktopSoundZone(button!)).toBe("panel")
  })

  it("maps compose toolbar buttons to toolbar", () => {
    document.body.innerHTML = `
      <section data-slot="desktop-workspace">
        <div data-slot="desktop-compose-toolbar">
          <button type="button" id="compose-btn">Pan</button>
        </div>
      </section>
    `

    const button = document.getElementById("compose-btn")
    expect(button).not.toBeNull()
    expect(resolveDesktopSoundZone(button!)).toBe("toolbar")
  })

  it("maps portaled context menu buttons to panel", () => {
    document.body.innerHTML = `
      <section data-slot="desktop-workspace"></section>
      <div data-slot="drafting-layer-context-menu">
        <button type="button" role="menuitem" id="menu-btn">Bring to front</button>
      </div>
    `

    const button = document.getElementById("menu-btn")
    expect(button).not.toBeNull()
    expect(resolveDesktopSoundZone(button!)).toBe("panel")
  })

  it("ignores clicks outside desktop", () => {
    document.body.innerHTML = `<button type="button" id="home-btn">Home</button>`

    const button = document.getElementById("home-btn")
    expect(button).not.toBeNull()
    expect(resolveDesktopSoundZone(button!)).toBeNull()
  })
})
