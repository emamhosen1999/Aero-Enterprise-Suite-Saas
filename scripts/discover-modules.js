/**
 * Aero Module Discovery Script
 * 
 * This script discovers all installed aero-* packages by scanning for module.json files.
 * It's used by Vite configurations to dynamically build aliases and page resolvers.
 * 
 * Usage:
 *   import { discoverModules, generatePageManifest, buildAliases } from './discover-modules.js';
 *   const modules = discoverModules(vendorPath);
 *   const aliases = buildAliases(modules);
 */

import fs from 'node:fs';
import path from 'node:path';

/**
 * @typedef {Object} ModuleConfig
 * @property {string} name - Full module name (e.g., "aero-hrm")
 * @property {string} short_name - Short name for aliases (e.g., "hrm")
 * @property {string} namespace - PHP namespace (e.g., "Aero\\Hrm")
 * @property {string} version - Semantic version
 * @property {string} description - Module description
 * @property {string} category - Category: "foundation", "landlord", "business"
 * @property {Object} frontend - Frontend configuration
 * @property {string} frontend.pages - Path to pages directory
 * @property {string} frontend.components - Path to components directory
 * @property {string} [frontend.pagePrefix] - Inertia page prefix (e.g., "Hrm")
 * @property {Object} [exports] - Public exports for cross-module imports
 * @property {string} path - Absolute path to module root
 * @property {string} jsPath - Absolute path to resources/js
 */

/**
 * Discover all Aero modules from the vendor directory
 * 
 * @param {string} vendorAeroPath - Absolute path to vendor/aero directory
 * @param {Object} [options] - Discovery options
 * @param {string[]} [options.exclude] - Module short_names to exclude
 * @param {boolean} [options.verbose] - Log discovery progress
 * @returns {Map<string, ModuleConfig>} Map of short_name -> module config
 */
export function discoverModules(vendorAeroPath, options = {}) {
    const { exclude = [], verbose = false } = options;
    const modules = new Map();
    
    if (!fs.existsSync(vendorAeroPath)) {
        if (verbose) console.warn('[Aero] vendor/aero not found. Run composer install first.');
        return modules;
    }
    
    const packages = fs.readdirSync(vendorAeroPath);
    
    for (const pkg of packages) {
        const pkgPath = path.resolve(vendorAeroPath, pkg);
        
        // Skip if not a directory
        if (!fs.statSync(pkgPath).isDirectory()) continue;
        
        const moduleJsonPath = path.resolve(pkgPath, 'module.json');
        
        if (fs.existsSync(moduleJsonPath)) {
            try {
                const moduleConfig = JSON.parse(fs.readFileSync(moduleJsonPath, 'utf-8'));
                const shortName = moduleConfig.short_name || pkg.replace('aero-', '');
                
                // Skip excluded modules
                if (exclude.includes(shortName)) {
                    if (verbose) console.log(`[Aero] Skipping excluded module: ${shortName}`);
                    continue;
                }
                
                // Validate required fields
                if (!moduleConfig.name || !moduleConfig.namespace) {
                    if (verbose) console.warn(`[Aero] Invalid module.json in ${pkg}: missing name or namespace`);
                    continue;
                }
                
                // Build paths
                const jsPath = moduleConfig.frontend?.pages 
                    ? path.resolve(pkgPath, path.dirname(moduleConfig.frontend.pages))
                    : path.resolve(pkgPath, 'resources/js');
                
                modules.set(shortName, {
                    ...moduleConfig,
                    short_name: shortName,
                    path: pkgPath,
                    jsPath: jsPath,
                    pagesPath: moduleConfig.frontend?.pages 
                        ? path.resolve(pkgPath, moduleConfig.frontend.pages)
                        : null,
                    componentsPath: moduleConfig.frontend?.components
                        ? path.resolve(pkgPath, moduleConfig.frontend.components)
                        : null,
                });
                
                if (verbose) console.log(`[Aero] Discovered module: ${shortName} (${moduleConfig.category || 'unknown'})`);
            } catch (e) {
                if (verbose) console.warn(`[Aero] Error reading ${moduleJsonPath}:`, e.message);
            }
        }
    }
    
    return modules;
}

