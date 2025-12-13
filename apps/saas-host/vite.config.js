import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { resolve, dirname } from 'node:path';
import { realpathSync, existsSync } from 'node:fs';
import { defineConfig } from 'vite';

/**
 * Aero Platform SaaS Host Application - Vite Configuration
 * 
 * This configuration builds assets from the aero-platform package as the entry point,
 * with aliases to aero-core and aero-hrm packages for module resolution.
 * 
 * Entry: vendor/aero/platform/resources/js/app.jsx
 * Aliases:
 *   @ -> vendor/aero/platform/resources/js (platform components)
 *   @core -> vendor/aero/core/resources/js (core tenant components)  
 *   @hrm -> vendor/aero/hrm/resources/js (HRM module components)
 */

// Resolve symlinks to real paths (required for Tailwind v4 on Windows)
const resolvePath = (relativePath) => {
    const fullPath = resolve(__dirname, relativePath);
    if (existsSync(fullPath)) {
        try {
            return realpathSync(fullPath);
        } catch {
            return fullPath;
        }
    }
    return fullPath;
};

// Package paths (resolved through symlinks)
const platformPath = resolvePath('vendor/aero/platform');
const corePath = resolvePath('vendor/aero/core');
const hrmPath = resolvePath('vendor/aero/hrm');

export default defineConfig({
    plugins: [
        laravel({
            input: [
                // Platform Entry
                `${platformPath}/resources/css/app.css`,
                `${platformPath}/resources/js/app.jsx`,
                // Core Entry
                `${corePath}/resources/css/app.css`,
                `${corePath}/resources/js/app.jsx`,
            ],
            refresh: true,
        }),
        react(),
    ],
  
   
    esbuild: {
        jsx: 'automatic',
    },

    resolve: {
        // Let Vite follow symlinks to their real path
        // This is required for Tailwind v4 to properly process CSS through symlinks
        preserveSymlinks: false,
        
        alias: {
            // @ resolves to platform's resources (primary entry point)
            '@': `${platformPath}/resources/js`,
            
            // @core resolves to core's resources (tenant shared components)
            '@core': `${corePath}/resources/js`,
            
            // @hrm resolves to HRM module's resources
            '@hrm': `${hrmPath}/resources/js`,
            
            // Ziggy for route generation
            'ziggy-js': resolve(__dirname, 'vendor/tightenco/ziggy'),
            
            // Ensure packages resolve HeroUI from host app's node_modules
            '@heroui/react': resolve(__dirname, 'node_modules/@heroui/react'),
            '@heroui/theme': resolve(__dirname, 'node_modules/@heroui/theme'),
            'tailwindcss': resolve(__dirname, 'node_modules/tailwindcss'),
     
          
            
        },
        
        // Allow modules in vendor to resolve from root node_modules
        modules: [
            resolve(__dirname, 'node_modules'),
            'node_modules',
        ],
    },

    // Optimize deps to include HeroUI packages
    optimizeDeps: {
        include: ['@heroui/react', '@heroui/theme'],
    },

    server: {
        host: 'localhost',
        port: 5173,
    }
});
