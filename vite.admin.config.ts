import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const port = Number(process.env.PORT) || 8080;
const apiPort = Number(process.env.API_PORT) || 3001;

export default defineConfig({
  base: "/admin-kyc/",
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
  ],
  optimizeDeps: {
    force: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "admin"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname, "admin"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/admin-kyc"),
    emptyOutDir: true,
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    watch: {
      ignored: ["**/.local/share/pnpm/**", "**/node_modules/.pnpm/store/**", "**/.git/**"],
    },
    fs: {
      strict: false,
    },
    proxy: {
      "/api/realtime": {
        target: `http://localhost:${apiPort}`,
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      "/api": {
        target: `http://localhost:${apiPort}`,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
