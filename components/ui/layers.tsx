"use client";

import type { Transition } from "motion/react";
import { m } from "motion/react";

import { createAnimatedIcon } from "@/components/ui/animated-icon-controls";

const DEFAULT_TRANSITION: Transition = {
  type: "spring",
  stiffness: 100,
  damping: 14,
  mass: 1,
};

const LayersIcon = createAnimatedIcon({
  displayName: "LayersIcon",
  play: async (controls) => {
    await controls.start("firstState");
    await controls.start("secondState");
  },
  renderSvg: ({ size, controls }) => (
    <svg
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
      <m.path
        animate={controls}
        d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"
        transition={DEFAULT_TRANSITION}
        variants={{
          normal: { y: 0 },
          firstState: { y: -9 },
          secondState: { y: 0 },
        }}
      />
      <m.path
        animate={controls}
        d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"
        transition={DEFAULT_TRANSITION}
        variants={{
          normal: { y: 0 },
          firstState: { y: -5 },
          secondState: { y: 0 },
        }}
      />
    </svg>
  ),
});

export { LayersIcon };
