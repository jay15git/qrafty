"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { Crop, Upload, UploadCloud, X } from "lucide-react"
import type React from "react"
import { useCallback, useEffect, useRef, useState } from "react"

interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

interface ImageDimensions {
  width: number
  height: number
}

interface CroppedImageData {
  url: string
  file: File
  metadata: ImageDimensions
}

const MAX_FILE_SIZE = 4 * 1024 * 1024
const SUPPORTED_FORMATS = ["image/jpeg", "image/png", "image/gif", "image/webp"]

function readFileAsDataUrl(file: File): Promise<string> {
  const { promise, resolve, reject } = Promise.withResolvers<string>()
  const reader = new FileReader()
  reader.onload = (event) => resolve(event.target?.result as string)
  reader.onerror = () => reject(new Error("Failed to read file"))
  reader.readAsDataURL(file)
  return promise
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  const { promise, resolve, reject } = Promise.withResolvers<HTMLImageElement>()
  const img = new Image()
  img.onload = () => resolve(img)
  img.onerror = () => reject(new Error("Invalid or corrupted image file"))
  img.src = src
  return promise
}

function formatMimeSubtype(format: string): string {
  const subtype = format.split("/")[1]
  return (subtype ?? format).toUpperCase()
}

function initialCropArea(
  imgRect: { width: number; height: number },
  fixedSize: { width: number; height: number } | undefined,
  aspectRatio: number | undefined,
): CropArea {
  const targetRatio = fixedSize
    ? fixedSize.width / fixedSize.height
    : aspectRatio
  let cropWidth = imgRect.width
  let cropHeight = imgRect.height

  if (targetRatio) {
    cropHeight = cropWidth / targetRatio
    if (cropHeight > imgRect.height) {
      cropHeight = imgRect.height
      cropWidth = cropHeight * targetRatio
    }
  }

  return {
    x: 0,
    y: (imgRect.height - cropHeight) / 2,
    width: cropWidth,
    height: cropHeight,
  }
}

function resizedCropArea(
  prev: CropArea,
  deltaX: number,
  deltaY: number,
  imgRect: { width: number; height: number },
  aspectRatio: number | undefined,
): CropArea {
  let newWidth = Math.max(50, prev.width + deltaX)
  let newHeight = Math.max(50, prev.height + deltaY)

  if (aspectRatio) {
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      newHeight = newWidth / aspectRatio
    } else {
      newWidth = newHeight * aspectRatio
    }
  }

  return {
    ...prev,
    width: Math.min(newWidth, imgRect.width - prev.x),
    height: Math.min(newHeight, imgRect.height - prev.y),
  }
}

function movedCropArea(
  prev: CropArea,
  deltaX: number,
  deltaY: number,
  imgRect: { width: number; height: number },
): CropArea {
  return {
    ...prev,
    x: Math.max(0, Math.min(imgRect.width - prev.width, prev.x + deltaX)),
    y: Math.max(0, Math.min(imgRect.height - prev.height, prev.y + deltaY)),
  }
}

function drawCropToCanvas(
  img: HTMLImageElement,
  canvas: HTMLCanvasElement,
  cropArea: CropArea,
  fixedSize: { width: number; height: number } | undefined,
) {
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Could not get canvas context")

  const imgRect = img.getBoundingClientRect()
  const scaleX = img.naturalWidth / imgRect.width
  const scaleY = img.naturalHeight / imgRect.height
  const outputWidth = fixedSize?.width || Math.round(cropArea.width * scaleX)
  const outputHeight = fixedSize?.height || Math.round(cropArea.height * scaleY)

  canvas.width = outputWidth
  canvas.height = outputHeight
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = "high"
  ctx.drawImage(
    img,
    Math.round(cropArea.x * scaleX),
    Math.round(cropArea.y * scaleY),
    Math.round(cropArea.width * scaleX),
    Math.round(cropArea.height * scaleY),
    0,
    0,
    outputWidth,
    outputHeight,
  )

  return { outputWidth, outputHeight }
}

function UploadTileIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16.44 8.90039C20.04 9.21039 21.51 11.0604 21.51 15.1104V15.2404C21.51 19.7104 19.72 21.5004 15.25 21.5004H8.73998C4.26998 21.5004 2.47998 19.7104 2.47998 15.2404V15.1104C2.47998 11.0904 3.92998 9.24039 7.46998 8.91039"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
      <path
        d="M12 15.0001V3.62012"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
      <path
        d="M15.3499 5.85L11.9999 2.5L8.6499 5.85"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
    </svg>
  )
}

