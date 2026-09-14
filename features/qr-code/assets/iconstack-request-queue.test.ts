import { afterEach, describe, expect, it, vi } from "vitest"

import { IconstackApiError } from "@/features/qr-code/assets/iconstack-api"
import {
  enqueueIconstackRequest,
  resetIconstackRequestQueue,
} from "@/features/qr-code/assets/iconstack-request-queue"

describe("iconstack-request-queue", () => {
  afterEach(() => {
    resetIconstackRequestQueue()
    vi.useRealTimers()
  })

  it("dedupes concurrent requests with the same key", async () => {
    const task = vi.fn().mockResolvedValue("svg")

    const [first, second] = await Promise.all([
      enqueueIconstackRequest("icon:lucide:heart", task),
      enqueueIconstackRequest("icon:lucide:heart", task),
    ])

    expect(task).toHaveBeenCalledTimes(1)
    expect(first).toBe("svg")
    expect(second).toBe("svg")
  })

  it("negative-caches failures so repeats skip the network", async () => {
    const error = new IconstackApiError("http", "boom", 400)
    const task = vi.fn().mockRejectedValue(error)

    await expect(enqueueIconstackRequest("icon:lucide:bad", task)).rejects.toBe(error)
    await expect(enqueueIconstackRequest("icon:lucide:bad", task)).rejects.toBe(error)

    expect(task).toHaveBeenCalledTimes(1)
  })

  it("retries retryable failures once before surfacing", async () => {
    vi.useFakeTimers()
    const task = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new IconstackApiError("network", "offline"))
      .mockResolvedValue("svg")

    const pending = enqueueIconstackRequest("icon:lucide:heart", task)
    await vi.advanceTimersByTimeAsync(1_000)

    await expect(pending).resolves.toBe("svg")
    expect(task).toHaveBeenCalledTimes(2)
  })

  it("does not retry non-retryable http errors", async () => {
    const task = vi
      .fn()
      .mockRejectedValue(new IconstackApiError("http", "missing", 404))

    await expect(enqueueIconstackRequest("icon:lucide:gone", task)).rejects.toMatchObject(
      { status: 404 },
    )
    expect(task).toHaveBeenCalledTimes(1)
  })

  it("caps concurrency at six simultaneous requests", async () => {
    let running = 0
    let maxRunning = 0
    const task = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          running += 1
          maxRunning = Math.max(maxRunning, running)
          setTimeout(() => {
            running -= 1
            resolve("svg")
          }, 5)
        }),
    )

    await Promise.all(
      Array.from({ length: 12 }, (_, index) =>
        enqueueIconstackRequest(`icon:lucide:${index}`, task),
      ),
    )

    expect(task).toHaveBeenCalledTimes(12)
    expect(maxRunning).toBeLessThanOrEqual(6)
  })
})
