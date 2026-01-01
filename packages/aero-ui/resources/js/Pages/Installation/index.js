/**
 * Unified Installation Pages
 * 
 * These pages are shared between both SaaS (Platform) and Standalone (Core) installation modes.
 * The `mode` prop ('saas' | 'standalone') controls which features are shown.
 * 
 * SaaS Mode Flow (7 steps):
 * 1. Welcome
 * 2. Requirements
 * 3. Database
 * 4. Platform Settings
 * 5. Admin Account
 * 6. Review
 * 7. Processing
 * 8. Complete
 * 
 * Standalone Mode Flow (8 steps):
 * 1. Welcome
 * 2. License Validation
 * 3. Requirements
 * 4. Database
 * 5. System Settings
 * 6. Admin Account
 * 7. Review
 * 8. Processing
 * 9. Complete
 */

export { default as Welcome } from './Welcome';
export { default as License } from './License';
export { default as Requirements } from './Requirements';
export { default as Database } from './Database';
export { default as Settings } from './Settings';
export { default as Admin } from './Admin';
export { default as Review } from './Review';
export { default as Processing } from './Processing';
export { default as Complete } from './Complete';
export { default as AlreadyInstalled } from './AlreadyInstalled';
