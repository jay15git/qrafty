import { IconstackApiError } from "@/features/qr/assets/iconstack-api";

const MAX_CONCURRENT_REQUESTS = 6;
const RETRY_DELAY_MS = 800;
const FAILURE_TTL_MS = 30_000;

let runningRequests = 0;
const requestWaiters: Array<() => void> = [];
const inflightRequests = new Map<string, Promise<unknown>>();
const recentFailures = new Map<string, { at: number; error: unknown }>();

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function acquireRequestSlot() {
  if (runningRequests >= MAX_CONCURRENT_REQUESTS) {
    await new Promise<void>((resolve) => {
      requestWaiters.push(resolve);
    });
  }
  runningRequests += 1;
}

function releaseRequestSlot() {
  runningRequests -= 1;
  requestWaiters.shift()?.();
}

function isRetryableIconstackError(error: unknown) {
  if (error instanceof IconstackApiError) {
    if (error.kind === "aborted" || error.kind === "invalid") {
      return false;
    }
    if (
      error.kind === "http" &&
      error.status !== undefined &&
      error.status !== 429 &&
      error.status < 500
    ) {
      return false;
    }
  }

  return true;
}

async function runWithRetry<T>(task: () => Promise<T>): Promise<T> {
  try {
    return await task();
  } catch (error) {
    if (!isRetryableIconstackError(error)) {
      throw error;
    }
    await delay(RETRY_DELAY_MS);
    return task();
  }
}

export function enqueueIconstackRequest<T>(key: string, task: () => Promise<T>): Promise<T> {
  const failure = recentFailures.get(key);
  if (failure && Date.now() - failure.at < FAILURE_TTL_MS) {
    return Promise.reject(failure.error);
  }

  const inflight = inflightRequests.get(key);
  if (inflight) {
    return inflight as Promise<T>;
  }

  const promise = (async () => {
    await acquireRequestSlot();
    try {
      return await runWithRetry(task);
    } finally {
      releaseRequestSlot();
    }
  })();

  inflightRequests.set(key, promise);
  promise.then(
    () => {
      inflightRequests.delete(key);
      recentFailures.delete(key);
    },
    (error: unknown) => {
      inflightRequests.delete(key);
      recentFailures.set(key, { at: Date.now(), error });
    },
  );

  return promise;
}

export function resetIconstackRequestQueue() {
  inflightRequests.clear();
  recentFailures.clear();
  for (const waiter of requestWaiters.splice(0)) {
    waiter();
  }
  runningRequests = 0;
}
