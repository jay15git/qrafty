"use client"

import { cn } from "@/lib/utils"

interface LabelTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  containerClassName?: string
}

export function LabelTextarea({
  label = "",
  containerClassName,
  className,
  placeholder = "",
  rows = 2,
  ...props
}: LabelTextareaProps) {
  return (
    <div className={cn("group relative w-full", className, containerClassName)}>
      <textarea
        className="peer block w-full resize-y rounded-lg border px-3.5 py-2 text-sm outline-none text-primary focus:ring-2 dark:border-neutral-700/75 dark:bg-neutral-950 focus:ring-muted"
        placeholder={placeholder}
        rows={rows}
        {...props}
      />
      <label className="absolute block inset-y-0 px-2 bg-white dark:bg-neutral-950 text-sm left-[7px] h-fit text-nowrap my-auto -translate-y-[19px] peer-focus:-translate-y-[19px] text-muted-foreground pointer-events-none transition-transform will duration-200 scale-[.8] origin-top-left peer-placeholder-shown:scale-100 peer-focus:scale-[.8] peer-placeholder-shown:translate-y-0">
        {label}
      </label>
    </div>
  )
}
