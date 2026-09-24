import type { MutableRefObject } from "react";

import type { QrFileExtension } from "@/features/qr/model/types";
import { createDefaultQraftyState } from "@/features/qr/model/state";

export const DEFAULT_DRAFTING_STUDIO_STATE = createDefaultQraftyState();

export const DEFAULT_DRAFTING_PANE_QR_SIZE = 240;
export const DRAFTING_LAYER_PASTE_OFFSET = 24;
export const DEFAULT_DOWNLOAD_NAME = "qrafty";
const DRAFTING_DOWNLOAD_EXTENSIONS = [
  "svg",
  "png",
  "webp",
  "jpeg",
] as const satisfies ReadonlyArray<QrFileExtension>;

export function replaceTrackedObjectUrl(
  trackedUrlRef: MutableRefObject<string | null>,
  file: Blob,
  onObjectUrlChange: (nextUrl: string) => void,
) {
  // react-doctor-disable-next-line react-doctor/no-create-object-url-without-revoke -- the caller revokes it via the logoUploadObjectUrl effect cleanup
  const nextUrl = URL.createObjectURL(file);
  trackedUrlRef.current = nextUrl;
  onObjectUrlChange(nextUrl);
  return nextUrl;
}

export type CanvasDownloadExtension = (typeof DRAFTING_DOWNLOAD_EXTENSIONS)[number];
