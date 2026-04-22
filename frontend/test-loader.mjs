// Node loader to resolve @/ alias used by Vite/CRA at runtime when running tests with `node`
import { fileURLToPath, pathToFileURL } from "node:url";
import { existsSync } from "node:fs";
import { dirname, resolve as pathResolve } from "node:path";

const SRC_DIR = pathResolve(dirname(fileURLToPath(import.meta.url)), "src");

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const rel = specifier.slice(2);
    const candidates = [
      pathResolve(SRC_DIR, rel),
      pathResolve(SRC_DIR, rel + ".js"),
      pathResolve(SRC_DIR, rel + ".mjs"),
      pathResolve(SRC_DIR, rel, "index.js"),
    ];
    for (const c of candidates) {
      if (existsSync(c)) return nextResolve(pathToFileURL(c).href, context);
    }
  }
  return nextResolve(specifier, context);
}

export const resolve_ = resolve;
