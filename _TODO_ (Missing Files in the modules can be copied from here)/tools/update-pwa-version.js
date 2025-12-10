import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module equivalents for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get version from .env, environment variable, or package.json
const getVersion = () => {
    try {
        // Try to get version from environment variable first
        if (process.env.APP_VERSION) {
            return process.env.APP_VERSION;
        }
        
        // Try to read from .env file
        try {
            const envPath = path.join(__dirname, '../.env');
            const envContent = fs.readFileSync(envPath, 'utf8');
            const lines = envContent.split('\n');
            for (const line of lines) {
                const trimmedLine = line.trim();
                if (trimmedLine.startsWith('APP_VERSION=')) {
                    const version = trimmedLine.split('=')[1].trim();
                    return version;
                }
            }
        } catch (envError) {
            console.warn('Could not read .env file, trying package.json');
        }
        
        // Fallback to package.json version
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        return packageJson.version || '1.0.0';
    } catch (error) {
        console.warn('Could not determine version, using default 1.0.0');
        return '1.0.0';
    }
};

// Update service worker with current version
const updateServiceWorkerVersion = () => {
    const version = getVersion();
    const serviceWorkerPath = path.join(__dirname, '../public/service-worker.js');
    
    try {
        let content = fs.readFileSync(serviceWorkerPath, 'utf8');
        
        // Replace the version constant
        content = content.replace(
            /const APP_VERSION = ['"][^'"]*['"];/,
            `const APP_VERSION = '${version}';`
        );
        
        fs.writeFileSync(serviceWorkerPath, content);
        console.log(`✅ Service worker updated with version: ${version}`);
        
        return true;
    } catch (error) {
        console.error('❌ Failed to update service worker version:', error);
        return false;
    }
};

// Update manifest.json with version info
const updateManifest = () => {
    const version = getVersion();
    const manifestPath = path.join(__dirname, '../public/manifest.json');
    
    try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        manifest.version = version;
        manifest.short_name = manifest.short_name || 'Aero Enterprise';
        manifest.name = manifest.name || 'Aero Enterprise Suite';
        
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        console.log(`✅ Manifest updated with version: ${version}`);
        
        return true;
    } catch (error) {
        console.error('❌ Failed to update manifest:', error);
        return false;
    }
};

// Main execution - ES module equivalent of require.main === module
// Convert Windows path to file URL format for comparison
const scriptPath = path.resolve(process.argv[1]);
const scriptUrl = `file:///${scriptPath.replace(/\\/g, '/')}`;

if (import.meta.url === scriptUrl) {
    console.log('🔄 Updating PWA assets with version information...');
    
    const swUpdated = updateServiceWorkerVersion();
    const manifestUpdated = updateManifest();
    
    if (swUpdated && manifestUpdated) {
        console.log('✅ All PWA assets updated successfully!');
        process.exit(0);
    } else {
        console.error('❌ Failed to update some PWA assets');
        process.exit(1);
    }
}

// ES module exports
export {
    updateServiceWorkerVersion,
    updateManifest,
    getVersion
};