interface ImageUploaderProps {
  imgClassName?: string
  onImageCropped?: (data: CroppedImageData) => void
  fixedSize?: { width: number; height: number }
  aspectRatio?: number
  className?: string
  dialogContentClassName?: string
  /** Applies /design inspector portal tokens to the crop dialog. */
  dialogTheme?: "light" | "dark"
  maxFileSize?: number
  supportedFormats?: string[]
  name?: string
  value?: string | File | null
  onChange?: (value: string | File | null) => void
  onBlur?: () => void
  error?: string
  disabled?: boolean
  placeholder?: string
  showFormatHint?: boolean
  compact?: boolean
  /** Square option-grid tile: plus empty state, no dashed frame. */
  tile?: boolean
}

function useImageCropper({
  onImageCropped,
  fixedSize,
  aspectRatio,
  maxFileSize = MAX_FILE_SIZE,
  supportedFormats = SUPPORTED_FORMATS,
  value,
  onChange,
  onBlur,
  disabled = false,
}: ImageUploaderProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const originalFileRef = useRef<File | null>(null)
  const [showCropDialog, setShowCropDialog] = useState(false)
  const [cropArea, setCropArea] = useState<CropArea>({
    x: 0,
    y: 0,
    width: 200,
    height: 200,
  })
  const [isDragging, setIsDragging] = useState(false)
  const isResizingRef = useRef(false)
  const dragStartRef = useRef({ x: 0, y: 0 })

  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const cropContainerRef = useRef<HTMLDivElement>(null)

  const maxFileSizeMb = Math.round(maxFileSize / (1024 * 1024))

  // Sync the preview with the controlled `value` prop by adjusting state
  // during render instead of in an effect.
  const [prevSynced, setPrevSynced] = useState<{
    value: string | File | null | undefined
    croppedImageUrl: string | null
  } | null>(null)
  if (
    prevSynced === null ||
    prevSynced.value !== value ||
    prevSynced.croppedImageUrl !== croppedImageUrl
  ) {
    setPrevSynced({ value, croppedImageUrl })
    if (value && typeof value === "string" && value !== croppedImageUrl) {
      setCroppedImageUrl(value)
    } else if (!value) {
      setCroppedImageUrl(null)
    }
  }

  const validateFile = useCallback(
    (file: File): string | null => {
      if (!supportedFormats.includes(file.type)) {
        return `Unsupported file format. Please use: ${supportedFormats
          .map(formatMimeSubtype)
          .join(", ")}`
      }

      if (file.size > maxFileSize) {
        return `File size too large. Maximum size is ${maxFileSizeMb}MB`
      }

      return null
    },
    [supportedFormats, maxFileSize, maxFileSizeMb],
  )

  const checkImageDimensions = useCallback(
    (img: HTMLImageElement): boolean => {
      if (!fixedSize) return false
      return (
        img.naturalWidth === fixedSize.width && img.naturalHeight === fixedSize.height
      )
    },
    [fixedSize],
  )

  const resetFileInput = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [])

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (disabled) return

      setValidationError(null)
      setIsProcessing(true)

      try {
        const nextValidationError = validateFile(file)
        if (nextValidationError) {
          setValidationError(nextValidationError)
          resetFileInput()
          return
        }

        const imageUrl = await readFileAsDataUrl(file)
        setSelectedImage(imageUrl)
        originalFileRef.current = file

        try {
          const tempImg = await loadImageElement(imageUrl)
          if (checkImageDimensions(tempImg)) {
            setCroppedImageUrl(imageUrl)
            onChange?.(file)
            onImageCropped?.({
              url: imageUrl,
              file,
              metadata: {
                width: tempImg.naturalWidth,
                height: tempImg.naturalHeight,
              },
            })
            onBlur?.()
          } else {
            setShowCropDialog(true)
          }
        } catch {
          setValidationError("Invalid or corrupted image file")
          resetFileInput()
        }
      } catch (processingError) {
        console.error("File processing error:", processingError)
        setValidationError(
          processingError instanceof Error && processingError.message === "Failed to read file"
            ? "Failed to read file"
            : "An error occurred while processing the file",
        )
        resetFileInput()
      } finally {
        setIsProcessing(false)
      }
    },
    [
      disabled,
      validateFile,
      checkImageDimensions,
      onChange,
      onImageCropped,
      onBlur,
      resetFileInput,
    ],
  )

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      setIsDragging(false)

      if (disabled) return

      const files = Array.from(event.dataTransfer.files)
      if (files.length > 0) {
        handleFileSelect(files[0])
      }
    },
    [handleFileSelect, disabled],
  )

  const handleDragOver = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      if (!disabled) {
        setIsDragging(true)
      }
    },
    [disabled],
  )

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(false)
  }, [])

  const handleImageLoad = useCallback(() => {
    if (imageRef.current && cropContainerRef.current) {
      setCropArea(
        initialCropArea(
          imageRef.current.getBoundingClientRect(),
          fixedSize,
          aspectRatio,
        ),
      )
    }
  }, [fixedSize, aspectRatio])

  const handleMouseDown = useCallback(
    (event: React.MouseEvent, type: "move" | "resize") => {
      event.preventDefault()
      event.stopPropagation()

      if (fixedSize && type === "resize") return

      dragStartRef.current = { x: event.clientX, y: event.clientY }
      if (type === "move") {
        setIsDragging(true)
      } else {
        isResizingRef.current = true
      }
    },
    [fixedSize],
  )

  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (!isDragging && !isResizingRef.current) return
      if (!cropContainerRef.current || !imageRef.current) return

      requestAnimationFrame(() => {
        const deltaX = event.clientX - dragStartRef.current.x
        const deltaY = event.clientY - dragStartRef.current.y
        const imgRect = imageRef.current!.getBoundingClientRect()

        if (isDragging) {
          setCropArea((prev) => movedCropArea(prev, deltaX, deltaY, imgRect))
        } else if (isResizingRef.current) {
          setCropArea((prev) => resizedCropArea(prev, deltaX, deltaY, imgRect, aspectRatio))
        }

        dragStartRef.current = { x: event.clientX, y: event.clientY }
      })
    },
    [isDragging, aspectRatio],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    isResizingRef.current = false
  }, [])

  const blobToFile = useCallback((blob: Blob, filename: string): File => {
    return new File([blob], filename, { type: blob.type })
  }, [])

  const cropImage = useCallback(async () => {
    const originalFile = originalFileRef.current
    if (!imageRef.current || !canvasRef.current || !originalFile) return

    setIsProcessing(true)

    try {
      const canvas = canvasRef.current
      const { outputWidth, outputHeight } = drawCropToCanvas(
        imageRef.current,
        canvas,
        cropArea,
        fixedSize,
      )

      setTimeout(() => {
        const nextCroppedImageUrl = canvas.toDataURL("image/jpeg", 0.9)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const croppedFile = blobToFile(blob, `cropped-${originalFile.name}`)

              setCroppedImageUrl(nextCroppedImageUrl)
              onChange?.(croppedFile)
              onImageCropped?.({
                url: nextCroppedImageUrl,
                file: croppedFile,
                metadata: { width: outputWidth, height: outputHeight },
              })
              setShowCropDialog(false)
              onBlur?.()
            }
            setIsProcessing(false)
          },
          "image/jpeg",
          0.9,
        )
      }, 0)
    } catch (cropError) {
      console.error("Error cropping image:", cropError)
      setValidationError("Failed to crop image. Please try again.")
      setIsProcessing(false)
    }
  }, [
    cropArea,
    fixedSize,
    onImageCropped,
    onChange,
    onBlur,
    blobToFile,
  ])

  const handleRemoveImage = useCallback(() => {
    if (croppedImageUrl && croppedImageUrl.startsWith("blob:")) {
      URL.revokeObjectURL(croppedImageUrl)
    }

    setCroppedImageUrl(null)
    setValidationError(null)
    onChange?.(null)
    onBlur?.()
    resetFileInput()
  }, [croppedImageUrl, onChange, onBlur, resetFileInput])

  const handleDialogClose = useCallback(
    (open: boolean) => {
      if (!open) {
        setShowCropDialog(false)

        if (selectedImage && selectedImage.startsWith("blob:")) {
          URL.revokeObjectURL(selectedImage)
        }

        setSelectedImage(null)
        originalFileRef.current = null
        setValidationError(null)
        resetFileInput()
      }
    },
    [selectedImage, resetFileInput],
  )

  const handleFileInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) {
        handleFileSelect(file)
      }
    },
    [handleFileSelect],
  )

  useEffect(() => {
    return () => {
      if (
        croppedImageUrl &&
        croppedImageUrl.startsWith("blob:") &&
        croppedImageUrl !== value
      ) {
        URL.revokeObjectURL(croppedImageUrl)
      }
      if (
        selectedImage &&
        selectedImage.startsWith("blob:") &&
        selectedImage !== value
      ) {
        URL.revokeObjectURL(selectedImage)
      }
    }
  }, [croppedImageUrl, selectedImage, value])

  return {
    selectedImage,
    showCropDialog,
    cropArea,
    isDragging,
    croppedImageUrl,
    validationError,
    isProcessing,
    maxFileSizeMb,
    fileInputRef,
    canvasRef,
    imageRef,
    cropContainerRef,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleImageLoad,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    cropImage,
    handleRemoveImage,
    handleDialogClose,
    handleFileInputChange,
  }
}

