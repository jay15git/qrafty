"use client"

import { useSyncExternalStore } from "react"
import { MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"

import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

type ModeToggleProps = {
  appearance?: "default" | "drafting"
  className?: string
}

function subscribe() {
  return () => {}
}

export function ModeToggle({ appearance = "default", className }: ModeToggleProps) {
  const { setTheme, theme } = useTheme()
  const mounted = useSyncExternalStore(subscribe, () => true, () => false)

  const isDark = mounted ? theme === "dark" : false
  const isDrafting = appearance === "drafting"
  const lightIconClassName = isDrafting
    ? isDark
      ? "text-[var(--ws-ink-subtle)]"
      : "text-[var(--ws-ink)]"
    : isDark
      ? "text-foreground/35"
      : "text-amber-500"
  const darkIconClassName = isDrafting
    ? isDark
      ? "text-[var(--ws-ink)]"
      : "text-[var(--ws-ink-subtle)]"
    : isDark
      ? "text-sky-300"
      : "text-foreground/35"

  if (isDrafting) {
    return (
      <Switch
        aria-label="Toggle dark mode"
        checked={isDark}
        className={cn(
          "dark:data-checked:bg-foreground dark:[&_[data-slot=switch-thumb]]:data-checked:bg-background",
          className,
        )}
        disabled={!mounted}
        onCheckedChange={(checked) => {
          setTheme(checked ? "dark" : "light")
        }}
      />
    )
  }

  return (
    <div
      data-slot="mode-toggle"
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-foreground shadow-none backdrop-blur",
        className,
      )}
    >
      <span
        className={cn(
          "font-medium text-foreground/70",
          isDrafting ? "ws-type-body" : "text-sm",
        )}
      >
        Appearance
      </span>
      <SunIcon
        data-slot="mode-toggle-light-icon"
        className={cn("size-4 transition-colors", lightIconClassName)}
      />
      <Switch
        aria-label="Toggle dark mode"
        checked={isDark}
        className="dark:data-checked:bg-foreground dark:[&_[data-slot=switch-thumb]]:data-checked:bg-background"
        disabled={!mounted}
        onCheckedChange={(checked) => {
          setTheme(checked ? "dark" : "light")
        }}
      />
      <MoonIcon
        data-slot="mode-toggle-dark-icon"
        className={cn("size-4 transition-colors", darkIconClassName)}
      />
    </div>
  )
}
