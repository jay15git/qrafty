export const MODULE_SHADER_FILL_IMAGE_ID = "module-shader-fill"
export const MODULE_SHADER_FILL_LAYER = "unified-shader-fill"
export const MODULE_SHADER_SOURCE_LAYER = "unified-shader-source"

function readCanvasAlphaSample(
  sourceCanvas: HTMLCanvasElement,
  sampleWidth: number,
  sampleHeight: number,
) {
  const directContext = sourceCanvas.getContext("2d", { willReadFrequently: true })

  if (directContext) {
    return directContext.getImageData(0, 0, sampleWidth, sampleHeight).data
  }

  if (typeof document === "undefined") {
    return null
  }

  const scratch = document.createElement("canvas")
  scratch.width = sampleWidth
  scratch.height = sampleHeight
  const scratchContext = scratch.getContext("2d", { willReadFrequently: true })

  if (!scratchContext) {
    return null
  }

  scratchContext.drawImage(
    sourceCanvas,
    0,
    0,
    sampleWidth,
    sampleHeight,
    0,
    0,
    sampleWidth,
    sampleHeight,
  )

  return scratchContext.getImageData(0, 0, sampleWidth, sampleHeight).data
}

export function solidColorImageDataUrl(color: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect width="1" height="1" fill="${color}"/></svg>`

  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

function isSvgImageNode(node: Element | null | undefined) {
  return node?.localName === "image" && node.namespaceURI === "http://www.w3.org/2000/svg"
}

export function findModuleShaderFillImage(root: ParentNode | null | undefined) {
  if (!root) {
    return null
  }

  const byId = root.querySelector(`#${MODULE_SHADER_FILL_IMAGE_ID}`)

  if (isSvgImageNode(byId)) {
    return byId as SVGImageElement
  }

  const byLayer = root.querySelector(`[data-qr-layer="${MODULE_SHADER_FILL_LAYER}"]`)

  if (isSvgImageNode(byLayer)) {
    return byLayer as SVGImageElement
  }

  return null
}

export function setModuleShaderFillImageHref(image: SVGImageElement, dataUrl: string) {
  image.setAttribute("href", dataUrl)
  image.setAttributeNS("http://www.w3.org/1999/xlink", "href", dataUrl)

  if ("href" in image && image.href && typeof image.href === "object" && "baseVal" in image.href) {
    image.href.baseVal = dataUrl
  }
}

/** Reject empty/transparent WebGL captures so solid SVG placeholders stay visible. */
export function isUsableShaderSnapshot(
  dataUrl: string,
  sourceCanvas?: HTMLCanvasElement | null,
) {
  if (!dataUrl || !dataUrl.startsWith("data:image/")) {
    return false
  }

  if (sourceCanvas instanceof HTMLCanvasElement) {
    const width = sourceCanvas.width
    const height = sourceCanvas.height

    if (width === 0 || height === 0) {
      return false
    }

    const sampleWidth = Math.min(16, width)
    const sampleHeight = Math.min(16, height)
    const pixels = readCanvasAlphaSample(sourceCanvas, sampleWidth, sampleHeight)

    if (!pixels) {
      return dataUrl.length > 300
    }

    for (let index = 3; index < pixels.length; index += 4) {
      if (pixels[index] > 8) {
        return true
      }
    }

    return false
  }

  return dataUrl.length > 300
}

export function hideModuleShaderPaintTargets(container: ParentNode | null | undefined) {
  if (!container) {
    return
  }

  for (const target of container.querySelectorAll(
    `[data-qr-layer="${MODULE_SHADER_SOURCE_LAYER}"]`,
  )) {
    target.setAttribute("opacity", "0")
  }
}

export function syncModuleShaderFillImage(
  container: ParentNode | null | undefined,
  dataUrl: string,
  sourceCanvas?: HTMLCanvasElement | null,
) {
  if (!isUsableShaderSnapshot(dataUrl, sourceCanvas)) {
    return false
  }

  const image = findModuleShaderFillImage(container)

  if (!image) {
    return false
  }

  setModuleShaderFillImageHref(image, dataUrl)
  hideModuleShaderPaintTargets(container)
  return true
}