export function ImageCropper({
  onImageCropped,
  fixedSize,
  aspectRatio,
  className,
  dialogContentClassName,
  dialogTheme,
  maxFileSize = MAX_FILE_SIZE,
  supportedFormats = SUPPORTED_FORMATS,
  value,
  onChange,
  onBlur,
  error,
  disabled = false,
  imgClassName,
  placeholder = "Drag and drop an image here, or click to select",
  showFormatHint = true,
  compact = false,
  tile = false,
}: ImageUploaderProps) {
  const {
    selectedImage,
    showCropDialog,
    cropArea,
    isDragging,
    croppedImageUrl,
    validationError,
    isProcessing,
    maxFileSizeMb,
    fileInputRef,
    canvasRef,
    imageRef,
    cropContainerRef,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleImageLoad,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    cropImage,
    handleRemoveImage,
    handleDialogClose,
    handleFileInputChange,
  } = useImageCropper({
    onImageCropped,
    fixedSize,
    aspectRatio,
    maxFileSize,
    supportedFormats,
    value,
    onChange,
    onBlur,
    disabled,
  })

  const displayError = error || validationError
  const currentAspectRatio =
    cropArea.width > 0 && cropArea.height > 0
      ? (cropArea.width / cropArea.height).toFixed(2)
      : "1.00"
  const usesDesktopTheme = Boolean(dialogTheme)
  const previewSurfaceClass =
    compact && dialogTheme === "dark"
      ? "bg-black"
      : compact && dialogTheme === "light"
        ? "bg-white"
        : "bg-background"

  return (
    <>
      <ImageDropzone
        className={className}
        compact={compact}
        croppedImageUrl={croppedImageUrl}
        dialogTheme={dialogTheme}
        disabled={disabled}
        displayError={displayError}
        fileInputRef={fileInputRef}
        imgClassName={imgClassName}
        isDragging={isDragging}
        isProcessing={isProcessing}
        maxFileSizeMb={maxFileSizeMb}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onFileInputChange={handleFileInputChange}
        onRemoveImage={handleRemoveImage}
        placeholder={placeholder}
        previewSurfaceClass={previewSurfaceClass}
        showFormatHint={showFormatHint}
        supportedFormats={supportedFormats}
        tile={tile}
        validationError={validationError}
      />

      <CropperDialog
        aspectRatio={aspectRatio}
        canvasRef={canvasRef}
        cropArea={cropArea}
        cropContainerRef={cropContainerRef}
        currentAspectRatio={currentAspectRatio}
        dialogContentClassName={dialogContentClassName}
        dialogTheme={dialogTheme}
        fixedSize={fixedSize}
        imageRef={imageRef}
        isProcessing={isProcessing}
        onCrop={cropImage}
        onDialogOpenChange={handleDialogClose}
        onImageLoad={handleImageLoad}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        open={showCropDialog}
        selectedImage={selectedImage}
        usesDesktopTheme={usesDesktopTheme}
      />
    </>
  )
}

