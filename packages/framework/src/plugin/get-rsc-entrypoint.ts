import type { RunnableDevEnvironment } from "vite";

export async function getRSCEntryPoint(environment: RunnableDevEnvironment): Promise<typeof import('../rsc/entry')> {
  const buildConfig = environment.config.build;
  const rscInput = buildConfig.rolldownOptions.input
  const source =
    rscInput != null &&
    typeof rscInput !== "string" &&
    !Array.isArray(rscInput)
      ? rscInput['index']
      : undefined;
  if (source == null) {
    throw new Error("Cannot determine RSC entry point");
  }
  const resolved = await environment.pluginContainer.resolveId(source);
  if (resolved == null) {
    throw new Error(`Cannot resolve RSC entry: ${source}`);
  }
  const rscEntry = await environment.runner.import<
    typeof import("../rsc/entry")
		>(resolved.id);

  return rscEntry;
}
