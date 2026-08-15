import type { ComponentType } from "react";

import { TablerAdapter } from "./tabler-adapter";
import type { IconComponent, IconComponentProps } from "../types";

export function tabler(
  Icon: ComponentType<{ size?: number; stroke?: number; className?: string }>,
): IconComponent {
  return (props: IconComponentProps) => <TablerAdapter Icon={Icon} {...props} />;
}
