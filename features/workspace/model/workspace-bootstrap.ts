import {
  createDefaultDraftingWorkspaceDocument,
  parseDraftingWorkspaceDocument,
  serializeDraftingWorkspaceDocument,
  type DraftingWorkspaceDocumentV1,
} from "@/features/workspace/model/document"
import { readDraftingWorkspaceDraft, writeDraftingWorkspaceDraft } from "@/features/workspace/model/storage"

const WORKSPACE_BOOTSTRAP_SNAPSHOT_KEY = "qrafty:workspace-bootstrap-snapshot"

export function writeWorkspaceBootstrapSnapshot(document: DraftingWorkspaceDocumentV1): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    window.sessionStorage.setItem(
      WORKSPACE_BOOTSTRAP_SNAPSHOT_KEY,
      serializeDraftingWorkspaceDocument(document),
    )
  } catch {
    // Snapshot is optional when storage is unavailable.
  }
}

export function readWorkspaceBootstrapSnapshot(): DraftingWorkspaceDocumentV1 | null {
  if (typeof window === "undefined") {
    return null
  }

  try {
    const raw = window.sessionStorage.getItem(WORKSPACE_BOOTSTRAP_SNAPSHOT_KEY)
    if (!raw) {
      return null
    }

    window.sessionStorage.removeItem(WORKSPACE_BOOTSTRAP_SNAPSHOT_KEY)
    return parseDraftingWorkspaceDocument(JSON.parse(raw))
  } catch {
    return null
  }
}

export type WorkspaceBootstrapResult = {
  consumedSession: boolean
  document: DraftingWorkspaceDocumentV1
}

export async function resolveWorkspaceBootstrapDocument(): Promise<WorkspaceBootstrapResult> {
  const snapshot = readWorkspaceBootstrapSnapshot()
  if (snapshot) {
    await writeDraftingWorkspaceDraft(snapshot)
    return {
      consumedSession: true,
      document: snapshot,
    }
  }

  const savedDocument = await readDraftingWorkspaceDraft()

  return {
    consumedSession: false,
    document: savedDocument ?? createDefaultDraftingWorkspaceDocument(),
  }
}
