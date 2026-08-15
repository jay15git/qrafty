import type * as React from 'react';
import type {
  HTMLMotionProps,
  SVGMotionProps,
  UseInViewOptions,
} from 'motion/react';

import type { WithAsChild } from '@/components/vendor/animate-ui/primitives/animate/slot';

import { staticAnimations } from '@/components/vendor/animate-ui/icons/icon.utils';

export type StaticAnimations = keyof typeof staticAnimations;
export type TriggerProp<T = string> = boolean | StaticAnimations | T;
export type Trigger = TriggerProp<string>;

export type AnimateIconContextValue = {
  controls: import('motion/react').LegacyAnimationControls | undefined;
  animation: StaticAnimations | string;
  loop: boolean;
  loopDelay: number;
  active: boolean;
  animate?: Trigger;
  initialOnAnimateEnd?: boolean;
  completeOnStop?: boolean;
  persistOnAnimateEnd?: boolean;
  delay?: number;
};

export type DefaultIconProps<T = string> = {
  animate?: TriggerProp<T>;
  animateOnHover?: TriggerProp<T>;
  animateOnTap?: TriggerProp<T>;
  animateOnView?: TriggerProp<T>;
  animateOnViewMargin?: UseInViewOptions['margin'];
  animateOnViewOnce?: boolean;
  animation?: T | StaticAnimations;
  loop?: boolean;
  loopDelay?: number;
  initialOnAnimateEnd?: boolean;
  completeOnStop?: boolean;
  persistOnAnimateEnd?: boolean;
  delay?: number;
};

export type AnimateIconProps<T = string> = WithAsChild<
  HTMLMotionProps<'span'> &
    DefaultIconProps<T> & {
      children: React.ReactNode;
      asChild?: boolean;
    }
>;

export type IconProps<T> = DefaultIconProps<T> &
  Omit<SVGMotionProps<SVGSVGElement>, 'animate'> & {
    size?: number;
  };

export type IconWrapperProps<T> = IconProps<T> & {
  icon: React.ComponentType<IconProps<T>>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyProps = Record<string, any>;
