"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { Slot } from "@radix-ui/react-slot"
import { AnimatePresence, m } from "motion/react"
import useMeasure from "react-use-measure"
import { Drawer } from "vaul"

import { usePersistedScrollNode } from "@/lib/persisted-element-scroll"
import { cn } from "@/lib/utils"

type ViewComponent = React.ComponentType<Record<string, unknown>>

interface ViewsRegistry {
  [viewName: string]: ViewComponent
}

interface FamilyDrawerContextValue {
  isOpen: boolean
  view: string
  setView: (view: string) => void
  opacityDuration: number
  elementRef: ReturnType<typeof useMeasure>[0]
  bounds: ReturnType<typeof useMeasure>[1]
  views: ViewsRegistry | undefined
}

const FamilyDrawerContext = createContext<FamilyDrawerContextValue | undefined>(undefined)

function useFamilyDrawer() {
  const context = useContext(FamilyDrawerContext)
  if (!context) {
    throw new Error("FamilyDrawer components must be used within FamilyDrawerRoot")
  }
  return context
}

interface FamilyDrawerRootProps {
  children: ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  defaultView?: string
  onViewChange?: (view: string) => void
  views?: ViewsRegistry
  modal?: boolean
  dismissible?: boolean
  /**
   * Vaul writes leftover inline `height`/`bottom` on keyboard dismiss.
   * This card animates its own height, so keyboard lift belongs to the host.
   * @default false
   */
  repositionInputs?: boolean
}

function FamilyDrawerRoot({
  children,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  defaultView = "default",
  onViewChange,
  views: customViews,
  modal = true,
  dismissible = true,
  repositionInputs = false,
}: FamilyDrawerRootProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const [view, setView] = useState(defaultView)
  const [elementRef, bounds] = useMeasure()
  const previousHeightRef = useRef<number>(0)

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setIsOpen = onOpenChange || setInternalOpen

  const opacityDuration = useMemo(() => {
    const currentHeight = bounds.height
    const previousHeight = previousHeightRef.current

    const MIN_DURATION = 0.15
    const MAX_DURATION = 0.27

    if (!previousHeightRef.current) {
      previousHeightRef.current = currentHeight
      return MIN_DURATION
    }

    const heightDifference = Math.abs(currentHeight - previousHeight)
    previousHeightRef.current = currentHeight

    return Math.min(Math.max(heightDifference / 500, MIN_DURATION), MAX_DURATION)
  }, [bounds.height])

  const handleViewChange = useCallback(
    (newView: string) => {
      setView(newView)
      onViewChange?.(newView)
    },
    [onViewChange],
  )

  const views =
    customViews && Object.keys(customViews).length > 0 ? customViews : undefined

  const contextValue: FamilyDrawerContextValue = useMemo(
    () => ({
      isOpen,
      view,
      setView: handleViewChange,
      opacityDuration,
      elementRef,
      bounds,
      views,
    }),
    [
      isOpen,
      view,
      handleViewChange,
      opacityDuration,
      elementRef,
      bounds,
      views,
    ],
  )

  return (
    <FamilyDrawerContext.Provider value={contextValue}>
      <Drawer.Root
        dismissible={dismissible}
        modal={modal}
        open={isOpen}
        onOpenChange={setIsOpen}
        repositionInputs={repositionInputs}
      >
        {children}
      </Drawer.Root>
    </FamilyDrawerContext.Provider>
  )
}

interface FamilyDrawerTriggerProps {
  children: ReactNode
  asChild?: boolean
  className?: string
}

function FamilyDrawerTrigger({
  children,
  asChild = false,
  className,
}: FamilyDrawerTriggerProps) {
  if (asChild) {
    return (
      <Drawer.Trigger asChild>
        {children}
      </Drawer.Trigger>
    )
  }

  return (
    <Drawer.Trigger asChild>
      <button
        className={cn(
          "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-11 rounded-full border bg-background px-4 py-2 font-medium text-foreground transition-colors hover:bg-accent focus-visible:shadow-focus-ring-button cursor-pointer antialiased",
          className,
        )}
        type="button"
      >
        {children}
      </button>
    </Drawer.Trigger>
  )
}

function FamilyDrawerPortal({ children }: { children: ReactNode }) {
  return <Drawer.Portal>{children}</Drawer.Portal>
}

interface FamilyDrawerOverlayProps {
  className?: string
  onClick?: () => void
}

