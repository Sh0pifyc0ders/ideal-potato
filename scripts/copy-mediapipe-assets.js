import fs from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const sourceDir = path.join(
  projectRoot,
  "node_modules",
  "@mediapipe",
  "tasks-vision",
  "wasm"
);
const targetDir = path.join(projectRoot, "client", "public", "mediapipe");

if (!fs.existsSync(sourceDir)) {
  console.warn(
    `[mediapipe] Source assets not found at ${sourceDir}. Install dependencies before copying.`
  );
  process.exit(0);
}

fs.rmSync(targetDir, { recursive: true, force: true });
fs.mkdirSync(targetDir, { recursive: true });
fs.cpSync(sourceDir, targetDir, { recursive: true });

console.log(`[mediapipe] Copied assets to ${targetDir}`);
