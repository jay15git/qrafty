import {
  createDefaultDraftingWorkspaceDocument,
  type DraftingWorkspaceDocumentV1,
} from "@/features/workspace/model/document"
import { readDraftingWorkspaceDraft } from "@/features/workspace/model/storage"

export async function resolveWorkspaceBootstrapDocument(): Promise<DraftingWorkspaceDocumentV1> {
  const savedDocument = await readDraftingWorkspaceDraft()

  return savedDocument ?? createDefaultDraftingWorkspaceDocument()
}
