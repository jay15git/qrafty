"use client"

import {
  AppleIcon,
  WindowsOldIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useState, type ComponentProps, type CSSProperties } from "react"

import { Kbd } from "@/components/kbd"
import { PopoverContent } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DesktopInspectorSection } from "@/features/desktop-shell/components/InspectorControls"
import { DRAFTING_KEYBOARD_SHORTCUT_GROUPS } from "@/features/workspace/model/keyboard-shortcuts"
import { cn } from "@/lib/utils"

type DesktopShortcutPlatform = "apple" | "windows"

const DESKTOP_SHORTCUT_PLATFORMS: Array<{
  icon: typeof WindowsOldIcon
  label: string
  value: DesktopShortcutPlatform
}> = [
  { icon: AppleIcon, label: "Apple", value: "apple" },
  { icon: WindowsOldIcon, label: "Windows", value: "windows" },
]

function getDefaultShortcutPlatform(): DesktopShortcutPlatform {
  if (typeof navigator === "undefined") {
    return "windows"
  }

  const platform =
    (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ??
    navigator.platform ??
    ""
  const userAgent = navigator.userAgent ?? ""
  const platformSignature = `${platform} ${userAgent}`.toLowerCase()

  return /mac|iphone|ipad|ipod/.test(platformSignature) ? "apple" : "windows"
}

function getShortcutKeyCombos(keys: string, platform: DesktopShortcutPlatform): string[][] {
  if (keys === "Arrow keys") {
    return [["↑"], ["↓"], ["←"], ["→"]]
  }

  if (keys === "Shift + Arrow") {
    return [["Shift", "← ↑ ↓ →"]]
  }

  return keys.split(" / ").map((combo) =>
    combo.split(" + ").map((key) => {
      if (key === "Cmd/Ctrl") {
        return platform === "apple" ? "⌘" : "Ctrl"
      }

      return key
    }),
  )
}

export function DesktopKeyboardShortcutsPopoverContent({
  popoverAlign = "end",
  popoverSide = "bottom",
}: {
  popoverAlign?: ComponentProps<typeof PopoverContent>["align"]
  popoverSide?: ComponentProps<typeof PopoverContent>["side"]
}) {
  const [shortcutPlatform, setShortcutPlatform] = useState<DesktopShortcutPlatform>(
    getDefaultShortcutPlatform,
  )

  return (
    <PopoverContent
      align={popoverAlign}
      data-slot="desktop-keyboard-shortcuts-popover"
      side={popoverSide}
      sideOffset={12}
      className="z-[20000] flex h-[min(44rem,calc(100dvh-7rem))] max-h-[min(44rem,calc(100dvh-7rem))] w-[min(27rem,calc(100vw-1rem))] flex-col overflow-hidden rounded-[16px] border border-[#242424] bg-[#0a0a0a] p-0 text-white shadow-[var(--desktop-glass-shadow)]"
      style={
        {
          "--desktop-inspector-field-bg": "#141414",
          "--desktop-inspector-section-bg": "#181818",
        } as CSSProperties
      }
    >
      <div className="grid shrink-0 grid-cols-[auto_1fr_auto] items-center gap-3 px-4 pb-2 pt-3">
        <div
          aria-label="Shortcut platform"
          className="inline-flex gap-1"
          data-slot="desktop-shortcut-platform-toggle"
          role="group"
        >
          {DESKTOP_SHORTCUT_PLATFORMS.map((platform) => {
            const isSelected = shortcutPlatform === platform.value

            return (
              <button
                aria-label={`Use ${platform.label} shortcuts`}
                aria-pressed={isSelected}
                className={cn(
                  "grid size-7 cursor-pointer place-items-center rounded-full text-white/52 transition hover:bg-[#262626] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/35",
                  isSelected && "bg-[#303030] text-white",
                )}
                data-platform={platform.value}
                data-slot="desktop-shortcut-platform-button"
                key={platform.value}
                onClick={() => setShortcutPlatform(platform.value)}
                type="button"
              >
                <HugeiconsIcon
                  icon={platform.icon}
                  size={15}
                  color="currentColor"
                  strokeWidth={1.8}
                />
              </button>
            )
          })}
        </div>
        <div className="min-w-0 text-center">
          <h2 className="text-sm font-semibold text-white/92">Shortcuts</h2>
        </div>
        <span aria-hidden="true" className="w-[3.75rem]" />
      </div>
      <ScrollArea
        chevron
        cueSize="comfortable"
        className="h-full min-h-0 flex-1"
        data-slot="desktop-keyboard-shortcuts-scroll-area"
        scrollFade
        viewportClassName="px-3 pb-3 pt-1"
      >
        <div data-slot="desktop-keyboard-shortcuts-scroll">
          <div className="grid gap-2.5">
            {DRAFTING_KEYBOARD_SHORTCUT_GROUPS.map((group) => (
              <DesktopInspectorSection
                aria-label={`${group.title} shortcuts`}
                className="p-2.5"
                key={group.title}
              >
                <h3 className="px-1 pb-1.5 text-[11px] font-semibold text-white/64">
                  {group.title}
                </h3>
                <div className="grid gap-1">
                  {group.shortcuts.map(([keys, description]) => (
                    <div
                      key={keys}
                      className="grid grid-cols-[minmax(10rem,12.5rem)_1fr] items-center gap-3 rounded-[7px] px-2 py-1.5 text-[12px]"
                    >
                      <span
                        className="flex min-w-0 flex-wrap items-center gap-1.5 justify-self-start"
                        data-slot="desktop-shortcut-keycaps"
                      >
                        {getShortcutKeyCombos(keys, shortcutPlatform).map((combo, comboIndex) => (
                          <span className="inline-flex items-center gap-1" key={`${keys}-${comboIndex}`}>
                            {comboIndex > 0 ? (
                              <span className="px-0.5 text-[10px] font-semibold text-white/34">/</span>
                            ) : null}
                            {combo.map((key, keyIndex) => (
                              <span
                                className="inline-flex items-center gap-1"
                                key={`${keys}-${comboIndex}-${keyIndex}`}
                              >
                                {keyIndex > 0 ? (
                                  <span
                                    aria-hidden="true"
                                    className="text-[11px] font-semibold text-white/38"
                                    data-slot="desktop-shortcut-combo-separator"
                                  >
                                    +
                                  </span>
                                ) : null}
                                <Kbd
                                  className="border-[#333333] bg-[#202020] text-white/88 shadow-none"
                                  data-slot="desktop-shortcut-kbd"
                                  size="md"
                                  variant="sculpted"
                                >
                                  {key}
                                </Kbd>
                              </span>
                            ))}
                          </span>
                        ))}
                      </span>
                      <span className="min-w-0 text-white/58">{description}</span>
                    </div>
                  ))}
                </div>
              </DesktopInspectorSection>
            ))}
          </div>
        </div>
      </ScrollArea>
    </PopoverContent>
  )
}
