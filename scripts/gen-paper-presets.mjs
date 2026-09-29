// Regenerates features/canvas/rendering/paper-shader-presets.generated.ts from
// the installed @paper-design/shaders-react presets. Run after upgrading the
// library, then `pnpm format` the output file:
//
//   node scripts/gen-paper-presets.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import * as shadersReact from "@paper-design/shaders-react";

const OUT = resolve("features/canvas/rendering/paper-shader-presets.generated.ts");
const DEFINITIONS = resolve("features/canvas/rendering/paper-shader-definitions.ts");

const kebabToCamel = (value) =>
  value.replace(/-([a-z])/g, (_match, letter) => letter.toUpperCase());

// Emit keys in PAPER_SHADER_DEFINITIONS order (matches snapshotPresets calls).
const definitionIds = [
  ...readFileSync(DEFINITIONS, "utf8").matchAll(/snapshotPresets\("([^"]+)"\)/g),
].map((match) => match[1]);

const entries = definitionIds.map((id) => {
  const presets = shadersReact[`${kebabToCamel(id)}Presets`];

  if (!presets) {
    throw new Error(`@paper-design/shaders-react has no presets export for "${id}"`);
  }

  return [id, presets];
});

const libraryVersion = JSON.parse(
  readFileSync(resolve("node_modules/@paper-design/shaders-react/package.json"), "utf8"),
).version;

const header = `/**
 * GENERATED FILE — do not edit by hand.
 *
 * Preset snapshot of \`@paper-design/shaders-react\` v${libraryVersion}.
 * This module is intentionally server-safe: it contains plain data only and
 * must never import from \`@paper-design/shaders-react\` (whose entry carries
 * \`"use client"\`, making its data exports unreadable from Server Components).
 *
 * Regenerate after upgrading the library:
 *   node scripts/gen-paper-presets.mjs && pnpm prettier --write features/canvas/rendering/paper-shader-presets.generated.ts
 *
 * A drift test in \`paper-shader-definitions.test.ts\` fails when the snapshot
 * no longer matches the installed library version.
 */
import type { PaperShaderParams } from "./paper-shader-definitions";

export const PAPER_SHADER_PRESET_SNAPSHOTS: Record<
  string,
  ReadonlyArray<{ readonly name: string; readonly params: PaperShaderParams }>
> = `;

const body = JSON.stringify(Object.fromEntries(entries), null, 2);
writeFileSync(OUT, `${header}${body} as const;\n`);
console.log(`wrote ${OUT} (${entries.length} shader preset groups)`);
