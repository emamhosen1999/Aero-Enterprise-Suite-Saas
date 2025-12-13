import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';

/**
 * Aero SaaS Host - Vite Configuration
 * 
 * This config enables "Zero-Touch" hosting by:
 * 1. Resolving pages from package directories
 * 2. Sharing node_modules with packages (no duplication)
 * 3. Providing @ alias for shared resources
 * 
 * IMPORTANT: Packages don't have their own node_modules.
 * All npm dependencies are resolved from the host's node_modules via aliases.
 */

const packagesDir = resolve(__dirname, '../../packages');
const sharedResources = resolve(__dirname, '../../_TODO_ (Missing Files in the modules can be copied from here)/resources/js');
const nm = (pkg) => resolve(__dirname, 'node_modules', pkg);

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.jsx'],
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    esbuild: {
        jsx: 'automatic',
    },
    resolve: {
        alias: {
            // @ resolves to shared resources (Components, Layouts, Context, utils, constants, etc.)
            '@': sharedResources,
            
            // Package aliases - pages and components from installed packages
            '@platform': resolve(packagesDir, 'aero-platform/resources/js'),
            '@core': resolve(packagesDir, 'aero-core/resources/js'),
            '@hrm': resolve(packagesDir, 'aero-hrm/resources/js'),
            
            // Ziggy for Laravel route generation in JS
            'ziggy-js': resolve(__dirname, 'vendor/tightenco/ziggy'),
            
            // NPM packages - resolve from host's node_modules for all package code
            'react': nm('react'),
            'react-dom': nm('react-dom'),
            'react/jsx-runtime': nm('react/jsx-runtime'),
            'react/jsx-dev-runtime': nm('react/jsx-dev-runtime'),
            '@inertiajs/react': nm('@inertiajs/react'),
            '@heroui/react': nm('@heroui/react'),
            '@heroicons/react/24/outline': nm('@heroicons/react/24/outline'),
            '@heroicons/react/24/solid': nm('@heroicons/react/24/solid'),
            '@heroicons/react/20/solid': nm('@heroicons/react/20/solid'),
            'framer-motion': nm('framer-motion'),
            'axios': nm('axios'),
            'laravel-vite-plugin/inertia-helpers': nm('laravel-vite-plugin/inertia-helpers'),
            'clsx': nm('clsx'),
            'tailwind-merge': nm('tailwind-merge'),
            'react-hot-toast': nm('react-hot-toast'),
            'sonner': nm('sonner'),
            'date-fns': nm('date-fns'),
            'recharts': nm('recharts'),
            '@tanstack/react-table': nm('@tanstack/react-table'),
        },
        // Dedupe to prevent multiple React instances
        dedupe: ['react', 'react-dom', '@inertiajs/react'],
    },
    // Pre-bundle common dependencies for faster dev server
    optimizeDeps: {
        include: [
            'react', 
            'react-dom', 
            '@inertiajs/react', 
            '@heroui/react', 
            'framer-motion',
            'axios',
            '@heroicons/react/24/outline',
            '@heroicons/react/24/solid',
        ],
    },
    server: {
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
});
