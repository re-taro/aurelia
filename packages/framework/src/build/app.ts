import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { ViteBuilder, MinimalPluginContextWithoutEnvironment } from "vite";
import { rscPayloadPlaceholder, getRscPayloadPath } from "./rsc-path";
import { getModulePathFor } from "../rsc/module";
import { processRscComponents } from "./rsc-processor";
import { computeContentHash } from "./content-hash";
import { drainStream } from "../util/drain-stream";
import { validateEntryPath, checkDuplicatePaths } from "./validate-entry-path";
import type { EntryBuildResult } from "../rsc/entry";
import invariant from "tiny-invariant";

export async function build(
  builder: ViteBuilder,
  context: MinimalPluginContextWithoutEnvironment,
  options: { rscPayloadDir: string },
): Promise<void> {
	const { config } = builder;

	invariant(config.environments['rsc'], "Expect rsc environment is set to config")
	const entryPath = path.join(config.environments['rsc'].build.outDir, "index.js");
  const entry: typeof import("../rsc/entry") = await import(
    pathToFileURL(entryPath).href
  );

  invariant(config.environments['client'], "Expect client environment is set to config")
  const baseDir = config.environments['client'].build.outDir;
  const base = normalizeBase(config.base);

  async function doBuild() {
    const { entries, deferRegistry } = await entry.build();

    const paths: string[] = [];
    for (const result of entries) {
      const error = validateEntryPath(result.path);
      if (error) {
        throw new Error(error);
      }
      paths.push(result.path);
    }
    const dupError = checkDuplicatePaths(paths);
    if (dupError) {
      throw new Error(dupError);
    }

    const dummyStream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.close();
      },
    });
    const { components, idMapping } = await processRscComponents(
      deferRegistry.loadAll(),
      dummyStream,
      options.rscPayloadDir,
      context,
    );

    for (const result of entries) {
      await buildSingleEntry(
        result,
        idMapping,
        baseDir,
        base,
        options.rscPayloadDir,
        context,
      );
    }

    for (const { finalId, finalContent, name } of components) {
      const filePath = path.join(
        baseDir,
        getModulePathFor(finalId).replace(/^\//, ""),
      );
      await writeFileNormal(filePath, finalContent, context, name);
    }
  }

  if (entry.buildEntry) {
    await entry.buildEntry({ build: doBuild, outDir: baseDir });
  } else {
    await doBuild();
  }
}

function normalizeBase(base: string): string {
  const normalized = base.endsWith("/") ? base.slice(0, -1) : base;
  return normalized === "/" ? "" : normalized;
}

function replaceIdsInContent(
  content: string,
  idMapping: Map<string, string>,
): string {
  let result = content;
  for (const [oldId, newId] of idMapping) {
    if (oldId !== newId) {
      result = result.replaceAll(oldId, newId);
    }
  }
  return result;
}

async function buildSingleEntry(
  result: EntryBuildResult,
  idMapping: Map<string, string>,
  baseDir: string,
  base: string,
  rscPayloadDir: string,
  context: MinimalPluginContextWithoutEnvironment,
) {
  const { path: entryPath, html, appRsc } = result;

  const htmlContent = await drainStream(html);

  const rawAppRscContent = await drainStream(appRsc);
  const appRscContent = replaceIdsInContent(rawAppRscContent, idMapping);

  const mainPayloadHash = await computeContentHash(appRscContent);
  const mainPayloadPath =
    base === ""
      ? getRscPayloadPath(mainPayloadHash, rscPayloadDir)
      : base + getRscPayloadPath(mainPayloadHash, rscPayloadDir);

  const finalHtmlContent = htmlContent.replaceAll(
    rscPayloadPlaceholder,
    mainPayloadPath,
  );

  await writeFileNormal(
    path.join(baseDir, entryPath),
    finalHtmlContent,
    context,
  );

  await writeFileNormal(
    path.join(
      baseDir,
      getRscPayloadPath(mainPayloadHash, rscPayloadDir).replace(/^\//, ""),
    ),
    appRscContent,
    context,
  );
}

async function writeFileNormal(
  filePath: string,
  data: string,
  context: MinimalPluginContextWithoutEnvironment,
  name?: string,
) {
  await mkdir(path.dirname(filePath), { recursive: true });
  const nameInfo = name ? ` (${name})` : "";
  context.info(`[aurelia] Writing ${filePath}${nameInfo}`);
  await writeFile(filePath, data);
}
