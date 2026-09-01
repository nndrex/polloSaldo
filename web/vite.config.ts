import { defineConfig, type Plugin, type ViteDevServer } from "vite";
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const PRICES_FILE = resolve(ROOT, "../data/prices.json");

function pricesJsonPlugin(): Plugin {
  return {
    name: "pollosaldo-prices-json",
    configureServer(server: ViteDevServer) {
      server.middlewares.use((req, res, next) => {
        const pathname = req.url?.split("?")[0] ?? "";
        if (pathname.endsWith("/prices.json") && existsSync(PRICES_FILE)) {
          res.setHeader("Content-Type", "application/json");
          res.end(readFileSync(PRICES_FILE));
          return;
        }
        next();
      });
    },
    closeBundle() {
      if (existsSync(PRICES_FILE)) {
        mkdirSync(resolve(ROOT, "dist"), { recursive: true });
        copyFileSync(PRICES_FILE, resolve(ROOT, "dist/prices.json"));
      }
    },
  };
}

export default defineConfig({
  base: "/polloSaldo/",
  plugins: [pricesJsonPlugin()],
  server: {
    fs: { allow: [dirname(ROOT)] },
  },
});
