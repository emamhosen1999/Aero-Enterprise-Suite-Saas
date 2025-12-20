import fs from "fs/promises";
import path from "path";
import glob from "fast-glob";
import { getRepoRoot, getPackages, fileExists } from "./utils.js";

interface PageInfo {
  name: string;
  package: string;
  path: string;
  route?: string;
  components?: string[];
}

interface ComponentInfo {
  name: string;
  package: string;
  path: string;
  type: "page" | "component" | "form" | "table" | "modal";
  imports?: string[];
}

/**
 * List all Inertia pages
 */
export async function listPages(): Promise<PageInfo[]> {
  const repoRoot = await getRepoRoot();
  const packages = await getPackages();
  const pages: PageInfo[] = [];

  for (const pkg of packages) {
    const pagesDir = path.join(repoRoot, "packages", pkg, "resources", "js", "Pages");
    
    if (await fileExists(pagesDir)) {
      const pageFiles = await glob("**/*.{jsx,tsx,js,ts}", { cwd: pagesDir, absolute: false });
      
      for (const file of pageFiles) {
        const pagePath = path.join(pagesDir, file);
        const content = await fs.readFile(pagePath, "utf-8");
        
        // Extract component imports
        const importMatches = content.matchAll(/import\s+.*?from\s+['"](.+?)['"]/g);
        const components = Array.from(importMatches)
          .map(m => m[1])
          .filter(imp => imp.startsWith("@/") || imp.startsWith("./") || imp.startsWith("../"));
        
        pages.push({
          name: file.replace(/\.(jsx|tsx|js|ts)$/, ""),
          package: pkg,
          path: path.relative(repoRoot, pagePath),
          components,
        });
      }
    }
  }

  return pages;
}

/**
 * List all React components
 */
export async function listComponents(): Promise<ComponentInfo[]> {
  const repoRoot = await getRepoRoot();
  const packages = await getPackages();
  const components: ComponentInfo[] = [];

  for (const pkg of packages) {
    const resourcesDir = path.join(repoRoot, "packages", pkg, "resources", "js");
    
    if (await fileExists(resourcesDir)) {
      const componentDirs = ["Components", "Forms", "Tables", "Modals"];
      
      for (const dir of componentDirs) {
        const componentDir = path.join(resourcesDir, dir);
        
        if (await fileExists(componentDir)) {
          const componentFiles = await glob("**/*.{jsx,tsx,js,ts}", { cwd: componentDir, absolute: false });
          
          for (const file of componentFiles) {
            const componentPath = path.join(componentDir, file);
            const content = await fs.readFile(componentPath, "utf-8");
            
            // Extract imports
            const importMatches = content.matchAll(/import\s+.*?from\s+['"](.+?)['"]/g);
            const imports = Array.from(importMatches)
              .map(m => m[1])
              .filter(imp => imp.startsWith("@/") || imp.startsWith("./") || imp.startsWith("../"));
            
            // Determine type
            let type: ComponentInfo["type"] = "component";
            if (dir === "Forms") type = "form";
            else if (dir === "Tables") type = "table";
            else if (dir === "Modals") type = "modal";
            else if (dir === "Pages") type = "page";
            
            components.push({
              name: file.replace(/\.(jsx|tsx|js|ts)$/, ""),
              package: pkg,
              path: path.relative(repoRoot, componentPath),
              type,
              imports,
            });
          }
        }
      }
    }
  }

  return components;
}

/**
 * Analyze component dependencies
 */
export async function analyzeComponentDependencies(componentPath: string): Promise<any> {
  const repoRoot = await getRepoRoot();
  const fullPath = path.join(repoRoot, componentPath);
  
  if (!await fileExists(fullPath)) {
    throw new Error(`Component not found: ${componentPath}`);
  }
  
  const content = await fs.readFile(fullPath, "utf-8");
  
  // Extract all imports
  const importMatches = content.matchAll(/import\s+(?:{([^}]+)}|(\w+))\s+from\s+['"](.+?)['"]/g);
  const imports: any[] = [];
  
  for (const match of importMatches) {
    const namedImports = match[1] ? match[1].split(",").map(s => s.trim()) : [];
    const defaultImport = match[2];
    const source = match[3];
    
    imports.push({
      source,
      defaultImport,
      namedImports,
      isLocal: source.startsWith("./") || source.startsWith("../") || source.startsWith("@/"),
    });
  }
  
  // Extract HeroUI components used
  const heroUIComponents = imports
    .filter(imp => imp.source === "@heroui/react")
    .flatMap(imp => imp.namedImports);
  
  // Extract Heroicons used
  const heroicons = imports
    .filter(imp => imp.source.includes("@heroicons/react"))
    .flatMap(imp => imp.namedImports);
  
  // Extract hooks used
  const hooks = content.match(/use[A-Z]\w+/g) || [];
  const uniqueHooks = [...new Set(hooks)];
  
  // Extract Inertia usage
  const usesInertia = content.includes("@inertiajs");
  const usesForm = content.includes("useForm");
  
  return {
    path: componentPath,
    imports,
    heroUIComponents,
    heroicons,
    hooks: uniqueHooks,
    usesInertia,
    usesForm,
    totalImports: imports.length,
    localImports: imports.filter(imp => imp.isLocal).length,
    externalImports: imports.filter(imp => !imp.isLocal).length,
  };
}

/**
 * Find components using a specific HeroUI component
 */
export async function findComponentsUsingHeroUI(heroUIComponent: string): Promise<string[]> {
  const repoRoot = await getRepoRoot();
  const packages = await getPackages();
  const results: string[] = [];

  for (const pkg of packages) {
    const resourcesDir = path.join(repoRoot, "packages", pkg, "resources", "js");
    
    if (await fileExists(resourcesDir)) {
      const files = await glob("**/*.{jsx,tsx,js,ts}", { cwd: resourcesDir, absolute: false });
      
      for (const file of files) {
        const filePath = path.join(resourcesDir, file);
        const content = await fs.readFile(filePath, "utf-8");
        
        // Check if the component is imported from @heroui/react
        const importRegex = new RegExp(`import\\s+{[^}]*${heroUIComponent}[^}]*}\\s+from\\s+['"]@heroui/react['"]`);
        const usageRegex = new RegExp(`<${heroUIComponent}[\\s>]`);
        
        if (importRegex.test(content) && usageRegex.test(content)) {
          results.push(path.relative(repoRoot, filePath));
        }
      }
    }
  }

  return results;
}

/**
 * Get page hierarchy and routing structure
 */
export async function getPageHierarchy(): Promise<any> {
  const pages = await listPages();
  const hierarchy: any = {};

  for (const page of pages) {
    const parts = page.name.split("/");
    let current = hierarchy;
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      
      if (i === parts.length - 1) {
        // Leaf node (actual page)
        current[part] = {
          _page: true,
          package: page.package,
          path: page.path,
          components: page.components,
        };
      } else {
        // Directory node
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part];
      }
    }
  }

  return hierarchy;
}

/**
 * List forms across packages
 */
export async function listForms(): Promise<ComponentInfo[]> {
  const components = await listComponents();
  return components.filter(c => c.type === "form");
}

/**
 * List tables across packages
 */
export async function listTables(): Promise<ComponentInfo[]> {
  const components = await listComponents();
  return components.filter(c => c.type === "table");
}
