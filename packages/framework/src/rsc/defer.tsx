import type { ReactElement, ReactNode } from "react";
import { renderToReadableStream } from "@vitejs/plugin-rsc/react/rsc";
import { DeferredComponent } from "#rsc-client";
import { drainStream } from "../util/drain-stream";
import { getPayloadIDFor } from "./module";
import { rscPayloadDir } from "virtual:aurelia/config";

export interface DeferEntry {
  state: DeferEntryState;
  name?: string;
  drainPromise?: Promise<string>;
}

export interface DeferOptions {
  name?: string;
}

export interface LoadedDeferEntry extends DeferEntry {
  state: Exclude<DeferEntryState, { state: "pending" }>;
  drainPromise: Promise<string>;
}

type DeferEntryState =
  | {
      state: "pending";
      element: ReactElement;
    }
  | {
      state: "streaming";
      stream: ReadableStream<Uint8Array>;
    }
  | {
      state: "ready";
    }
  | {
      state: "error";
      error: unknown;
    };

function sanitizeName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 50);
}


type Result = { id: string; data: string; name?: string }

export class DeferRegistry {
  #registry = new Map<string, DeferEntry>();

  register(element: ReactElement, id: string, name?: string): void {
    this.#registry.set(id, { state: { element, state: "pending" }, name });
  }

  load(id: string): LoadedDeferEntry | undefined {
    const entry = this.#registry.get(id);
    if (entry == null) {
      return undefined;
    }
    return this.#loadEntry(entry);
  }

  #loadEntry(entry: DeferEntry): LoadedDeferEntry {
    const { state } = entry;
    switch (state.state) {
      case "pending": {
        const stream = renderToReadableStream<ReactNode>(state.element);
        const [stream1, stream2] = stream.tee();
        entry.state = { state: "streaming", stream: stream1 };
        const drainPromise = drainStream(stream2);
        entry.drainPromise = drainPromise;
        drainPromise.then(
          () => {
            entry.state = { state: "ready" };
          },
          (error: unknown) => {
            entry.state = { state: "error", error };
          },
        );
        return entry as LoadedDeferEntry;
      }
      case "streaming":
      case "ready":
      case "error":
        return entry as LoadedDeferEntry;
    }
  }

  has(id: string): boolean {
    return this.#registry.has(id);
  }

  async *loadAll():AsyncGenerator<Result, void, unknown> {
    const errors: unknown[] = [];

    const loadedEntries = Array.from(this.#registry, ([id, entry]) => {
      const loaded = this.#loadEntry(entry);
      return [id, loaded.drainPromise, entry.name] as const;
    });

    if (loadedEntries.length === 0) return;

    const completed: Array<Result | { error: unknown }> = [];
    let waiting: (() => void) | undefined;
    let remainingCount = loadedEntries.length;

    const onComplete = (result: Result | { error: unknown }) => {
      completed.push(result);
      remainingCount--;
      waiting?.();
    };

    for (const [id, drainPromise, name] of loadedEntries) {
      drainPromise.then(
        (data) => onComplete({ id, data, name }),
        (error) => onComplete({ error }),
      );
    }

    while (remainingCount > 0 || completed.length > 0) {
      if (completed.length === 0) {
        await new Promise<void>((r) => {
          waiting = r;
        });
        waiting = undefined;
      }
      for (const result of completed.splice(0)) {
        if ("error" in result) {
          errors.push(result.error);
        } else {
          yield result;
        }
      }
    }

    if (errors.length > 0) {
      throw new AggregateError(errors);
    }
  }
}

export const deferRegistry: DeferRegistry = new DeferRegistry();

export function defer(
  element: ReactElement,
  options?: DeferOptions,
): ReactNode {
  const name = options?.name;
  const sanitizedName = name ? sanitizeName(name) : undefined;
  const rawId = sanitizedName
    ? `${sanitizedName}-${crypto.randomUUID()}`
    : crypto.randomUUID();
  const id = getPayloadIDFor(rawId, rscPayloadDir);
  deferRegistry.register(element, id, name);

  return <DeferredComponent moduleID={id} />;
}
