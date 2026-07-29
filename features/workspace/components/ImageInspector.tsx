"use client"

import FileUpload from "@/components/vendor/kokonutui/file-upload"
import { Input } from "@/components/ui/input"
import {
  DEFAULT_DRAFTING_IMAGE_LAYER,
  type DraftingCanvasLayer,
} from "@/features/workspace/model/layers"
import {
  DraftingInspectorSection,
} from "@/features/workspace/components/InspectorPanel"
import {
  InspectorNumberInput,
  InspectorToggleButton,
} from "@/features/workspace/components/inspector/InspectorFields"

export function ImageInspector({
  layer,
  onPatch,
}: {
  layer: DraftingCanvasLayer
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
}) {
  return (
    <DraftingInspectorSection dataSlot="drafting-image-inspector" title="Image">
      <Input
        aria-label="Image URL"
        className="drafting-type-input h-10 min-w-0 border-[var(--drafting-line)] bg-[var(--drafting-panel-bg-hover)] px-3 text-[var(--drafting-ink)] shadow-none focus-visible:border-[var(--drafting-line-strong)] focus-visible:ring-0"
        placeholder="https://example.com/photo.png"
        value={layer.imageSource === "url" ? (layer.imageValue ?? "") : ""}
        onChange={(event) =>
          onPatch({
            imageSource: event.currentTarget.value ? "url" : "none",
            imageValue: event.currentTarget.value || undefined,
          })
        }
      />

      <FileUpload
        acceptedFileTypes={["image/*"]}
        className="mx-0 max-w-full"
        onUploadError={() => undefined}
        onUploadSuccess={(file) => {
          onPatch({
            imageSource: "upload",
            imageValue: URL.createObjectURL(file),
          })
        }}
        uploadDelay={0}
      />

      <div className="grid grid-cols-2 gap-2">
        {(["cover", "contain"] as const).map((fit) => (
          <InspectorToggleButton
            active={(layer.imageFit ?? DEFAULT_DRAFTING_IMAGE_LAYER.imageFit) === fit}
            key={fit}
            label={fit}
            onClick={() => onPatch({ imageFit: fit })}
          />
        ))}
      </div>
    </DraftingInspectorSection>
  )
}
