import {
  parseDraftingWorkspaceDocument,
  serializeDraftingWorkspaceDocument,
  type DraftingWorkspaceDocumentV1,
} from "@/features/workspace/model/document"

const DB_NAME = "qrafty-drafting-workspace"
const DB_VERSION = 1
const STORE_NAME = "drafts"
const DRAFT_ID = "new"
const LOCAL_STORAGE_KEY = "qrafty:drafting-workspace:new"

type StoredDraftingWorkspaceRecord = {
  document: unknown
  id: string
  updatedAt: number
}

export async function readDraftingWorkspaceDraft(): Promise<DraftingWorkspaceDocumentV1 | null> {
  const idbRecord = await readIndexedDbDraft().catch(() => null)

  if (idbRecord) {
    return parseDraftingWorkspaceDocument(idbRecord.document)
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY)
    return raw ? parseDraftingWorkspaceDocument(JSON.parse(raw)) : null
  } catch {
    return null
  }
}

export async function writeDraftingWorkspaceDraft(
  document: DraftingWorkspaceDocumentV1,
): Promise<void> {
  const serialized = serializeDraftingWorkspaceDocument(document)

  try {
    await writeIndexedDbDraft(JSON.parse(serialized))
    return
  } catch {
    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, serialized)
    } catch {
      // Current session history still works if browser storage is unavailable.
    }
  }
}function openDraftingWorkspaceDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is unavailable."))
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed."))
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = () => {
      const db = request.result

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" })
      }
    }
  })
}

async function readIndexedDbDraft(): Promise<StoredDraftingWorkspaceRecord | null> {
  const db = await openDraftingWorkspaceDb()

  try {
    return await new Promise<StoredDraftingWorkspaceRecord | null>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly")
      const request = transaction.objectStore(STORE_NAME).get(DRAFT_ID)

      transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB read failed."))
      request.onerror = () => reject(request.error ?? new Error("IndexedDB get failed."))
      request.onsuccess = () => resolve(normalizeStoredRecord(request.result))
    })
  } finally {
    db.close()
  }
}

async function writeIndexedDbDraft(document: unknown): Promise<void> {
  const db = await openDraftingWorkspaceDb()

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite")

      transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB write failed."))
      transaction.oncomplete = () => resolve()
      transaction.objectStore(STORE_NAME).put({
        document,
        id: DRAFT_ID,
        updatedAt: Date.now(),
      } satisfies StoredDraftingWorkspaceRecord)
    })
  } finally {
    db.close()
  }
}

function normalizeStoredRecord(value: unknown): StoredDraftingWorkspaceRecord | null {
  if (
    typeof value !== "object" ||
    value === null ||
    !("id" in value) ||
    value.id !== DRAFT_ID ||
    !("document" in value)
  ) {
    return null
  }

  return value as StoredDraftingWorkspaceRecord
}
