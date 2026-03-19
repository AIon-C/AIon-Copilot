import { create } from "@bufbuild/protobuf";
import { toGrpcClientError } from "@/lib/grpc/error";
import { GetThreadRequestSchema } from "@/gen/chatapp/thread/v1/thread_service_pb";
import { threadClient } from "./thread-client";
import type { GetThreadInput, GetThreadResult } from "../model/thread-types";
import { mapThreadResponse } from "../utils/thread-mapper";

export const threadService = {
  async getThread(input: GetThreadInput): Promise<GetThreadResult> {
    try {
      const response = await threadClient.getThread(
        create(GetThreadRequestSchema, {
          threadRootId: input.threadRootId,
        }),
      );

      return mapThreadResponse(response);
    } catch (error) {
      throw toGrpcClientError(error);
    }
  },
};