function CropOverlay({
  aspectRatio,
  cropArea,
  currentAspectRatio,
  fixedSize,
  onMouseDown,
  usesDesktopTheme,
}: {
  aspectRatio?: number
  cropArea: CropArea
  currentAspectRatio: string
  fixedSize?: { width: number; height: number }
  onMouseDown: (event: React.MouseEvent, type: "move" | "resize") => void
  usesDesktopTheme: boolean
}) {
  return (
    <div
      role="group"
      className={cn(
        "absolute border-2 border-primary bg-primary/10",
        fixedSize ? "cursor-default" : "cursor-move",
      )}
      style={{
        left: cropArea.x,
        top: cropArea.y,
        width: cropArea.width,
        height: cropArea.height,
      }}
      onMouseDown={(event) => onMouseDown(event, "move")}
    >
      {!fixedSize ? (
        <div
          role="group"
          className="absolute right-0 bottom-0 size-4 cursor-se-resize border border-primary-foreground bg-primary"
          onMouseDown={(event) => {
            event.stopPropagation()
            onMouseDown(event, "resize")
          }}
        />
      ) : null}

      <div
        className={cn(
          "absolute -top-8 left-0 rounded px-2 py-1 text-xs whitespace-nowrap",
          usesDesktopTheme
            ? "bg-[var(--dn-fg)] text-[var(--dn-bg)]"
            : "bg-primary text-primary-foreground",
        )}
      >
        {Math.round(cropArea.width)}×{Math.round(cropArea.height)}
        <span className="ml-2 opacity-75">{currentAspectRatio}:1</span>
        {aspectRatio ? (
          <span className="ml-1 opacity-75">
            (target: {aspectRatio.toFixed(2)}:1)
          </span>
        ) : null}
      </div>
    </div>
  )
}

