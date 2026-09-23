import qrcodegen from "../../vendor/react-qr-code/src/lib/qrcodegen";
import { ERROR_LEVEL_MAP } from "../../vendor/react-qr-code/src/constants";
import type { ErrorCorrectionLevel } from "../react-qr-code";

export type QrModuleMetrics = {
  /** Actual error-correction level after boostEcl is applied. */
  errorCorrectionLevel: ErrorCorrectionLevel;
  margin: number;
  moduleCount: number;
  numCells: number;
  version: number;
};

export type QrModuleGrid = {
  /** Actual error-correction level after boostEcl is applied. */
  errorCorrectionLevel: ErrorCorrectionLevel;
  margin: number;
  /** modules[r][c] === true for dark modules; excludes the quiet zone margin. */
  modules: boolean[][];
  numCells: number;
  version: number;
};

export type QrModuleMetricsInput = {
  boostLevel?: boolean;
  level: ErrorCorrectionLevel;
  marginSize?: number;
  minVersion?: number;
  value: string | string[];
};

/**
 * Non-React equivalent of `useQRCode`: encodes the payload and returns the
 * module grid metrics used to size the rendered svg (viewBox = numCells).
 * Returns null when the payload cannot be encoded.
 */
function encodeQrCode(input: QrModuleMetricsInput) {
  const values = Array.isArray(input.value) ? input.value : [input.value];
  const segments = values.reduce<qrcodegen.QrSegment[]>((accum, value) => {
    accum.push(...qrcodegen.QrSegment.makeSegments(value));
    return accum;
  }, []);

  return qrcodegen.QrCode.encodeSegments(
    segments,
    ERROR_LEVEL_MAP[input.level],
    Math.max(1, input.minVersion ?? 1),
    undefined,
    undefined,
    input.boostLevel,
  );
}

function getErrorCorrectionLevelName(ecl: qrcodegen.QrCode.Ecc): ErrorCorrectionLevel {
  switch (ecl.ordinal) {
    case qrcodegen.QrCode.Ecc.LOW.ordinal:
      return "L";
    case qrcodegen.QrCode.Ecc.MEDIUM.ordinal:
      return "M";
    case qrcodegen.QrCode.Ecc.QUARTILE.ordinal:
      return "Q";
    default:
      return "H";
  }
}

export function getQrModuleMetrics(input: QrModuleMetricsInput): QrModuleMetrics | null {
  try {
    const qrcode = encodeQrCode(input);
    const margin = Math.max(Math.floor(input.marginSize ?? 4), 0);
    const moduleCount = qrcode.getModules().length;

    return {
      errorCorrectionLevel: getErrorCorrectionLevelName(qrcode.errorCorrectionLevel),
      margin,
      moduleCount,
      numCells: moduleCount + margin * 2,
      version: qrcode.version,
    };
  } catch {
    return null;
  }
}

/**
 * Like `getQrModuleMetrics` but also returns the encoded module matrix so
 * callers can compare rendered pixels against expected dark/light modules.
 */
export function getQrModuleGrid(input: QrModuleMetricsInput): QrModuleGrid | null {
  try {
    const qrcode = encodeQrCode(input);
    const margin = Math.max(Math.floor(input.marginSize ?? 4), 0);
    const modules = qrcode.getModules().map((row) => [...row]);

    return {
      errorCorrectionLevel: getErrorCorrectionLevelName(qrcode.errorCorrectionLevel),
      margin,
      modules,
      numCells: modules.length + margin * 2,
      version: qrcode.version,
    };
  } catch {
    return null;
  }
}
