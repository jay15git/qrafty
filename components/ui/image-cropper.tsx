"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Crop, Upload, UploadCloud, X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageDimensions {
  width: number;
  height: number;
}

interface CroppedImageData {
  url: string;
  file: File;
  metadata: ImageDimensions;
}

const MAX_FILE_SIZE = 4 * 1024 * 1024;
const SUPPORTED_FORMATS = ["image/jpeg", "image/png", "image/gif", "image/webp"];

function readFileAsDataUrl(file: File): Promise<string> {
  const { promise, resolve, reject } = Promise.withResolvers<string>();
  const reader = new FileReader();
  reader.onload = (event) => resolve(event.target?.result as string);
  reader.onerror = () => reject(new Error("Failed to read file"));
  reader.readAsDataURL(file);
  return promise;
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  const { promise, resolve, reject } = Promise.withResolvers<HTMLImageElement>();
  const img = new Image();
  img.onload = () => resolve(img);
  img.onerror = () => reject(new Error("Invalid or corrupted image file"));
  img.src = src;
  return promise;
}

function formatMimeSubtype(format: string): string {
  const subtype = format.split("/")[1];
  return (subtype ?? format).toUpperCase();
}

function resizedCropArea(
  prev: CropArea,
  deltaX: number,
  deltaY: number,
  imgRect: { width: number; height: number },
): CropArea {
  return {
    ...prev,
    width: Math.min(Math.max(50, prev.width + deltaX), imgRect.width - prev.x),
    height: Math.min(Math.max(50, prev.height + deltaY), imgRect.height - prev.y),
  };
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
  };
}

function drawCropToCanvas(img: HTMLImageElement, canvas: HTMLCanvasElement, cropArea: CropArea) {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  const imgRect = img.getBoundingClientRect();
  const scaleX = img.naturalWidth / imgRect.width;
  const scaleY = img.naturalHeight / imgRect.height;
  const outputWidth = Math.round(cropArea.width * scaleX);
  const outputHeight = Math.round(cropArea.height * scaleY);

  canvas.width = outputWidth;
  canvas.height = outputHeight;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
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
  );

  return { outputWidth, outputHeight };
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
  );
}

interface ImageUploaderProps {
  onImageCropped?: (data: CroppedImageData) => void;
  className?: string;
  /** Applies /design settings portal tokens to the crop dialog. */
  dialogTheme?: "light" | "dark";
  maxFileSize?: number;
  value?: string | File | null;
  onChange?: (value: string | File | null) => void;
  placeholder?: string;
  showFormatHint?: boolean;
  compact?: boolean;
  /** Square option-grid tile: plus empty state, no dashed frame. */
  tile?: boolean;
}

