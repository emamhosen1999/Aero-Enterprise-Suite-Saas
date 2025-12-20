import fs from "fs/promises";
import path from "path";
import glob from "fast-glob";
import { getRepoRoot, getPackages, fileExists } from "./utils.js";

interface ModelInfo {
  name: string;
  package: string;
  path: string;
  namespace?: string;
  traits?: string[];
}

interface RouteInfo {
  method: string;
  uri: string;
  name?: string;
  action: string;
  middleware?: string[];
  package: string;
}

interface MigrationInfo {
  filename: string;
  package: string;
  timestamp: string;
  description: string;
}

/**
 * List all Eloquent models across packages
 */
export async function listModels(): Promise<ModelInfo[]> {
  const repoRoot = await getRepoRoot();
  const packages = await getPackages();
  const models: ModelInfo[] = [];

  for (const pkg of packages) {
    const modelsDir = path.join(repoRoot, "packages", pkg, "src", "Models");
    
    if (await fileExists(modelsDir)) {
      const modelFiles = await glob("*.php", { cwd: modelsDir, absolute: false });
      
      for (const file of modelFiles) {
        const modelPath = path.join(modelsDir, file);
        const content = await fs.readFile(modelPath, "utf-8");
        
        // Extract namespace
        const namespaceMatch = content.match(/namespace\s+([\w\\]+);/);
        const namespace = namespaceMatch ? namespaceMatch[1] : undefined;
        
        // Extract traits
        const traitMatches = content.match(/use\s+([\w\\]+);/g) || [];
        const traits = traitMatches
          .map(t => t.replace(/use\s+/, "").replace(";", ""))
          .filter(t => t.includes("\\Traits\\") || t.includes("HasFactory") || t.includes("SoftDeletes"));
        
        models.push({
          name: file.replace(".php", ""),
          package: pkg,
          path: path.relative(repoRoot, modelPath),
          namespace,
          traits,
        });
      }
    }
  }

  return models;
}

/**
 * List all routes from route files
 */
export async function listRoutes(): Promise<RouteInfo[]> {
  const repoRoot = await getRepoRoot();
  const packages = await getPackages();
  const routes: RouteInfo[] = [];

  for (const pkg of packages) {
    const routesDir = path.join(repoRoot, "packages", pkg, "routes");
    
    if (await fileExists(routesDir)) {
      const routeFiles = await glob("*.php", { cwd: routesDir, absolute: false });
      
      for (const file of routeFiles) {
        const routePath = path.join(routesDir, file);
        const content = await fs.readFile(routePath, "utf-8");
        
        // Simple regex-based route extraction (not perfect but good enough for MCP)
        const routePatterns = [
          /Route::(get|post|put|patch|delete|any)\s*\(\s*['"]([^'"]+)['"]\s*,\s*(?:\[([^\]]+)\]|['"]([^'"]+)['"])/g,
          /Route::(get|post|put|patch|delete|any)\s*\(\s*['"]([^'"]+)['"]\s*\)\s*->\s*name\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
        ];
        
        for (const pattern of routePatterns) {
          let match;
          while ((match = pattern.exec(content)) !== null) {
            routes.push({
              method: match[1].toUpperCase(),
              uri: match[2],
              name: match[3] || undefined,
              action: match[4] || match[3] || "Controller",
              package: pkg,
            });
          }
        }
      }
    }
  }

  return routes;
}

/**
 * List all migrations
 */
export async function listMigrations(): Promise<MigrationInfo[]> {
  const repoRoot = await getRepoRoot();
  const packages = await getPackages();
  const migrations: MigrationInfo[] = [];

  for (const pkg of packages) {
    const migrationsDir = path.join(repoRoot, "packages", pkg, "database", "migrations");
    
    if (await fileExists(migrationsDir)) {
      const migrationFiles = await glob("*.php", { cwd: migrationsDir, absolute: false });
      
      for (const file of migrationFiles) {
        // Extract timestamp and description from filename
        // Format: YYYY_MM_DD_HHMMSS_description.php
        const match = file.match(/^(\d{4}_\d{2}_\d{2}_\d{6})_(.+)\.php$/);
        
        if (match) {
          migrations.push({
            filename: file,
            package: pkg,
            timestamp: match[1],
            description: match[2].replace(/_/g, " "),
          });
        }
      }
    }
  }

  // Sort by timestamp
  migrations.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  return migrations;
}

/**
 * Get controllers for a package
 */
export async function listControllers(packageName?: string): Promise<any[]> {
  const repoRoot = await getRepoRoot();
  const packages = packageName ? [packageName] : await getPackages();
  const controllers: any[] = [];

  for (const pkg of packages) {
    const controllersDir = path.join(repoRoot, "packages", pkg, "src", "Http", "Controllers");
    
    if (await fileExists(controllersDir)) {
      const controllerFiles = await glob("**/*.php", { cwd: controllersDir, absolute: false });
      
      for (const file of controllerFiles) {
        const controllerPath = path.join(controllersDir, file);
        const content = await fs.readFile(controllerPath, "utf-8");
        
        // Extract class name
        const classMatch = content.match(/class\s+(\w+)\s+extends/);
        const className = classMatch ? classMatch[1] : file.replace(".php", "");
        
        // Extract methods
        const methodMatches = content.matchAll(/public\s+function\s+(\w+)\s*\(/g);
        const methods = Array.from(methodMatches).map(m => m[1]);
        
        controllers.push({
          name: className,
          package: pkg,
          file: file,
          path: path.relative(repoRoot, controllerPath),
          methods,
        });
      }
    }
  }

  return controllers;
}

/**
 * Get middleware for a package
 */
export async function listMiddleware(packageName?: string): Promise<any[]> {
  const repoRoot = await getRepoRoot();
  const packages = packageName ? [packageName] : await getPackages();
  const middleware: any[] = [];

  for (const pkg of packages) {
    const middlewareDir = path.join(repoRoot, "packages", pkg, "src", "Http", "Middleware");
    
    if (await fileExists(middlewareDir)) {
      const middlewareFiles = await glob("*.php", { cwd: middlewareDir, absolute: false });
      
      for (const file of middlewareFiles) {
        const middlewarePath = path.join(middlewareDir, file);
        const content = await fs.readFile(middlewarePath, "utf-8");
        
        // Extract class name
        const classMatch = content.match(/class\s+(\w+)/);
        const className = classMatch ? classMatch[1] : file.replace(".php", "");
        
        middleware.push({
          name: className,
          package: pkg,
          file: file,
          path: path.relative(repoRoot, middlewarePath),
        });
      }
    }
  }

  return middleware;
}

/**
 * Get service providers
 */
export async function listServiceProviders(): Promise<any[]> {
  const repoRoot = await getRepoRoot();
  const packages = await getPackages();
  const providers: any[] = [];

  for (const pkg of packages) {
    const providersDir = path.join(repoRoot, "packages", pkg, "src", "Providers");
    
    if (await fileExists(providersDir)) {
      const providerFiles = await glob("*.php", { cwd: providersDir, absolute: false });
      
      for (const file of providerFiles) {
        const providerPath = path.join(providersDir, file);
        const content = await fs.readFile(providerPath, "utf-8");
        
        // Extract class name
        const classMatch = content.match(/class\s+(\w+)\s+extends\s+ServiceProvider/);
        const className = classMatch ? classMatch[1] : file.replace(".php", "");
        
        providers.push({
          name: className,
          package: pkg,
          file: file,
          path: path.relative(repoRoot, providerPath),
        });
      }
    }
  }

  return providers;
}