function CropperDialogFooter({
  isProcessing,
  onCancel,
  onCrop,
  usesDesktopTheme,
}: {
  isProcessing: boolean
  onCancel: () => void
  onCrop: () => void
  usesDesktopTheme: boolean
}) {
  return (
    <DialogFooter
      className={cn(
        usesDesktopTheme
          ? "desktopnew-crop-dialog__footer gap-2 border-t border-[var(--dn-line)] p-[length:var(--dn-row-px)] sm:flex-row sm:justify-stretch sm:space-x-0"
          : undefined,
      )}
    >
      {usesDesktopTheme ? (
        <>
          <button
            className="dn-control-surface dn-pressable-subtle dn-squircle-sm flex h-[length:var(--dn-control-height)] flex-1 items-center justify-center gap-2 text-[length:var(--dn-type-value)] font-medium tracking-[var(--dn-tracking-tight)] text-[var(--dn-fg)]"
            disabled={isProcessing}
            type="button"
            onClick={onCancel}
          >
            <X className="size-4" />
            Cancel
          </button>
          <button
            className="dn-settings-primary dn-control-surface dn-pressable-press-only dn-squircle-sm flex h-[length:var(--dn-control-height)] flex-1 items-center justify-center gap-2 text-[length:var(--dn-type-value)] font-medium tracking-[var(--dn-tracking-tight)]"
            disabled={isProcessing}
            type="button"
            onClick={onCrop}
          >
            <Crop className="size-4" />
            {isProcessing ? "Processing..." : "Crop Image"}
          </button>
        </>
      ) : (
        <>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isProcessing}
          >
            <X className="mr-2 size-4" />
            Cancel
          </Button>
          <Button onClick={onCrop} disabled={isProcessing}>
            <Crop className="mr-2 size-4" />
            {isProcessing ? "Processing..." : "Crop Image"}
          </Button>
        </>
      )}
    </DialogFooter>
  )
}

