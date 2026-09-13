import { describe, expect, it } from "vitest"

import { getFfmpegVideoArgs, validateVideoExportRequest } from "./video-export"

describe("animated video export", () => {
  it("validates supported export settings", () => {
    expect(
      validateVideoExportRequest({
        durationSeconds: 10,
        frameRate: 60,
        format: "mp4",
        longEdge: 1080,
        width: 1080,
        height: 1920,
      }),
    ).toEqual({
      durationSeconds: 10,
      frameRate: 60,
      format: "mp4",
      longEdge: 1080,
      width: 1080,
      height: 1920,
    })
  })

  it("accepts durations across the supported range", () => {
    for (const durationSeconds of [5, 30, 60]) {
      expect(
        validateVideoExportRequest({
          durationSeconds,
          frameRate: 30,
          format: "mp4",
          longEdge: 1080,
          width: 1080,
          height: 1080,
        }).durationSeconds,
      ).toBe(durationSeconds)
    }
  })

  it("rejects unsupported settings", () => {
    expect(() =>
      validateVideoExportRequest({
        durationSeconds: 3,
        frameRate: 24,
        format: "gif",
        longEdge: 1080,
        width: 1080,
        height: 1080,
      }),
    ).toThrow("Unsupported video export duration.")
  })

  it.each([0, 4, 61, 120, 7.5])("rejects out-of-range duration %s", (durationSeconds) => {
    expect(() =>
      validateVideoExportRequest({
        durationSeconds,
        frameRate: 30,
        format: "mp4",
        longEdge: 1080,
        width: 1080,
        height: 1080,
      }),
    ).toThrow("Unsupported video export duration.")
  })

  it("builds constant-frame-rate MP4 arguments", () => {
    const args = getFfmpegVideoArgs(
      {
        durationSeconds: 5,
        frameRate: 30,
        format: "mp4",
        longEdge: 1080,
        width: 1080,
        height: 1920,
      },
      "input.webm",
      "output.mp4",
    )

    expect(args).toEqual(
      expect.arrayContaining([
        "-t",
        "5",
        "-r",
        "30",
        "-vsync",
        "cfr",
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
      ]),
    )
  })
})
