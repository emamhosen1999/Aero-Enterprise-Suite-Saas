import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    // Set the base path for assets
    base: '/build/',
    
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.jsx'],
            refresh: true,
            // Point to standalone-host for hot file and manifest
            publicDirectory: resolve(__dirname, '../../apps/standalone-host/public'),
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
            '@': resolve(__dirname, 'resources/js'),
            'ziggy-js': resolve(__dirname, 'vendor/tightenco/ziggy'),
        },
    },
    server: {
        // Important: Set CORS to allow the Laravel app to load Vite assets
        cors: true,
        // Optional: Use specific port
        port: 5173,
        strictPort: false,
    },
    build: {
        // Output to standalone-host public directory
        outDir: resolve(__dirname, '../../apps/standalone-host/public/build'),
        emptyOutDir: false, // Don't delete module assets
        manifest: 'manifest.json', // Put manifest in build root, not .vite/ subdirectory
        rollupOptions: {
            output: {
                manualChunks: undefined,
            },
        },
    },
});
