import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * Vite Configuration for Aero Modules (Library Mode)
 * 
 * This configuration enables modules to be built as UMD libraries that:
 * 1. Externalize shared dependencies (React, Inertia) to avoid duplication
 * 2. Can be dynamically loaded in Standalone mode (no rebuild needed)
 * 3. Work seamlessly in SaaS mode with Composer
 * 
 * Usage:
 * - Place this file in your module's root: packages/aero-hrm/vite.config.js
 * - Customize the module name and entry point as needed
 */

export default defineConfig({
  plugins: [
    react({
      // Enable Fast Refresh for development
      fastRefresh: true,
    }),
  ],

  // Build configuration for library mode
  build: {
    // Output to dist directory
    outDir: 'dist',
    
    // Enable library mode
    lib: {
      // Entry point - adjust based on your module structure
      entry: path.resolve(__dirname, 'resources/js/index.jsx'),
      
      // Module name - will be available as window.AeroHrm
      name: 'AeroHrm',
      
      // Output formats - ES module for modern browsers
      formats: ['es'],
      
      // Output file naming
      fileName: () => 'aero-hrm.js',
    },

    rollupOptions: {
      // Externalize dependencies that shouldn't be bundled
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        '@inertiajs/react',
        '@heroui/react',
        '@heroicons/react/24/outline',
        '@heroicons/react/24/solid',
      ],

      output: {
        // Global variable names for externalized deps (UMD mode)
        globals: {
          'react': 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
          '@inertiajs/react': 'InertiaReact',
          '@heroui/react': 'HeroUI',
          '@heroicons/react/24/outline': 'HeroIconsOutline',
          '@heroicons/react/24/solid': 'HeroIconsSolid',
        },

        // Preserve module structure for better tree-shaking
        preserveModules: false,

        // Asset file naming
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') {
            return 'aero-hrm.css';
          }
          return assetInfo.name;
        },

        // Chunk file naming (for code splitting)
        chunkFileNames: 'chunks/[name]-[hash].js',
      },
    },

    // Source maps for debugging
    sourcemap: true,

    // Minification (disable for debugging)
    minify: 'terser',
    
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
      },
    },

    // Clear the output directory before building
    emptyOutDir: true,

    // CSS code splitting
    cssCodeSplit: false, // Bundle all CSS into one file
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'resources/js'),
      '@/Components': path.resolve(__dirname, 'resources/js/Components'),
      '@/Pages': path.resolve(__dirname, 'resources/js/Pages'),
      '@/Layouts': path.resolve(__dirname, 'resources/js/Layouts'),
    },
  },

  // Development server (for local testing)
  server: {
    port: 5173,
    strictPort: false,
    hmr: {
      host: 'localhost',
    },
  },

  // Preview server (for testing built files)
  preview: {
    port: 4173,
  },

  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@inertiajs/react',
    ],
  },
});
