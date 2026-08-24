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

interface ImageUploaderProps {
  imgClassName?: string
  onImageCropped?: (data: CroppedImageData) => void
  fixedSize?: { width: number; height: number }
  aspectRatio?: number
  className?: string
  dialogContentClassName?: string
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
}

export function ImageCropper({
  onImageCropped,
  fixedSize,
  aspectRatio,
  className,
  dialogContentClassName,
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
}: ImageUploaderProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [originalFile, setOriginalFile] = useState<File | null>(null)
  const [showCropDialog, setShowCropDialog] = useState(false)
  const [cropArea, setCropArea] = useState<CropArea>({
    x: 0,
    y: 0,
    width: 200,
    height: 200,
  })
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const cropContainerRef = useRef<HTMLDivElement>(null)

  const maxFileSizeMb = Math.round(maxFileSize / (1024 * 1024))

  useEffect(() => {
    if (value && typeof value === "string" && value !== croppedImageUrl) {
      setCroppedImageUrl(value)
    }
    if (!value) {
      setCroppedImageUrl(null)
    }
  }, [value, croppedImageUrl])

  const validateFile = useCallback(
    (file: File): string | null => {
      if (!supportedFormats.includes(file.type)) {
        return `Unsupported file format. Please use: ${supportedFormats
          .map((format) => format.split("/")[1].toUpperCase())
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
          setIsProcessing(false)
          resetFileInput()
          return
        }

        const reader = new FileReader()
        reader.onload = (event) => {
          const imageUrl = event.target?.result as string
          setSelectedImage(imageUrl)
          setOriginalFile(file)

          const tempImg = new Image()
          tempImg.onload = () => {
            if (checkImageDimensions(tempImg)) {
              const nextCroppedImageUrl = imageUrl
              setCroppedImageUrl(nextCroppedImageUrl)
              onChange?.(file)
              onImageCropped?.({
                url: nextCroppedImageUrl,
                file,
                metadata: {
                  width: tempImg.naturalWidth,
                  height: tempImg.naturalHeight,
                },
              })
              onBlur?.()
              setIsProcessing(false)
            } else {
              setShowCropDialog(true)
              setIsProcessing(false)
            }
          }
          tempImg.onerror = () => {
            setValidationError("Invalid or corrupted image file")
            setIsProcessing(false)
            resetFileInput()
          }
          tempImg.src = imageUrl
        }
        reader.onerror = () => {
          setValidationError("Failed to read file")
          setIsProcessing(false)
          resetFileInput()
        }
        reader.readAsDataURL(file)
      } catch (processingError) {
        console.error("File processing error:", processingError)
        setValidationError("An error occurred while processing the file")
        setIsProcessing(false)
        resetFileInput()
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
      const img = imageRef.current
      const imgRect = img.getBoundingClientRect()

      let cropWidth = imgRect.width
      let cropHeight = imgRect.height

      if (fixedSize) {
        const targetRatio = fixedSize.width / fixedSize.height
        cropHeight = cropWidth / targetRatio

        if (cropHeight > imgRect.height) {
          cropHeight = imgRect.height
          cropWidth = cropHeight * targetRatio
        }
      } else if (aspectRatio) {
        cropHeight = cropWidth / aspectRatio

        if (cropHeight > imgRect.height) {
          cropHeight = imgRect.height
          cropWidth = cropHeight * aspectRatio
        }
      }

      setCropArea({
        x: 0,
        y: (imgRect.height - cropHeight) / 2,
        width: cropWidth,
        height: cropHeight,
      })
    }
  }, [fixedSize, aspectRatio])

  const handleMouseDown = useCallback(
    (event: React.MouseEvent, type: "move" | "resize") => {
      event.preventDefault()
      event.stopPropagation()

      if (fixedSize && type === "resize") return

      setDragStart({ x: event.clientX, y: event.clientY })
      if (type === "move") {
        setIsDragging(true)
      } else {
        setIsResizing(true)
      }
    },
    [fixedSize],
  )

  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (!isDragging && !isResizing) return
      if (!cropContainerRef.current || !imageRef.current) return

      requestAnimationFrame(() => {
        const deltaX = event.clientX - dragStart.x
        const deltaY = event.clientY - dragStart.y
        const imgRect = imageRef.current!.getBoundingClientRect()

        if (isDragging) {
          setCropArea((prev) => {
            const newX = Math.max(
              0,
              Math.min(imgRect.width - prev.width, prev.x + deltaX),
            )
            const newY = Math.max(
              0,
              Math.min(imgRect.height - prev.height, prev.y + deltaY),
            )
            return { ...prev, x: newX, y: newY }
          })
        } else if (isResizing) {
          setCropArea((prev) => {
            let newWidth = Math.max(50, prev.width + deltaX)
            let newHeight = Math.max(50, prev.height + deltaY)

            if (aspectRatio) {
              if (Math.abs(deltaX) > Math.abs(deltaY)) {
                newHeight = newWidth / aspectRatio
              } else {
                newWidth = newHeight * aspectRatio
              }
            }

            newWidth = Math.min(newWidth, imgRect.width - prev.x)
            newHeight = Math.min(newHeight, imgRect.height - prev.y)

            return { ...prev, width: newWidth, height: newHeight }
          })
        }

        setDragStart({ x: event.clientX, y: event.clientY })
      })
    },
    [isDragging, isResizing, dragStart, aspectRatio],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setIsResizing(false)
  }, [])

  const blobToFile = useCallback((blob: Blob, filename: string): File => {
    return new File([blob], filename, { type: blob.type })
  }, [])

  const cropImage = useCallback(async () => {
    if (!imageRef.current || !canvasRef.current || !originalFile) return

    setIsProcessing(true)

    try {
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("Could not get canvas context")

      const img = imageRef.current
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

      setTimeout(() => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const nextCroppedImageUrl = URL.createObjectURL(blob)
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
    originalFile,
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
        setOriginalFile(null)
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
      if (croppedImageUrl && croppedImageUrl.startsWith("blob:")) {
        URL.revokeObjectURL(croppedImageUrl)
      }
      if (selectedImage && selectedImage.startsWith("blob:")) {
        URL.revokeObjectURL(selectedImage)
      }
    }
  }, [croppedImageUrl, selectedImage])

  const displayError = error || validationError
  const currentAspectRatio =
    cropArea.width > 0 && cropArea.height > 0
      ? (cropArea.width / cropArea.height).toFixed(2)
      : "1.00"

  return (
    <>
      <div
        className={cn(
          "group overflow-hidden rounded-lg border-2 border-dashed bg-background text-center transition-colors",
          compact ? "h-28" : "h-52",
          disabled
            ? "cursor-not-allowed border-muted-foreground/10 bg-muted/5"
            : "cursor-pointer",
          !disabled && isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50",
          displayError && "border-destructive bg-destructive/5",
          className,
        )}
      >
        <div
          onDrop={!disabled ? handleDrop : undefined}
          onDragOver={!disabled ? handleDragOver : undefined}
          onDragLeave={!disabled ? handleDragLeave : undefined}
          onClick={
            !disabled && !isProcessing
              ? () => fileInputRef.current?.click()
              : undefined
          }
        >
          {croppedImageUrl ? (
            <div className="relative">
              <img
                src={croppedImageUrl}
                alt="Uploaded image"
                className={cn("h-[204px] w-full rounded-lg object-cover", imgClassName)}
              />
              {!disabled ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <UploadCloud className="size-8 text-white/80" />
                </div>
              ) : null}
              {!disabled ? (
                <Button
                  variant="ghost"
                  size="icon-md"
                  type="button"
                  className="absolute top-2 right-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
                  onClick={(event) => {
                    event.stopPropagation()
                    handleRemoveImage()
                  }}
                >
                  <X className="size-4" />
                </Button>
              ) : null}
            </div>
          ) : (
            <div
              className={cn(
                "relative flex w-full flex-1 flex-col items-center justify-center",
                compact ? "px-3 py-3" : "px-4 py-8",
              )}
            >
              <Upload
                className={cn(
                  compact ? "mb-1 size-7" : "mx-auto mb-4 size-12",
                  disabled ? "text-muted-foreground/50" : "text-muted-foreground",
                )}
              />
              {placeholder ? (
                <p
                  className={cn(
                    compact ? "text-xs" : "mb-2 line-clamp-2 text-sm",
                    disabled ? "text-muted-foreground/50" : "text-muted-foreground",
                  )}
                >
                  {isProcessing ? "Processing…" : placeholder}
                </p>
              ) : null}
              {showFormatHint ? (
                <p
                  className={cn(
                    "line-clamp-1 text-xs",
                    disabled ? "text-muted-foreground/50" : "text-muted-foreground",
                  )}
                >
                  {compact
                    ? `${supportedFormats
                        .map((format) => format.split("/")[1].toUpperCase())
                        .join(", ")} · ${maxFileSizeMb} MB max`
                    : `Supports ${supportedFormats
                        .map((format) => format.split("/")[1].toUpperCase())
                        .join(", ")} up to ${maxFileSizeMb} MB`}
                </p>
              ) : null}
              {validationError ? (
                <p className="mt-2 text-xs text-destructive">{validationError}</p>
              ) : null}
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={supportedFormats.join(",")}
          className="hidden"
          disabled={disabled || isProcessing}
          onChange={handleFileInputChange}
        />
      </div>

      <Dialog open={showCropDialog} onOpenChange={handleDialogClose}>
        <DialogContent
          className={cn(
            "max-h-[90vh] w-fit max-w-7xl! overflow-hidden",
            dialogContentClassName,
          )}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crop className="size-5" />
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

          <div className="space-y-4">
            <div
              ref={cropContainerRef}
              className="relative max-h-[80vh] overflow-hidden rounded-lg border bg-muted/10 select-none"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {selectedImage ? (
                <>
                  <img
                    ref={imageRef}
                    src={selectedImage}
                    alt="Crop preview"
                    className="max-h-[70vh] w-full max-w-full object-contain"
                    onLoad={handleImageLoad}
                    draggable={false}
                  />

                  <div
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
                    onMouseDown={(event) => handleMouseDown(event, "move")}
                  >
                    {!fixedSize ? (
                      <div
                        className="absolute right-0 bottom-0 size-4 cursor-se-resize border border-primary-foreground bg-primary"
                        onMouseDown={(event) => {
                          event.stopPropagation()
                          handleMouseDown(event, "resize")
                        }}
                      />
                    ) : null}

                    <div className="absolute -top-8 left-0 rounded bg-primary px-2 py-1 text-xs whitespace-nowrap text-primary-foreground">
                      {Math.round(cropArea.width)}×{Math.round(cropArea.height)}
                      <span className="ml-2 opacity-75">{currentAspectRatio}:1</span>
                      {aspectRatio ? (
                        <span className="ml-1 opacity-75">
                          (target: {aspectRatio.toFixed(2)}:1)
                        </span>
                      ) : null}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleDialogClose(false)}
              disabled={isProcessing}
            >
              <X className="mr-2 size-4" />
              Cancel
            </Button>
            <Button onClick={cropImage} disabled={isProcessing}>
              <Crop className="mr-2 size-4" />
              {isProcessing ? "Processing..." : "Crop Image"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <canvas ref={canvasRef} className="hidden" />
    </>
  )
}
