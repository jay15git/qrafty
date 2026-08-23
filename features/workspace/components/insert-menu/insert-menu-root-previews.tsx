"use client"

import { ReactQRCode } from "@new-qr/qr-internal/react-qr-code"
import type { ReactNode } from "react"

import {
  ILLUSTRATION_SETS,
  type IllustrationAsset,
  type IllustrationSetId,
} from "@/features/workspace/assets/illustration-sets"
import { ElementShapePrimitivePreview } from "@/features/workspace/components/ElementShapePrimitivePreview"
import type { InsertMenuFanPreviewItems } from "@/features/workspace/components/insert-menu/InsertMenuFanPreview"
import type { DraftingShapePrimitiveId } from "@/features/workspace/model/element-shapes"

const INSERT_MENU_IMAGE_PREVIEW_SRCS = [
  "/backgrounds/ascii-landscape.png",
  "/shader-previews/mesh-gradient.webp",
  "/shader-previews/waves.webp",
] as const

const INSERT_MENU_EMOJI_PREVIEWS = ["✨", "😊", "🎉"] as const

function pickFanPreviewSrcs(assets: readonly IllustrationAsset[]): [string, string, string] {
  const first = assets[0]?.path ?? ""
  const secondIndex = Math.min(Math.floor(assets.length / 3), Math.max(assets.length - 1, 0))
  const thirdIndex = Math.min(Math.floor((assets.length * 2) / 3), Math.max(assets.length - 1, 0))
  return [first, assets[secondIndex]?.path ?? first, assets[thirdIndex]?.path ?? first]
}

function InsertMenuTextPreviewCard({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={className}
    >
      {children}
    </span>
  )
}

function InsertMenuShapePreviewCard({ shapeId }: { shapeId: DraftingShapePrimitiveId }) {
  return <ElementShapePrimitivePreview className="size-5 text-[var(--dn-fg)]" shapeId={shapeId} />
}

function InsertMenuEmojiPreviewCard({ emoji }: { emoji: string }) {
  return (
    <span
      aria-hidden
      className="text-[1.35rem] leading-none"
      style={{
        fontFamily:
          "'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif",
      }}
    >
      {emoji}
    </span>
  )
}

function InsertMenuImagePreviewCard({ src }: { src: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt="" className="size-full rounded-[0.375rem] object-cover" draggable={false} src={src} />
  )
}

function InsertMenuIllustrationPreviewCard({ src }: { src: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt="" className="size-6 object-contain" draggable={false} src={src} />
  )
}

function InsertMenuQrPreviewCard({
  style,
}: {
  style: "square" | "circle" | "rounded"
}) {
  return (
    <ReactQRCode
      background="transparent"
      boostLevel
      dataModulesSettings={{ color: "currentColor", style }}
      finderPatternInnerSettings={{ color: "currentColor", style: "square" }}
      finderPatternOuterSettings={{ color: "currentColor", style: "square" }}
      level="L"
      marginSize={0}
      minVersion={1}
      size={28}
      svgProps={{
        "aria-hidden": true,
        className: "size-7 text-[var(--dn-fg)]",
      }}
      value="newqr"
    />
  )
}

export const INSERT_MENU_TEXT_PREVIEWS: InsertMenuFanPreviewItems = [
  <InsertMenuTextPreviewCard
    key="text-serif"
    className="font-serif text-base font-semibold leading-none tracking-tight text-[var(--dn-fg)]"
  >
    Aa
  </InsertMenuTextPreviewCard>,
  <InsertMenuTextPreviewCard
    key="text-sans"
    className="font-sans text-base font-bold leading-none tracking-tight text-[var(--dn-fg)]"
  >
    Bb
  </InsertMenuTextPreviewCard>,
  <InsertMenuTextPreviewCard
    key="text-mono"
    className="font-mono text-sm font-semibold leading-none tracking-tight text-[var(--dn-fg)]"
  >
    01
  </InsertMenuTextPreviewCard>,
]

export const INSERT_MENU_SHAPE_PREVIEWS: InsertMenuFanPreviewItems = [
  <InsertMenuShapePreviewCard key="shape-rect" shapeId="rect" />,
  <InsertMenuShapePreviewCard key="shape-ellipse" shapeId="ellipse" />,
  <InsertMenuShapePreviewCard key="shape-arrow" shapeId="arrow" />,
]

export const INSERT_MENU_EMOJI_FAN_PREVIEWS: InsertMenuFanPreviewItems =
  INSERT_MENU_EMOJI_PREVIEWS.map((emoji) => (
    <InsertMenuEmojiPreviewCard emoji={emoji} key={emoji} />
  )) as InsertMenuFanPreviewItems

export const INSERT_MENU_IMAGE_PREVIEWS: InsertMenuFanPreviewItems =
  INSERT_MENU_IMAGE_PREVIEW_SRCS.map((src) => (
    <InsertMenuImagePreviewCard key={src} src={src} />
  )) as InsertMenuFanPreviewItems

export const INSERT_MENU_ILLUSTRATION_SET_PREVIEWS: Record<
  IllustrationSetId,
  InsertMenuFanPreviewItems
> = Object.fromEntries(
  ILLUSTRATION_SETS.map((set) => {
    const [first, second, third] = pickFanPreviewSrcs(set.assets)
    return [
      set.id,
      [
        <InsertMenuIllustrationPreviewCard key={`${set.id}-0`} src={first} />,
        <InsertMenuIllustrationPreviewCard key={`${set.id}-1`} src={second} />,
        <InsertMenuIllustrationPreviewCard key={`${set.id}-2`} src={third} />,
      ] satisfies InsertMenuFanPreviewItems,
    ]
  }),
) as Record<IllustrationSetId, InsertMenuFanPreviewItems>

export const INSERT_MENU_QR_PREVIEWS: InsertMenuFanPreviewItems = [
  <InsertMenuQrPreviewCard key="qr-square" style="square" />,
  <InsertMenuQrPreviewCard key="qr-circle" style="circle" />,
  <InsertMenuQrPreviewCard key="qr-rounded" style="rounded" />,
]
