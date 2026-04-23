import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * Execute a shell command and return the output
 */
export async function executeCommand(command: string, cwd?: string): Promise<string> {
  try {
    const { stdout } = await execAsync(command, { cwd: cwd || process.cwd() });
    return stdout.trim();
  } catch (error: any) {
    throw new Error(`Command failed: ${error.message}`);
  }
}

/**
 * Check if a file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Read and parse JSON file
 */
export async function readJsonFile<T>(filePath: string): Promise<T> {
  const content = await fs.readFile(filePath, "utf-8");
  return JSON.parse(content) as T;
}

/**
 * Get repository root directory
 */
export async function getRepoRoot(): Promise<string> {
  const cwd = process.cwd();
  // If we're in mcp-agent-template, go up one level
  if (cwd.endsWith("mcp-agent-template")) {
    return path.dirname(cwd);
  }
  return cwd;
}

/**
 * Get all package directories
 */
export async function getPackages(): Promise<string[]> {
  const repoRoot = await getRepoRoot();
  const packagesDir = path.join(repoRoot, "packages");
  
  try {
    const entries = await fs.readdir(packagesDir, { withFileTypes: true });
    return entries
      .filter(entry => entry.isDirectory() && entry.name.startsWith("aero-"))
      .map(entry => entry.name);
  } catch {
    return [];
  }
}

/**
 * Read composer.json from a package
 */
export async function readPackageComposer(packageName: string): Promise<any> {
  const repoRoot = await getRepoRoot();
  const composerPath = path.join(repoRoot, "packages", packageName, "composer.json");
  
  if (await fileExists(composerPath)) {
    return await readJsonFile(composerPath);
  }
  return null;
}

/**
 * Format output as JSON
 */
export function formatJson(data: any): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Log with timestamp
 */
export function log(message: string): void {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

/**
 * Error logging
 */
export function logError(message: string, error?: any): void {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ERROR: ${message}`);
  if (error) {
    console.error(error);
  }
}
