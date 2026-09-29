export { getQrModuleGrid, getQrModuleMetrics, type QrModuleGrid } from "./qr-matrix";
export type { QrSvgDocumentLike, QrSvgElementLike } from "./svg-element-like";
export {
  getFinderCornerRegions,
  getQrSvgNumCells,
  type FinderCornerKind,
  type FinderCornerRegion,
} from "./finder-gradient-overlays";
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
  type DotMatrixAnchor,
  type DotMatrixCoordinates,
  type DotMatrixMetrics,
  type DotMatrixShapeLike,
  type DotPaletteGroupAssignment,
  type DotPaletteShapeGroup,
} from "./dot-palette";
export {
  coerceNonNegativeSvgNumber,
  coerceSvgNumber,
  formatSvgNumber,
  getLinearGradientEndpoints,
  getNumericSvgAttribute,
  getSmallestPositiveDelta,
  getSvgPathSubpathStartPoint,
  splitSvgPathData,
} from "./svg-utils";
export {
  appendEmitChild,
  cloneEmitNode,
  createEmitNode,
  emitDescendants,
  getEmitAttr,
  getEmitAttrNS,
  getEmitAttrNormalized,
  insertEmitBefore,
  parseEmitSvgMarkup,
  removeEmitAttr,
  removeEmitNode,
  serializeEmitNode,
  serializeEmitNodes,
  setEmitAttr,
  setEmitAttrNS,
  type EmitNode,
} from "./emit-node";
