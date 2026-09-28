/** Shared corner classes for controls and popup surfaces. */
export type ShapeClasses = {
  /** Bounded control / overlay background corner. */
  bg: string;
  /** Focus ring — +2px over `bg` so the ring stays concentric (it sits 2px
   *  outside the element: top/left -2, width/height +4). */
  focusRing: string;
  /** Popup container corner — one step above `bg`. */
  container: string;
  /** List/menu rows inside a padded popup. */
  item: string;
  /** Bounded inputs (select trigger). */
  input: string;
};

export const shapeClasses: ShapeClasses = {
  bg: "rounded-lg",
  focusRing: "rounded-[10px]",
  container: "rounded-xl",
  item: "rounded-lg",
  input: "rounded-lg",
};