/**
 * Build Vite aliases from discovered modules
 * 
 * @param {Map<string, ModuleConfig>} modules - Discovered modules
 * @param {Object} [options] - Alias options
 * @param {string[]} [options.exclude] - Module short_names to exclude from aliases
 * @returns {Object} Alias map for Vite resolve.alias
 */
export function buildAliases(modules, options = {}) {
    const { exclude = [] } = options;
    const aliases = {};
    
    for (const [shortName, module] of modules) {
        if (exclude.includes(shortName)) continue;
        
        // Create @{shortName} alias pointing to resources/js
        aliases[`@${shortName}`] = module.jsPath;
        
        // Create @{shortName}/components alias if components path exists
        if (module.componentsPath) {
            aliases[`@${shortName}/components`] = module.componentsPath;
        }
    }
    
    return aliases;
}

/**
 * Generate page manifest for Inertia page resolution
 * Maps Inertia page names to absolute file paths
 * 
 * @param {Map<string, ModuleConfig>} modules - Discovered modules
 * @returns {Object} Page manifest { "Hrm/Employees/Index": "/abs/path/to/Index.jsx" }
 */
export function generatePageManifest(modules) {
    const pages = {};
    
    for (const [shortName, module] of modules) {
        if (!module.pagesPath || !fs.existsSync(module.pagesPath)) continue;
        
        const pagePrefix = module.frontend?.pagePrefix || capitalize(shortName);
        
        // Recursively find all .jsx/.tsx files in pages directory
        const pageFiles = findFiles(module.pagesPath, ['.jsx', '.tsx']);
        
        for (const file of pageFiles) {
            // Convert absolute path to relative within pages directory
            const relativePath = path.relative(module.pagesPath, file);
            
            // Remove extension and convert to Inertia page name
            const pageName = relativePath
                .replace(/\.(jsx|tsx)$/, '')
                .replace(/\\/g, '/'); // Normalize Windows paths
            
            // Full Inertia page name: ModulePrefix/PagePath
            const inertiaName = `${pagePrefix}/${pageName}`;
            
            pages[inertiaName] = file;
        }
    }
    
    return pages;
}

/**
 * Find all files with given extensions recursively
 * 
 * @param {string} dir - Directory to search
 * @param {string[]} extensions - File extensions to match (e.g., ['.jsx', '.tsx'])
 * @returns {string[]} Array of absolute file paths
 */
function findFiles(dir, extensions) {
    const files = [];
    
    if (!fs.existsSync(dir)) return files;
    
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
            files.push(...findFiles(fullPath, extensions));
        } else if (entry.isFile()) {
            const ext = path.extname(entry.name);
            if (extensions.includes(ext)) {
                files.push(fullPath);
            }
        }
    }
    
    return files;
}

/**
 * Capitalize first letter
 * @param {string} str 
 * @returns {string}
 */
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Get modules filtered by category
 * 
 * @param {Map<string, ModuleConfig>} modules - All modules
 * @param {string} category - Category to filter by
 * @returns {Map<string, ModuleConfig>} Filtered modules
 */
export function filterByCategory(modules, category) {
    const filtered = new Map();
    
    for (const [shortName, module] of modules) {
        if (module.category === category) {
            filtered.set(shortName, module);
        }
    }
    
    return filtered;
}

/**
 * Check if a module is installed
 * 
 * @param {string} vendorAeroPath - Path to vendor/aero
 * @param {string} moduleName - Module short_name or full name
 * @returns {boolean}
 */
export function isModuleInstalled(vendorAeroPath, moduleName) {
    const normalizedName = moduleName.startsWith('aero-') ? moduleName : `aero-${moduleName}`;
    const modulePath = path.join(vendorAeroPath, normalizedName);
    return fs.existsSync(path.join(modulePath, 'module.json'));
}

export default {
    discoverModules,
    buildAliases,
    generatePageManifest,
    filterByCategory,
    isModuleInstalled,
};
