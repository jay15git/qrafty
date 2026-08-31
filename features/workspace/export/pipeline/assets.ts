import {
  blobUrlToDataUrl,
  isBlobUrl,
  isDataUrl,
} from "@qrafty/qr-internal/scene"

import type { SceneIrFontRef } from "@qrafty/qr-internal/codegen"

const REMOTE_IMAGE_PATTERN = /href="(https?:\/\/[^"]+)"/g

export async function inlineRemoteUrl(url: string, label = "asset") {
  if (!url || isDataUrl(url)) {
    return url
  }

  if (isBlobUrl(url)) {
    const dataUrl = await blobUrlToDataUrl(url)
    if (!dataUrl) {
      throw new Error(`Could not inline local ${label}.`)
    }
    return dataUrl
  }

  if (typeof fetch === "undefined") {
    return url
  }

  try {
    const response = await fetch(url, { mode: "cors" })
    if (!response.ok) {
      throw new Error(`Could not fetch ${label} (${response.status}).`)
    }

    const blob = await response.blob()
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result)
          return
        }
        reject(new Error(`Could not encode ${label}.`))
      }
      reader.onerror = () => reject(reader.error ?? new Error(`Could not read ${label}.`))
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : `Could not inline ${label}.`
    throw new Error(
      `${message} Remote images must allow CORS for export.`,
    )
  }
}

export async function inlineSvgImageHrefs(svgMarkup: string) {
  const urls = new Set<string>()
  for (const match of svgMarkup.matchAll(REMOTE_IMAGE_PATTERN)) {
    const url = match[1]
    if (url && !isDataUrl(url)) {
      urls.add(url)
    }
  }

  let result = svgMarkup
  for (const url of urls) {
    const inlined = await inlineRemoteUrl(url, "image")
    result = result.split(url).join(inlined)
  }

  return result
}

export function buildFontFaceDefs(fonts: SceneIrFontRef[]) {
  return fonts
    .flatMap((font) => {
      if (font.cssText) {
        return [`<style type="text/css"><![CDATA[${font.cssText}]]></style>`]
      }

      if (font.cssUrl) {
        return [
          `<style type="text/css">@import url("${font.cssUrl.replaceAll('"', "&quot;")}");</style>`,
        ]
      }

      return []
    })
    .join("")
}
