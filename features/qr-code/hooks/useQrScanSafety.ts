"use client"

import { useEffect, useMemo, useState } from "react"

import type { QraftyState } from "@/features/qr-code/model/state"
import { decodeQraftyPreview } from "@/features/qr-code/scan-safety/decode-qrafty-preview"
import { getEffectiveBackgroundForScanSafety } from "@/features/qr-code/scan-safety/effective-background"
import {
  createPendingScannabilityResult,
  createSkippedScannabilityResult,
  evaluateScannability,
  shouldSkipScannabilityCheck,
} from "@/features/qr-code/scan-safety/evaluate-scannability"
import type { ScanSafetyResult } from "@/features/qr-code/scan-safety/types"

const DECODE_DEBOUNCE_MS = 350

type UseQrScanSafetyOptions = {
  cardFill: string
  contentIsValid?: boolean
  enabled?: boolean
}

export function useQrScanSafety(
  state: QraftyState,
  { cardFill, contentIsValid = true, enabled = true }: UseQrScanSafetyOptions,
): ScanSafetyResult {
  const effectiveBackgroundColor = useMemo(
    () => getEffectiveBackgroundForScanSafety(state, cardFill),
    [cardFill, state],
  )

  const expectedText = state.data.trim()
  const shouldSkip = shouldSkipScannabilityCheck(contentIsValid, expectedText, enabled)

  const [result, setResult] = useState<ScanSafetyResult>(() =>
    shouldSkip
      ? createSkippedScannabilityResult(expectedText)
      : createPendingScannabilityResult(expectedText),
  )

  useEffect(() => {
    if (shouldSkip) {
      setResult(createSkippedScannabilityResult(expectedText))
      return
    }

    setResult(createPendingScannabilityResult(expectedText))
    let cancelled = false

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const decoded = await decodeQraftyPreview(state, effectiveBackgroundColor)

          if (cancelled) {
            return
          }

          setResult(evaluateScannability(expectedText, decoded))
        } catch {
          if (!cancelled) {
            setResult(evaluateScannability(expectedText, null))
          }
        }
      })()
    }, DECODE_DEBOUNCE_MS)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [effectiveBackgroundColor, expectedText, shouldSkip, state])

  return result
}
