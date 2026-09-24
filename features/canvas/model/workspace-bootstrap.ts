import {
  createDefaultCanvasWorkspaceDocument,
  type CanvasWorkspaceDocumentV1,
} from "@/features/canvas/model/document";
import { readCanvasWorkspaceDraft } from "@/features/canvas/model/storage";

export async function resolveWorkspaceBootstrapDocument(): Promise<CanvasWorkspaceDocumentV1> {
  const savedDocument = await readCanvasWorkspaceDraft();

  return savedDocument ?? createDefaultCanvasWorkspaceDocument();
}
