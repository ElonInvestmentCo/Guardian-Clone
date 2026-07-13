import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const port = Number(process.env.PORT) || 3000;
const apiPort = Number(process.env.API_PORT) || 3001;

export default defineConfig({
  base: "/",
  // Bridge non-VITE_-prefixed Replit secrets into the client build. Vite only
  // auto-exposes env vars prefixed with VITE_, but Cloudflare Turnstire site
  // keys are stored as plain secrets (TURNSTILE_SITE_KEY) since the key itself
  // isn't sensitive but we don't want to force a VITE_ prefix on the secret name.
  define: {
    "import.meta.env.VITE_TURNSTILE_SITE_KEY": JSON.stringify(process.env.TURNSTILE_SITE_KEY ?? ""),
  },
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    hmr: {
      overlay: false,
    },
    watch: {
      ignored: ["**/.local/share/pnpm/**", "**/node_modules/.pnpm/store/**", "**/.git/**"],
    },
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    proxy: {
      "/api": {
        target: `http://localhost:${apiPort}`,
        changeOrigin: true,
        secure: false,
      },
      "/assets": {
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
