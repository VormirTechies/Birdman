import "dotenv/config";

import { spawnSync } from "node:child_process";
import path from "node:path";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is not set");

const queryStart = uri.indexOf("?");
const base = queryStart === -1 ? uri : uri.slice(0, queryStart);
const query = queryStart === -1 ? "" : uri.slice(queryStart);
const datasourceUrl = base.endsWith("/") ? `${base}birdman${query}` : uri;
const prismaBin = path.join(
  process.cwd(),
  "node_modules",
  ".bin",
  process.platform === "win32" ? "prisma.cmd" : "prisma",
);

const result = spawnSync(prismaBin, process.argv.slice(2), {
  stdio: "inherit",
  env: { ...process.env, MONGODB_URI: datasourceUrl },
});

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
