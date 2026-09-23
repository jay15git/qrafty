"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, m } from "motion/react";

import { cn } from "@/lib/utils";
import { useFamilyDrawer, type ViewsRegistry } from "./context";
import { FamilyDrawerViewContent } from "./view-content";

interface FamilyDrawerAnimatedWrapperProps {
  children: ReactNode;
  className?: string;
}

export function FamilyDrawerAnimatedWrapper({
  children,
  className,
  ...rest
}: FamilyDrawerAnimatedWrapperProps & Record<string, unknown>) {
  const { elementRef } = useFamilyDrawer();

  return (
    <div ref={elementRef} className={cn("px-6 pb-6 pt-2.5 antialiased", className)} {...rest}>
      {children}
    </div>
  );
}

interface FamilyDrawerAnimatedContentProps {
  children?: ReactNode;
  views?: ViewsRegistry;
}

export function FamilyDrawerAnimatedContent({
  children,
  views: propViews,
}: FamilyDrawerAnimatedContentProps) {
  const { view, opacityDuration } = useFamilyDrawer();
  const [visitedViews, setVisitedViews] = useState<string[]>(() => [view]);

  if (!visitedViews.includes(view)) {
    setVisitedViews((current) => (current.includes(view) ? current : [...current, view]));
  }

  if (children) {
    return (
      <AnimatePresence custom={view} initial={false} mode="popLayout">
        <m.div
          key={view}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96 }}
          initial={{ opacity: 0, scale: 0.96 }}
          transition={{
            duration: opacityDuration,
            ease: [0.26, 0.08, 0.25, 1],
          }}
        >
          {children}
        </m.div>
      </AnimatePresence>
    );
  }

  return (
    <>
      {visitedViews.map((viewName) => {
        const isActive = viewName === view;

        return (
          <div
            key={viewName}
            aria-hidden={!isActive}
            className={cn(!isActive && "pointer-events-none hidden")}
            inert={isActive ? undefined : true}
          >
            <m.div
              animate={isActive ? { opacity: 1, scale: 1, y: 0 } : false}
              initial={false}
              transition={{
                duration: opacityDuration,
                ease: [0.26, 0.08, 0.25, 1],
              }}
            >
              <FamilyDrawerViewContent viewName={viewName} views={propViews} />
            </m.div>
          </div>
        );
      })}
    </>
  );
}
