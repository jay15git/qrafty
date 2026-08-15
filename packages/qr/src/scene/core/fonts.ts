import type { SceneDocumentV1, SceneFont } from "../schema"

export function collectSceneFonts(scene: SceneDocumentV1): SceneFont[] {
  return scene.fonts
}

export function buildFontFaceCss(fonts: SceneFont[]) {
  return fonts
    .flatMap((font) =>
      font.url
        ? [`@font-face {
  font-family: "${font.family}";
  src: url("${font.url}");
  font-weight: ${font.weight ?? "normal"};
  font-style: ${font.style ?? "normal"};
}`]
        : [],
    )
    .join("\n")
}
