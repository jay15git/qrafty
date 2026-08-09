export function dotMatrixLoaderToPresetName(loader: string) {
  return loader
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join("")
}
