import { WorkspaceService } from "@/gen/chatapp/workspace/v1/workspace_service_pb";
import { createApiClient } from "@/lib/grpc/base-client";

export const workspaceClient = createApiClient(WorkspaceService);