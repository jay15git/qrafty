export type Rect = {
  height: number
  width: number
  x: number
  y: number
}

export type TrackSpec = number | "auto"

export type Frame = {
  canvas: Rect
  content: Rect
  center(width: number, height: number): Rect
  columns(specs: TrackSpec[], gap?: number): Rect[]
  inset(by: number): Frame
  rows(specs: TrackSpec[], gap?: number): Rect[]
}

function resolveTracks(specs: TrackSpec[], available: number, gap: number): number[] {
  const gaps = gap * Math.max(0, specs.length - 1)
  const fixedTotal = specs.reduce<number>(
    (total, spec) => (spec === "auto" ? total : total + spec),
    0,
  )
  const autoCount = specs.filter((spec) => spec === "auto").length
  const remaining = available - gaps - fixedTotal
  const autoSize = autoCount > 0 ? remaining / autoCount : 0

  return specs.map((spec) => (spec === "auto" ? autoSize : spec))
}

function buildFrame(canvas: Rect, content: Rect): Frame {
  return {
    canvas,
    content,

    center(width, height) {
      return {
        height,
        width,
        x: content.x + (content.width - width) / 2,
        y: content.y + (content.height - height) / 2,
      }
    },

    columns(specs, gap = 0) {
      const sizes = resolveTracks(specs, content.width, gap)
      let cursor = content.x

      return sizes.map((width) => {
        const rect: Rect = { height: content.height, width, x: cursor, y: content.y }
        cursor += width + gap
        return rect
      })
    },

    inset(by) {
      return subFrame(content, by)
    },

    rows(specs, gap = 0) {
      const sizes = resolveTracks(specs, content.height, gap)
      let cursor = content.y

      return sizes.map((height) => {
        const rect: Rect = { height, width: content.width, x: content.x, y: cursor }
        cursor += height + gap
        return rect
      })
    },
  }
}

export function subFrame(rect: Rect, padding = 0): Frame {
  const content: Rect = {
    height: rect.height - padding * 2,
    width: rect.width - padding * 2,
    x: rect.x + padding,
    y: rect.y + padding,
  }

  return buildFrame(rect, content)
}

export function createFrame(options: { height: number; padding?: number; width: number }): Frame {
  const canvas: Rect = {
    height: options.height,
    width: options.width,
    x: -options.width / 2,
    y: -options.height / 2,
  }

  return subFrame(canvas, options.padding ?? 0)
}
