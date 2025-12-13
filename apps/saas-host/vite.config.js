import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';

// Package paths - SaaS mode uses platform + core + modules
const packagesDir = resolve(__dirname, '../../packages');
const sharedResources = resolve(__dirname, '../../_TODO_ (Missing Files in the modules can be copied from here)/resources/js');

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
            // @ resolves to shared resources (Components, Layouts, Context, utils, etc.)
            '@': sharedResources,
            
            // Package page directories
            '@platform': resolve(packagesDir, 'aero-platform/resources/js'),
            '@core': resolve(packagesDir, 'aero-core/resources/js'),
            '@hrm': resolve(packagesDir, 'aero-hrm/resources/js'),
            
            // Ziggy for route generation
            'ziggy-js': resolve(__dirname, 'vendor/tightenco/ziggy'),
        },
    },
    // Ensure Vite can resolve node_modules for files in packages
    optimizeDeps: {
        include: ['react', 'react-dom', '@inertiajs/react', '@heroui/react', 'framer-motion'],
    },
    server: {
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
});
