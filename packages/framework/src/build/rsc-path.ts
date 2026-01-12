import { getModulePathFor, getPayloadIDFor } from "../rsc/module";

export const rscPayloadPlaceholder = "__AURELIA_RSC_PAYLOAD_PATH__";

export function getRscPayloadPath(
  contentHash: string,
  rscPayloadDir: string,
): string {
  return getModulePathFor(getPayloadIDFor(contentHash, rscPayloadDir));
}
