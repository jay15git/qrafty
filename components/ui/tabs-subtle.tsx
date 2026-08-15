"use client";

import {
  useId,
  useRef,
  useState,
  useCallback,
  useEffect,
  useMemo,
  createContext,
  useContext,
  forwardRef,
  type ReactNode,
  type HTMLAttributes,
} from "react";
import { m, AnimatePresence } from "framer-motion";
import type { IconComponent } from "@/lib/icon-context";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/springs";
import { fontWeights } from "@/lib/font-weight";
import { useProximityHover } from "@/hooks/use-proximity-hover";

const TABS_SUBTLE_PILL_CLASS = "rounded-full";
const TABS_SUBTLE_FOCUS_RING_CLASS = "rounded-full";
const TABS_SUBTLE_FROZEN_TRANSITION = { duration: 0 };

interface TabsSubtleContextValue {
  registerTab: (index: number, element: HTMLElement | null) => void;
  hoveredIndex: number | null;
  selectedIndex: number;
  onSelect: (index: number) => void;
  idPrefix: string;
  activeLabel: boolean;
}

const TabsSubtleContext = createContext<TabsSubtleContextValue | null>(null);

function useTabsSubtle() {
  const ctx = useContext(TabsSubtleContext);
  if (!ctx) throw new Error("useTabsSubtle must be used within a TabsSubtle");
  return ctx;
}

interface TabsSubtleProps extends Omit<HTMLAttributes<HTMLDivElement>, "onSelect"> {
  children: ReactNode;
  selectedIndex: number;
  onSelect: (index: number) => void;
  idPrefix?: string;
  /** When true, only the selected tab shows its text label. Requires icons on tabs. */
  activeLabel?: boolean;
  /** Freezes selection/hover pill motion while the settings shell is resizing. */
  pauseSelectionMotion?: boolean;
}

