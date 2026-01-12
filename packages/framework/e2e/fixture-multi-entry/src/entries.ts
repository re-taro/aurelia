import type { EntryDefinition } from 'framework/entries';

export default function getEntries(): EntryDefinition[] {
  return [
    {
      path: "index.html",
      root: () => import("./root"),
      app: () => import("./pages/Home"),
    },
    {
      path: "about.html",
      root: () => import("./root"),
      app: () => import("./pages/About"),
    },
  ];
}