function useImageCropper({
  onImageCropped,
  maxFileSize = MAX_FILE_SIZE,
  value,
  onChange,
}: ImageUploaderProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const originalFileRef = useRef<File | null>(null);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [cropArea, setCropArea] = useState<CropArea>({
    x: 0,
    y: 0,
    width: 200,
    height: 200,
  });
  const [isDragging, setIsDragging] = useState(false);
  const isResizingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const cropContainerRef = useRef<HTMLDivElement>(null);

  const maxFileSizeMb = Math.round(maxFileSize / (1024 * 1024));

  // Sync the preview with the controlled `value` prop by adjusting state
  // during render instead of in an effect.
  const [prevSynced, setPrevSynced] = useState<{
    value: string | File | null | undefined;
    croppedImageUrl: string | null;
  } | null>(null);
  if (
    prevSynced === null ||
    prevSynced.value !== value ||
    prevSynced.croppedImageUrl !== croppedImageUrl
  ) {
    setPrevSynced({ value, croppedImageUrl });
    if (value && typeof value === "string" && value !== croppedImageUrl) {
      setCroppedImageUrl(value);
    } else if (!value) {
      setCroppedImageUrl(null);
    }
  }

  const validateFile = useCallback(
    (file: File): string | null => {
      if (!SUPPORTED_FORMATS.includes(file.type)) {
        return `Unsupported file format. Please use: ${SUPPORTED_FORMATS.map(
          formatMimeSubtype,
        ).join(", ")}`;
      }

      if (file.size > maxFileSize) {
        return `File size too large. Maximum size is ${maxFileSizeMb}MB`;
      }

      return null;
    },
    [maxFileSize, maxFileSizeMb],
  );

  const resetFileInput = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleFileSelect = useCallback(
    async (file: File) => {
      setValidationError(null);
      setIsProcessing(true);

      try {
        const nextValidationError = validateFile(file);
        if (nextValidationError) {
          setValidationError(nextValidationError);
          resetFileInput();
          return;
        }

        const imageUrl = await readFileAsDataUrl(file);
        setSelectedImage(imageUrl);
        originalFileRef.current = file;

        try {
          await loadImageElement(imageUrl);
          setShowCropDialog(true);
        } catch {
          setValidationError("Invalid or corrupted image file");
          resetFileInput();
        }
      } catch (processingError) {
        console.error("File processing error:", processingError);
        setValidationError(
          processingError instanceof Error && processingError.message === "Failed to read file"
            ? "Failed to read file"
            : "An error occurred while processing the file",
        );
        resetFileInput();
      } finally {
        setIsProcessing(false);
      }
    },
    [validateFile, resetFileInput],
  );

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setIsDragging(false);

      const files = Array.from(event.dataTransfer.files);
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect],
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  const handleImageLoad = useCallback(() => {
    if (imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect();
      setCropArea({ x: 0, y: 0, width: rect.width, height: rect.height });
    }
  }, []);

  const handleMouseDown = useCallback((event: React.MouseEvent, type: "move" | "resize") => {
    event.preventDefault();
    event.stopPropagation();

    dragStartRef.current = { x: event.clientX, y: event.clientY };
    if (type === "move") {
      setIsDragging(true);
    } else {
      isResizingRef.current = true;
    }
  }, []);

  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (!isDragging && !isResizingRef.current) return;
      if (!cropContainerRef.current || !imageRef.current) return;

      requestAnimationFrame(() => {
        const deltaX = event.clientX - dragStartRef.current.x;
        const deltaY = event.clientY - dragStartRef.current.y;
        const imgRect = imageRef.current!.getBoundingClientRect();

        if (isDragging) {
          setCropArea((prev) => movedCropArea(prev, deltaX, deltaY, imgRect));
        } else if (isResizingRef.current) {
          setCropArea((prev) => resizedCropArea(prev, deltaX, deltaY, imgRect));
        }

        dragStartRef.current = { x: event.clientX, y: event.clientY };
      });
    },
    [isDragging],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    isResizingRef.current = false;
  }, []);

  const handleCropKeyDown = useCallback((event: React.KeyboardEvent, type: "move" | "resize") => {
    const deltas: Record<string, [number, number]> = {
      ArrowDown: [0, 1],
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
    };
    const delta = deltas[event.key];

    if (!delta || !imageRef.current) {
      return;
    }

    event.preventDefault();
    const magnitude = event.shiftKey ? 10 : 1;
    const imgRect = imageRef.current.getBoundingClientRect();

    if (type === "move") {
      setCropArea((prev) =>
        movedCropArea(prev, delta[0] * magnitude, delta[1] * magnitude, imgRect),
      );
    } else {
      setCropArea((prev) =>
        resizedCropArea(prev, delta[0] * magnitude, delta[1] * magnitude, imgRect),
      );
    }
  }, []);

  const cropImage = useCallback(async () => {
    const originalFile = originalFileRef.current;
    if (!imageRef.current || !canvasRef.current || !originalFile) return;

    setIsProcessing(true);

    try {
      const canvas = canvasRef.current;
      const { outputWidth, outputHeight } = drawCropToCanvas(imageRef.current, canvas, cropArea);

      setTimeout(() => {
        const nextCroppedImageUrl = canvas.toDataURL("image/jpeg", 0.9);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const croppedFile = new File([blob], `cropped-${originalFile.name}`, {
                type: blob.type,
              });

              setCroppedImageUrl(nextCroppedImageUrl);
              onChange?.(croppedFile);
              onImageCropped?.({
                url: nextCroppedImageUrl,
                file: croppedFile,
                metadata: { width: outputWidth, height: outputHeight },
              });
              setShowCropDialog(false);
            }
            setIsProcessing(false);
          },
          "image/jpeg",
          0.9,
        );
      }, 0);
    } catch (cropError) {
      console.error("Error cropping image:", cropError);
      setValidationError("Failed to crop image. Please try again.");
      setIsProcessing(false);
    }
  }, [cropArea, onImageCropped, onChange]);

  const handleRemoveImage = useCallback(() => {
    if (croppedImageUrl && croppedImageUrl.startsWith("blob:")) {
      URL.revokeObjectURL(croppedImageUrl);
    }

    setCroppedImageUrl(null);
    setValidationError(null);
    onChange?.(null);
    resetFileInput();
  }, [croppedImageUrl, onChange, resetFileInput]);

  const handleDialogClose = useCallback(
    (open: boolean) => {
      if (!open) {
        setShowCropDialog(false);

        if (selectedImage && selectedImage.startsWith("blob:")) {
          URL.revokeObjectURL(selectedImage);
        }

        setSelectedImage(null);
        originalFileRef.current = null;
        setValidationError(null);
        resetFileInput();
      }
    },
    [selectedImage, resetFileInput],
  );

  const handleFileInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect],
  );

  useEffect(() => {
    return () => {
      if (croppedImageUrl && croppedImageUrl.startsWith("blob:") && croppedImageUrl !== value) {
        URL.revokeObjectURL(croppedImageUrl);
      }
      if (selectedImage && selectedImage.startsWith("blob:") && selectedImage !== value) {
        URL.revokeObjectURL(selectedImage);
      }
    };
  }, [croppedImageUrl, selectedImage, value]);

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
    handleCropKeyDown,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    cropImage,
    handleRemoveImage,
    handleDialogClose,
    handleFileInputChange,
  };
}

