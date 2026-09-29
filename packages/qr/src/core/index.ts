export { getQrModuleGrid, getQrModuleMetrics, type QrModuleGrid } from "./qr-matrix";
export type { QrSvgDocumentLike, QrSvgElementLike } from "./svg-element-like";
export { getFinderCornerRegions, getQrSvgNumCells } from "./finder-gradient-overlays";
export {
  getActiveDotsPalette,
  getDotMatrixAnchor,
  collectDotMatrixAnchors,
  collectDotMatrixMetricsFromAnchors,
  createDotPaletteShapeGroups,
  getDotPaletteIndex,
  getFallbackDotMatrixMetricsFromAnchors,
  hashDotPaletteString,
  balanceDotPaletteAssignments,
  resolveDotMatrixAnchorCoordinates,
  type DotMatrixMetrics,
  type DotMatrixShapeLike,
  type DotPaletteShapeGroup,
} from "./dot-palette";
export {
  coerceNonNegativeSvgNumber,
  coerceSvgNumber,
  formatSvgNumber,
  splitSvgPathData,
} from "./svg-utils";
export {
  emitDescendants,
  getEmitAttr,
  parseEmitSvgMarkup,
  removeEmitNode,
  serializeEmitNode,
  type EmitNode,
} from "./emit-node";
