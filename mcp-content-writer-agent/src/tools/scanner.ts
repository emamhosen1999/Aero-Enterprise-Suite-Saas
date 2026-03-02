/**
 * scanner.ts — Reads source files from packages to extract metadata
 * used by content generation tools.
 */
import fs from "fs/promises";
import path from "path";
import glob from "fast-glob";
import { getRepoRoot, getPackages, pathExists, readFileSafe, readJsonFile } from "./utils.js";

export interface PackageSummary {
  name: string;
  description: string;
  type: string;
  version: string;
  dependencies: string[];
  models: string[];
  controllers: string[];
  routes: RouteEntry[];
  migrations: string[];
  pages: string[];
  services: string[];
  hasTests: boolean;
  readmeExists: boolean;
}

export interface RouteEntry {
  method: string;
  uri: string;
  name: string;
  action: string;
}

/** Extract route entries from a PHP route file */
async function parseRouteFile(filePath: string, pkg: string): Promise<RouteEntry[]> {
  const content = await readFileSafe(filePath);
  if (!content) return [];

  const routes: RouteEntry[] = [];
  const regex = /Route::(get|post|put|patch|delete|resource|apiResource)\s*\(\s*['"]([^'"]+)['"]/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    const nameMatch = /->name\s*\(\s*['"]([^'"]+)['"]\s*\)/.exec(
      content.slice(match.index, match.index + 300)
    );
    routes.push({
      method: match[1].toUpperCase(),
      uri: match[2],
      name: nameMatch ? nameMatch[1] : "",
      action: pkg,
    });
  }
  return routes;
}

/** Scan a single package and return its summary */
export async function scanPackage(packageName: string): Promise<PackageSummary> {
  const repoRoot = await getRepoRoot();
  const pkgRoot = path.join(repoRoot, "packages", packageName);

  // composer.json
  const composerData = await readJsonFile<any>(path.join(pkgRoot, "composer.json"));
  const description: string = composerData?.description ?? "";
  const version: string = composerData?.version ?? "dev-main";
  const rawDeps: Record<string, string> = {
    ...(composerData?.require ?? {}),
    ...(composerData?.["require-dev"] ?? {}),
  };
  const dependencies = Object.keys(rawDeps).filter((d) => d.startsWith("aero/"));

  // Models
  const modelsDir = path.join(pkgRoot, "src", "Models");
  const modelFiles = (await pathExists(modelsDir))
    ? await glob("*.php", { cwd: modelsDir })
    : [];
  const models = modelFiles.map((f) => f.replace(".php", ""));

  // Controllers
  const controllersDir = path.join(pkgRoot, "src", "Http", "Controllers");
  const controllerFiles = (await pathExists(controllersDir))
    ? await glob("**/*.php", { cwd: controllersDir })
    : [];
  const controllers = controllerFiles.map((f) => f.replace(".php", ""));

  // Routes
  const routesDir = path.join(pkgRoot, "routes");
  let routes: RouteEntry[] = [];
  if (await pathExists(routesDir)) {
    const routeFiles = await glob("*.php", { cwd: routesDir });
    for (const rf of routeFiles) {
      const parsed = await parseRouteFile(path.join(routesDir, rf), packageName);
      routes = routes.concat(parsed);
    }
  }

  // Migrations
  const migrationsDir = path.join(pkgRoot, "database", "migrations");
  const migrationFiles = (await pathExists(migrationsDir))
    ? await glob("*.php", { cwd: migrationsDir })
    : [];
  const migrations = migrationFiles.map((f) => f.replace(".php", ""));

  // Pages (React)
  const pagesDir = path.join(pkgRoot, "resources", "js", "Pages");
  const pageFiles = (await pathExists(pagesDir))
    ? await glob("**/*.{jsx,tsx}", { cwd: pagesDir })
    : [];
  const pages = pageFiles;

  // Services
  const servicesDir = path.join(pkgRoot, "src", "Services");
  const serviceFiles = (await pathExists(servicesDir))
    ? await glob("*.php", { cwd: servicesDir })
    : [];
  const services = serviceFiles.map((f) => f.replace(".php", ""));

  // Tests
  const testsDir = path.join(pkgRoot, "tests");
  const hasTests = await pathExists(testsDir);

  // README
  const readmeExists = await pathExists(path.join(pkgRoot, "README.md"));

  // Determine type
  let type = "module";
  if (packageName === "aero-core") type = "required";
  else if (packageName === "aero-platform") type = "saas-only";
  else if (packageName === "aero-ui") type = "ui";

  return {
    name: packageName,
    description,
    type,
    version,
    dependencies,
    models,
    controllers,
    routes,
    migrations,
    pages,
    services,
    hasTests,
    readmeExists,
  };
}

/** Scan ALL packages and return their summaries */
export async function scanAllPackages(): Promise<PackageSummary[]> {
  const packages = await getPackages();
  const summaries: PackageSummary[] = [];
  for (const pkg of packages) {
    summaries.push(await scanPackage(pkg));
  }
  return summaries;
}

/** Read the existing README (if any) for a package */
export async function readPackageReadme(packageName: string): Promise<string | null> {
  const repoRoot = await getRepoRoot();
  return readFileSafe(path.join(repoRoot, "packages", packageName, "README.md"));
}

/** Read git log for the repo */
export async function getGitLog(limit = 20, path?: string): Promise<string> {
  const { executeCommand, getRepoRoot } = await import("./utils.js");
  const root = await getRepoRoot();
  const pathArg = path ? `-- "${path}"` : "";
  try {
    return await executeCommand(
      `git log --oneline --no-merges -n ${limit} ${pathArg}`,
      root
    );
  } catch {
    return "";
  }
}

/** Read git log for a specific package */
export async function getPackageGitLog(packageName: string, limit = 20): Promise<string> {
  const repoRoot = await getRepoRoot();
  const pkgPath = path.join("packages", packageName);
  return getGitLog(limit, pkgPath);
}
