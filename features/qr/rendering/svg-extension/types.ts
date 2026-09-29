import type { QrSvgElementLike } from "../svg-element";

export type QrSvgExtensionOptions = {
  height?: number;
  width?: number;
};

export type QrSvgExtensionFunction = (
  svg: QrSvgElementLike,
  options: QrSvgExtensionOptions,
) => void;
