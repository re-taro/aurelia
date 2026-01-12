// Client initialization - runs before React (side effects only)
import "virtual:aurelia/client-init";

import {
  createFromReadableStream,
  createFromFetch,
} from "@vitejs/plugin-rsc/browser";
import React, { startTransition, useEffect, useState } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { rscStream } from "rsc-html-stream/client";
import { GlobalErrorBoundary } from "./error-boundary";
import type { RscPayload } from "../rsc/entry";
import { devMainRscPath } from "../rsc/request";
import { appClientManifestVar, type AppClientManifest } from "./definitions";
import { withBasePath } from "../util/base-path";
import { ssr as ssrEnabled } from "virtual:aurelia/config";

async function devMain() {
  let setPayload: (v: RscPayload) => void;

  const initialPayload = await createFromReadableStream<RscPayload>(rscStream);

  function BrowserRoot() {
    const [payload, setPayload_] = useState(initialPayload);

    useEffect(() => {
      setPayload = (v) => startTransition(() => setPayload_(v));
    }, [setPayload_]);

    return payload.root;
  }

  async function fetchRscPayload() {
    const payload = await createFromFetch<RscPayload>(
      fetch(withBasePath(devMainRscPath)),
    );
    setPayload(payload);
  }

  const browserRoot = (
    <React.StrictMode>
      <GlobalErrorBoundary>
        <BrowserRoot />
      </GlobalErrorBoundary>
    </React.StrictMode>
  );

  if (
    // @ts-expect-error
    globalThis.__NO_HYDRATE
  ) {
    createRoot(document).render(browserRoot);
  } else if (ssrEnabled) {
    hydrateRoot(document, browserRoot);
  } else {
    createRoot(document).render(browserRoot);
  }

  if (import.meta.hot) {
    import.meta.hot.on("rsc:update", () => {
      fetchRscPayload();
    });
  }
}

async function prodMain() {
  const manifest: AppClientManifest =
    // @ts-expect-error
    globalThis[appClientManifestVar];

  const payload = await createFromFetch<RscPayload>(fetch(manifest.stream));

  function BrowserRoot() {
    return payload.root;
  }

  if (ssrEnabled) {
    const browserRoot = (
      <React.StrictMode>
        <GlobalErrorBoundary>
          <BrowserRoot />
        </GlobalErrorBoundary>
      </React.StrictMode>
    );

    hydrateRoot(document, browserRoot);
  } else {
    const browserRoot = <BrowserRoot />;
    const appRootId = manifest.marker;

    const appMarker = document.getElementById(appRootId);
    if (appMarker == null) {
      throw new Error(
        `Failed to find app root element by id "${appRootId}". This is likely a bug.`,
      );
    }
    const appRoot = appMarker.parentElement;
    if (appRoot == null) {
      throw new Error(
        `App root element has no parent element. This is likely a bug.`,
      );
    }
    appMarker.remove();

    createRoot(appRoot).render(browserRoot);
  }
}

if (import.meta.env.DEV) {
  devMain();
} else {
  prodMain();
}
