"use client"

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react"
import { Reorder, useDragControls, useReducedMotion } from "motion/react"

import { cn } from "@/lib/utils"

const CELL = { type: "spring", stiffness: 520, damping: 34, mass: 0.45 } as const
const INSTANT = { duration: 0 } as const

const moveItem = <T,>(list: readonly T[], from: number, to: number): T[] => {
  const next = [...list]
  const [taken] = next.splice(from, 1)
  next.splice(to, 0, taken!)
  return next
}

export type UseReorderListOptions<T> = {
  items: readonly T[]
  getId: (item: T) => string
  getLabel: (item: T) => string
  onReorder: (next: T[]) => void
  onCommit?: (next: T[]) => void
  disabled?: boolean
}

function useReorderList<T>({
  items,
  getId,
  getLabel,
  onReorder,
  onCommit,
  disabled = false,
}: UseReorderListOptions<T>) {
  const [grabbed, setGrabbed] = useState<string | null>(null)
  const [dragging, setDragging] = useState<string | null>(null)
  const [spoken, setSpoken] = useState("")

  const emit = useRef(onReorder)
  const settle = useRef(onCommit)
  const live = useRef(items)
  useEffect(() => {
    emit.current = onReorder
    settle.current = onCommit
    live.current = items
  })
  const snapshot = useRef<readonly T[] | null>(null)

  const indexOf = useCallback(
    (id: string) => live.current.findIndex((item) => getId(item) === id),
    [getId],
  )

  const grab = useCallback(
    (id: string) => {
      snapshot.current = live.current
      setGrabbed(id)
      const at = indexOf(id)
      const item = live.current[at]
      setSpoken(`${getLabel(item)} grabbed, position ${at + 1} of ${live.current.length}.`)
    },
    [getLabel, indexOf],
  )

  const drop = useCallback(
    (id: string) => {
      snapshot.current = null
      setGrabbed(null)
      const at = indexOf(id)
      const item = live.current[at]
      setSpoken(`${getLabel(item)} dropped at position ${at + 1}.`)
      settle.current?.([...live.current])
    },
    [getLabel, indexOf],
  )

  const cancel = useCallback(() => {
    if (snapshot.current) {
      emit.current([...snapshot.current])
    }
    snapshot.current = null
    setGrabbed(null)
    setSpoken("Reorder cancelled, original order restored.")
  }, [])

  const step = useCallback(
    (id: string, delta: -1 | 1) => {
      const from = indexOf(id)
      const to = from + delta
      if (from < 0 || to < 0 || to >= live.current.length) {
        return
      }

      const next = moveItem(live.current, from, to)
      emit.current(next)
      const item = next[to]
      setSpoken(`${getLabel(item)}, position ${to + 1} of ${next.length}.`)
      if (snapshot.current === null) {
        settle.current?.(next)
      }
    },
    [getLabel, indexOf],
  )

  const rowKeyDown = useCallback(
    (id: string) => (event: KeyboardEvent<HTMLElement>) => {
      if (disabled || event.target !== event.currentTarget) {
        return
      }

      const held = grabbed === id
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault()
        if (held) {
          drop(id)
        } else {
          grab(id)
        }
        return
      }

      if ((event.key === "ArrowUp" || event.key === "ArrowDown") && held) {
        event.preventDefault()
        step(id, event.key === "ArrowUp" ? -1 : 1)
        return
      }

      if (event.key === "Escape" && held) {
        event.preventDefault()
        cancel()
      }
    },
    [disabled, grabbed, grab, drop, step, cancel],
  )

  const onDragStart = useCallback((id: string) => {
    snapshot.current = live.current
    setDragging(id)
  }, [])

  const onDragEnd = useCallback(
    (id: string) => {
      snapshot.current = null
      setDragging(null)
      const at = indexOf(id)
      const item = live.current[at]
      setSpoken(`${getLabel(item)} dropped at position ${at + 1}.`)
      settle.current?.([...live.current])
    },
    [getLabel, indexOf],
  )

  return {
    grabbed,
    dragging,
    spoken,
    rowKeyDown,
    onDragStart,
    onDragEnd,
    cancel,
  }
}

export type ReorderListProps<T> = UseReorderListOptions<T> & {
  children: (item: T) => ReactNode
  label: string
  className?: string
  listClassName?: string
  listDataSlot?: string
  itemDataSlot?: string
  selectedId?: string
  isItemDraggable?: (item: T) => boolean
  getItemClassName?: (item: T, state: { lifted: boolean; selected: boolean }) => string | undefined
  gripClassName?: string
  renderTrailing?: (item: T) => ReactNode
  onItemActivate?: (item: T) => void
}

const GRIP = (
  <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" aria-hidden="true">
    <circle cx="2.5" cy="2.5" r="1.2" />
    <circle cx="7.5" cy="2.5" r="1.2" />
    <circle cx="2.5" cy="7" r="1.2" />
    <circle cx="7.5" cy="7" r="1.2" />
    <circle cx="2.5" cy="11.5" r="1.2" />
    <circle cx="7.5" cy="11.5" r="1.2" />
  </svg>
)

