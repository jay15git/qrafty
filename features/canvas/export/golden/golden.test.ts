// @vitest-environment jsdom

/**
 * Golden export snapshots. Each fixture in `./fixtures.ts` is run through the
 * same emit path as `renderWorkspaceSvgMarkup` (QR markup → scene IR → SVG),
 * minus the browser-only WebGL shader capture, which is replaced by canned
 * `shaderSnapshots`. SVG and IR snapshots pin the export surface so T4
 * refactors (document model, paint types, the pure emitter) can prove they did
 * not change output.
 */

import { emitSvg, preprocessSvg } from "@qrafty/qr-internal/codegen";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { inlineSvgImageHrefs } from "@/features/canvas/export/pipeline/assets";
import { resolveQrExportTimeMs } from "@/features/canvas/export/pipeline/clock";
import {
  buildAnimatedQrMarkupAtTime,
  shouldExportAnimatedQr,
} from "@/features/canvas/export/pipeline/qr-frames";
import { createCanvasQrArtworkState } from "@/features/canvas/rendering/qr-artwork";
import { buildSceneIr } from "@/features/qr/export/build-scene-ir";
import { buildDashboardQrNodePayload } from "@/features/qr/rendering/qr-svg-render";
import { GOLDEN_FIXTURES } from "./fixtures";

function snapshotPath(name: string, extension: string) {
  return resolve(`features/canvas/export/golden/snapshots/${name}.${extension}`);
}

describe("golden export snapshots", () => {
  for (const fixture of GOLDEN_FIXTURES) {
    it(`exports ${fixture.name}`, async () => {
      const { cardState, layers, state } = fixture.build();

      const qrPayload = await buildDashboardQrNodePayload(createCanvasQrArtworkState(state));
      const qrTimeMs = resolveQrExportTimeMs(state, fixture.mode, fixture.videoTimeMs);
      const qrMarkup = shouldExportAnimatedQr(state)
        ? buildAnimatedQrMarkupAtTime(qrPayload.markup, state, qrTimeMs)
        : qrPayload.markup;

      const ir = await buildSceneIr({
        cardState,
        componentName: fixture.name.replace(/[^a-zA-Z0-9]/g, "") || "QrCard",
        layers,
        qrMarkup,
        shaderSnapshots: fixture.shaderSnapshots,
        state,
      });

      const svg = await inlineSvgImageHrefs(
        preprocessSvg(emitSvg(ir), { idPrefix: fixture.nodeId }),
      );

      await expect(JSON.stringify(ir, null, 2)).toMatchFileSnapshot(
        snapshotPath(fixture.name, "ir.json"),
      );
      await expect(svg).toMatchFileSnapshot(snapshotPath(fixture.name, "svg"));
    });
  }
});
