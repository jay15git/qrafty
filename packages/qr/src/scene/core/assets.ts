import type { SceneAsset, SceneDocumentV1 } from "../schema"

export type NormalizedAsset = SceneAsset & {
  resolvedUrl: string
}

export function isBlobUrl(value: string) {
  return value.startsWith("blob:")
}

export function isDataUrl(value: string) {
  return value.startsWith("data:")
}

export async function blobUrlToDataUrl(blobUrl: string): Promise<string | null> {
  if (typeof fetch === "undefined") {
    return null
  }

  try {
    const response = await fetch(blobUrl)
    if (!response.ok) {
      return null
    }
    const blob = await response.blob()
    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null)
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

export async function normalizeAssetUrl(
  url: string,
  options: { inlineBlobs?: boolean } = {},
): Promise<string> {
  if (!url) {
    return url
  }

  if (options.inlineBlobs !== false && isBlobUrl(url)) {
    const dataUrl = await blobUrlToDataUrl(url)
    return dataUrl ?? url
  }

  return url
}

export async function inlineSceneAssets(
  scene: SceneDocumentV1,
): Promise<SceneDocumentV1> {
  const entries = await Promise.all(
    Object.entries(scene.assets).map(async ([id, asset]) => {
      const resolvedUrl = await normalizeAssetUrl(asset.url)
      return [
        id,
        {
          ...asset,
          source: isDataUrl(resolvedUrl) ? "data" : asset.source === "blob" ? "url" : asset.source,
          url: resolvedUrl,
        },
      ] as const
    }),
  )

  const assets: Record<string, SceneAsset> = Object.fromEntries(entries)

  return {
    ...scene,
    assets,
  }
}

export function collectSceneAssetIds(scene: SceneDocumentV1) {
  return Object.keys(scene.assets)
}
