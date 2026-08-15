import { HugeIconsAdapter } from "./hugeicons-adapter";
import type { IconComponent, IconComponentProps } from "../types";

export function hugeicons(iconDef: unknown): IconComponent {
  return (props: IconComponentProps) => <HugeIconsAdapter iconDef={iconDef} {...props} />;
}