function ReorderListRow<T>({
  item,
  getId,
  getLabel,
  draggable,
  selected,
  lifted,
  reduced,
  hintId,
  held,
  itemDataSlot,
  gripClassName,
  getItemClassName,
  rowKeyDown,
  onDragStart,
  onDragEnd,
  onBlurCancel,
  children,
  renderTrailing,
  onItemActivate,
}: {
  item: T
  getId: (item: T) => string
  getLabel: (item: T) => string
  draggable: boolean
  selected: boolean
  lifted: boolean
  reduced: boolean
  hintId: string
  held: boolean
  itemDataSlot?: string
  gripClassName?: string
  getItemClassName?: (item: T, state: { lifted: boolean; selected: boolean }) => string | undefined
  rowKeyDown: (id: string) => (event: KeyboardEvent<HTMLElement>) => void
  onDragStart: (id: string) => void
  onDragEnd: (id: string) => void
  onBlurCancel: () => void
  children: (item: T) => ReactNode
  renderTrailing?: (item: T) => ReactNode
  onItemActivate?: (item: T) => void
}) {
  const id = getId(item)
  const controls = useDragControls()

  function startDrag(event: PointerEvent<HTMLElement>) {
    controls.start(event)
  }

  // Non-draggable rows skip rowKeyDown (grab/drop keys); Enter/Space on the
  // focused row activates it the way a click does.
  const activateKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget) return
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault()
      onItemActivate?.(item)
    }
  }

  return (
    <Reorder.Item
      value={item}
      drag={draggable ? "y" : false}
      dragControls={controls}
      dragListener={false}
      tabIndex={draggable ? 0 : -1}
      aria-describedby={draggable ? hintId : undefined}
      aria-selected={selected}
      data-slot={itemDataSlot}
      role="option"
      onKeyDown={draggable ? rowKeyDown(id) : activateKeyDown}
      onClick={(event) => {
        const target = event.target as HTMLElement
        if (
          target.closest("[data-reorder-grip]") ||
          target.closest('[data-slot="desktop-layer-row-actions"]')
        ) {
          return
        }
        onItemActivate?.(item)
      }}
      onDragStart={() => onDragStart(id)}
      onDragEnd={() => onDragEnd(id)}
      onBlur={() => held && onBlurCancel()}
      transition={reduced ? INSTANT : CELL}
      whileDrag={reduced || !draggable ? undefined : { scale: 1.01 }}
      style={{ touchAction: draggable ? "pan-x" : undefined }}
      className={cn(
        "relative w-full min-w-0 cursor-pointer list-none outline-none",
        lifted && "z-10",
        getItemClassName?.(item, { lifted, selected }),
      )}
    >
      <div className="flex w-full min-w-0 cursor-pointer items-center gap-1.5">
        {draggable ? (
          <button
            type="button"
            data-reorder-grip
            className={cn(
              "grid size-7 shrink-0 cursor-grab place-items-center rounded-lg text-muted-foreground/70 active:cursor-grabbing",
              lifted && "cursor-grabbing",
              gripClassName,
            )}
            aria-label={`Reorder ${getLabel(item)}`}
            onPointerDown={(event) => {
              event.stopPropagation()
              startDrag(event)
            }}
            onClick={(event) => event.stopPropagation()}
          >
            {GRIP}
          </button>
        ) : (
          <span aria-hidden="true" className="size-7 shrink-0" />
        )}

        <span className="sr-only">{getLabel(item)}</span>

        <div className="min-w-0 flex-1">{children(item)}</div>

        {renderTrailing ? (
          <div
            className="flex shrink-0 cursor-pointer items-center"
            data-slot="desktop-layer-row-actions"
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
          >
            {renderTrailing(item)}
          </div>
        ) : null}
      </div>
    </Reorder.Item>
  )
}

export function ReorderList<T>({
  children,
  label,
  className,
  listClassName,
  listDataSlot,
  itemDataSlot,
  selectedId,
  isItemDraggable,
  getItemClassName,
  gripClassName,
  renderTrailing,
  onItemActivate,
  ...options
}: ReorderListProps<T>) {
  const { items, getId, onReorder, disabled = false } = options
  const list = useReorderList(options)
  const reduced = useReducedMotion() === true
  const hintId = useId()

  const canDragItem = (item: T) => !disabled && (isItemDraggable?.(item) ?? true)

  return (
    <div className={cn("w-full min-w-0 cursor-pointer", className)}>
      <Reorder.Group
        axis="y"
        values={items as T[]}
        onReorder={onReorder}
        aria-label={label}
        className={cn("m-0 flex cursor-pointer list-none flex-col gap-0 p-0", listClassName)}
        data-slot={listDataSlot}
        role="listbox"
      >
        {items.map((item) => {
          const id = getId(item)
          const held = list.grabbed === id
          const lifted = held || list.dragging === id
          const draggable = canDragItem(item)
          const selected = selectedId === id

          return (
            <ReorderListRow
              key={id}
              draggable={draggable}
              getId={getId}
              getItemClassName={getItemClassName}
              getLabel={options.getLabel}
              gripClassName={gripClassName}
              held={held}
              hintId={hintId}
              item={item}
              itemDataSlot={itemDataSlot}
              lifted={lifted}
              reduced={reduced}
              renderTrailing={renderTrailing}
              rowKeyDown={list.rowKeyDown}
              selected={selected}
              onBlurCancel={list.cancel}
              onDragEnd={list.onDragEnd}
              onDragStart={list.onDragStart}
              onItemActivate={onItemActivate}
            >
              {children}
            </ReorderListRow>
          )
        })}
      </Reorder.Group>

      <span id={hintId} className="sr-only">
        Drag the grip to reorder. With the keyboard, focus a row, Space grabs it, arrow keys move
        it, Space drops it, and Escape restores the original order.
      </span>
      <span role="status" aria-live="polite" className="sr-only">
        {list.spoken}
      </span>
    </div>
  )
}
