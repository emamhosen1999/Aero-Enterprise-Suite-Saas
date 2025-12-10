/**
 * Lighthouse CI Configuration
 * 
 * Production optimization configuration for glassERP system
 * Implements comprehensive performance monitoring and CI integration
 * 
 * @version 1.0.0
 * @created June 18, 2025
 * @phase Phase 5 - Production Optimization
 */

module.exports = {
  ci: {
    // Build configuration
    collect: {
      // URLs to analyze (feature-based routing)
      url: [
        'http://localhost:3000',                    // Home/Dashboard
        'http://localhost:3000/employee-management', // Employee Management Feature
        'http://localhost:3000/project-management',  // Project Management Feature
        'http://localhost:3000/leave-management',    // Leave Management Feature
        'http://localhost:3000/attendance',          // Attendance Feature
        'http://localhost:3000/communication',       // Communication Feature
        'http://localhost:3000/events',              // Events Feature
        'http://localhost:3000/administration',      // Administration Feature
        'http://localhost:3000/auth/login',          // Authentication
        'http://localhost:3000/auth/register',       // Registration
      ],
      
      // Collection settings
      numberOfRuns: 3,                              // Run 3 times for accuracy
      startServerCommand: 'npm run dev',           // Development server
      startServerReadyPattern: 'Local:',           // Server ready pattern
      startServerReadyTimeout: 30000,              // 30 second timeout
      
      // Browser settings
      chromePath: null,                             // Use system Chrome
      chromeFlags: [
        '--headless',
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ],
      
      // Performance settings
      settings: {
        preset: 'desktop',                          // Desktop performance
        chromeFlags: '--no-sandbox --disable-setuid-sandbox',
        throttlingMethod: 'simulate',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
        },
        
        // Skip certain audits for development
        skipAudits: [
          'uses-http2',                             // HTTP/2 not required in dev
          'uses-long-cache-ttl',                    // Cache headers not set in dev
        ],
        
        // Custom categories weights
        categories: {
          performance: { weight: 0.25 },
          accessibility: { weight: 0.25 },
          'best-practices': { weight: 0.25 },
          seo: { weight: 0.25 },
          pwa: { weight: 0 }                        // PWA not primary focus
        }
      }
    },
    
    // Assertions for performance budgets
    assert: {
      // Performance budgets
      assertions: {
        // Core Web Vitals
        'first-contentful-paint': ['warn', { maxNumericValue: 1800 }],      // < 1.8s
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],    // < 2.5s
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],      // < 0.1
        'first-input-delay': ['warn', { maxNumericValue: 100 }],            // < 100ms
        
        // Performance scores
        'categories:performance': ['warn', { minScore: 0.85 }],             // 85+ performance
        'categories:accessibility': ['error', { minScore: 0.95 }],          // 95+ accessibility
        'categories:best-practices': ['warn', { minScore: 0.90 }],          // 90+ best practices
        'categories:seo': ['warn', { minScore: 0.85 }],                     // 85+ SEO
        
        // Bundle size limits
        'total-byte-weight': ['warn', { maxNumericValue: 3145728 }],        // 3MB total
        'unused-javascript': ['warn', { maxNumericValue: 524288 }],         // 512KB unused JS
        'unused-css-rules': ['warn', { maxNumericValue: 51200 }],           // 50KB unused CSS
        
        // Feature-specific performance
        'speed-index': ['warn', { maxNumericValue: 3000 }],                 // < 3s speed index
        'interactive': ['warn', { maxNumericValue: 3800 }],                 // < 3.8s interactive
        'max-potential-fid': ['warn', { maxNumericValue: 130 }],            // < 130ms potential FID
        
        // Accessibility requirements
        'color-contrast': 'error',                                          // Color contrast required
        'heading-order': 'error',                                           // Proper heading order
        'landmark-one-main': 'error',                                       // Main landmark required
        'meta-viewport': 'error',                                           // Viewport meta required
        'focus-traps': 'warn',                                              // Focus management
        
        // Modern development practices
        'uses-passive-event-listeners': 'warn',                             // Passive listeners
        'no-document-write': 'error',                                       // No document.write
        'uses-text-compression': 'warn',                                    // Text compression
        'render-blocking-resources': 'warn',                                // No render blocking
      },
      
      // Include passed assertions in reports
      includePassedAssertions: true
    },
    
    // Upload configuration for CI/CD
    upload: {
      // GitHub Actions integration
      target: 'temporary-public-storage',           // Use temporary storage
      
      // Report upload settings
      uploadUrlMap: true,                           // Include URL mapping
      reportFilenamePattern: '%%PATHNAME%%-%%DATETIME%%-report.%%EXTENSION%%'
    },
    
    // Server configuration
    server: {
      port: 9001,                                   // Lighthouse CI server port
      storage: {
        storageMethod: 'filesystem',                // Use filesystem storage
        storagePath: './lighthouse-reports'         // Reports directory
      }
    },
    
    // Wizard configuration for setup
    wizard: {
      // Skip wizard in CI environments
      skipWizard: process.env.CI === 'true'
    }
  },
  
  // Custom configuration for glassERP features
  glasseRP: {
    // Feature-specific performance targets
    features: {
      'employee-management': {
        performanceTarget: 90,
        accessibilityTarget: 100,
        loadTimeTarget: 1500                        // 1.5s max load time
      },
      'project-management': {
        performanceTarget: 85,                      // Complex charts/analytics
        accessibilityTarget: 100,
        loadTimeTarget: 2000                        // 2s max for complex features
      },
      'administration': {
        performanceTarget: 88,
        accessibilityTarget: 100,
        loadTimeTarget: 1800
      }
    },
    
    // Component-specific monitoring
    components: {
      forms: {
        performanceTarget: 95,                      // Forms should be very fast
        interactivityTarget: 500                    // 500ms max interaction delay
      },
      tables: {
        performanceTarget: 80,                      // Tables can be slower
        renderTarget: 1000                          // 1s max render time
      },
      dashboards: {
        performanceTarget: 75,                      // Dashboards are complex
        loadTarget: 2500                            // 2.5s max dashboard load
      }
    },
    
    // Glass morphism performance considerations
    glassDesign: {
      backdropFilterPerf: true,                     // Monitor backdrop filter impact
      animationBudget: 16,                          // 16ms animation budget (60fps)
      shadowComplexity: 'medium'                    // Medium shadow complexity limit
    }
  }
};

/**
 * Performance Budget Breakdown:
 * 
 * 🎯 Target Metrics:
 * ├── First Contentful Paint: < 1.8s (Good)
 * ├── Largest Contentful Paint: < 2.5s (Good)
 * ├── First Input Delay: < 100ms (Good)
 * ├── Cumulative Layout Shift: < 0.1 (Good)
 * └── Speed Index: < 3.0s (Good)
 * 
 * 📦 Bundle Targets:
 * ├── Total Bundle: < 3MB (gzipped)
 * ├── Main Bundle: < 800KB (gzipped)
 * ├── Vendor Bundle: < 600KB (gzipped)
 * ├── CSS Bundle: < 150KB (gzipped)
 * └── Feature Bundles: < 300KB each
 * 
 * ♿ Accessibility Requirements:
 * ├── Score: 95+ (Near Perfect)
 * ├── Color Contrast: AAA Level
 * ├── Keyboard Navigation: 100%
 * ├── Screen Reader: Full Support
 * └── WCAG 2.1 AA: Complete Compliance
 */
