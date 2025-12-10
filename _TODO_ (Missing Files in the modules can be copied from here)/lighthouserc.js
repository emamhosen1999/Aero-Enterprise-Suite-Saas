/**
 * Lighthouse CI Configuration - Glass ERP Phase 5
 * 
 * Automated performance auditing and quality gates for production deployment.
 * Ensures performance standards are maintained across all releases.
 */

module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:8000/dashboard', 'http://localhost:8000/daily-works', 'http://localhost:8000/administration/dashboard'],
      startServerCommand: 'php artisan serve --port=8000',
      startServerReadyPattern: 'Development Server.*started',
      startServerReadyTimeout: 20000,
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
        emulatedFormFactor: 'desktop',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0
        },
        skipAudits: [
          // Skip audits that aren't relevant for this project
          'apple-touch-icon',
          'installable-manifest',
          'splash-screen',
          'themed-omnibox',
          'offline-start-url'
        ]
      }
    },
    assert: {
      assertions: {
        // Performance Budget - Core Web Vitals
        'categories:performance': ['error', { minScore: 0.7 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.8 }],
        'categories:seo': ['warn', { minScore: 0.8 }],
        
        // Core Web Vitals Thresholds
        'first-contentful-paint': ['error', { maxNumericValue: 1800 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'first-input-delay': ['error', { maxNumericValue: 100 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'speed-index': ['warn', { maxNumericValue: 3000 }],
        'total-blocking-time': ['warn', { maxNumericValue: 200 }],
        
        // Resource Optimization
        'unused-css-rules': ['warn', { maxLength: 0 }],
        'unused-javascript': ['warn', { maxLength: 0 }],
        'modern-image-formats': ['warn', { maxLength: 0 }],
        'offscreen-images': ['warn', { maxLength: 0 }],
        'render-blocking-resources': ['warn', { maxLength: 2 }],
        
        // Bundle Size Budgets
        'resource-summary:script:size': ['error', { maxNumericValue: 500000 }], // 500KB
        'resource-summary:stylesheet:size': ['error', { maxNumericValue: 100000 }], // 100KB
        'resource-summary:image:size': ['warn', { maxNumericValue: 1000000 }], // 1MB
        'resource-summary:total:size': ['warn', { maxNumericValue: 2000000 }], // 2MB
        
        // Security & Best Practices
        'is-on-https': ['error', { minScore: 1 }],
        'uses-http2': ['warn', { minScore: 1 }],
        'no-vulnerable-libraries': ['error', { minScore: 1 }],
        'csp-xss': ['warn', { minScore: 1 }]
      },
      preset: 'lighthouse:recommended'
    },
    upload: {
      target: 'filesystem',
      outputDir: './storage/app/lighthouse-reports',
      reportFilenamePattern: '%%PATHNAME%%-%%DATETIME%%-report.%%EXTENSION%%'
    },
    server: {
      port: 9001,
      storage: {
        storageMethod: 'filesystem',
        storagePath: './storage/app/lighthouse-ci'
      }
    }
  }
};
