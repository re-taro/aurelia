import type { Context, FC, ReactNode } from "react";
import { createFromFetch } from "@vitejs/plugin-rsc/browser";
import { getModulePathFor } from "../rsc/module";
import { createContext, use } from "react";
import type { LoadedDeferEntry, DeferRegistry } from "../rsc/defer";
import { withBasePath } from "../util/base-path";
import invariant from "tiny-invariant";

interface DeferContextValue {
  registry: DeferRegistry;
  createFromReadableStream: <T>(
    stream: ReadableStream<Uint8Array>,
  ) => Promise<T>;
}

export const RegistryContext: Context<DeferContextValue | undefined> = createContext<DeferContextValue | undefined>(
  undefined,
);

interface DeferredComponentProps {
  moduleID: string;
}

export const DeferredComponent: FC<DeferredComponentProps> = ({
  moduleID,
}) => {
  const deferContext = use(RegistryContext);
  const modulePath = getModulePathFor(moduleID);
  if (deferContext) {
    const entry = deferContext.registry.load(moduleID);
    if (entry == null) {
      throw new Error(`Module entry not found for ID '${moduleID}'`);
    }
    return getRSCStreamFromRegistry(
      entry,
      deferContext.createFromReadableStream,
    );
  }
	const stream = getClientRSCStream(withBasePath(modulePath));
  return use(stream);
};

const moduleToStreamMap = new Map<string, Promise<ReactNode>>();

async function getRSCStreamFromRegistry(
  entry: LoadedDeferEntry,
  createFromReadableStream: <T>(
    stream: ReadableStream<Uint8Array>,
  ) => Promise<T>,
): Promise<ReactNode> {
  switch (entry.state.state) {
    case "streaming": {
      return createFromReadableStream<ReactNode>(entry.state.stream);
    }
    case "ready": {
      const data = await entry.drainPromise;
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          const encoder = new TextEncoder();
          controller.enqueue(encoder.encode(data));
          controller.close();
        },
      });
      return createFromReadableStream<ReactNode>(stream);
    }
    case "error": {
      return Promise.reject(entry.state.error);
    }
  }
}

function getClientRSCStream(modulePath: string) {
  let stream = moduleToStreamMap.get(modulePath);
	if (stream == null) {
    stream = createFromFetch<ReactNode>(fetch(modulePath));
    moduleToStreamMap.set(modulePath, stream);
  }
  return stream;
}
