import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { resolve } from 'node:path';
import fs from 'node:fs';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

/**
 * Aero Enterprise Suite - Standalone Host Vite Configuration
 * 
 * UNIFIED ENTRY POINT STRATEGY:
 * - All frontend lives in aero-ui package
 * - Single app.jsx handles page resolution based on Inertia route
 * - Pages are organized by module: Pages/{Core,HRM,CRM,...}
 * 
 * This mode is for on-premise or self-hosted single-organization deployments.
 * No aero-platform, no multi-tenancy, no billing.
 */

// Package paths - symlinked from ../../packages via Composer
const uiPath = 'vendor/aero/ui';

/**
 * Dynamic Module Discovery
 * Scans vendor/aero/* for module.json files and builds alias map
 */
function discoverModules() {
    const vendorAeroPath = resolve(__dirname, 'vendor/aero');
    const modules = {};
    
    if (!fs.existsSync(vendorAeroPath)) {
        console.warn('[Aero] vendor/aero not found. Run composer install first.');
        return modules;
    }
    
    const packages = fs.readdirSync(vendorAeroPath);
    
    for (const pkg of packages) {
        const pkgPath = resolve(vendorAeroPath, pkg);
        const moduleJsonPath = resolve(pkgPath, 'module.json');
        
        if (fs.existsSync(moduleJsonPath)) {
            try {
                const moduleConfig = JSON.parse(fs.readFileSync(moduleJsonPath, 'utf-8'));
                const shortName = moduleConfig.short_name || pkg.replace('aero-', '');
                
                // Skip core, platform, and ui - they have explicit aliases or don't have frontend anymore
                if (shortName !== 'core' && shortName !== 'platform' && shortName !== 'ui') {
                    modules[shortName] = {
                        name: moduleConfig.name,
                        namespace: moduleConfig.namespace,
                        path: pkgPath,
                        jsPath: resolve(pkgPath, 'resources/js'),
                    };
                    console.log(`[Aero] Discovered module: ${shortName}`);
                }
            } catch (e) {
                console.warn(`[Aero] Error reading ${moduleJsonPath}:`, e.message);
            }
        }
    }
    
    return modules;
}

// Discover all installed modules
const modules = discoverModules();

// Build dynamic aliases for discovered modules
const moduleAliases = Object.entries(modules).reduce((aliases, [shortName, module]) => {
    aliases[`@${shortName}`] = module.jsPath;
    return aliases;
}, {});

export default defineConfig({
    plugins: [
        laravel({
            input: [
                // Unified UI package - single entry point for all frontend
                `${uiPath}/resources/css/app.css`,
                `${uiPath}/resources/js/app.jsx`,
            ],
            refresh: [
                // Watch all package resources for HMR
                'vendor/aero/*/resources/js/**/*.{js,jsx,ts,tsx}',
                'vendor/aero/*/resources/css/**/*.css',
                'resources/**/*.{blade.php,js,jsx}',
            ],
        }),
        react(),
        tailwindcss(),
    ],

    esbuild: {
        jsx: 'automatic',
    },

    resolve: {
        // Preserve symlink paths so manifest keys match Blade references
        preserveSymlinks: true,
        
        alias: {
            // Unified UI package - primary alias for all frontend imports
            '@': resolve(__dirname, `${uiPath}/resources/js`),
            '@ui': resolve(__dirname, `${uiPath}/resources/js`),
            
            // Dynamic module aliases (e.g., @hrm, @crm, @ims) - for backend resources if needed
            ...moduleAliases,
            
            // Ziggy for route generation
            'ziggy-js': resolve(__dirname, 'vendor/tightenco/ziggy'),
            
            // Ensure all packages use host app's node_modules (single React instance)
            'react': resolve(__dirname, 'node_modules/react'),
            'react-dom': resolve(__dirname, 'node_modules/react-dom'),
            '@heroui/react': resolve(__dirname, 'node_modules/@heroui/react'),
            '@heroui/theme': resolve(__dirname, 'node_modules/@heroui/theme'),
            'framer-motion': resolve(__dirname, 'node_modules/framer-motion'),
            '@inertiajs/react': resolve(__dirname, 'node_modules/@inertiajs/react'),
        },
        
        // Module resolution order
        modules: [
            resolve(__dirname, 'node_modules'),
            'node_modules',
        ],
    },

    // Pre-bundle these to avoid duplicates
    optimizeDeps: {
        include: [
            'react',
            'react-dom',
            '@heroui/react',
            '@heroui/theme',
            'framer-motion',
            '@inertiajs/react',
        ],
        // Don't pre-bundle vendor packages (needed for HMR)
        exclude: [...Object.keys(moduleAliases)],
    },

    server: {
        host: 'localhost',
        port: 5173,
        strictPort: true,
        hmr: {
            host: 'localhost',
        },
        cors: true,
        // Allow serving files from symlinked packages
        fs: {
            allow: [
                __dirname,
                resolve(__dirname, '../../packages'),
                resolve(__dirname, 'vendor/aero'),
            ],
            strict: false,
        },
        watch: {
            // Follow symlinks for HMR
            followSymlinks: true,
        },
    },

    build: {
        manifest: 'manifest.json',
        outDir: 'public/build',
        rollupOptions: {
            output: {
                // Optimal chunking strategy
                manualChunks: {
                    'vendor-react': ['react', 'react-dom'],
                    'vendor-heroui': ['@heroui/react', '@heroui/theme'],
                    'vendor-inertia': ['@inertiajs/react'],
                },
            },
        },
    },
});
