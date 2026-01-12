export const defaultRscPayloadDir = "aurelia__rsc-payload";

export function getPayloadIDFor(
  rawId: string,
  rscPayloadDir: string = defaultRscPayloadDir,
): string {
  return `${rscPayloadDir}/${rawId}`;
}

const rscModulePathPrefix = "/aurelia__/";
const rscModulePathSuffix = ".txt";

export function getModulePathFor(id: string): string {
  return `${rscModulePathPrefix}${id}${rscModulePathSuffix}`;
}

export function extractIDFromModulePath(
  modulePath: string,
): string | undefined {
  if (
    !modulePath.startsWith(rscModulePathPrefix) ||
    !modulePath.endsWith(rscModulePathSuffix)
  ) {
    return undefined;
  }
  return modulePath.slice(
    rscModulePathPrefix.length,
    -rscModulePathSuffix.length,
  );
}
