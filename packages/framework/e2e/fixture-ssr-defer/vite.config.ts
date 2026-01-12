import aurelia from "framework";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    aurelia({
      root: "./src/root.tsx",
      app: "./src/App.tsx",
      ssr: true,
    }),
    react(),
  ],
});
