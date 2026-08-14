export type ScanSafetyStatus = "valid" | "invalid" | "pending" | "skipped"

export type ScanSafetySummary =
  | "Valid"
  | "Not scannable"
  | "Checking…"
  | "No content"

export type ScanSafetyResult = {
  status: ScanSafetyStatus
  summary: ScanSafetySummary
  expectedText: string
  decodedText: string | null
}

const DEFAULT_SCAN_SAFETY_RESULT: ScanSafetyResult = {
  status: "valid",
  summary: "Valid",
  expectedText: "",
  decodedText: null,
}

export const PENDING_SCAN_SAFETY_RESULT: ScanSafetyResult = {
  status: "pending",
  summary: "Checking…",
  expectedText: "",
  decodedText: null,
}

export const SKIPPED_SCAN_SAFETY_RESULT: ScanSafetyResult = {
  status: "skipped",
  summary: "No content",
  expectedText: "",
  decodedText: null,
}