export function ImageCropper({
  onImageCropped,
  className,
  dialogTheme,
  maxFileSize = MAX_FILE_SIZE,
  value,
  onChange,
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
    handleCropKeyDown,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    cropImage,
    handleRemoveImage,
    handleDialogClose,
    handleFileInputChange,
  } = useImageCropper({
    onImageCropped,
    maxFileSize,
    value,
    onChange,
  });

  const usesDesktopTheme = Boolean(dialogTheme);
  const previewSurfaceClass =
    compact && dialogTheme === "dark"
      ? "bg-black"
      : compact && dialogTheme === "light"
        ? "bg-white"
        : "bg-background";

  return (
    <>
      <ImageDropzone
        className={className}
        compact={compact}
        croppedImageUrl={croppedImageUrl}
        dialogTheme={dialogTheme}
        fileInputRef={fileInputRef}
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
        tile={tile}
        validationError={validationError}
      />

      <CropperDialog
        canvasRef={canvasRef}
        cropArea={cropArea}
        cropContainerRef={cropContainerRef}
        dialogTheme={dialogTheme}
        imageRef={imageRef}
        isProcessing={isProcessing}
        onCrop={cropImage}
        onDialogOpenChange={handleDialogClose}
        onImageLoad={handleImageLoad}
        onKeyDown={handleCropKeyDown}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        open={showCropDialog}
        selectedImage={selectedImage}
        usesDesktopTheme={usesDesktopTheme}
      />
    </>
  );
}

