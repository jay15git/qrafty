import type { ComponentType } from "react";

import { PhosphorAdapter } from "./phosphor-adapter";
import type { IconComponent, IconComponentProps } from "../types";

type PhosphorWeight = "thin" | "light" | "regular" | "bold";

export function phosphor(
  Icon: ComponentType<{ size?: number; weight?: PhosphorWeight; className?: string }>,
): IconComponent {
  return (props: IconComponentProps) => <PhosphorAdapter Icon={Icon} {...props} />;
}
