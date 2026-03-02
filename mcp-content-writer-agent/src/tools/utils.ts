import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/** Execute a shell command and return stdout */
export async function executeCommand(command: string, cwd?: string): Promise<string> {
  try {
    const { stdout } = await execAsync(command, { cwd: cwd || process.cwd() });
    return stdout.trim();
  } catch (error: any) {
    throw new Error(`Command failed: ${error.message}`);
  }
}

/** Check if a path exists */
export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/** Read a file safely, returning null if missing */
export async function readFileSafe(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, "utf-8");
  } catch {
    return null;
  }
}

/** Read and parse a JSON file */
export async function readJsonFile<T>(filePath: string): Promise<T | null> {
  const content = await readFileSafe(filePath);
  if (!content) return null;
  try {
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

/**
 * Resolve the monorepo root.
 * When running from within mcp-content-writer-agent/, go up one level.
 */
export async function getRepoRoot(): Promise<string> {
  const cwd = process.cwd();
  if (cwd.endsWith("mcp-content-writer-agent")) {
    return path.dirname(cwd);
  }
  return cwd;
}

/** Return all aero-* package directory names */
export async function getPackages(): Promise<string[]> {
  const repoRoot = await getRepoRoot();
  const packagesDir = path.join(repoRoot, "packages");
  try {
    const entries = await fs.readdir(packagesDir, { withFileTypes: true });
    return entries
      .filter((e) => e.isDirectory() && e.name.startsWith("aero-"))
      .map((e) => e.name);
  } catch {
    return [];
  }
}

/** Pretty-print a value as formatted JSON */
export function formatJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

/** Simple stdout logger */
export function log(message: string): void {
  process.stderr.write(`[content-writer] ${message}\n`);
}

/** Error logger */
export function logError(message: string, error?: unknown): void {
  process.stderr.write(`[content-writer][ERROR] ${message}: ${error}\n`);
}
