"use client";

import { Download02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { forwardRef, type ComponentPropsWithoutRef } from "react";

import { CUELUME_BUTTON } from "@/features/shell/audio/cuelume";
import { cn } from "@/lib/utils";

type DownloadButtonProps = Omit<ComponentPropsWithoutRef<"button">, "children">;

export const DownloadButton = forwardRef<HTMLButtonElement, DownloadButtonProps>(
  function DownloadButton({ className, onClick, type = "button", ...props }, ref) {
    return (
      <button
        ref={ref}
        aria-label="Download"
        className={cn(
          "relative grid size-9 shrink-0 cursor-pointer place-items-center rounded-full border-0 bg-transparent p-0 text-[var(--chrome-fg)] shadow-none transition-colors hover:text-[var(--chrome-button-hover-fg,currentColor)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--chrome-button-focus-ring)] motion-reduce:transition-none max-md:size-11",
          className,
        )}
        data-slot="download-trigger"
        type={type}
        onClick={onClick}
        {...CUELUME_BUTTON}
        {...props}
      >
        <HugeiconsIcon icon={Download02Icon} size={16} color="currentColor" strokeWidth={2} />
      </button>
    );
  },
);
