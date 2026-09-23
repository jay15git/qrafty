const REQUIRES_IMAGE_SHADER_IDS = new Set<string>([
  "fluted-glass",
  "image-dithering",
  "heatmap",
  "liquid-metal",
  "halftone-dots",
  "halftone-cmyk",
  "gem-smoke",
]);

export function shaderRequiresImage(shaderId: string) {
  return REQUIRES_IMAGE_SHADER_IDS.has(shaderId);
}
