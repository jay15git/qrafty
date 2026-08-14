"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  DESKTOP_INSPECTOR_DROPDOWN_ITEM_CLASS,
  DESKTOP_INSPECTOR_FG_SECONDARY,
  DESKTOP_INSPECTOR_SELECTED_CLASS,
} from "@/features/desktop-shell/components/InspectorControls"
import { cn } from "@/lib/utils"

const CATEGORY_PILL_SURFACE =
  "rounded-full border border-transparent bg-[var(--desktop-inspector-field-bg)] shadow-[var(--ws-shadow-rest)] transition-shadow duration-300 hover:bg-[var(--desktop-inspector-control-hover-bg)] hover:text-[var(--desktop-inspector-fg-primary)] hover:shadow-[var(--ws-shadow-hover)]"

const CATEGORY_DROPDOWN_MENU_CLASS =
  "z-50 min-w-0 rounded-2xl border border-transparent bg-[var(--ws-option-card-bg)] p-2 text-[var(--desktop-inspector-fg-secondary)] shadow-[var(--ws-option-card-shadow-rest)] ring-0"

import {
  QR_CATEGORIES,
  type QrCategoryKey,
  type QrInputType,
} from "@/features/qr-code/content/input-options"

interface QrCategoryBrowserProps {
  activeInputType: QrInputType | null
  onInputTypeChange: (value: QrInputType) => void
  openCategory?: QrCategoryKey | null
  onOpenCategoryChange?: (value: QrCategoryKey | null) => void
}

export function QrCategoryBrowser({
  activeInputType,
  onInputTypeChange,
  openCategory: openCategoryProp,
  onOpenCategoryChange,
}: QrCategoryBrowserProps) {
  const isControlled = openCategoryProp !== undefined
  const [internalOpenCategory, setInternalOpenCategory] = React.useState<QrCategoryKey | null>(null)
  const openCategory = isControlled ? openCategoryProp : internalOpenCategory

  const setOpenCategory = React.useCallback(
    (value: QrCategoryKey | null) => {
      if (!isControlled) {
        setInternalOpenCategory(value)
      }

      onOpenCategoryChange?.(value)
    },
    [isControlled, onOpenCategoryChange]
  )

  return (
    <div
      data-testid="qr-category-browser"
      className="flex flex-wrap items-center justify-center gap-1.5"
    >
      {QR_CATEGORIES.map((category) => {
        const CategoryIcon = category.icon
        const isOpen = openCategory === category.key
        const isSelectedCategory = category.items.some((item) => item.value === activeInputType)

        return (
          <DropdownMenu
            key={category.key}
            open={isOpen}
            onOpenChange={(open) => {
              if (open) {
                setOpenCategory(category.key)
                return
              }

              if (openCategory === category.key) {
                setOpenCategory(null)
              }
            }}
          >
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 px-3 text-xs",
                  CATEGORY_PILL_SURFACE,
                  DESKTOP_INSPECTOR_FG_SECONDARY,
                  (isOpen || isSelectedCategory) &&
                    cn(
                      DESKTOP_INSPECTOR_SELECTED_CLASS,
                      "shadow-[var(--ws-shadow-rest)] hover:shadow-[var(--ws-shadow-hover)]",
                    ),
                )}
              >
                <CategoryIcon data-icon="inline-start" />
                {category.label}
                <ChevronDown
                  data-icon="inline-end"
                  className={cn("transition-transform duration-200", isOpen && "rotate-180")}
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              data-slot="hub-dropdown-menu"
              className={cn(
                CATEGORY_DROPDOWN_MENU_CLASS,
                "w-[22rem] max-w-[calc(100vw-2rem)]",
              )}
            >
              <DropdownMenuGroup className="grid gap-1 sm:grid-cols-2">
                {category.items.map((item) => {
                  const ItemIcon = item.icon
                  const isActive = activeInputType === item.value

                  return (
                    <DropdownMenuItem
                      key={item.value}
                      data-hub-item-active={isActive ? "" : undefined}
                      onSelect={() => {
                        onInputTypeChange(item.value)
                        setOpenCategory(null)
                      }}
                      className={cn(
                        DESKTOP_INSPECTOR_DROPDOWN_ITEM_CLASS,
                        "min-h-10 rounded-xl px-3 py-2",
                        isActive && DESKTOP_INSPECTOR_SELECTED_CLASS,
                      )}
                    >
                      <ItemIcon />
                      <span className="truncate">{item.label}</span>
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      })}
    </div>
  )
}