const TabsSubtle = forwardRef<HTMLDivElement, TabsSubtleProps>(
  ({ children, selectedIndex, onSelect, idPrefix: idPrefixProp, activeLabel = false, pauseSelectionMotion = false, className, ...props }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const isMouseInside = useRef(false);
    const generatedId = useId();
    const idPrefix = idPrefixProp || generatedId;

    const {
      activeIndex: hoveredIndex,
      setActiveIndex: setHoveredIndex,
      itemRects: tabRects,
      handlers,
      registerItem,
      measureItems: measureTabs,
    } = useProximityHover(containerRef, { axis: "x" });

    // Track tab elements locally so we can observe their individual resizes
    const tabElementsRef = useRef(new Map<number, HTMLElement>());
    const registerTab = useCallback(
      (index: number, element: HTMLElement | null) => {
        registerItem(index, element);
        if (element) {
          tabElementsRef.current.set(index, element);
        } else {
          tabElementsRef.current.delete(index);
        }
      },
      [registerItem]
    );

    useEffect(() => {
      if (pauseSelectionMotion) {
        return () => {}
      }

      measureTabs();
      return () => {}
    }, [measureTabs, children, pauseSelectionMotion]);

    // Observe individual tab buttons for resize (label expand/collapse in activeLabel mode)
    useEffect(() => {
      if (pauseSelectionMotion) {
        return () => {}
      }

      const elements = Array.from(tabElementsRef.current.values())
      if (elements.length === 0) {
        return () => {}
      }
      if (typeof ResizeObserver === "undefined") {
        measureTabs()
        return () => {}
      }

      const ro = new ResizeObserver(() => measureTabs())
      for (const element of elements) {
        ro.observe(element)
      }

      return () => {
        ro.disconnect()
      }
    }, [measureTabs, children, pauseSelectionMotion])

    // Wrap handlers to track isMouseInside
    const handleMouseMove = useCallback(
      (e: React.MouseEvent) => {
        isMouseInside.current = true;
        handlers.onMouseMove(e);
      },
      [handlers]
    );

    const handleMouseLeave = useCallback(() => {
      isMouseInside.current = false;
      handlers.onMouseLeave();
    }, [handlers]);

    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

    const selectedRect = tabRects[selectedIndex];
    const hoverRect =
      hoveredIndex !== null ? tabRects[hoveredIndex] : null;
    const focusRect = focusedIndex !== null ? tabRects[focusedIndex] : null;
    const isHoveringSelected = hoveredIndex === selectedIndex;
    const isHovering = hoveredIndex !== null && !isHoveringSelected;

    const contextValue = useMemo(
      () => ({ registerTab, hoveredIndex, selectedIndex, onSelect, idPrefix, activeLabel }),
      [registerTab, hoveredIndex, selectedIndex, onSelect, idPrefix, activeLabel],
    );

    return (
      <TabsSubtleContext.Provider value={contextValue}>
        <div
          ref={(node) => {
            (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
          }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onFocus={(e) => {
            const indexAttr = (e.target as HTMLElement)
              .closest("[data-proximity-index]")
              ?.getAttribute("data-proximity-index");
            if (indexAttr != null) {
              const idx = Number(indexAttr);
              setHoveredIndex(idx);
              setFocusedIndex(
                (e.target as HTMLElement).matches(":focus-visible") ? idx : null
              );
            }
          }}
          onBlur={(e) => {
            if (containerRef.current?.contains(e.relatedTarget as Node)) return;
            setFocusedIndex(null);
            if (isMouseInside.current) return;
            setHoveredIndex(null);
          }}
          onKeyDown={(e) => {
            const items = Array.from(
              containerRef.current?.querySelectorAll('[role="tab"]') ?? []
            ) as HTMLElement[];
            const currentIdx = items.indexOf(e.target as HTMLElement);
            if (currentIdx === -1) return;

            if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
              e.preventDefault();
              const next = ["ArrowRight", "ArrowDown"].includes(e.key)
                ? (currentIdx + 1) % items.length
                : (currentIdx - 1 + items.length) % items.length;
              items[next].focus();
            } else if (e.key === "Home") {
              e.preventDefault();
              items[0]?.focus();
            } else if (e.key === "End") {
              e.preventDefault();
              items[items.length - 1]?.focus();
            }
          }}
          className={cn(
            "relative flex items-center gap-0.5 select-none overflow-x-auto max-w-full scrollbar-hide -my-1 py-1",
            className
          )}
          role="tablist"
          {...props}
        >
          {/* Selected pill */}
          {selectedRect ? (
            <m.div
              className={cn("absolute bg-active pointer-events-none", TABS_SUBTLE_PILL_CLASS)}
              initial={false}
              style={{
                left: selectedRect.left,
                width: selectedRect.width,
                top: selectedRect.top,
                height: selectedRect.height,
              }}
              animate={{
                opacity: isHovering ? 0.8 : 1,
              }}
              transition={
                pauseSelectionMotion
                  ? TABS_SUBTLE_FROZEN_TRANSITION
                  : {
                      ...spring.moderate,
                      opacity: { duration: 0.08 },
                    }
              }
            />
          ) : null}

          {/* Hover pill */}
          <AnimatePresence>
            {hoverRect && !isHoveringSelected && selectedRect && !pauseSelectionMotion && (
              <m.div
                className={cn("absolute bg-active pointer-events-none", TABS_SUBTLE_PILL_CLASS)}
                initial={{ opacity: 0 }}
                style={{
                  left: hoverRect.left,
                  width: hoverRect.width,
                  top: hoverRect.top,
                  height: hoverRect.height,
                }}
                animate={{
                  opacity: 0.4,
                }}
                exit={
                  !isMouseInside.current && selectedRect
                    ? {
                        opacity: 0,
                        transition: { ...spring.moderate, opacity: { duration: 0.06 } },
                      }
                    : { opacity: 0, transition: spring.fast.exit }
                }
                transition={{
                  ...spring.fast,
                  opacity: { duration: 0.08 },
                }}
              />
            )}
          </AnimatePresence>

          {/* Focus ring */}
          <AnimatePresence>
            {focusRect && !pauseSelectionMotion && (
              <m.div
                className={cn(
                  "absolute pointer-events-none z-20 border border-[#6B97FF]",
                  TABS_SUBTLE_FOCUS_RING_CLASS,
                )}
                initial={false}
                style={{
                  left: focusRect.left - 2,
                  top: focusRect.top - 2,
                  width: focusRect.width + 4,
                  height: focusRect.height + 4,
                }}
                animate={{}}
                exit={{ opacity: 0, transition: spring.fast.exit }}
                transition={{
                  ...spring.fast,
                  opacity: { duration: 0.08 },
                }}
              />
            )}
          </AnimatePresence>

          {children}
        </div>
      </TabsSubtleContext.Provider>
    );
  }
);

TabsSubtle.displayName = "TabsSubtle";

interface TabsSubtleItemProps extends HTMLAttributes<HTMLButtonElement> {
  icon?: IconComponent;
  label: string;
  index: number;
}

const TabsSubtleItem = forwardRef<HTMLButtonElement, TabsSubtleItemProps>(
  ({ icon: Icon, label, index, className, ...props }, ref) => {
    const internalRef = useRef<HTMLButtonElement>(null);
    const { registerTab, hoveredIndex, selectedIndex, onSelect, idPrefix, activeLabel } =
      useTabsSubtle();

    useEffect(() => {
      registerTab(index, internalRef.current);
      return () => registerTab(index, null);
    }, [index, registerTab]);

    const isSelected = selectedIndex === index;
    const isActive = hoveredIndex === index || isSelected;
    const collapseLabel = activeLabel && !!Icon;
    const showLabel = !collapseLabel || isSelected;

    const labelContent = (
      <span className="inline-grid text-[13px] whitespace-nowrap">
        <span
          className="col-start-1 row-start-1 invisible"
          style={{ fontVariationSettings: fontWeights.semibold }}
          aria-hidden="true"
        >
          {label}
        </span>
        <span
          className={cn(
            "col-start-1 row-start-1 transition-[color,font-variation-settings] duration-80",
            isActive ? "text-foreground" : "text-muted-foreground"
          )}
          style={{
            fontVariationSettings: isSelected
              ? fontWeights.semibold
              : fontWeights.normal,
          }}
        >
          {label}
        </span>
      </span>
    );

    return (
      <button
        ref={(node) => {
          (internalRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
        }}
        data-proximity-index={index}
        id={`${idPrefix}-tab-${index}`}
        role="tab"
        aria-selected={isSelected}
        aria-controls={`${idPrefix}-panel-${index}`}
        aria-label={collapseLabel && !showLabel ? label : undefined}
        tabIndex={isSelected ? 0 : -1}
        onClick={() => onSelect(index)}
        className={cn(
          "relative z-10 flex items-center px-3 py-2 cursor-pointer bg-transparent border-none outline-none",
          collapseLabel ? "h-8" : "gap-2",
          TABS_SUBTLE_PILL_CLASS,
          className
        )}
        {...props}
      >
        {Icon && (
          <Icon
            size={16}
            strokeWidth={isActive ? 2 : 1.5}
            className={cn(
              "shrink-0 transition-[color,stroke-width] duration-80",
              isActive ? "text-foreground" : "text-muted-foreground"
            )}
          />
        )}
        {collapseLabel ? (
          <AnimatePresence initial={false}>
            {showLabel && (
              <m.span
                key="label"
                className="overflow-hidden inline-block origin-left"
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                exit={{ scaleX: 0, opacity: 0 }}
                style={{ marginLeft: showLabel ? 8 : 0 }}
                transition={{
                  ...spring.fast,
                  opacity: { duration: 0.06 },
                }}
              >
                {labelContent}
              </m.span>
            )}
          </AnimatePresence>
        ) : (
          labelContent
        )}
      </button>
    );
  }
);

TabsSubtleItem.displayName = "TabsSubtleItem";

interface TabsSubtlePanelProps extends HTMLAttributes<HTMLDivElement> {
  index: number;
  selectedIndex: number;
  idPrefix: string;
  children: ReactNode;
}

const TabsSubtlePanel = forwardRef<HTMLDivElement, TabsSubtlePanelProps>(
  ({ index, selectedIndex, idPrefix, children, className, ...props }, ref) => {
    const isSelected = selectedIndex === index;

    return (
      <div
        ref={ref}
        id={`${idPrefix}-panel-${index}`}
        role="tabpanel"
        aria-labelledby={`${idPrefix}-tab-${index}`}
        hidden={!isSelected}
        tabIndex={-1}
        className={cn("outline-none", className)}
        {...props}
      >
        {isSelected && children}
      </div>
    );
  }
);

TabsSubtlePanel.displayName = "TabsSubtlePanel";

export { TabsSubtle, TabsSubtleItem };
