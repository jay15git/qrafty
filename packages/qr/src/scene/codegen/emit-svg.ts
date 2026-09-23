import type { SceneIr } from "./types";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function buildFontDefs(fonts: SceneIr["fonts"]) {
  return fonts
    .flatMap((font) => {
      if (font.cssText) {
        return [`<style type="text/css"><![CDATA[${font.cssText}]]></style>`];
      }

      if (font.cssUrl) {
        return [`<style type="text/css">@import url("${escapeXml(font.cssUrl)}");</style>`];
      }

      return [];
    })
    .join("");
}

export function emitSvg(ir: SceneIr) {
  const { bounds } = ir;
  const fontDefs = buildFontDefs(ir.fonts);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${bounds.width}" height="${bounds.height}" viewBox="${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}"><defs>${fontDefs}${ir.defs}</defs>${ir.body}</svg>`;
}
