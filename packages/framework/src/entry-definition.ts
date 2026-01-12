import type { ComponentType, ReactNode } from "react";

export type MaybePromise<T> = T | Promise<T>;

export type RootModule = {
  default: ComponentType<{ children: ReactNode }>;
};

export type AppModule = { default: ComponentType };

export interface EntryDefinition {
  path: string;
  root: MaybePromise<RootModule> | (() => MaybePromise<RootModule>);
  app: ReactNode | MaybePromise<AppModule> | (() => MaybePromise<AppModule>);
}

export type GetEntriesResult =
  | Iterable<EntryDefinition>
  | AsyncIterable<EntryDefinition>;
