# @qrafty/qr

Internal QRafty QR rendering library used by QRafty:

- **QRafty QR rendering** — `QraftyQrCode`
- **Paper shaders** — `PaperShaderLayer`
- **Animated QR** — `AnimatedQr`

## Usage

```tsx
import { QraftyQrCode } from "@qrafty/qr/react"
import { AnimatedQr } from "@qrafty/qr/animated"
import { PaperShaderLayer } from "@qrafty/qr/shaders"
```

## Exports

| Import | Components |
|--------|------------|
| `@qrafty/qr` | Shared types, `QraftyQrCode` |
| `@qrafty/qr/react` | `QraftyQrCode`, `ReactQRCode` (upstream primitive) |
| `@qrafty/qr/shaders` | `PaperShaderLayer`, shader helpers |
| `@qrafty/qr/animated` | `AnimatedQr` |

`QraftyQrCode` is a flat portable API over vendored `@lglab/react-qr-code`. For full upstream parity (nested props, `ref.download`), use `ReactQRCode` from `@qrafty/qr/react`.

### Portable props (upstream-aligned)

| Portable | Upstream |
|----------|----------|
| `value` | `value` (`string \| string[]`) |
| `level` | `level` |
| `minVersion` | `minVersion` |
| `boostLevel` | `boostLevel` |
| `margin` | `marginSize` |
| `module` | `dataModulesSettings.style` |
| `moduleSize` | `dataModulesSettings.size` |
| `moduleLineWidth` | `dataModulesSettings.lineWidth` |
| `moduleRoundSize` | `!dataModulesSettings.randomSize` |
| `foreground` | `dataModulesSettings.color` |
| `finderOuter` / `finderInner` | `finderPattern*Settings.style` |
| `backgroundGradient` | `background` (gradient) |
| `logo` | `imageSettings` |
| `ariaLabel` | `svgProps['aria-label']` |

## Build

```bash
pnpm --filter @qrafty/qr build
```
