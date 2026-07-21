"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import type { CodeExportTarget } from "@new-qr/qr-internal/codegen"

type CodeExportOption = {
  id: string
  label: string
  target: CodeExportTarget
}

const CODE_EXPORT_OPTIONS: CodeExportOption[] = [
  { id: "html", label: "HTML", target: { format: "html" } },
  { id: "css", label: "CSS", target: { format: "css" } },
  {
    id: "react-jsx",
    label: "React JSX",
    target: { format: "react", dialect: "jsx", componentName: "QrCard" },
  },
  {
    id: "react-tsx",
    label: "React TSX",
    target: { format: "react", dialect: "tsx", componentName: "QrCard" },
  },
  { id: "svg", label: "SVG", target: { format: "svg" } },
]

type DesktopCodeExportInspectorProps = {
  buildCodegenExport: (target: CodeExportTarget) => Promise<{ code: string; installCommand?: string }>
}

export function DesktopCodeExportInspector({ buildCodegenExport }: DesktopCodeExportInspectorProps) {
  const [error, setError] = useState<string | null>(null)
  const [selectedExportId, setSelectedExportId] = useState(CODE_EXPORT_OPTIONS[0].id)
  const [codePreview, setCodePreview] = useState("")
  const [installCommand, setInstallCommand] = useState("")
  const [codeLoading, setCodeLoading] = useState(false)

  const selectedExport = useMemo(
    () => CODE_EXPORT_OPTIONS.find((option) => option.id === selectedExportId) ?? CODE_EXPORT_OPTIONS[0],
    [selectedExportId],
  )

  const refreshCodegen = useCallback(() => {
    setCodeLoading(true)
    void buildCodegenExport(selectedExport.target)
      .then((result) => {
        setCodePreview(result.code)
        setInstallCommand(result.installCommand ?? "")
        setError(null)
      })
      .catch(() => {
        setCodePreview("")
        setInstallCommand("")
        setError("Failed to generate export code.")
      })
      .finally(() => {
        setCodeLoading(false)
      })
  }, [buildCodegenExport, selectedExport.target])

  useEffect(() => {
    refreshCodegen()
  }, [refreshCodegen])

  if (error) {
    return <p className="text-sm text-red-500">{error}</p>
  }

  return (
    <div className="grid gap-4" data-slot="desktop-code-export-inspector">
      <div className="flex flex-wrap gap-2">
        {CODE_EXPORT_OPTIONS.map((option) => (
          <button
            key={option.id}
            className={`rounded-md border px-2 py-1 text-xs ${option.id === selectedExportId ? "bg-black/10" : ""}`}
            type="button"
            onClick={() => setSelectedExportId(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <pre className="max-h-56 overflow-auto rounded-md bg-black/5 p-3 text-xs">
        {codeLoading ? "Generating..." : codePreview}
      </pre>
      {installCommand ? (
        <p className="text-xs opacity-70">
          Requires: <code>{installCommand}</code>
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button
          className="rounded-md border px-3 py-2 text-sm"
          type="button"
          onClick={() => navigator.clipboard.writeText(codePreview)}
          disabled={!codePreview || codeLoading}
        >
          Copy {selectedExport.label}
        </button>
        <button className="rounded-md border px-3 py-2 text-sm" type="button" onClick={() => refreshCodegen()}>
          Refresh preview
        </button>
      </div>
    </div>
  )
}
