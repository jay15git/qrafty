export type QrSvgExtensionOptions = {
  height?: number;
  width?: number;
};

export type QrSvgExtensionFunction = (svg: SVGElement, options: QrSvgExtensionOptions) => void;
