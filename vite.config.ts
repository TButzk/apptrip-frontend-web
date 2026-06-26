import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? "/apptrip-react/",
  plugins: [react()],
  server: {
    proxy: {
      "/map-tiles": {
        target: "https://tile.openstreetmap.org",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/map-tiles/, ""),
        headers: {
          "User-Agent": "AppTrip/1.0 (+https://github.com/AppTrip)"
        }
      }
    }
  },
  resolve: {
    alias: {
      components: path.resolve(__dirname, "src/components"),
      hooks: path.resolve(__dirname, "src/hooks"),
      pages: path.resolve(__dirname, "src/pages"),
      routes: path.resolve(__dirname, "src/routes"),
      services: path.resolve(__dirname, "src/services"),
      types: path.resolve(__dirname, "src/types"),
      utils: path.resolve(__dirname, "src/utils")
    }
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts"
  }
});
