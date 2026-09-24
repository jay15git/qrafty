"use client";

import { useEffect, useRef, useState, type MutableRefObject } from "react";

import {
  cloneCanvasWorkspaceDocument,
  serializeCanvasWorkspaceDocument,
  type CanvasWorkspaceDocumentV1,
} from "@/features/canvas/model/document";
import { writeCanvasWorkspaceDraft } from "@/features/canvas/model/storage";
import { resolveWorkspaceBootstrapDocument } from "@/features/canvas/model/workspace-bootstrap";
import { previewSession } from "@/features/canvas/preview/preview-session";

const HISTORY_LIMIT = 80;
const HISTORY_DEBOUNCE_MS = 160;
const AUTOSAVE_DEBOUNCE_MS = 240;

export function useCanvasHistory({
  applyDocumentRef,
  document,
  isWorkspaceReady,
  setIsWorkspaceReady,
}: {
  applyDocumentRef: MutableRefObject<(nextDocument: CanvasWorkspaceDocumentV1) => void>;
  document: CanvasWorkspaceDocumentV1;
  isWorkspaceReady: boolean;
  setIsWorkspaceReady: (ready: boolean) => void;
}) {
  const [historyRevision, setHistoryRevision] = useState(-1);
  const autosaveTimerRef = useRef<number | null>(null);
  const historyTimerRef = useRef<number | null>(null);
  const historyRef = useRef<CanvasWorkspaceDocumentV1[]>([]);
  const historyIndexRef = useRef(-1);
  const isApplyingHistoryRef = useRef(false);
  const shouldReplaceCurrentEntryRef = useRef(false);

  const setHistoryStack = (nextStack: CanvasWorkspaceDocumentV1[], nextIndex: number) => {
    historyRef.current = nextStack;
    historyIndexRef.current = nextIndex;
    setHistoryRevision((current) => current + 1);
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

  const save = () => {
    if (autosaveTimerRef.current !== null) {
      window.clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }

    void writeCanvasWorkspaceDraft(document);
  };

  const canUndo = historyRevision >= 0 && historyIndexRef.current > 0;
  const canRedo = historyRevision >= 0 && historyIndexRef.current < historyRef.current.length - 1;

  // Initial draft hydration runs once on mount.
  useEffect(() => {
    let cancelled = false;

    void resolveWorkspaceBootstrapDocument().then((nextDocument) => {
      if (cancelled) {
        return;
      }

      isApplyingHistoryRef.current = true;
      applyDocumentRef.current(nextDocument);
      setHistoryStack([cloneCanvasWorkspaceDocument(nextDocument)], 0);
      setIsWorkspaceReady(true);
      window.setTimeout(() => {
        isApplyingHistoryRef.current = false;
      }, 0);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced history snapshot capture.
  useEffect(() => {
    if (!isWorkspaceReady) {
      return;
    }

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
  }, [document, isWorkspaceReady]);

  // Debounced draft autosave.
  useEffect(() => {
    if (!isWorkspaceReady) {
      return;
    }

    if (autosaveTimerRef.current !== null) {
      window.clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = window.setTimeout(() => {
      if (previewSession.getIsInteracting()) {
        return;
      }

      void writeCanvasWorkspaceDraft(document);
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (autosaveTimerRef.current !== null) {
        window.clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [document, isWorkspaceReady]);

  // Timer cleanup on unmount.
  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current !== null) {
        window.clearTimeout(autosaveTimerRef.current);
      }
      if (historyTimerRef.current !== null) {
        window.clearTimeout(historyTimerRef.current);
      }
    };
  }, []);

  return {
    canRedo,
    canUndo,
    isWorkspaceReady,
    redo,
    save,
    shouldReplaceCurrentEntryRef,
    undo,
  };
}
