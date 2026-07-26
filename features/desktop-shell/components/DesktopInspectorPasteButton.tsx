"use client"

import { useEffect, useRef, useState } from "react"
import { CheckIcon, ClipboardIcon } from "lucide-react"

import { cn } from "@/lib/utils"

import "./desktop-inspector-icon-swap.css"

const PASTE_SUCCESS_MS = 1500

type DesktopInspectorPasteButtonProps = {
  className?: string
  onPaste: (value: string) => void
}

export function DesktopInspectorPasteButton({
  className,
  onPaste,
}: DesktopInspectorPasteButtonProps) {
  const [iconState, setIconState] = useState<"a" | "b">("a")
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current)
      }
    }
  }, [])

  async function handlePaste() {
    try {
      const text = (await navigator.clipboard.readText()).trim()
      if (!text) {
        return
      }

      onPaste(text)
      setIconState("b")

      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current)
      }

      resetTimeoutRef.current = setTimeout(() => {
        setIconState("a")
        resetTimeoutRef.current = null
      }, PASTE_SUCCESS_MS)
    } catch {
      // Clipboard permission denied or unavailable.
    }
  }

  return (
    <button
      aria-label="Paste from clipboard"
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-[5px] text-[var(--desktop-inspector-fg-muted)] transition hover:bg-white/8 hover:text-[var(--desktop-inspector-fg-primary)]",
        className,
      )}
      data-slot="desktop-inspector-paste-action"
      type="button"
      onClick={() => {
        void handlePaste()
      }}
    >
      <span aria-hidden className="t-icon-swap" data-state={iconState}>
        <span className="t-icon" data-icon="a">
          <ClipboardIcon className="size-3.5" strokeWidth={1.75} />
        </span>
        <span className="t-icon" data-icon="b">
          <CheckIcon className="size-3.5 text-emerald-400" strokeWidth={2} />
        </span>
      </span>
    </button>
  )
}
