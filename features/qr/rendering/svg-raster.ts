const SVG_NAMESPACE = "http://www.w3.org/2000/svg"
const XLINK_NAMESPACE = "http://www.w3.org/1999/xlink"

export type RasterizeSvgMarkupOptions = {
  backgroundColor?: string
}

export function prepareStandaloneSvgMarkup(markup: string): string {
  const trimmed = markup.trim()

  if (typeof DOMParser === "undefined" || typeof XMLSerializer === "undefined") {
    return ensureSvgNamespaces(trimmed)
  }

  const document = new DOMParser().parseFromString(trimmed, "image/svg+xml")
  const svg = document.documentElement

  if (svg.tagName.toLowerCase() !== "svg" || document.querySelector("parsererror")) {
    return ensureSvgNamespaces(trimmed)
  }

  if (!svg.getAttribute("xmlns")) {
    svg.setAttribute("xmlns", SVG_NAMESPACE)
  }

  if (markupNeedsXlinkNamespace(trimmed) && !svg.getAttribute("xmlns:xlink")) {
    svg.setAttribute("xmlns:xlink", XLINK_NAMESPACE)
  }

  return new XMLSerializer().serializeToString(svg)
}

function ensureSvgNamespaces(markup: string): string {
  let result = markup

  if (!/\sxmlns=/.test(result)) {
    result = result.replace(/<svg\b/i, `<svg xmlns="${SVG_NAMESPACE}"`)
  }

  if (markupNeedsXlinkNamespace(result) && !/\sxmlns:xlink=/.test(result)) {
    result = result.replace(/<svg\b/i, `<svg xmlns:xlink="${XLINK_NAMESPACE}"`)
  }

  return result
}

function markupNeedsXlinkNamespace(markup: string): boolean {
  return /\sxlink:href=/.test(markup) || /\shref="#/.test(markup)
}

async function loadSvgMarkupAsImage(markup: string): Promise<HTMLImageElement> {
  const preparedMarkup = prepareStandaloneSvgMarkup(markup)
  const blob = new Blob([preparedMarkup], { type: "image/svg+xml;charset=utf-8" })

  return await new Promise<HTMLImageElement>((resolve, reject) => {
    // eslint-disable-next-line react-doctor/no-create-object-url-without-revoke -- released in onload/onerror/onabort
    const objectUrl = URL.createObjectURL(blob)
    const image = new Image()

    const releaseObjectUrl = () => {
      URL.revokeObjectURL(objectUrl)
    }

    image.onload = () => {
      releaseObjectUrl()
      resolve(image)
    }
    image.onerror = () => {
      releaseObjectUrl()
      reject(new Error("The SVG could not be rasterized."))
    }
    image.onabort = () => {
      releaseObjectUrl()
      reject(new Error("The SVG rasterization was aborted."))
    }
    image.src = objectUrl
  })
}

export async function rasterizeSvgMarkupToCanvas(
  markup: string,
  width: number,
  height: number,
  options: RasterizeSvgMarkupOptions = {},
): Promise<HTMLCanvasElement> {
  if (typeof window === "undefined") {
    throw new Error("SVG rasterization requires a browser environment.")
  }

  const image = await loadSvgMarkupAsImage(markup)
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext("2d")

  if (!context) {
    throw new Error("The browser could not create a canvas context for rasterization.")
  }

  context.clearRect(0, 0, width, height)

  if (options.backgroundColor) {
    context.fillStyle = options.backgroundColor
    context.fillRect(0, 0, width, height)
  }

  context.imageSmoothingEnabled = false
  context.drawImage(image, 0, 0, width, height)

  return canvas
}