function CropperDialog({
  aspectRatio,
  canvasRef,
  cropArea,
  cropContainerRef,
  currentAspectRatio,
  dialogContentClassName,
  dialogTheme,
  fixedSize,
  imageRef,
  isProcessing,
  onCrop,
  onDialogOpenChange,
  onImageLoad,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  open,
  selectedImage,
  usesDesktopTheme,
}: {
  aspectRatio?: number
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  cropArea: CropArea
  cropContainerRef: React.RefObject<HTMLDivElement | null>
  currentAspectRatio: string
  dialogContentClassName?: string
  dialogTheme?: "light" | "dark"
  fixedSize?: { width: number; height: number }
  imageRef: React.RefObject<HTMLImageElement | null>
  isProcessing: boolean
  onCrop: () => void
  onDialogOpenChange: (open: boolean) => void
  onImageLoad: () => void
  onMouseDown: (event: React.MouseEvent, type: "move" | "resize") => void
  onMouseMove: (event: React.MouseEvent) => void
  onMouseUp: () => void
  open: boolean
  selectedImage: string | null
  usesDesktopTheme: boolean
}) {
  const handleDialogClose = onDialogOpenChange
  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogClose}>
        <DialogContent
          className={cn(
            usesDesktopTheme
              ? cn(
                  "desktopnew-crop-dialog dn-portal-surface desktopnew-popover-content",
                  "w-[min(calc(100vw-2rem),26rem)] max-w-none gap-0 overflow-hidden border-0 p-0 shadow-none outline-none dn-squircle-md",
                  dialogTheme === "dark" && "dark",
                )
              : "max-h-[90vh] w-fit max-w-7xl! overflow-hidden",
            dialogContentClassName,
          )}
          data-theme={dialogTheme}
        >
          <DialogHeader
            className={cn(
              usesDesktopTheme
                ? "desktopnew-crop-dialog__header gap-2 space-y-0 border-b border-[var(--dn-line)] px-[length:var(--dn-row-px)] py-3 text-left"
                : undefined,
            )}
          >
            <DialogTitle
              className={cn(
                "flex items-center gap-2",
                usesDesktopTheme &&
                  "text-[length:var(--dn-type-value)] font-semibold tracking-[var(--dn-tracking-tight)] text-[var(--dn-fg)]",
              )}
            >
              <Crop className={cn("size-5", usesDesktopTheme && "text-[var(--dn-muted)]")} />
              Crop Image
              {fixedSize ? (
                <Badge variant="secondary" className="ml-2">
                  {fixedSize.width}×{fixedSize.height}
                </Badge>
              ) : null}
              {aspectRatio && !fixedSize ? (
                <Badge variant="secondary" className="ml-2">
                  Ratio {aspectRatio.toFixed(2)}:1
                </Badge>
              ) : null}
            </DialogTitle>
          </DialogHeader>

          <div className={cn(usesDesktopTheme ? "desktopnew-crop-dialog__body p-[length:var(--dn-row-px)]" : "space-y-4")}>
            <div
              role="group"
              ref={cropContainerRef}
              className={cn(
                "relative overflow-hidden select-none",
                usesDesktopTheme
                  ? "desktopnew-crop-dialog__stage max-h-[min(60vh,28rem)] rounded-[var(--dn-radius-sm)] border border-[var(--dn-line)] bg-[var(--dn-control)]"
                  : "max-h-[80vh] rounded-lg border bg-muted/10",
              )}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
            >
              {selectedImage ? (
                <>
                  <img
                    ref={imageRef}
                    src={selectedImage}
                    alt="Crop preview"
                    className={cn(
                      "w-full max-w-full object-contain",
                      usesDesktopTheme ? "max-h-[min(60vh,28rem)]" : "max-h-[70vh]",
                    )}
                    onLoad={onImageLoad}
                    draggable={false}
                  />

                  <CropOverlay
                    aspectRatio={aspectRatio}
                    cropArea={cropArea}
                    currentAspectRatio={currentAspectRatio}
                    fixedSize={fixedSize}
                    onMouseDown={onMouseDown}
                    usesDesktopTheme={usesDesktopTheme}
                  />
                </>
              ) : null}
            </div>
          </div>

          <CropperDialogFooter
            isProcessing={isProcessing}
            onCancel={() => handleDialogClose(false)}
            onCrop={onCrop}
            usesDesktopTheme={usesDesktopTheme}
          />
        </DialogContent>
      </Dialog>

      <canvas ref={canvasRef} className="hidden" />
    </>
  )
}

function dropzoneRootClass({
  tile,
  compact,
  previewSurfaceClass,
  disabled,
  isDragging,
  displayError,
  className,
}: {
  tile: boolean
  compact: boolean
  previewSurfaceClass: string
  disabled: boolean
  isDragging: boolean
  displayError: string | null
  className?: string
}) {
  return cn(
    "group overflow-hidden text-center transition-colors",
    tile
      ? "size-full border-0 bg-transparent"
      : "rounded-lg border-2 border-dashed",
    !tile && (compact ? "aspect-square w-full" : "h-52"),
    !tile && previewSurfaceClass,
    disabled
      ? "cursor-not-allowed border-muted-foreground/10"
      : "cursor-pointer",
    !disabled && isDragging
      ? "border-primary"
      : "border-muted-foreground/25 hover:border-primary/50",
    displayError && "border-destructive",
    className,
  )
}

