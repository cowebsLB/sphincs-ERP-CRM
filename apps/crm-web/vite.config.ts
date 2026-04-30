import { defineConfig } from "vite";

export default defineConfig({
  base: process.env.VITE_PUBLIC_BASE ?? "/",
  publicDir: "../../assets",
  server: {
    port: 5174,
    strictPort: true
  },
  test: {
    environment: "node",
    globals: true
  }
});
