"use client";

/**
 * @author: @dorianbaffier
 * @description: File Upload
 * @version: 1.0.0
 * @date: 2025-06-26
 * @license: MIT
 * @website: https://kokonutui.com
 * @github: https://github.com/kokonut-labs/kokonutui
 */

import {
  type DragEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import {
  KokonutFileUploadDropzone,
  type FileError,
  type FileStatus,
} from "./file-upload-dropzone";

interface FileUploadProps {
  onUploadSuccess?: (file: File) => void;
  onUploadError?: (error: FileError) => void;
  acceptedFileTypes?: string[];
  maxFileSize?: number;
  currentFile?: File | null;
  onFileRemove?: () => void;
  /** Duration in milliseconds for the upload simulation. Defaults to 2000ms (2s), 0 for no simulation */
  uploadDelay?: number;
  validateFile?: (file: File) => FileError | null;
  className?: string;
}

const DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const EMPTY_ACCEPTED_FILE_TYPES: string[] = [];
const UPLOAD_STEP_SIZE = 5;
const FILE_SIZES = [
  "Bytes",
  "KB",
  "MB",
  "GB",
  "TB",
  "PB",
  "EB",
  "ZB",
  "YB",
] as const;

const formatBytes = (bytes: number, decimals = 2): string => {
  if (!+bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const unit = FILE_SIZES[i] || FILE_SIZES[FILE_SIZES.length - 1];
  return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${unit}`;
};

const matchesAcceptedFileType = (
  fileType: string,
  acceptedFileType: string,
): boolean => {
  const normalizedAcceptedType = acceptedFileType.toLowerCase();

  if (normalizedAcceptedType.endsWith("/*")) {
    const [acceptedGroup] = normalizedAcceptedType.split("/");
    const [fileGroup] = fileType.split("/");

    return acceptedGroup === fileGroup;
  }

  return fileType === normalizedAcceptedType;
};

export default function FileUpload({
  onUploadSuccess = () => {},
  onUploadError = () => {},
  acceptedFileTypes = EMPTY_ACCEPTED_FILE_TYPES,
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  currentFile: initialFile = null,
  onFileRemove = () => {},
  uploadDelay = 2000,
  validateFile = () => null,
  className,
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(initialFile);
  const [status, setStatus] = useState<FileStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<FileError | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const onUploadSuccessRef = useRef(onUploadSuccess);
  const onUploadErrorRef = useRef(onUploadError);
  const onFileRemoveRef = useRef(onFileRemove);
  const validateFileRef = useRef(validateFile);

  useLayoutEffect(() => {
    onUploadSuccessRef.current = onUploadSuccess;
    onUploadErrorRef.current = onUploadError;
    onFileRemoveRef.current = onFileRemove;
    validateFileRef.current = validateFile;
  });

  useEffect(
    () => () => {
      if (uploadIntervalRef.current) {
        clearInterval(uploadIntervalRef.current);
      }
    },
    [],
  );

  const validateFileSize = useCallback(
    (file: File): FileError | null => {
      if (file.size > maxFileSize) {
        return {
          message: `File size exceeds ${formatBytes(maxFileSize)}`,
          code: "FILE_TOO_LARGE",
        };
      }
      return null;
    },
    [maxFileSize],
  );

  const validateFileType = useCallback(
    (file: File): FileError | null => {
      if (!acceptedFileTypes?.length) return null;

      const fileType = file.type.toLowerCase();
      if (
        !acceptedFileTypes.some((type) =>
          matchesAcceptedFileType(fileType, type),
        )
      ) {
        return {
          message: `File type must be ${acceptedFileTypes.join(", ")}`,
          code: "INVALID_FILE_TYPE",
        };
      }
      return null;
    },
    [acceptedFileTypes],
  );

  const handleError = useCallback((error: FileError) => {
    setError(error);
    setStatus("error");
    onUploadErrorRef.current?.(error);

    setTimeout(() => {
      setError(null);
      setStatus("idle");
    }, 3000);
  }, []);

  const simulateUpload = useCallback(
    (uploadingFile: File) => {
      let currentProgress = 0;

      if (uploadIntervalRef.current) {
        clearInterval(uploadIntervalRef.current);
      }

      uploadIntervalRef.current = setInterval(
        () => {
          currentProgress += UPLOAD_STEP_SIZE;
          if (currentProgress >= 100) {
            if (uploadIntervalRef.current) {
              clearInterval(uploadIntervalRef.current);
            }
            setProgress(0);
            setStatus("idle");
            setFile(null);
            onUploadSuccessRef.current?.(uploadingFile);
          } else {
            setProgress(currentProgress);
          }
        },
        uploadDelay / (100 / UPLOAD_STEP_SIZE),
      );
    },
    [uploadDelay],
  );

  const handleFileSelect = useCallback(
    (selectedFile: File | null) => {
      if (!selectedFile) return;

      setError(null);

      const sizeError = validateFileSize(selectedFile);
      if (sizeError) {
        handleError(sizeError);
        return;
      }

      const typeError = validateFileType(selectedFile);
      if (typeError) {
        handleError(typeError);
        return;
      }

      const customError = validateFileRef.current?.(selectedFile);
      if (customError) {
        handleError(customError);
        return;
      }

      setFile(selectedFile);
      setStatus("uploading");
      setProgress(0);
      simulateUpload(selectedFile);
    },
    [simulateUpload, validateFileSize, validateFileType, handleError],
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setStatus((prev) => (prev !== "uploading" ? "dragging" : prev));
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setStatus((prev) => (prev === "dragging" ? "idle" : prev));
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (status === "uploading") return;
      setStatus("idle");
      const droppedFile = e.dataTransfer.files?.[0];
      if (droppedFile) handleFileSelect(droppedFile);
    },
    [status, handleFileSelect],
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      handleFileSelect(selectedFile || null);
      if (e.target) e.target.value = "";
    },
    [handleFileSelect],
  );

  const triggerFileInput = useCallback(() => {
    if (status === "uploading") return;
    fileInputRef.current?.click();
  }, [status]);

  const resetState = useCallback(() => {
    setFile(null);
    setStatus("idle");
    setProgress(0);
    if (onFileRemoveRef.current) onFileRemoveRef.current();
  }, []);

  return (
    <aside
      aria-label="File upload"
      className={cn("relative mx-auto w-full max-w-sm", className || "")}
    >
      <KokonutFileUploadDropzone
        status={status}
        progress={progress}
        file={file}
        error={error}
        acceptedFileTypes={acceptedFileTypes}
        maxFileSize={maxFileSize}
        formatBytes={formatBytes}
        fileInputRef={fileInputRef}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onFileInputChange={handleFileInputChange}
        onTriggerFileInput={triggerFileInput}
        onReset={resetState}
      />
    </aside>
  );
}

FileUpload.displayName = "FileUpload";