function previewImageClass({
  tile,
  compact,
  previewSurfaceClass,
  imgClassName,
}: {
  tile: boolean
  compact: boolean
  previewSurfaceClass: string
  imgClassName?: string
}) {
  return cn(
    tile || compact
      ? "size-full object-cover"
      : "h-[204px] w-full rounded-lg object-cover",
    !tile && previewSurfaceClass,
    imgClassName,
  )
}

function removeButtonClass({
  tile,
  compact,
  dialogTheme,
}: {
  tile: boolean
  compact: boolean
  dialogTheme?: "light" | "dark"
}) {
  return cn(
    "rounded-full backdrop-blur-sm",
    tile ? "pointer-events-auto size-6" : "size-8",
    compact && dialogTheme === "dark"
      ? "bg-black/70 text-white hover:bg-black/85"
      : compact && dialogTheme === "light"
        ? "bg-white/85 text-black hover:bg-white"
        : "bg-background/80 hover:bg-background",
  )
}

function DropzonePreview({
  compact,
  croppedImageUrl,
  dialogTheme,
  disabled,
  imgClassName,
  onRemoveImage,
  previewSurfaceClass,
  tile,
}: {
  compact: boolean
  croppedImageUrl: string
  dialogTheme?: "light" | "dark"
  disabled: boolean
  imgClassName?: string
  onRemoveImage: () => void
  previewSurfaceClass: string
  tile: boolean
}) {
  return (
    <div className={cn("relative", compact ? "size-full" : undefined)}>
      <img
        src={croppedImageUrl}
        alt="Cropped upload preview"
        className={previewImageClass({
          tile,
          compact,
          previewSurfaceClass,
          imgClassName,
        })}
      />
      {!disabled && !tile ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          <UploadCloud className="size-8 text-white/80" />
        </div>
      ) : null}
      {!disabled ? (
        <div
          className={cn(
            "absolute",
            tile
              ? "inset-0 flex items-center justify-center pointer-events-none"
              : "top-2 right-2",
          )}
        >
          <Button
            variant="ghost"
            size="icon-md"
            type="button"
            aria-label="Remove cropped upload"
            className={removeButtonClass({ tile, compact, dialogTheme })}
            onClick={(event) => {
              event.stopPropagation()
              onRemoveImage()
            }}
          >
            <X className={cn(tile ? "size-3" : "size-4")} />
          </Button>
        </div>
      ) : null}
    </div>
  )
}

function emptyStateClass({ tile, compact }: { tile: boolean; compact: boolean }) {
  return cn(
    "relative w-full",
    tile
      ? "grid size-full place-items-center"
      : "flex flex-col items-center justify-center",
    !tile && (compact ? "size-full px-1.5 py-1.5" : "px-4 py-8"),
  )
}

function tileIconClass(disabled: boolean) {
  return cn(
    "grid size-full place-items-center dn-squircle-xs",
    disabled
      ? "bg-[color-mix(in_srgb,var(--dn-muted)_20%,transparent)] text-[var(--dn-muted)]"
      : "bg-[color-mix(in_srgb,var(--dn-muted)_38%,transparent)] text-[var(--dn-fg)] transition-colors group-hover:bg-[color-mix(in_srgb,var(--dn-muted)_55%,transparent)]",
  )
}

function uploadIconClass({
  compact,
  disabled,
}: {
  compact: boolean
  disabled: boolean
}) {
  return cn(
    compact ? "mb-1 size-7" : "mx-auto mb-4 size-12",
    disabled ? "text-muted-foreground/50" : "text-muted-foreground",
  )
}

function mutedTextClass({
  compact,
  disabled,
  base,
}: {
  compact: boolean
  disabled: boolean
  base: string
}) {
  return cn(
    base,
    compact ? "text-xs" : undefined,
    disabled ? "text-muted-foreground/50" : "text-muted-foreground",
  )
}

function formatHintText({
  compact,
  supportedFormats,
  maxFileSizeMb,
}: {
  compact: boolean
  supportedFormats: string[]
  maxFileSizeMb: number
}) {
  const formats = supportedFormats.map(formatMimeSubtype).join(", ")
  return compact
    ? `${formats} · ${maxFileSizeMb} MB max`
    : `Supports ${formats} up to ${maxFileSizeMb} MB`
}

