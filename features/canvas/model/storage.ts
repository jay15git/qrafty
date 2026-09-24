import {
  serializeCanvasWorkspaceDocument,
  type CanvasWorkspaceDocumentV1,
} from "@/features/canvas/model/document";
import { parseCanvasWorkspaceDocument } from "@/features/canvas/model/document/parse";

const DB_NAME = "qrafty-canvas-workspace";
const DB_VERSION = 1;
const STORE_NAME = "drafts";
const DRAFT_ID = "new";
const LOCAL_STORAGE_KEY = "qrafty:canvas-workspace:new";

type StoredCanvasWorkspaceRecord = {
  document: unknown;
  id: string;
  updatedAt: number;
};

export async function readCanvasWorkspaceDraft(): Promise<CanvasWorkspaceDocumentV1 | null> {
  const idbRecord = await readIndexedDbDraft().catch(() => null);

  if (idbRecord) {
    return parseCanvasWorkspaceDocument(idbRecord.document);
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? parseCanvasWorkspaceDocument(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export async function writeCanvasWorkspaceDraft(
  document: CanvasWorkspaceDocumentV1,
): Promise<void> {
  const serialized = serializeCanvasWorkspaceDocument(document);

  try {
    await writeIndexedDbDraft(JSON.parse(serialized));
    return;
  } catch {
    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, serialized);
    } catch {
      // Current session history still works if browser storage is unavailable.
    }
  }
}
function openCanvasWorkspaceDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is unavailable."));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed."));
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

async function readIndexedDbDraft(): Promise<StoredCanvasWorkspaceRecord | null> {
  const db = await openCanvasWorkspaceDb();

  try {
    return await new Promise<StoredCanvasWorkspaceRecord | null>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const request = transaction.objectStore(STORE_NAME).get(DRAFT_ID);

      transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB read failed."));
      request.onerror = () => reject(request.error ?? new Error("IndexedDB get failed."));
      request.onsuccess = () => resolve(normalizeStoredRecord(request.result));
    });
  } finally {
    db.close();
  }
}

async function writeIndexedDbDraft(document: unknown): Promise<void> {
  const db = await openCanvasWorkspaceDb();

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");

      transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB write failed."));
      transaction.oncomplete = () => resolve();
      transaction.objectStore(STORE_NAME).put({
        document,
        id: DRAFT_ID,
        updatedAt: Date.now(),
      } satisfies StoredCanvasWorkspaceRecord);
    });
  } finally {
    db.close();
  }
}

function normalizeStoredRecord(value: unknown): StoredCanvasWorkspaceRecord | null {
  if (
    typeof value !== "object" ||
    value === null ||
    !("id" in value) ||
    value.id !== DRAFT_ID ||
    !("document" in value)
  ) {
    return null;
  }

  return value as StoredCanvasWorkspaceRecord;
}
