import aurelia from "framework";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    aurelia({
      entries: "./src/entries.ts",
    }),
    react(),
  ],
});