function DropzoneEmptyState({
  compact,
  disabled,
  isProcessing,
  maxFileSizeMb,
  placeholder,
  showFormatHint,
  supportedFormats,
  tile,
  validationError,
}: {
  compact: boolean
  disabled: boolean
  isProcessing: boolean
  maxFileSizeMb: number
  placeholder?: string
  showFormatHint: boolean
  supportedFormats: string[]
  tile: boolean
  validationError: string | null
}) {
  return (
    <div className={emptyStateClass({ tile, compact })}>
      {tile ? (
        <span aria-hidden className={tileIconClass(disabled)}>
          <UploadTileIcon className="size-4" />
        </span>
      ) : (
        <Upload className={uploadIconClass({ compact, disabled })} />
      )}
      {!tile && placeholder ? (
        <p
          className={mutedTextClass({
            compact,
            disabled,
            base: compact ? "" : "mb-2 line-clamp-2 text-sm",
          })}
        >
          {isProcessing ? "Processing…" : placeholder}
        </p>
      ) : null}
      {!tile && showFormatHint ? (
        <p className={mutedTextClass({ compact, disabled, base: "line-clamp-1 text-xs" })}>
          {formatHintText({ compact, supportedFormats, maxFileSizeMb })}
        </p>
      ) : null}
      {validationError ? (
        <p className="mt-2 text-xs text-destructive">{validationError}</p>
      ) : null}
    </div>
  )
}

function ImageDropzone({
  className,
  compact,
  croppedImageUrl,
  dialogTheme,
  disabled,
  displayError,
  fileInputRef,
  imgClassName,
  isDragging,
  isProcessing,
  maxFileSizeMb,
  onDragLeave,
  onDragOver,
  onDrop,
  onFileInputChange,
  onRemoveImage,
  placeholder,
  previewSurfaceClass,
  showFormatHint,
  supportedFormats,
  tile,
  validationError,
}: {
  className?: string
  compact: boolean
  croppedImageUrl: string | null
  dialogTheme?: "light" | "dark"
  disabled: boolean
  displayError: string | null
  fileInputRef: React.RefObject<HTMLInputElement | null>
  imgClassName?: string
  isDragging: boolean
  isProcessing: boolean
  maxFileSizeMb: number
  onDragLeave: (event: React.DragEvent) => void
  onDragOver: (event: React.DragEvent) => void
  onDrop: (event: React.DragEvent) => void
  onFileInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveImage: () => void
  placeholder?: string
  previewSurfaceClass: string
  showFormatHint: boolean
  supportedFormats: string[]
  tile: boolean
  validationError: string | null
}) {
  const isInteractive = !disabled && !isProcessing
  return (
    <div
      className={dropzoneRootClass({
        tile,
        compact,
        previewSurfaceClass,
        disabled,
        isDragging,
        displayError,
        className,
      })}
    >
        <div
          role="group"
          className={cn(tile || compact ? "size-full min-h-0" : undefined)}
          tabIndex={isInteractive ? 0 : undefined}
          onDrop={!disabled ? onDrop : undefined}
          onDragOver={!disabled ? onDragOver : undefined}
          onDragLeave={!disabled ? onDragLeave : undefined}
          onClick={
            isInteractive
              ? () => fileInputRef.current?.click()
              : undefined
          }
          onKeyDown={
            isInteractive
              ? (event) => {
                  if (
                    event.target === event.currentTarget &&
                    (event.key === "Enter" || event.key === " ")
                  ) {
                    event.preventDefault()
                    fileInputRef.current?.click()
                  }
                }
              : undefined
          }
        >
          {croppedImageUrl ? (
            <DropzonePreview
              compact={compact}
              croppedImageUrl={croppedImageUrl}
              dialogTheme={dialogTheme}
              disabled={disabled}
              imgClassName={imgClassName}
              onRemoveImage={onRemoveImage}
              previewSurfaceClass={previewSurfaceClass}
              tile={tile}
            />
          ) : (
            <DropzoneEmptyState
              compact={compact}
              disabled={disabled}
              isProcessing={isProcessing}
              maxFileSizeMb={maxFileSizeMb}
              placeholder={placeholder}
              showFormatHint={showFormatHint}
              supportedFormats={supportedFormats}
              tile={tile}
              validationError={validationError}
            />
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={supportedFormats.join(",")}
          className="hidden"
          disabled={disabled || isProcessing}
          onChange={onFileInputChange}
        />
      </div>
  )
}
