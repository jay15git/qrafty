export function resolveShaderPlaybackVisible(
  observedVisible: boolean,
  ignoreVisibilityGate?: boolean,
) {
  return ignoreVisibilityGate ? true : observedVisible;
}
