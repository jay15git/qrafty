// @vitest-environment jsdom

import { existsSync } from "node:fs"
import { expect, it } from "vitest"

import { renderAllTemplates } from "./render-templates"

it("renders every registered template to png", async () => {
  const rendered = await renderAllTemplates()

  expect(rendered.length).toBeGreaterThan(0)

  for (const id of rendered) {
    expect(existsSync(`.render/templates/${id}.png`), id).toBe(true)
  }

  expect(existsSync(".render/templates/index.html")).toBe(true)
}, 120_000)
