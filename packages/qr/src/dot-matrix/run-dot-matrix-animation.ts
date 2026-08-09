import {
  dotMatrixAnimationPresets,
  getAnimationPreset,
  QRCodeEntity,
  type AnimationPreset,
  type QRCodeAnimation,
  type QRCodeAnimationSettings,
} from "./animations"
import { startDotMatrixLoop, type DotMatrixLoopHandle } from "./dot-matrix-loop"

export type DotMatrixAnimationHandle = DotMatrixLoopHandle

function readModulePosition(element: SVGElement, axis: "column" | "row") {
  const value =
    element.getAttribute(`data-${axis}`) ||
    element.getAttribute(`data-${axis === "column" ? "x" : "y"}`)
  const parsed = value ? parseFloat(value) : Number.NaN
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeAnimationElement(element: SVGElement) {
  if (!element?.style) return
  element.style.setProperty("transform-box", "fill-box")
  element.style.transformOrigin = "center"
}

function resolveModuleCount(root: ParentNode) {
  const modules = Array.from(root.querySelectorAll(".module")) as SVGElement[]
  const positions = modules
    .map((module) => ({
      column: readModulePosition(module, "column"),
      row: readModulePosition(module, "row"),
    }))
    .filter((position) => Number.isFinite(position.column) && Number.isFinite(position.row))

  if (positions.length === 0) {
    return 21
  }

  return (
    positions.reduce(
      (max, position) => Math.max(max, position.column, position.row),
      0,
    ) + 1
  )
}

function collectAnimatableElements(root: ParentNode) {
  const modules = Array.from(root.querySelectorAll(".module"))
  const rings = Array.from(root.querySelectorAll(".position-ring"))
  const centers = Array.from(root.querySelectorAll(".position-center"))
  const icons = Array.from(root.querySelectorAll("#icon-wrapper, [data-qr-layer='qr-logo']"))

  return { modules, rings, centers, icons }
}

export function isDotMatrixPreset(preset: string) {
  return dotMatrixAnimationPresets.indexOf(preset as AnimationPreset) > -1
}

export function runDotMatrixAnimation(
  root: ParentNode,
  preset: string | QRCodeAnimation,
  settings: QRCodeAnimationSettings = {},
): DotMatrixAnimationHandle | undefined {
  const animation =
    typeof preset === "string" ? getAnimationPreset(preset) : preset

  const { modules, rings, centers, icons } = collectAnimatableElements(root)
  const targets = [...modules, ...rings, ...centers, ...icons]

  if (targets.length === 0) {
    return undefined
  }

  targets.forEach((element) => normalizeAnimationElement(element as SVGElement))

  const moduleCount = resolveModuleCount(root)

  const setEntityType = (array: Element[], entity: QRCodeEntity) =>
    array.map((element) => ({ element, entityType: entity }))

  const animationAdditions = [
    ...setEntityType(modules, QRCodeEntity.Module),
    ...setEntityType(rings, QRCodeEntity.PositionRing),
    ...setEntityType(centers, QRCodeEntity.PositionCenter),
    ...setEntityType(icons, QRCodeEntity.Icon),
  ]
    .map(({ element, entityType }) => ({
      element,
      positionX: readModulePosition(element as SVGElement, "column"),
      positionY: readModulePosition(element as SVGElement, "row"),
      entityType,
    }))
    .map((entityInfo) =>
      animation(
        entityInfo.element,
        entityInfo.positionX,
        entityInfo.positionY,
        moduleCount,
        entityInfo.entityType,
        settings,
      ),
    )

  const loopTargets = animationAdditions.map((addition) => ({
    element: addition.targets as SVGElement,
    animation: addition,
  }))

  return startDotMatrixLoop(
    loopTargets,
    (callback) => requestAnimationFrame(callback),
    (frame) => cancelAnimationFrame(frame),
  )
}
