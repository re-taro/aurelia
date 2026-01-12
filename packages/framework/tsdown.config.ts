import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/entry-definition.ts",
    "src/entries/*.ts"
  ],
  external: [/^virtual:/, /^#/],
  format: ["esm"],
  dts: true,
  unbundle: true,
});
