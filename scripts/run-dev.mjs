#!/usr/bin/env node
/**
 * Lance `next dev` sur DEV_PORT (scripts/dev-port.mjs).
 * Usage interne : npm run dev | npm run dev:quick
 */

import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

loadEnv({ path: join(root, ".env.local") });

const { DEV_PORT } = await import("./dev-port.mjs");

const quick = process.argv.includes("--quick");
const host = quick ? "127.0.0.1" : "0.0.0.0";

const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const child = spawn(npx, ["next", "dev", "-H", host, "-p", String(DEV_PORT)], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code) => process.exit(code ?? 0));
