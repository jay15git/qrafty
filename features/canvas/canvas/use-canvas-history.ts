"use client";

import { useEffect, useRef, useState, type MutableRefObject } from "react";

import {
  cloneCanvasWorkspaceDocument,
  serializeCanvasWorkspaceDocument,
  type CanvasWorkspaceDocument,
} from "@/features/canvas/model/document";
import { previewSession } from "@/features/canvas/preview/preview-session";

const HISTORY_LIMIT = 80;
const HISTORY_DEBOUNCE_MS = 160;

export function useCanvasHistory({
  applyDocumentRef,
  document,
}: {
  applyDocumentRef: MutableRefObject<(nextDocument: CanvasWorkspaceDocument) => void>;
  document: CanvasWorkspaceDocument;
}) {
  const [initialDocument] = useState(() => cloneCanvasWorkspaceDocument(document));
  const [historyPosition, setHistoryPosition] = useState({ index: 0, length: 1 });
  const historyTimerRef = useRef<number | null>(null);
  const historyRef = useRef<CanvasWorkspaceDocument[]>([initialDocument]);
  const historyIndexRef = useRef(0);
  const isApplyingHistoryRef = useRef(false);
  const shouldReplaceCurrentEntryRef = useRef(false);

  const setHistoryStack = (nextStack: CanvasWorkspaceDocument[], nextIndex: number) => {
    historyRef.current = nextStack;
    historyIndexRef.current = nextIndex;
    setHistoryPosition({ index: nextIndex, length: nextStack.length });
  };

  const restoreHistorySnapshot = (nextIndex: number) => {
    const snapshot = historyRef.current[nextIndex];

    if (!snapshot) {
      return;
    }

    isApplyingHistoryRef.current = true;
    setHistoryStack(historyRef.current, nextIndex);
    applyDocumentRef.current(snapshot);
    window.setTimeout(() => {
      isApplyingHistoryRef.current = false;
    }, 0);
  };

  const undo = () => {
    restoreHistorySnapshot(Math.max(0, historyIndexRef.current - 1));
  };

  const redo = () => {
    restoreHistorySnapshot(Math.min(historyRef.current.length - 1, historyIndexRef.current + 1));
  };

  const canUndo = historyPosition.index > 0;
  const canRedo = historyPosition.index < historyPosition.length - 1;

  // Debounced history snapshot capture.
  useEffect(() => {
    if (historyTimerRef.current !== null) {
      window.clearTimeout(historyTimerRef.current);
    }

    historyTimerRef.current = window.setTimeout(() => {
      if (previewSession.getIsInteracting()) {
        return;
      }

      const snapshot = cloneCanvasWorkspaceDocument(document);
      const serializedSnapshot = serializeCanvasWorkspaceDocument(snapshot);
      const currentIndex = historyIndexRef.current;
      const currentSnapshot = historyRef.current[currentIndex];

      if (
        currentSnapshot &&
        serializeCanvasWorkspaceDocument(currentSnapshot) === serializedSnapshot
      ) {
        return;
      }

      if (isApplyingHistoryRef.current) {
        return;
      }

      if (shouldReplaceCurrentEntryRef.current) {
        const nextStack = [...historyRef.current];
        nextStack[currentIndex] = snapshot;
        shouldReplaceCurrentEntryRef.current = false;
        setHistoryStack(nextStack, currentIndex);
        return;
      }

      const nextStack = historyRef.current.slice(0, currentIndex + 1);
      nextStack.push(snapshot);

      if (nextStack.length > HISTORY_LIMIT) {
        nextStack.shift();
      }

      setHistoryStack(nextStack, nextStack.length - 1);
    }, HISTORY_DEBOUNCE_MS);

    return () => {
      if (historyTimerRef.current !== null) {
        window.clearTimeout(historyTimerRef.current);
      }
    };
  }, [document]);

  return {
    canRedo,
    canUndo,
    redo,
    shouldReplaceCurrentEntryRef,
    undo,
  };
}
