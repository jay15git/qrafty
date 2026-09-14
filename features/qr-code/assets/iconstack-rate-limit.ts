const MAX_CONCURRENT_REQUESTS = 4
const MIN_REQUEST_INTERVAL_MS = 60

let activeRequests = 0
let requestChain: Promise<void> = Promise.resolve()
const capacityWaiters: Array<() => void> = []

function waitForCapacity() {
  if (activeRequests < MAX_CONCURRENT_REQUESTS) {
    return Promise.resolve()
  }

  return new Promise<void>((resolve) => {
    capacityWaiters.push(resolve)
  })
}

function releaseCapacity() {
  activeRequests -= 1
  capacityWaiters.shift()?.()
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

/**
 * Serializes request starts so every Iconstack call is spaced at least
 * MIN_REQUEST_INTERVAL_MS apart and at most MAX_CONCURRENT_REQUESTS run
 * in parallel. Callers share one queue, so a preview burst drains
 * politely instead of hitting the API all at once.
 */
export async function scheduleIconstackRequest<T>(fn: () => Promise<T>): Promise<T> {
  const acquire = requestChain.then(async () => {
    await waitForCapacity()
    await sleep(MIN_REQUEST_INTERVAL_MS)
    activeRequests += 1
  })
  requestChain = acquire
  await acquire

  try {
    return await fn()
  } finally {
    releaseCapacity()
  }
}
