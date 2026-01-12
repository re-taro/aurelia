import { drainStream } from "../util/drain-stream";
import { getPayloadIDFor } from "../rsc/module";
import { computeContentHash } from "./content-hash";
import { findReferencedIds, topologicalSort } from "./dependency-graph";
import invariant from "tiny-invariant";

export interface ProcessedComponent {
  finalId: string;
  finalContent: string;
  name?: string;
}

export interface ProcessResult {
  components: ProcessedComponent[];
  appRscContent: string;
  idMapping: Map<string, string>;
}

interface RawComponent {
  id: string;
  data: string;
  name?: string;
}

export async function processRscComponents(
  deferRegistryIterator: AsyncIterable<RawComponent>,
  appRscStream: ReadableStream,
  rscPayloadDir: string,
  context?: { warn: (message: string) => void },
): Promise<ProcessResult> {
  const components = new Map<string, string>();
  const componentNames = new Map<string, string | undefined>();
  for await (const { id, data, name } of deferRegistryIterator) {
    components.set(id, data);
    componentNames.set(id, name);
  }

  let appRscContent = await drainStream(appRscStream);

  if (components.size === 0) {
    return {
      components: [],
      appRscContent,
      idMapping: new Map(),
    };
  }

  const allIds = new Set(components.keys());

  const dependencies = new Map<string, Set<string>>();
  for (const [id, content] of components) {
    const otherIds = new Set(allIds);
    otherIds.delete(id);
    const refs = findReferencedIds(content, otherIds);
    dependencies.set(id, refs);
  }

  const { sorted, inCycle } = topologicalSort(dependencies);

  const idMapping = new Map<string, string>();

  if (inCycle.length > 0) {
    context?.warn(
      `[aurelia] Warning: ${inCycle.length} RSC component(s) are in dependency cycles and will keep unstable IDs: ${inCycle.join(", ")}`,
    );
    for (const id of inCycle) {
      idMapping.set(id, id);
    }
  }

  const processedComponents: ProcessedComponent[] = [];

  for (const tempId of sorted) {
    let content = components.get(tempId)!;

    for (const [oldId, newId] of idMapping) {
      if (oldId !== newId) {
        content = content.replaceAll(oldId, newId);
      }
    }

    const contentHash = await computeContentHash(content);
    const finalId = getPayloadIDFor(contentHash, rscPayloadDir);

    idMapping.set(tempId, finalId);

    processedComponents.push({
      finalId,
      finalContent: content,
      name: componentNames.get(tempId),
    });
  }

  for (const tempId of inCycle) {
		let content = components.get(tempId);
		invariant(content, 'Expect content to be exist')

    for (const [oldId, newId] of idMapping) {
      if (oldId !== newId) {
        content = content.replaceAll(oldId, newId);
      }
    }

    processedComponents.push({
      finalId: tempId,
      finalContent: content,
      name: componentNames.get(tempId),
    });
  }

  for (const [oldId, newId] of idMapping) {
    if (oldId !== newId) {
      appRscContent = appRscContent.replaceAll(oldId, newId);
    }
  }

  return {
    components: processedComponents,
    appRscContent,
    idMapping,
  };
}
