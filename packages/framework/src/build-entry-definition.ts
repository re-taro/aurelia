export interface BuildEntryContext {
  build: () => Promise<void>;
  outDir: string;
}

export type BuildEntryFunction = (
  context: BuildEntryContext,
) => Promise<void> | void;
