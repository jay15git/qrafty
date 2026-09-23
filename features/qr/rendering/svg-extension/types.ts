export type QrAnimationRenderMode = "export" | "none" | "preview";

export type QrSvgExtensionOptions = {
  height?: number;
  width?: number;
};

export type QrSvgExtensionFunction = (svg: SVGElement, options: QrSvgExtensionOptions) => void;
