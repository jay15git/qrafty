import { randomUUID } from "node:crypto"
import { execFile } from "node:child_process"
import { promises as fs } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { promisify } from "node:util"

import { getFfmpegVideoArgs, getVideoExportFilename, getVideoExportMimeType, validateVideoExportRequest } from "@/features/qr-code/export/video-export"

/** @deprecated Client-side WebCodecs export is the product path. This route remains for optional server transcode only. */

const execFileAsync = promisify(execFile)
const MAX_UPLOAD_BYTES = 64 * 1024 * 1024

export const runtime = "nodejs"

export async function POST(request: Request) {
  let dir = ""
  try {
    const body = await request.arrayBuffer()
    if (body.byteLength > MAX_UPLOAD_BYTES) return Response.json({ error: "Video source exceeds 64 MB limit." }, { status: 413 })
    const metadata = request.headers.get("x-animated-qr-export")
    const options = validateVideoExportRequest(metadata ? JSON.parse(metadata) : null)
    dir = join(tmpdir(), `qrafty-${randomUUID()}`)
    await fs.mkdir(dir, { recursive: true })
    const inputPath = join(dir, "input.webm")
    const outputPath = join(dir, `output.${options.format}`)
    await fs.writeFile(inputPath, Buffer.from(body))
    await execFileAsync("ffmpeg", getFfmpegVideoArgs(options, inputPath, outputPath), { timeout: 120_000, maxBuffer: 1024 * 1024 })
    const output = await fs.readFile(outputPath)
    return new Response(output, {
      headers: {
        "Content-Type": getVideoExportMimeType(options.format),
        "Content-Disposition": `attachment; filename="${getVideoExportFilename(options.format, options.frameRate, options.durationSeconds)}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Video encoding failed."
    const status = message.includes("Unsupported") || message.includes("Invalid") ? 400 : message.includes("ENOENT") ? 503 : 500
    return Response.json({ error: status === 503 ? "FFmpeg is unavailable." : message }, { status })
  } finally {
    if (dir) await fs.rm(dir, { recursive: true, force: true }).catch(() => undefined)
  }
}
