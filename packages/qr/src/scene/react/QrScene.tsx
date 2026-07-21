"use client"

import { useEffect, useMemo, useState } from "react"

import {
  findCardLayer,
  findQrLayer,
  getActiveSceneNode,
  usesAnimatedQr,
  usesPaperShader,
} from "../core"
import { AnimatedQr, sceneQrToAnimatedQrProps } from "../bitjson"
import { PaperShaderLayer } from "../paper"
import {
  migrateSceneDocument,
  type SceneDocumentV1,
  type SceneRenderMode,
} from "../schema"

export type QrSceneProps = {
  scene?: SceneDocumentV1
  sceneUrl?: string
  sceneId?: string
  mode?: SceneRenderMode
  className?: string
  sceneApiBaseUrl?: string
}

async function fetchSceneDocument(
  props: Pick<QrSceneProps, "sceneUrl" | "sceneId" | "sceneApiBaseUrl">,
) {
  if (props.sceneUrl) {
    const response = await fetch(props.sceneUrl)
    return migrateSceneDocument(await response.json())
  }

  if (props.sceneId) {
    const base = props.sceneApiBaseUrl ?? "/api/scenes"
    const response = await fetch(`${base}/${props.sceneId}/latest`)
    const payload = await response.json()

    if (payload.scene) {
      return migrateSceneDocument(payload.scene)
    }

    const sceneUrl = typeof payload.sceneUrl === "string" ? payload.sceneUrl : null

    if (sceneUrl) {
      const sceneResponse = await fetch(sceneUrl)
      return migrateSceneDocument(await sceneResponse.json())
    }

    return migrateSceneDocument(payload)
  }

  return null
}

export function QrScene({
  scene,
  sceneUrl,
  sceneId,
  mode = "live",
  className,
  sceneApiBaseUrl,
}: QrSceneProps) {
  const [remoteScene, setRemoteScene] = useState<SceneDocumentV1 | null>(null)
  const [error, setError] = useState<string | null>(null)
  const loadedScene = scene ?? remoteScene

  useEffect(() => {
    if (scene || (!sceneUrl && !sceneId)) {
      return
    }

    let cancelled = false

    void fetchSceneDocument({ sceneUrl, sceneId, sceneApiBaseUrl })
      .then((nextScene) => {
        if (!cancelled) {
          if (!nextScene) {
            setError("Scene document is unavailable.")
            return
          }

          setRemoteScene(nextScene)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Failed to load scene document.")
        }
      })

    return () => {
      cancelled = true
    }
  }, [scene, sceneApiBaseUrl, sceneId, sceneUrl])

  const node = useMemo(
    () => (loadedScene ? getActiveSceneNode(loadedScene) : null),
    [loadedScene],
  )

  if (error) {
    return <div className={className}>{error}</div>
  }

  if (!loadedScene || !node) {
    return <div className={className} />
  }

  const cardLayer = findCardLayer(node.layers)
  const qrLayer = findQrLayer(node.layers)
  const showPaperShader =
    (mode === "live" || mode === "hybrid" || mode === "fallback") &&
    usesPaperShader(node.card) &&
    node.card?.paperShader
  const showAnimatedQr =
    (mode === "live" || mode === "hybrid") && node.qr && usesAnimatedQr(node.qr)

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: loadedScene.width,
        height: loadedScene.height,
        overflow: "hidden",
        borderRadius: node.card?.cornerRadius,
      }}
    >
      {showPaperShader ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            overflow: "hidden",
          }}
        >
          <PaperShaderLayer
            fallbackColor={node.card?.fill}
            paperShader={node.card!.paperShader!}
          />
        </div>
      ) : cardLayer ? (
        <div
          style={{
            position: "absolute",
            left: cardLayer.x,
            top: cardLayer.y,
            width: cardLayer.width,
            height: cardLayer.height,
            borderRadius: node.card?.cornerRadius,
            backgroundColor: node.card?.fill,
          }}
        />
      ) : null}

      {node.decorSvg && mode !== "live" ? (
        <div
          dangerouslySetInnerHTML={{ __html: node.decorSvg }}
          style={{ position: "absolute", inset: 0 }}
        />
      ) : null}

      {qrLayer && node.qr ? (
        <div
          style={{
            position: "absolute",
            left: qrLayer.x,
            top: qrLayer.y,
            width: qrLayer.width,
            height: qrLayer.height,
            zIndex: 10,
          }}
        >
          {showAnimatedQr ? (
            <AnimatedQr {...sceneQrToAnimatedQrProps(node.qr)} width={qrLayer.width} height={qrLayer.height} />
          ) : (
            <div
              dangerouslySetInnerHTML={{ __html: node.qr.externalSvg }}
              style={{ height: "100%", width: "100%" }}
            />
          )}
        </div>
      ) : null}
    </div>
  )
}
