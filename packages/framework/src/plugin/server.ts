import { isRunnableDevEnvironment, type Plugin } from "vite";
import { readFile } from "node:fs/promises";
import { toNodeHandler } from "srvx/node";
import path from "node:path";
import { getRSCEntryPoint } from "./get-rsc-entrypoint";
import { urlPathToFileCandidates } from "../util/url-path";
import invariant from "tiny-invariant";

export const serverPlugin = (): Plugin => {
  let resolvedOutDir = "__uninitialized__";
  return {
    name: "aurelia:server",
		configResolved(config) {
			invariant(config.environments['client'], 'Expect client environment is set to config')
      resolvedOutDir = path.resolve(
        config.root,
        config.environments['client'].build.outDir,
      );
    },
		configureServer(server) {
			invariant(server.environments['rsc'], 'Expect client environment is set to server')
      const rscEnv = server.environments['rsc'];
      if (!isRunnableDevEnvironment(rscEnv)) {
        throw new Error("The rsc environment is not runnable");
      }

      return () => {
        server.middlewares.use(async (req, res, next) => {
          try {
            const rscEntry = await getRSCEntryPoint(rscEnv);
            if (req.headers.accept?.includes("text/html")) {
							const fetchHandler = toNodeHandler(rscEntry.serveHTML);
							// @ts-expect-error TS2345
              await fetchHandler(req, res);
              return;
            }
            const fetchHandler = toNodeHandler(rscEntry.serveRSC);
						try {
							// @ts-expect-error TS2345
              await fetchHandler(req, res);
            } catch (error) {
              if (rscEntry.isServeRSCError(error) && error.status === 404) {
                next();
                return;
              }
              next(error);
            }
          } catch (error) {
            next(error);
          }
        });
      };
    },
    configurePreviewServer(server) {
      return () => {
        server.middlewares.use(async (req, res, next) => {
          try {
            if (req.headers.accept?.includes("text/html")) {
              const urlPath = new URL(req.url!, `http://${req.headers.host}`)
                .pathname;
              const candidates = urlPathToFileCandidates(urlPath);
              for (const candidate of candidates) {
                try {
                  const html = await readFile(
                    path.join(resolvedOutDir, candidate),
                    "utf-8",
                  );
                  res.end(html);
                  return;
                } catch {
                  // Try next candidate
                }
              }
              for (const indexFile of ["index.html", "index.htm"]) {
                try {
                  const html = await readFile(
                    path.join(resolvedOutDir, indexFile),
                    "utf-8",
                  );
                  res.end(html);
                  return;
                } catch {
                  // Try next candidate
                }
              }
              next();
              return;
            }
          } catch (error) {
            next(error);
            return;
          }
          next();
        });
      };
    },
  };
};
