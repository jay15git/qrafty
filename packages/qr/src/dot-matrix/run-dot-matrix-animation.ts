import {
  dotMatrixAnimationPresets,
  getAnimationPreset,
  QRCodeEntity,
  type AnimationPreset,
  type QRCodeAnimation,
  type QRCodeAnimationSettings,
} from "./animations"
import {
  captureDotMatrixOriginalFills,
  seekDotMatrixTargets,
  startDotMatrixLoop,
  type DotMatrixLoopHandle,
  type DotMatrixLoopTarget,
} from "./dot-matrix-loop"

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
  const positions = modules.flatMap((module) => {
    const column = readModulePosition(module, "column")
    const row = readModulePosition(module, "row")
    if (!Number.isFinite(column) || !Number.isFinite(row)) {
      return []
    }
    return [{ column, row }]
  })

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

export function buildDotMatrixAnimationTargets(
  root: ParentNode,
  preset: string | QRCodeAnimation,
  settings: QRCodeAnimationSettings = {},
): DotMatrixLoopTarget[] {
  const animation =
    typeof preset === "string" ? getAnimationPreset(preset) : preset

  const { modules, icons } = collectAnimatableElements(root)
  const targets = [...modules, ...icons]

  if (targets.length === 0) {
    return []
  }

  targets.forEach((element) => normalizeAnimationElement(element as SVGElement))

  const moduleCount = resolveModuleCount(root)

  const setEntityType = (array: Element[], entity: QRCodeEntity) =>
    array.map((element) => ({ element, entityType: entity }))

  const animationAdditions = [
    ...setEntityType(modules, QRCodeEntity.Module),
    ...setEntityType(icons, QRCodeEntity.Icon),
  ].flatMap(({ element, entityType }) => [
    animation(
      element,
      readModulePosition(element as SVGElement, "column"),
      readModulePosition(element as SVGElement, "row"),
      moduleCount,
      entityType,
      settings,
    ),
  ])

  return animationAdditions.map((addition) => ({
    element: addition.targets as SVGElement,
    animation: addition,
  }))
}

export function seekDotMatrixAnimation(
  root: ParentNode,
  preset: string | QRCodeAnimation,
  globalTimeMs: number,
  settings: QRCodeAnimationSettings = {},
) {
  const loopTargets = buildDotMatrixAnimationTargets(root, preset, settings)
  if (loopTargets.length === 0) {
    return undefined
  }

  const originalFills = captureDotMatrixOriginalFills(loopTargets)
  seekDotMatrixTargets(loopTargets, globalTimeMs, originalFills)
  return { loopTargets, originalFills }
}

export function runDotMatrixAnimation(
  root: ParentNode,
  preset: string | QRCodeAnimation,
  settings: QRCodeAnimationSettings = {},
): DotMatrixAnimationHandle | undefined {
  const loopTargets = buildDotMatrixAnimationTargets(root, preset, settings)

  if (loopTargets.length === 0) {
    return undefined
  }

  return startDotMatrixLoop(
    loopTargets,
    (callback) => requestAnimationFrame(callback),
    (frame) => cancelAnimationFrame(frame),
  )
}
