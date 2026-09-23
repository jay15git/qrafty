import {
  createDefaultDraftingWorkspaceDocument,
  type DraftingWorkspaceDocumentV1,
} from "@/features/canvas/model/document";
import { readDraftingWorkspaceDraft } from "@/features/canvas/model/storage";

export async function resolveWorkspaceBootstrapDocument(): Promise<DraftingWorkspaceDocumentV1> {
  const savedDocument = await readDraftingWorkspaceDraft();

  return savedDocument ?? createDefaultDraftingWorkspaceDocument();
}
