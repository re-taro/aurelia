import path from "node:path";
import { normalizePath, type Plugin } from "vite";
import rsc from "@vitejs/plugin-rsc";
import { build } from "../build/app";
import { serverPlugin } from "./server";
import { defaultRscPayloadDir } from "../rsc/module";

interface AureliaBaseOptions {
  publicOutDir?: string;
  ssr?: boolean;
  clientInit?: string;
  rscPayloadDir?: string;
  build?: string;
}

interface SingleEntryOptions {
  root: string;
  app: string;
  entries?: never;
}

interface MultipleEntriesOptions {
  root?: never;
  app?: never;
  entries: string;
}

export type AureliaOptions = AureliaBaseOptions &
  (SingleEntryOptions | MultipleEntriesOptions);

export default function aurelia(
  options: AureliaOptions,
): (Plugin | Plugin[])[] {
  const {
    publicOutDir = "dist/public",
    ssr = false,
    clientInit,
    rscPayloadDir = defaultRscPayloadDir,
  } = options;

  if (
    !rscPayloadDir ||
    rscPayloadDir.includes("/") ||
    rscPayloadDir.includes("\\") ||
    rscPayloadDir === ".." ||
    rscPayloadDir === "."
  ) {
    throw new Error(
      `[aurelia] Invalid rscPayloadDir: "${rscPayloadDir}". Must be a non-empty single path segment without slashes.`,
    );
  }

  let resolvedEntriesModule: string = "__uninitialized__";
  let resolvedClientInitEntry: string | undefined;
  let resolvedBuildEntry: string | undefined;

  const isMultiEntry = "entries" in options && options.entries !== undefined;

  return [
    {
      name: "aurelia:config-pre",
      config(config) {
        return {
          environments: {
            client: {
              build: {
                outDir:
                  config.environments?.['client']?.build?.outDir ?? publicOutDir,
              },
            },
          },
        };
      },
    },
    serverPlugin(),
    rsc({
      entries: {
        rsc: "framework/entries/rsc",
        ssr: "framework/entries/ssr",
        client: "framework/entries/client",
      },
      serverHandler: false,
    }),
    {
      name: "framework:config",
      configResolved(config) {
        if (isMultiEntry) {
          resolvedEntriesModule = normalizePath(
            path.resolve(config.root, options.entries),
          );
        } else {
          const resolvedRoot = normalizePath(
            path.resolve(config.root, options.root),
          );
          const resolvedApp = normalizePath(
            path.resolve(config.root, options.app),
          );
          resolvedEntriesModule = JSON.stringify({
            root: resolvedRoot,
            app: resolvedApp,
          });
        }
        if (clientInit) {
          resolvedClientInitEntry = normalizePath(
            path.resolve(config.root, clientInit),
          );
        }
        if (options.build) {
          resolvedBuildEntry = normalizePath(
            path.resolve(config.root, options.build),
          );
        }
      },
      configEnvironment(_name, config) {
        if (!config.optimizeDeps) {
          config.optimizeDeps = {};
        }
        if (config.optimizeDeps.include) {
          config.optimizeDeps.include = config.optimizeDeps.include.map(
            (entry) => {
              if (entry.startsWith("@vitejs/plugin-rsc")) {
                entry = `framework > ${entry}`;
              }
              return entry;
            },
          );
        }
        if (!config.optimizeDeps.exclude) {
          config.optimizeDeps.exclude = [];
        }
        // Since code includes imports to virtual modules, we need to exclude
        // us from Optimize Deps.
        config.optimizeDeps.exclude.push("framework");
      },
    },
    {
      name: "framework:virtual-entry",
      resolveId(id) {
        if (id === "virtual:aurelia/entries") {
          return "\0virtual:aurelia/entries";
        }
        if (id === "virtual:aurelia/config") {
          return "\0virtual:aurelia/config";
        }
        if (id === "virtual:aurelia/client-init") {
          return "\0virtual:aurelia/client-init";
        }
        if (id === "virtual:aurelia/build-entry") {
          return "\0virtual:aurelia/build-entry";
				}
        return
      },
      load(id) {
        if (id === "\0virtual:aurelia/entries") {
          if (isMultiEntry) {
            return `export { default } from "${resolvedEntriesModule}";`;
          }
          const { root, app } = JSON.parse(resolvedEntriesModule);
          return [
            `import Root from "${root}";`,
            `import App from "${app}";`,
            `export default function getEntries() {`,
            `  return [{ path: "index.html", root: { default: Root }, app: { default: App } }];`,
            `}`,
          ].join("\n");
        }
        if (id === "\0virtual:aurelia/config") {
          return [
            `export const ssr = ${JSON.stringify(ssr)};`,
            `export const rscPayloadDir = ${JSON.stringify(rscPayloadDir)};`,
          ].join("\n");
        }
        if (id === "\0virtual:aurelia/client-init") {
          if (resolvedClientInitEntry) {
            return `import "${resolvedClientInitEntry}";`;
          }
          return "";
        }
        if (id === "\0virtual:aurelia/build-entry") {
          if (resolvedBuildEntry) {
            return `export { default } from "${resolvedBuildEntry}";`;
          }
          return "export default undefined;";
				}
        return
      },
    },
    {
      name: "aurelia:build",
      async buildApp(builder) {
        await build(builder, this, { rscPayloadDir });
      },
    },
  ];
}
