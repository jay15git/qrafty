import type { ComponentType } from "react";

import { UntitledUiAdapter } from "./untitledui-adapter";
import type { IconComponent, IconComponentProps } from "../types";

export function untitledui(
  Icon: ComponentType<{ width?: number; height?: number; strokeWidth?: number; className?: string }>,
): IconComponent {
  return (props: IconComponentProps) => <UntitledUiAdapter Icon={Icon} {...props} />;
}
