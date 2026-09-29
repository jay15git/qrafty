export type SceneIrBounds = {
  minX: number;
  minY: number;
  width: number;
  height: number;
};

export type SceneIrFontRef = {
  id: string;
  family: string;
  cssText?: string;
  cssUrl?: string;
};

export type SceneIr = {
  bounds: SceneIrBounds;
  defs: string;
  body: string;
  fonts: SceneIrFontRef[];
};