function FamilyDrawerOverlay({ className, onClick }: FamilyDrawerOverlayProps) {
  const { setView } = useFamilyDrawer()

  return (
    <Drawer.Overlay
      className={cn("fixed inset-0 z-10 bg-black/30", className)}
      onClick={onClick || (() => setView("default"))}
    />
  )
}

const DEFAULT_VIEW_ACCESSIBILITY_TITLES: Record<string, string> = {
  default: "Settings",
  content: "Content",
  qr: "QR",
  motion: "Motion",
  shape: "Shape",
  background: "Background",
  elements: "Elements",
  element: "Layer style",
  "wallpapers": "Wallpapers",
  "setting-detail": "Setting",
}

type FamilyDrawerContentProps = {
  children: ReactNode
  className?: string
  asChild?: boolean
  variant?: "card" | "sheet"
  /** Screen-reader label for the drawer dialog. Falls back to the active view name. */
  accessibilityTitle?: string
  /** Pixel cap for the animated frame; overflowing content uses this frame's native scroller. */
  maxHeight?: number
} & Record<string, unknown>

function FamilyDrawerContent({
  children,
  className,
  asChild = false,
  variant = "card",
  accessibilityTitle,
  maxHeight,
  ...rest
}: FamilyDrawerContentProps) {
  const { bounds, view } = useFamilyDrawer()
  const setScrollFrameRef = usePersistedScrollNode(`family-drawer-frame:${view}`)
  const isCapped = maxHeight !== undefined
  const dialogTitle =
    accessibilityTitle ??
    DEFAULT_VIEW_ACCESSIBILITY_TITLES[view] ??
    DEFAULT_VIEW_ACCESSIBILITY_TITLES.default
  const displayedHeight =
    isCapped ? Math.min(bounds.height, maxHeight) : bounds.height

  const variantClass =
    variant === "sheet"
      ? "fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-h-[min(70dvh,32rem)] overflow-hidden rounded-t-[28px] bg-background outline-none pb-[env(safe-area-inset-bottom,0px)]"
      : "fixed bottom-[max(1rem,env(safe-area-inset-bottom,0px))] z-30 overflow-hidden rounded-[36px] bg-background outline-none"

  const content = (
    <m.div
      animate={{
        height: displayedHeight,
        transition: {
          duration: 0.27,
          ease: [0.25, 1, 0.5, 1],
        },
      }}
      className={
        isCapped
          ? "min-w-0 overflow-hidden"
          : undefined
      }
    >
      <Drawer.Title className="sr-only">{dialogTitle}</Drawer.Title>
      {isCapped ? (
        <div
          ref={setScrollFrameRef}
          className="h-full min-w-0 overflow-x-clip overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          data-vaul-no-drag=""
        >
          {children}
        </div>
      ) : (
        children
      )}
    </m.div>
  )

  if (asChild && !isCapped) {
    return (
      <Drawer.Content asChild className={cn(variantClass, className)} {...rest}>
        <Slot>{content}</Slot>
      </Drawer.Content>
    )
  }

  return (
    <Drawer.Content className={cn(variantClass, className)} {...rest}>
      {content}
    </Drawer.Content>
  )
}

interface FamilyDrawerAnimatedWrapperProps {
  children: ReactNode
  className?: string
}

function FamilyDrawerAnimatedWrapper({
  children,
  className,
  ...rest
}: FamilyDrawerAnimatedWrapperProps & Record<string, unknown>) {
  const { elementRef } = useFamilyDrawer()

  return (
    <div
      ref={elementRef}
      className={cn("px-6 pb-6 pt-2.5 antialiased", className)}
      {...rest}
    >
      {children}
    </div>
  )
}

interface FamilyDrawerAnimatedContentProps {
  children?: ReactNode
  views?: ViewsRegistry
}

function FamilyDrawerAnimatedContent({
  children,
  views: propViews,
}: FamilyDrawerAnimatedContentProps) {
  const { view, opacityDuration } = useFamilyDrawer()
  const [visitedViews, setVisitedViews] = useState<string[]>(() => [view])

  useEffect(() => {
    setVisitedViews((current) =>
      current.includes(view) ? current : [...current, view],
    )
  }, [view])

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
    )
  }

  return (
    <>
      {visitedViews.map((viewName) => {
        const isActive = viewName === view

        return (
          <m.div
            key={viewName}
            aria-hidden={!isActive}
            className={cn(!isActive && "hidden")}
            animate={
              isActive
                ? { opacity: 1, scale: 1, y: 0 }
                : { opacity: 0, scale: 0.96 }
            }
            initial={false}
            transition={{
              duration: opacityDuration,
              ease: [0.26, 0.08, 0.25, 1],
            }}
          >
            <FamilyDrawerViewContent viewName={viewName} views={propViews} />
          </m.div>
        )
      })}
    </>
  )
}

