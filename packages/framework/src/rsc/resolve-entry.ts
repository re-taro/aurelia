import { createElement } from "react";
import type { ComponentType, ReactNode } from "react";
import type { EntryDefinition } from "../entry-definition";

export async function resolveRoot(
  root: EntryDefinition["root"],
): Promise<ComponentType<{ children: ReactNode }>> {
  const module = typeof root === "function" ? await root() : await root;
  return module.default;
}

function isAppModule(
  value: unknown,
): value is { default: ComponentType } {
  return (
    typeof value === "object" &&
    value != null &&
    "default" in value &&
    typeof value['default'] === "function"
  );
}

export async function resolveApp(
  app: EntryDefinition["app"],
): Promise<ReactNode> {
  if (typeof app === "function") {
    const module = await app();
    return createElement(module.default);
  }
  if (isAppModule(app)) {
    return createElement(app.default);
  }
  const resolved = await app;
  if (isAppModule(resolved)) {
    return createElement(resolved.default);
	}
  return resolved;
}
