import { createDocumentFromHubIntent } from "@/features/studio-hub/model/bootstrap-document"
import {
  readStudioSession,
  writeStudioSession,
  type StudioSessionMeta,
} from "@/features/studio-hub/model/navigation"
import {
  createDefaultDraftingWorkspaceDocument,
  parseDraftingWorkspaceDocument,
  serializeDraftingWorkspaceDocument,
  type DraftingWorkspaceDocumentV1,
} from "@/features/workspace/model/document"
import { readDraftingWorkspaceDraft, writeDraftingWorkspaceDraft } from "@/features/workspace/model/storage"

const WORKSPACE_BOOTSTRAP_SNAPSHOT_KEY = "new-qr:workspace-bootstrap-snapshot"

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

function sessionToIntent(session: StudioSessionMeta) {
  if (session.source === "template" && session.templateId) {
    return {
      source: "template" as const,
      templateId: session.templateId,
      prompt: session.prompt,
      returnTab: session.returnTab,
    }
  }

  if (session.source === "library" && session.designId) {
    return {
      source: "library" as const,
      designId: session.designId,
      returnTab: session.returnTab,
    }
  }

  if (session.source === "prompt") {
    return {
      source: "prompt" as const,
      prompt: session.prompt,
      returnTab: session.returnTab,
    }
  }

  if (session.source === "blank") {
    return {
      source: "blank" as const,
      returnTab: session.returnTab,
    }
  }

  return null
}

function consumeStudioSession(session: StudioSessionMeta) {
  writeStudioSession({
    returnTab: session.returnTab,
    source: "blank",
  })
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

  const session = readStudioSession()
  const intent = session ? sessionToIntent(session) : null

  if (intent && (intent.source === "template" || intent.source === "library" || intent.source === "prompt")) {
    const document = await createDocumentFromHubIntent(intent)
    await writeDraftingWorkspaceDraft(document)
    consumeStudioSession(session!)
    return {
      consumedSession: true,
      document,
    }
  }

  const savedDocument = await readDraftingWorkspaceDraft()

  return {
    consumedSession: false,
    document: savedDocument ?? createDefaultDraftingWorkspaceDocument(),
  }
}
