"use client";

import { useEffect, useState } from "react";

import type { QraftyState } from "@/features/qr/model/state";
import type { CanvasLayer } from "@/features/canvas/model/layers/shared";
import { analyzeQraftyScannability } from "@/features/qr/scan-safety/analyze-qrafty-scannability";
import type { ScanSafetyScene } from "@/features/qr/scan-safety/rasterize-preview";
import { getQraftyQrExpectedText } from "@/features/qr/scan-safety/qr-grid";
import {
  createPendingScannabilityResult,
  createSkippedScannabilityResult,
  createUnavailableScannabilityResult,
  evaluateScannability,
  shouldSkipScannabilityCheck,
} from "@/features/qr/scan-safety/evaluate-scannability";
import type { ScanSafetyResult } from "@/features/qr/scan-safety/types";

const DECODE_DEBOUNCE_MS = 400;

type UseQrScanSafetyOptions = {
  contentIsValid?: boolean;
  enabled?: boolean;
  /** Selected QR canvas layer. */
  layer?: CanvasLayer;
  /** Export-equivalent scene used to render the QR crop. */
  scene?: ScanSafetyScene;
};

export function useQrScanSafety(
  state: QraftyState,
  { contentIsValid = true, enabled = true, layer, scene }: UseQrScanSafetyOptions,
): ScanSafetyResult {
  const expectedText = getQraftyQrExpectedText(state);
  const shouldSkip = shouldSkipScannabilityCheck(contentIsValid, expectedText, enabled);
  const canAnalyze = !shouldSkip && Boolean(layer && scene);

  const [result, setResult] = useState<ScanSafetyResult>(() =>
    shouldSkip
      ? createSkippedScannabilityResult(expectedText)
      : canAnalyze
        ? createPendingScannabilityResult(expectedText)
        : createUnavailableScannabilityResult(expectedText),
  );

  useEffect(() => {
    let cancelled = false;
    const delay = shouldSkip || !canAnalyze ? 0 : DECODE_DEBOUNCE_MS;

    const timer = window.setTimeout(() => {
      if (cancelled) {
        return;
      }

      if (shouldSkip) {
        setResult(createSkippedScannabilityResult(expectedText));
        return;
      }

      if (!layer || !scene) {
        setResult(createUnavailableScannabilityResult(expectedText));
        return;
      }

      setResult((current) =>
        current.score === null
          ? createPendingScannabilityResult(expectedText)
          : { ...createPendingScannabilityResult(expectedText), score: current.score },
      );

      void (async () => {
        try {
          const decodedText = await analyzeQraftyScannability(state, {
            layer,
            scene,
          });

          if (!cancelled) {
            setResult(
              evaluateScannability(
                expectedText,
                decodedText,
                decodedText === expectedText ? 100 : 0,
              ),
            );
          }
        } catch {
          if (!cancelled) {
            setResult(createUnavailableScannabilityResult(expectedText));
          }
        }
      })();
    }, delay);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [canAnalyze, expectedText, layer, scene, shouldSkip, state]);

  return result;
}
