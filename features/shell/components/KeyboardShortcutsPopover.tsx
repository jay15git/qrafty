"use client";

import { AppleIcon, WindowsOldIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState, type ComponentProps } from "react";

import { Kbd } from "@/components/kbd";
import { PopoverContent } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { InspectorSection } from "@/features/shell/components/InspectorControls";
import { DRAFTING_KEYBOARD_SHORTCUT_GROUPS } from "@/features/canvas/model/keyboard-shortcuts";
import { cn } from "@/lib/utils";

type ShortcutPlatform = "apple" | "windows";

const SHORTCUT_PLATFORMS: Array<{
  icon: typeof WindowsOldIcon;
  label: string;
  value: ShortcutPlatform;
}> = [
  { icon: AppleIcon, label: "Apple", value: "apple" },
  { icon: WindowsOldIcon, label: "Windows", value: "windows" },
];

function getDefaultShortcutPlatform(): ShortcutPlatform {
  if (typeof navigator === "undefined") {
    return "windows";
  }

  const platform =
    (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ??
    navigator.platform ??
    "";
  const userAgent = navigator.userAgent ?? "";
  const platformSignature = `${platform} ${userAgent}`.toLowerCase();

  return /mac|iphone|ipad|ipod/.test(platformSignature) ? "apple" : "windows";
}

function getShortcutKeyCombos(keys: string, platform: ShortcutPlatform): string[][] {
  if (keys === "Arrow keys") {
    return [["↑"], ["↓"], ["←"], ["→"]];
  }

  if (keys === "Shift + Arrow") {
    return [["Shift", "← ↑ ↓ →"]];
  }

  return keys.split(" / ").map((combo) =>
    combo.split(" + ").map((key) => {
      if (key === "Cmd/Ctrl") {
        return platform === "apple" ? "⌘" : "Ctrl";
      }

      return key;
    }),
  );
}

export function KeyboardShortcutsPopoverContent({
  popoverAlign = "end",
  popoverSide = "bottom",
  theme = "dark",
}: {
  popoverAlign?: ComponentProps<typeof PopoverContent>["align"];
  popoverSide?: ComponentProps<typeof PopoverContent>["side"];
  theme?: "light" | "dark";
}) {
  const [shortcutPlatform, setShortcutPlatform] = useState<ShortcutPlatform>(
    getDefaultShortcutPlatform,
  );

  return (
    <PopoverContent
      align={popoverAlign}
      collisionPadding={12}
      data-slot="keyboard-shortcuts-popover"
      data-theme={theme}
      side={popoverSide}
      sideOffset={12}
      className={cn(
        "ds-portal-surface ds-popover-content ds-popover-flat z-[var(--z-popover)] flex h-[min(44rem,calc(100dvh-7rem))] max-h-[min(44rem,calc(100dvh-7rem))] w-[var(--popover-width-lg)] flex-col overflow-hidden p-0 ds-squircle-md",
        theme === "dark" && "dark",
      )}
    >
      <div className="grid shrink-0 grid-cols-[auto_1fr_auto] items-center gap-3 px-4 pb-2 pt-3">
        <div
          aria-label="Shortcut platform"
          className="inline-flex gap-1"
          data-slot="shortcut-platform-toggle"
          role="group"
        >
          {SHORTCUT_PLATFORMS.map((platform) => {
            const isSelected = shortcutPlatform === platform.value;

            return (
              <button
                aria-label={`Use ${platform.label} shortcuts`}
                aria-pressed={isSelected}
                className={cn(
                  "grid size-7 cursor-pointer place-items-center rounded-full text-[var(--muted)] transition hover:bg-[var(--control)] hover:text-[var(--fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring,var(--ring))]",
                  isSelected && "bg-[var(--control)] text-[var(--fg)]",
                )}
                data-platform={platform.value}
                data-slot="shortcut-platform-button"
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
            );
          })}
        </div>
        <div className="min-w-0 text-center">
          <h2 className="text-sm font-semibold text-[var(--fg)]">Shortcuts</h2>
        </div>
        <span aria-hidden="true" className="w-[3.75rem]" />
      </div>
      <ScrollArea
        chevron
        cueSize="comfortable"
        className="h-full min-h-0 flex-1"
        data-slot="keyboard-shortcuts-scroll-area"
        scrollFade
        viewportClassName="px-3 pb-3 pt-1"
      >
        <div data-slot="keyboard-shortcuts-scroll">
          <div className="grid gap-2.5">
            {DRAFTING_KEYBOARD_SHORTCUT_GROUPS.map((group) => (
              <InspectorSection
                aria-label={`${group.title} shortcuts`}
                className="p-2.5"
                key={group.title}
              >
                <h3 className="px-1 pb-1.5 text-[length:var(--type-meta)] font-semibold text-[var(--muted)]">
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
                        data-slot="shortcut-keycaps"
                      >
                        {getShortcutKeyCombos(keys, shortcutPlatform).map((combo, comboIndex) => (
                          <span
                            className="inline-flex items-center gap-1"
                            key={`${keys}-${comboIndex}`}
                          >
                            {comboIndex > 0 ? (
                              <span className="px-0.5 text-[10px] font-semibold text-[var(--muted)]">
                                /
                              </span>
                            ) : null}
                            {combo.map((key, keyIndex) => (
                              <span
                                className="inline-flex items-center gap-1"
                                key={`${keys}-${comboIndex}-${keyIndex}`}
                              >
                                {keyIndex > 0 ? (
                                  <span
                                    aria-hidden="true"
                                    className="text-[length:var(--type-meta)] font-semibold text-[var(--muted)]"
                                    data-slot="shortcut-combo-separator"
                                  >
                                    +
                                  </span>
                                ) : null}
                                <Kbd
                                  className="border-[var(--line)] bg-[var(--control)] text-[var(--fg)] shadow-none"
                                  data-slot="shortcut-kbd"
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
                      <span className="min-w-0 text-[var(--muted)]">{description}</span>
                    </div>
                  ))}
                </div>
              </InspectorSection>
            ))}
          </div>
        </div>
      </ScrollArea>
    </PopoverContent>
  );
}