function CropOverlay({
  cropArea,
  onKeyDown,
  onMouseDown,
  usesDesktopTheme,
}: {
  cropArea: CropArea;
  onKeyDown: (event: React.KeyboardEvent, type: "move" | "resize") => void;
  onMouseDown: (event: React.MouseEvent, type: "move" | "resize") => void;
  usesDesktopTheme: boolean;
}) {
  return (
    <div
      aria-label={`Crop area, ${Math.round(cropArea.width)} by ${Math.round(cropArea.height)} pixels. Arrow keys move; hold Shift for larger steps.`}
      role="group"
      tabIndex={0}
      className={cn(
        "absolute cursor-move border-2 border-primary bg-primary/10",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
      )}
      style={{
        left: cropArea.x,
        top: cropArea.y,
        width: cropArea.width,
        height: cropArea.height,
      }}
      onKeyDown={(event) => onKeyDown(event, "move")}
      onMouseDown={(event) => onMouseDown(event, "move")}
    >
      <div
        aria-label="Resize crop area. Arrow keys resize; hold Shift for larger steps."
        role="button"
        tabIndex={0}
        className="absolute right-0 bottom-0 size-4 cursor-se-resize border border-primary-foreground bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        onKeyDown={(event) => {
          event.stopPropagation();
          onKeyDown(event, "resize");
        }}
        onMouseDown={(event) => {
          event.stopPropagation();
          onMouseDown(event, "resize");
        }}
      />

      <div
        className={cn(
          "absolute -top-8 left-0 rounded px-2 py-1 text-[length:var(--type-caption)] whitespace-nowrap",
          usesDesktopTheme
            ? "bg-[var(--fg)] text-[var(--bg)]"
            : "bg-primary text-primary-foreground",
        )}
      >
        {Math.round(cropArea.width)}×{Math.round(cropArea.height)}
      </div>
    </div>
  );
}

function CropperDialogFooter({
  isProcessing,
  onCancel,
  onCrop,
  usesDesktopTheme,
}: {
  isProcessing: boolean;
  onCancel: () => void;
  onCrop: () => void;
  usesDesktopTheme: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
        usesDesktopTheme &&
          "ds-crop-dialog__footer gap-2 border-t border-[var(--line)] p-[length:var(--row-px)] sm:flex-row sm:justify-stretch sm:space-x-0",
      )}
    >
      {usesDesktopTheme ? (
        <>
          <button
            className="ds-control-surface ds-pressable-subtle ds-squircle-sm flex h-[length:var(--control-height)] flex-1 items-center justify-center gap-2 text-[length:var(--type-value)] font-medium tracking-[var(--tracking-tight)] text-[var(--fg)]"
            disabled={isProcessing}
            type="button"
            onClick={onCancel}
          >
            <X className="size-4" />
            Cancel
          </button>
          <button
            className="ds-settings-primary ds-control-surface ds-pressable-press-only ds-squircle-sm flex h-[length:var(--control-height)] flex-1 items-center justify-center gap-2 text-[length:var(--type-value)] font-medium tracking-[var(--tracking-tight)]"
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
          <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
            <X className="mr-2 size-4" />
            Cancel
          </Button>
          <Button onClick={onCrop} disabled={isProcessing}>
            <Crop className="mr-2 size-4" />
            {isProcessing ? "Processing..." : "Crop Image"}
          </Button>
        </>
      )}
    </div>
  );
}

