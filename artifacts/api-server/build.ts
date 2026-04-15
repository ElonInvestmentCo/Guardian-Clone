import path from "path";
import { fileURLToPath } from "url";
import { build as esbuild } from "esbuild";
import { rm, readFile } from "fs/promises";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Root of the monorepo (two levels up from artifacts/api-server)
const WORKSPACE_ROOT = path.resolve(__dirname, "..", "..");

// server deps to bundle to reduce openat(2) syscalls
// which helps cold start times without risking some
// packages that are not bundle compatible
const allowlist = [
  "@google/generative-ai",
  "axios",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "pg",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];

function runCmd(
  cmd: string,
  cwd: string = WORKSPACE_ROOT,
  env: Record<string, string> = {},
): void {
  console.log(`\n==> ${cmd}`);
  execSync(cmd, {
    cwd,
    stdio: "inherit",
    env: { ...process.env, ...env },
  });
}

async function buildFrontends(): Promise<void> {
  console.log("\n==> Building guardian-trading frontend...");
  runCmd(
    "pnpm --filter @workspace/guardian-trading run build",
    WORKSPACE_ROOT,
    { BASE_PATH: "/", PORT: "3000" },
  );

  console.log("\n==> Building admin-kyc frontend...");
  runCmd(
    "pnpm --filter @workspace/admin-kyc run build",
    WORKSPACE_ROOT,
    { BASE_PATH: "/admin-kyc/", PORT: "3000" },
  );
}

async function buildServer(): Promise<void> {
  const distDir = path.resolve(__dirname, "dist");
  await rm(distDir, { recursive: true, force: true });

  console.log("\nbuilding server...");
  const pkgPath = path.resolve(__dirname, "package.json");
  const pkg = JSON.parse(await readFile(pkgPath, "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter(
    (dep) =>
      !allowlist.includes(dep) &&
      !(pkg.dependencies?.[dep]?.startsWith("workspace:")),
  );

  await esbuild({
    entryPoints: [path.resolve(__dirname, "src/index.ts")],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: path.resolve(distDir, "index.cjs"),
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: externals,
    logLevel: "info",
  });
}

async function buildAll() {
  await buildFrontends();
  await buildServer();
  console.log("\n==> Production build complete.");
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
