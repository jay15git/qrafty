# @qrafty/qr

Internal QRafty QR rendering library used by QRafty:

- **QR primitives** — `ReactQRCode` (vendored `@lglab/react-qr-code` fork)
- **Dot-matrix animation** — `DotMatrixAnimatedSvg`
- **Paper shader helpers** — render options, world-size, WebGL support probes

## Exports

| Import | Contents |
|--------|----------|
| `@qrafty/qr` | Shared types (`QraftyQrCodeProps`, `QraftyQrConfig`, …) |
| `@qrafty/qr/react` | `ReactQRCode` (upstream primitive) |
| `@qrafty/qr/shaders` | Shader helpers (`buildPaperShaderRenderProps`, render options) |
| `@qrafty/qr/dot-matrix` | `DotMatrixAnimatedSvg` + animation utilities |

QRafty app code also imports QRafty-only internals via `@qrafty/qr-internal/*` path aliases (scene codegen, unified fills, vendored renderer). Those paths are **not** package exports.

## Build

```bash
pnpm --filter @qrafty/qr build
```