function CropperDialog({
  canvasRef,
  cropArea,
  cropContainerRef,
  dialogTheme,
  imageRef,
  isProcessing,
  onCrop,
  onDialogOpenChange,
  onImageLoad,
  onKeyDown,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  open,
  selectedImage,
  usesDesktopTheme,
}: {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  cropArea: CropArea;
  cropContainerRef: React.RefObject<HTMLDivElement | null>;
  dialogTheme?: "light" | "dark";
  imageRef: React.RefObject<HTMLImageElement | null>;
  isProcessing: boolean;
  onCrop: () => void;
  onDialogOpenChange: (open: boolean) => void;
  onImageLoad: () => void;
  onKeyDown: (event: React.KeyboardEvent, type: "move" | "resize") => void;
  onMouseDown: (event: React.MouseEvent, type: "move" | "resize") => void;
  onMouseMove: (event: React.MouseEvent) => void;
  onMouseUp: () => void;
  open: boolean;
  selectedImage: string | null;
  usesDesktopTheme: boolean;
}) {
  const handleDialogClose = onDialogOpenChange;
  return (
    <>
      <DialogPrimitive.Root open={open} onOpenChange={handleDialogClose}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay
            className={cn(
              "fixed inset-0 z-[var(--z-modal)] bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            )}
          />
          <DialogPrimitive.Content
            className={cn(
              "fixed top-[50%] left-[50%] z-[var(--z-modal)] grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-[var(--motion-ui)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg",
              usesDesktopTheme &&
                cn(
                  "ds-crop-dialog ds-portal-surface ds-popover-content",
                  "w-[min(calc(100vw-2rem),26rem)] max-w-none gap-0 overflow-hidden border-0 p-0 shadow-none outline-none ds-squircle-md",
                  dialogTheme === "dark" && "dark",
                ),
            )}
            data-theme={dialogTheme}
          >
            <div
              className={cn(
                "flex flex-col space-y-1.5 text-center sm:text-left",
                usesDesktopTheme &&
                  "ds-crop-dialog__header gap-2 space-y-0 border-b border-[var(--line)] px-[length:var(--row-px)] py-3 text-left",
              )}
            >
              <DialogPrimitive.Title
                className={cn(
                  "flex items-center gap-2 text-lg leading-none font-semibold tracking-tight",
                  usesDesktopTheme &&
                    "text-[length:var(--type-value)] font-semibold tracking-[var(--tracking-tight)] text-[var(--fg)]",
                )}
              >
                <Crop className={cn("size-5", usesDesktopTheme && "text-[var(--muted)]")} />
                Crop Image
              </DialogPrimitive.Title>
            </div>

            <div
              className={cn(
                usesDesktopTheme ? "ds-crop-dialog__body p-[length:var(--row-px)]" : "space-y-4",
              )}
            >
              <div
                role="group"
                ref={cropContainerRef}
                className={cn(
                  "relative overflow-hidden select-none",
                  usesDesktopTheme
                    ? "ds-crop-dialog__stage max-h-[min(60vh,28rem)] rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--control)]"
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
                      cropArea={cropArea}
                      onKeyDown={onKeyDown}
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

            <DialogPrimitive.Close className="absolute top-4 right-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
              <X className="size-4" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      <canvas ref={canvasRef} className="hidden" />
    </>
  );
}

function DropzonePreview({
  compact,
  croppedImageUrl,
  dialogTheme,
  onRemoveImage,
  previewSurfaceClass,
  tile,
}: {
  compact: boolean;
  croppedImageUrl: string;
  dialogTheme?: "light" | "dark";
  onRemoveImage: () => void;
  previewSurfaceClass: string;
  tile: boolean;
}) {
  return (
    <div className={cn("relative", compact ? "size-full" : undefined)}>
      <img
        src={croppedImageUrl}
        alt="Cropped upload preview"
        className={cn(
          tile || compact ? "size-full object-cover" : "h-[204px] w-full rounded-lg object-cover",
          !tile && previewSurfaceClass,
        )}
      />
      {!tile ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          <UploadCloud className="size-8 text-white/80" />
        </div>
      ) : null}
      <div
        className={cn(
          "absolute",
          tile ? "inset-0 flex items-center justify-center pointer-events-none" : "top-2 right-2",
        )}
      >
        <Button
          variant="ghost"
          size="icon-md"
          type="button"
          aria-label="Remove cropped upload"
          className={cn(
            "rounded-full",
            tile ? "pointer-events-auto size-6" : "size-8",
            compact && dialogTheme === "dark"
              ? "bg-black/70 text-white hover:bg-black/85"
              : compact && dialogTheme === "light"
                ? "bg-white/85 text-black hover:bg-white"
                : "bg-background/80 hover:bg-background",
          )}
          onClick={(event) => {
            event.stopPropagation();
            onRemoveImage();
          }}
        >
          <X className={cn(tile ? "size-3" : "size-4")} />
        </Button>
      </div>
    </div>
  );
}

function mutedTextClass({ compact, base }: { compact: boolean; base: string }) {
  return cn(base, compact ? "text-xs" : undefined, "text-muted-foreground");
}

function DropzoneEmptyState({
  compact,
  isProcessing,
  maxFileSizeMb,
  placeholder,
  showFormatHint,
  tile,
  validationError,
}: {
  compact: boolean;
  isProcessing: boolean;
  maxFileSizeMb: number;
  placeholder?: string;
  showFormatHint: boolean;
  tile: boolean;
  validationError: string | null;
}) {
  const formats = SUPPORTED_FORMATS.map(formatMimeSubtype).join(", ");
  return (
    <div
      className={cn(
        "relative w-full",
        tile ? "grid size-full place-items-center" : "flex flex-col items-center justify-center",
        !tile && (compact ? "size-full px-1.5 py-1.5" : "px-4 py-8"),
      )}
    >
      {tile ? (
        <span
          aria-hidden
          className="grid size-full place-items-center ds-squircle-xs bg-[color-mix(in_srgb,var(--muted)_38%,transparent)] text-[var(--fg)] transition-colors group-hover:bg-[color-mix(in_srgb,var(--muted)_55%,transparent)]"
        >
          <UploadTileIcon className="size-4" />
        </span>
      ) : (
        <Upload
          className={cn(compact ? "mb-1 size-7" : "mx-auto mb-4 size-12", "text-muted-foreground")}
        />
      )}
      {!tile && placeholder ? (
        <p
          className={mutedTextClass({
            compact,
            base: compact ? "" : "mb-2 line-clamp-2 text-[length:var(--type-body)]",
          })}
        >
          {isProcessing ? "Processing…" : placeholder}
        </p>
      ) : null}
      {!tile && showFormatHint ? (
        <p
          className={mutedTextClass({
            compact,
            base: "line-clamp-1 text-[length:var(--type-meta)]",
          })}
        >
          {compact
            ? `${formats} · ${maxFileSizeMb} MB max`
            : `Supports ${formats} up to ${maxFileSizeMb} MB`}
        </p>
      ) : null}
      {validationError ? (
        <p className="mt-2 text-[length:var(--type-caption)] text-destructive">{validationError}</p>
      ) : null}
    </div>
  );
}

function ImageDropzone({
  className,
  compact,
  croppedImageUrl,
  dialogTheme,
  fileInputRef,
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
  tile,
  validationError,
}: {
  className?: string;
  compact: boolean;
  croppedImageUrl: string | null;
  dialogTheme?: "light" | "dark";
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  isDragging: boolean;
  isProcessing: boolean;
  maxFileSizeMb: number;
  onDragLeave: (event: React.DragEvent) => void;
  onDragOver: (event: React.DragEvent) => void;
  onDrop: (event: React.DragEvent) => void;
  onFileInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: () => void;
  placeholder?: string;
  previewSurfaceClass: string;
  showFormatHint: boolean;
  tile: boolean;
  validationError: string | null;
}) {
  const isInteractive = !isProcessing;
  return (
    <div
      className={cn(
        "group overflow-hidden text-center transition-colors",
        tile ? "size-full border-0 bg-transparent" : "rounded-lg border-2 border-dashed",
        !tile && (compact ? "aspect-square w-full" : "h-52"),
        !tile && previewSurfaceClass,
        "cursor-pointer",
        isDragging ? "border-primary" : "border-muted-foreground/25 hover:border-primary/50",
        validationError && "border-destructive",
        className,
      )}
    >
      <div
        role="group"
        className={cn(tile || compact ? "size-full min-h-0" : undefined)}
        tabIndex={isInteractive ? 0 : undefined}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={isInteractive ? () => fileInputRef.current?.click() : undefined}
        onKeyDown={
          isInteractive
            ? (event) => {
                if (
                  event.target === event.currentTarget &&
                  (event.key === "Enter" || event.key === " ")
                ) {
                  event.preventDefault();
                  fileInputRef.current?.click();
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
            onRemoveImage={onRemoveImage}
            previewSurfaceClass={previewSurfaceClass}
            tile={tile}
          />
        ) : (
          <DropzoneEmptyState
            compact={compact}
            isProcessing={isProcessing}
            maxFileSizeMb={maxFileSizeMb}
            placeholder={placeholder}
            showFormatHint={showFormatHint}
            tile={tile}
            validationError={validationError}
          />
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={SUPPORTED_FORMATS.join(",")}
        className="hidden"
        disabled={isProcessing}
        onChange={onFileInputChange}
      />
    </div>
  );
}
