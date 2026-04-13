import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: process.env.VITE_PUBLIC_BASE ?? "/",
  publicDir: "../../assets",
  server: {
    port: 5173,
    strictPort: true
  },
  plugins: [react()],
  css: {
    postcss: {
      plugins: []
    }
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    globals: true
  }
});
