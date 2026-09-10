const DEPRECATED_DOT_MATRIX_LOADERS: Record<string, string> = {
  "cross-bloom": "radial-expand",
  "echo-ring": "radial-expand",
  "fan-rotate": "neon-drift",
  "origin-wave": "radial-expand",
  "scan": "neon-drift",
  "tunnel": "neon-drift",
  "wave": "neon-drift",
};

export function dotMatrixLoaderToPresetName(loader: string) {
  const normalizedLoader = DEPRECATED_DOT_MATRIX_LOADERS[loader] ?? loader;

  return normalizedLoader
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join("");
}
