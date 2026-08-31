import type {
  DataModulesStyle,
  ErrorCorrectionLevel,
  FinderPatternInnerStyle,
  FinderPatternOuterStyle,
  GradientSettings,
  ReactQRCodeProps,
} from "@qrafty/qr-internal/react-qr-code"

export type QrFileExtension = "png" | "jpeg" | "webp" | "svg"
export type QrDrawType = "svg" | "canvas"
export type QrTypeNumber =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24
  | 25
  | 26
  | 27
  | 28
  | 29
  | 30
  | 31
  | 32
  | 33
  | 34
  | 35
  | 36
  | 37
  | 38
  | 39
  | 40
export type QrMode = "Numeric" | "Alphanumeric" | "Byte" | "Kanji"
export type QrGradientType = "linear" | "radial"

export type {
  DataModulesStyle as QrDataModulesStyle,
  ErrorCorrectionLevel as QrErrorCorrectionLevel,
  FinderPatternInnerStyle as QrFinderPatternInnerStyle,
  FinderPatternOuterStyle as QrFinderPatternOuterStyle,
  GradientSettings as QrGradientSettings,
  ReactQRCodeProps,
}
