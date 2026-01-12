import invariant from "tiny-invariant";

export interface SortResult {
  sorted: string[];
  inCycle: string[];
}

export function findReferencedIds(
  content: string,
  allKnownIds: Set<string>,
): Set<string> {
  const referenced = new Set<string>();
  for (const id of allKnownIds) {
    if (content.includes(id)) {
      referenced.add(id);
    }
  }
  return referenced;
}

export function topologicalSort(
  dependencies: Map<string, Set<string>>,
): SortResult {
  const allNodes = new Set(dependencies.keys());

  const inDegree = new Map<string, number>();
  for (const node of allNodes) {
    inDegree.set(node, 0);
  }

  for (const [_node, deps] of dependencies) {
    for (const dep of deps) {
      if (allNodes.has(dep)) {
        inDegree.set(dep, (inDegree.get(dep) ?? 0) + 1);
      }
    }
  }

  const queue: string[] = [];
  for (const [node, degree] of inDegree) {
    if (degree === 0) {
      queue.push(node);
    }
  }

  const sorted: string[] = [];

  while (queue.length > 0) {
		const node = queue.shift();
		invariant(node, 'Expect node to be exist');

    sorted.push(node);

    const deps = dependencies.get(node);
    if (deps) {
      for (const dep of deps) {
        if (allNodes.has(dep)) {
          const newDegree = (inDegree.get(dep) ?? 1) - 1;
          inDegree.set(dep, newDegree);
          if (newDegree === 0) {
            queue.push(dep);
          }
        }
      }
    }
  }

  const inCycle: string[] = [];
  for (const node of allNodes) {
    if (!sorted.includes(node)) {
      inCycle.push(node);
    }
  }

  return { sorted, inCycle };
}
