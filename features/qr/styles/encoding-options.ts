import type {
  QrErrorCorrectionLevel,
  QrTypeNumber,
} from "@/features/qr/model/types"

export const TYPE_NUMBER_MIN = 0
export const TYPE_NUMBER_MAX = 40

export const ERROR_CORRECTION_LEVEL_OPTIONS: Array<{
  value: QrErrorCorrectionLevel
  label: string
  title: string
  summary: string
}> = [
  { value: "L", label: "L", title: "Low", summary: "≈7% recovery, maximizes data density." },
  {
    value: "M",
    label: "M",
    title: "Medium",
    summary: "≈15% recovery, balanced for everyday use.",
  },
  {
    value: "Q",
    label: "Q",
    title: "Quartile",
    summary: "≈25% recovery, safer around logos and styling.",
  },
  {
    value: "H",
    label: "H",
    title: "High",
    summary: "≈30% recovery, strongest damage tolerance.",
  },
]

function formatTypeNumberLabel(value: number) {
  return value === 0 ? "Auto" : String(value)
}

export const formatQrTypeNumberLabel = formatTypeNumberLabel
