import { createFromReadableStream } from "@vitejs/plugin-rsc/ssr";
import { use } from "react";
import { renderToReadableStream } from "react-dom/server.edge";
import { prerender } from "react-dom/static";
import { injectRSCPayload } from "rsc-html-stream/server";
import type { RscPayload } from "../rsc/entry";
import { appClientManifestVar } from "../client/definitions";
import { rscPayloadPlaceholder } from "../build/rsc-path";
import { preload } from "react-dom";
import type { DeferRegistry } from "../rsc/defer";
import { RegistryContext } from "#rsc-client";

export async function renderHTML(
  rscStream: ReadableStream<Uint8Array>,
  options: {
    appEntryMarker: string;
    build: boolean;
    ssr?: boolean;
    nonce?: string;
    deferRegistry?: DeferRegistry;
    clientRscStream?: ReadableStream<Uint8Array>;
  },
): Promise<{ stream: ReadableStream<Uint8Array>; status?: number }> {
  const [rscStream1, rscStream2] = rscStream.tee();

  let payload: Promise<RscPayload> | undefined;
  function SsrRoot() {
    payload ??= createFromReadableStream<RscPayload>(rscStream1);
    if (options.build) {
      preload(rscPayloadPlaceholder, {
        crossOrigin: "anonymous",
        as: "fetch",
      });
    }
    return (
      <RegistryContext
        value={
          options.deferRegistry
            ? {
                registry: options.deferRegistry,
                createFromReadableStream,
              }
            : undefined
        }
      >
        {use(payload).root}
      </RegistryContext>
    );
  }

  let bootstrapScriptContent: string = "";
  if (options.build) {
    if (options.ssr) {
      bootstrapScriptContent += `globalThis.${appClientManifestVar}={stream:"${rscPayloadPlaceholder}"};\n`;
    } else {
      bootstrapScriptContent += `globalThis.${appClientManifestVar}={marker:"${options.appEntryMarker}",stream:"${rscPayloadPlaceholder}"};\n`;
    }
  }
  bootstrapScriptContent +=
    await import.meta.viteRsc.loadBootstrapScriptContent("index");

  let htmlStream: ReadableStream<Uint8Array>;
  let status: number | undefined;
  try {
    if (options.build) {
      const { prelude, postponed } = await prerender(<SsrRoot />, {
        bootstrapScriptContent,
      });
      if (postponed != null) {
        throw new Error("Unexpected postponed state during prerendering");
      }

      htmlStream = prelude;
    } else {
      htmlStream = await renderToReadableStream(<SsrRoot />, {
        bootstrapScriptContent,
        nonce: options?.nonce,
      });
    }
  } catch (e) {
    if (options.build) {
      throw e;
    }
    status = 500;
    htmlStream = await renderToReadableStream(
      <html>
        <body>
          <noscript>Internal Server Error: SSR failed</noscript>
        </body>
      </html>,
      {
        bootstrapScriptContent:
          `globalThis.__NO_HYDRATE=1;` + bootstrapScriptContent,
        nonce: options?.nonce,
      },
    );
  }

  let responseStream = htmlStream;

  if (!options.build) {
    const streamToInject = options.clientRscStream ?? rscStream2;
    responseStream = responseStream.pipeThrough(
      injectRSCPayload(streamToInject, {
        nonce: options?.nonce,
      }),
    );
  }

  return { stream: responseStream, status };
}
