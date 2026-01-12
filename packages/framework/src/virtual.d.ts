declare module "virtual:aurelia/entries" {
  import type { GetEntriesResult } from "./entry-definition";
  const getEntries: () => GetEntriesResult;
  export default getEntries;
}
declare module "virtual:aurelia/config" {
  export const ssr: boolean;
  export const rscPayloadDir: string;
}
declare module "virtual:aurelia/client-init" {}
declare module "virtual:aurelia/build-entry" {
  import type { BuildEntryFunction } from "./build-entry-definition";
  const buildEntry: BuildEntryFunction | undefined;
  export default buildEntry;
}
