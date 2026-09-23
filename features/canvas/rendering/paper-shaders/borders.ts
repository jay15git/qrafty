import { PulsingBorderAspectRatios, pulsingBorderMeta } from "@paper-design/shaders";
import {
  color,
  COMMON_HIDDEN_PARAMS,
  number,
  option,
  withColors,
  type PaperShaderControlConfig,
} from "@/features/canvas/rendering/paper-shaders/shared";

export const BORDER_SHADER_CONTROL_CONFIG: Record<string, PaperShaderControlConfig> = {
  "pulsing-border": {
    hiddenParams: COMMON_HIDDEN_PARAMS,
    ...withColors(pulsingBorderMeta.maxColorCount, [
      color("colorBack", 100),
      number("roundness", 0, 1, 200),
      number("thickness", 0, 1, 201),
      number("softness", 0, 1, 202),
      option("aspectRatio", Object.keys(PulsingBorderAspectRatios), 204),
      number("intensity", 0, 1, 205),
      number("bloom", 0, 1, 206),
      number("spotSize", 0, 1, 206),
      number("spots", 1, pulsingBorderMeta.maxSpots, 207, 1),
      number("pulse", 0, 1, 207),
      number("smoke", 0, 1, 208),
      number("smokeSize", 0, 1, 209),
      number("speed", 0, 2, 300),
      number("scale", 0.01, 1.5, 301),
      number("rotation", 0, 360, 302, 1),
      number("offsetX", -1, 1, 303),
      number("offsetY", -1, 1, 304),
      number("margin", 0, 1, 403),
      number("marginLeft", 0, 0.5, 403),
      number("marginRight", 0, 0.5, 403),
      number("marginTop", 0, 0.5, 403),
      number("marginBottom", 0, 0.5, 403),
    ]),
  },
};
