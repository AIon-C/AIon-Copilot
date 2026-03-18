import type { DescService } from "@bufbuild/protobuf";
import { createClient } from "@connectrpc/connect";
import { transport } from "./transport";


export function createApiClient<T extends DescService>(service: T) {
  return createClient(service, transport)
}