interface FamilyDrawerCloseProps {
  children?: ReactNode
  asChild?: boolean
  className?: string
}

function FamilyDrawerClose({
  children,
  asChild = false,
  className,
}: FamilyDrawerCloseProps) {
  const defaultClose = (
    <button
      data-vaul-no-drag=""
      className={cn(
        "absolute right-8 top-7 z-10 flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-transform focus:scale-95 focus-visible:shadow-focus-ring-button active:scale-75 cursor-pointer",
        className,
      )}
      type="button"
    >
      {children || <CloseIcon />}
    </button>
  )

  if (asChild) {
    return (
      <Drawer.Close asChild>
        {defaultClose}
      </Drawer.Close>
    )
  }

  return <Drawer.Close asChild>{defaultClose}</Drawer.Close>
}

interface FamilyDrawerHeaderProps {
  icon?: ReactNode
  title: string
  description?: string
  className?: string
}

function FamilyDrawerHeader({
  icon,
  title,
  description,
  className,
}: FamilyDrawerHeaderProps) {
  return (
    <div className={cn("mb-4 flex flex-col gap-1", className)}>
      {icon ? <div className="mb-1">{icon}</div> : null}
      <h2 className="text-[19px] font-semibold text-foreground">{title}</h2>
      {description ? (
        <p className="text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  )
}

interface FamilyDrawerButtonProps {
  children: ReactNode
  onClick: () => void
  className?: string
  asChild?: boolean
}

function FamilyDrawerButton({
  children,
  onClick,
  className,
  asChild = false,
}: FamilyDrawerButtonProps) {
  const button = (
    <button
      data-vaul-no-drag=""
      className={cn(
        "flex min-h-14 h-14 w-full items-center gap-[15px] rounded-[16px] bg-muted px-4 text-[17px] font-semibold text-foreground transition-transform focus:scale-95 focus-visible:shadow-focus-ring-button active:scale-95 cursor-pointer",
        className,
      )}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  )

  if (asChild) {
    return <Slot>{button}</Slot>
  }

  return button
}

interface FamilyDrawerSecondaryButtonProps {
  children: ReactNode
  onClick: () => void
  className?: string
  asChild?: boolean
}

function FamilyDrawerSecondaryButton({
  children,
  onClick,
  className,
  asChild = false,
}: FamilyDrawerSecondaryButtonProps) {
  const button = (
    <button
      data-vaul-no-drag=""
      type="button"
      className={cn(
        "flex h-12 w-full items-center justify-center gap-[15px] rounded-full text-center text-[19px] font-semibold transition-transform focus:scale-95 focus-visible:shadow-focus-ring-button active:scale-95 cursor-pointer",
        className,
      )}
      onClick={onClick}
    >
      {children}
    </button>
  )

  if (asChild) {
    return <Slot>{button}</Slot>
  }

  return button
}

interface FamilyDrawerViewContentProps {
  views?: ViewsRegistry
  /** Pin a view for exit animations; defaults to the active drawer view. */
  viewName?: string
}

function FamilyDrawerViewContent({
  views: propViews,
  viewName: propViewName,
}: FamilyDrawerViewContentProps = {} as FamilyDrawerViewContentProps) {
  const { view: contextView, views: contextViews } = useFamilyDrawer()
  const view = propViewName ?? contextView

  const views = propViews || contextViews

  if (!views) {
    throw new Error(
      "FamilyDrawerViewContent requires views to be provided via props or FamilyDrawerRoot",
    )
  }

  const ViewComponent = views[view]

  if (!ViewComponent) {
    const DefaultComponent = views.default
    return DefaultComponent ? <DefaultComponent /> : null
  }

  return <ViewComponent />
}

function CloseIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M10.4854 1.99998L2.00007 10.4853"
        stroke="#999999"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.4854 10.4844L2.00007 1.99908"
        stroke="#999999"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export {
  FamilyDrawerRoot,
  FamilyDrawerTrigger,
  FamilyDrawerPortal,
  FamilyDrawerOverlay,
  FamilyDrawerContent,
  FamilyDrawerAnimatedWrapper,
  FamilyDrawerAnimatedContent,
  FamilyDrawerClose,
  FamilyDrawerHeader,
  FamilyDrawerButton,
  FamilyDrawerSecondaryButton,
  FamilyDrawerViewContent,
  useFamilyDrawer,
  type ViewsRegistry,
  type ViewComponent,
}
