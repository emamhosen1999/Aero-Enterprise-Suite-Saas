import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

/**
 * Aero Platform - Vite Configuration
 * 
 * This package builds its own frontend assets and outputs to saas-host.
 * The package is self-contained with its own dependencies.
 */

export default defineConfig({
    // Set the base path for assets
    base: '/build/',
    
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.jsx'],
            refresh: true,
            // Output to saas-host for SaaS mode
            publicDirectory: resolve(__dirname, '../../apps/saas-host/public'),
            buildDirectory: 'build',
        }),
        react(),
        tailwindcss()
    ],
    esbuild: {
        jsx: 'automatic',
    },
    resolve: {
        alias: {
            // @ resolves to this package's resources
            '@': resolve(__dirname, 'resources/js'),
            // Core package for shared tenant components
            '@core': resolve(__dirname, '../aero-core/resources/js'),
            // HRM module
            '@hrm': resolve(__dirname, '../aero-hrm/resources/js'),
            // Ziggy for route generation
            'ziggy-js': resolve(__dirname, 'vendor/tightenco/ziggy'),
        },
    },
    server: {
        cors: true,
        port: 5174, // Different port from core
        strictPort: false,
    },
    build: {
        // Output to saas-host public directory
        outDir: resolve(__dirname, '../../apps/saas-host/public/build'),
        emptyOutDir: false,
        manifest: 'manifest.json',
        rollupOptions: {
            output: {
                manualChunks: undefined,
            },
        },
    },
});
