"use client";

import type { Variants } from "motion/react";
import { m } from "motion/react";

import { createAnimatedIcon } from "@/components/ui/animated-icon-controls";

const ICON_VARIANTS: Variants = {
  normal: {
    scale: 1,
    rotate: 0,
  },
  animate: {
    scale: 1.05,
    rotate: [0, -7, 7, 0],
    transition: {
      rotate: {
        duration: 0.5,
        ease: "easeInOut",
      },
      scale: {
        type: "spring",
        stiffness: 400,
        damping: 10,
      },
    },
  },
};

const MessageCircleIcon = createAnimatedIcon({
  displayName: "MessageCircleIcon",
  play: (controls) => controls.start("animate"),
  renderSvg: ({ size, controls }) => (
    <m.svg
      animate={controls}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      variants={ICON_VARIANTS}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </m.svg>
  ),
});

export { MessageCircleIcon };
