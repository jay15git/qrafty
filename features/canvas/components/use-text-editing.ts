"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent, type MouseEvent } from "react";

import { type CanvasLayer } from "@/features/canvas/model/layers/shared";

export type CanvasTextEditingInput = {
  onLayerChange?: (layerId: string, patch: Partial<CanvasLayer>) => void;
  onLayerSelect?: (layerId: string | null, options?: { additive?: boolean }) => void;
  resolvedLayers: CanvasLayer[];
};

export function useTextEditing({
  onLayerChange,
  onLayerSelect,
  resolvedLayers,
}: CanvasTextEditingInput) {
  const [editingTextLayerId, setEditingTextLayerId] = useState<string | null>(null);
  const [editingTextDraft, setEditingTextDraft] = useState("");
  const textEditorRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const registerTextEditor = useCallback((layerId: string, element: HTMLTextAreaElement | null) => {
    textEditorRefs.current[layerId] = element;
  }, []);

  useEffect(() => {
    if (!editingTextLayerId) {
      return;
    }

    const editor = textEditorRefs.current[editingTextLayerId];
    editor?.focus();
    editor?.setSelectionRange(editor.value.length, editor.value.length);
  }, [editingTextLayerId]);

  function startTextEditing(event: MouseEvent<HTMLElement>, layer: CanvasLayer) {
    if (layer.kind !== "text") {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    onLayerSelect?.(layer.id);
    setEditingTextLayerId(layer.id);
    setEditingTextDraft(layer.text ?? "");
  }

  function handleTextEditorInput(event: FormEvent<HTMLTextAreaElement>) {
    setEditingTextDraft(event.currentTarget.value);
  }

  function commitEditingTextDraft() {
    if (!editingTextLayerId) {
      return;
    }

    const layer = resolvedLayers.find((candidate) => candidate.id === editingTextLayerId);
    const text = textEditorRefs.current[editingTextLayerId]?.value ?? editingTextDraft;

    if (layer?.kind === "text" && ((layer.text ?? "") !== text || layer.textRuns)) {
      onLayerChange?.(layer.id, { text, textRuns: undefined });
    }

    setEditingTextDraft(text);
    setEditingTextLayerId(null);
  }

  return {
    editingTextDraft,
    editingTextLayerId,
    registerTextEditor,
    commitEditingTextDraft,
    handleTextEditorInput,
    startTextEditing,
  };
}
