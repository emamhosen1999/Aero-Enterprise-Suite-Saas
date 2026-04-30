/**
 * Installation URL paths — hardcoded to avoid Ziggy dependency.
 * Installation routes are not included in Ziggy's route list because
 * they use a custom 'inertia.installation' middleware.
 */
export const IR = {
  // Pages
  index:        '/install',
  license:      '/install/license',
  requirements: '/install/requirements',
  database:     '/install/database',
  settings:     '/install/settings',
  admin:        '/install/admin',
  review:       '/install/review',
  processing:   '/install/processing',
  complete:     '/install/complete',
  // AJAX endpoints
  validateLicense:      '/install/validate-license',
  recheckRequirements:  '/install/recheck-requirements',
  testServer:           '/install/test-server',
  saveDatabase:         '/install/save-database',
  savePlatform:         '/install/save-platform',
  saveSettings:         '/install/save-settings',
  saveAdmin:            '/install/save-admin',
  execute:              '/install/execute',
  progress:             '/install/progress',
  retry:                '/install/retry',
  testEmail:            '/install/test-email',
};
