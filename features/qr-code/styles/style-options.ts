import type { QrFinderPatternOuterStyle } from "@/features/qr-code/model/types"
import type { QraftyCornerDotStyle, QraftyDataModulesStyle } from "@/features/qr-code/model/state"
import { CUSTOM_CORNER_DOT_SHAPE_OPTIONS } from "@/features/qr-code/styles/custom-corner-dot-shapes"

export const DOT_STYLE_OPTIONS: Array<{ label: string; value: QraftyDataModulesStyle }> = [
  { label: "Square", value: "square" },
  { label: "Small square", value: "square-sm" },
  { label: "Pinched square", value: "pinched-square" },
  { label: "Rounded", value: "rounded" },
  { label: "Leaf", value: "leaf" },
  { label: "Vertical line", value: "vertical-line" },
  { label: "Horizontal line", value: "horizontal-line" },
  { label: "Circuit board", value: "circuit-board" },
  { label: "Circle", value: "circle" },
  { label: "Diamond", value: "diamond" },
  { label: "Star", value: "star" },
  { label: "Heart", value: "heart" },
  { label: "Hashtag", value: "hashtag" },
]

export const CORNER_SQUARE_STYLE_OPTIONS: Array<{
  label: string
  value: QrFinderPatternOuterStyle
}> = [
  { label: "Square", value: "square" },
  { label: "Pinched square", value: "pinched-square" },
  { label: "Small rounded", value: "rounded-sm" },
  { label: "Rounded", value: "rounded" },
  { label: "Large rounded", value: "rounded-lg" },
  { label: "Circle", value: "circle" },
  { label: "Inpoint small", value: "inpoint-sm" },
  { label: "Inpoint", value: "inpoint" },
  { label: "Inpoint large", value: "inpoint-lg" },
  { label: "Outpoint small", value: "outpoint-sm" },
  { label: "Outpoint", value: "outpoint" },
  { label: "Outpoint large", value: "outpoint-lg" },
  { label: "Leaf small", value: "leaf-sm" },
  { label: "Leaf", value: "leaf" },
  { label: "Leaf large", value: "leaf-lg" },
]

export const CORNER_DOT_STYLE_OPTIONS: Array<{
  label: string
  value: QraftyCornerDotStyle
}> = [
  { label: "Square", value: "square" },
  { label: "Pinched square", value: "pinched-square" },
  { label: "Small rounded", value: "rounded-sm" },
  { label: "Rounded", value: "rounded" },
  { label: "Large rounded", value: "rounded-lg" },
  { label: "Circle", value: "circle" },
  { label: "Inpoint small", value: "inpoint-sm" },
  { label: "Inpoint", value: "inpoint" },
  { label: "Inpoint large", value: "inpoint-lg" },
  { label: "Outpoint small", value: "outpoint-sm" },
  { label: "Outpoint", value: "outpoint" },
  { label: "Outpoint large", value: "outpoint-lg" },
  { label: "Leaf small", value: "leaf-sm" },
  { label: "Leaf", value: "leaf" },
  { label: "Leaf large", value: "leaf-lg" },
  { label: "Diamond", value: "diamond" },
  { label: "Star", value: "star" },
  { label: "Heart", value: "heart" },
  { label: "Hashtag", value: "hashtag" },
  { label: "Microchip", value: "microchip" },
  ...CUSTOM_CORNER_DOT_SHAPE_OPTIONS,
]
