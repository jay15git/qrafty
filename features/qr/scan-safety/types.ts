export type ScanSafetyStatus = "valid" | "invalid" | "pending" | "skipped" | "unavailable";

export type ScanSafetySummary =
  "Valid" | "Not scannable" | "Checking…" | "No content" | "Unavailable";

export type ScanSafetyResult = {
  status: ScanSafetyStatus;
  summary: ScanSafetySummary;
  expectedText: string;
  decodedText: string | null;
  /** 0..100 scannability score; null while pending, skipped, or unavailable. */
  score: number | null;
};

export const PENDING_SCAN_SAFETY_RESULT: ScanSafetyResult = {
  status: "pending",
  summary: "Checking…",
  expectedText: "",
  decodedText: null,
  score: null,
};

export const SKIPPED_SCAN_SAFETY_RESULT: ScanSafetyResult = {
  status: "skipped",
  summary: "No content",
  expectedText: "",
  decodedText: null,
  score: null,
};

export const UNAVAILABLE_SCAN_SAFETY_RESULT: ScanSafetyResult = {
  status: "unavailable",
  summary: "Unavailable",
  expectedText: "",
  decodedText: null,
  score: null,
};
