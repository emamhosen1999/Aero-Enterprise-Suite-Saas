/**
 * Phase 2 v3: Simple string-based replacements for known Card/CardHeader patterns.
 * 
 * Instead of trying to parse JSX generically, we define exact string patterns
 * found in the codebase and replace them directly.
 * 
 * Run: node scripts/migrate-card-styles-v3.mjs [--dry-run]
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, relative } from 'path';

const UI_DIR = join(import.meta.dirname, '..', 'packages', 'aero-ui', 'resources', 'js');
const DRY_RUN = process.argv.includes('--dry-run');

const stats = { filesScanned: 0, filesModified: 0, replacements: 0, skipped: [] };

function getAllJsxFiles(dir) {
    const results = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) results.push(...getAllJsxFiles(fullPath));
        else if (entry.name.endsWith('.jsx') || entry.name.endsWith('.js')) results.push(fullPath);
    }
    return results;
}

function shouldSkip(rel) {
    const normalized = rel.replace(/\\/g, '/');
    const skipPatterns = [
        'Auth/Login.jsx', 'Auth/Register.jsx', 'Auth/ForgotPassword.jsx',
        'Auth/ResetPassword.jsx', 'Auth/VerifyEmail.jsx', 'Auth/AdminSetup.jsx',
        'Auth/AcceptInvitation.jsx', 'ThemedCard.jsx', 'ThemeSettingDrawer.jsx',
        'ProfileMenu.jsx', 'AuthLayout.jsx', 'SessionExpiredModal.jsx', 'StatisticCard.jsx',
    ];
    return skipPatterns.some(p => normalized.includes(p));
}

/**
 * All known Card inline style patterns to replace.
 * Each entry: [find, replace]
 * Patterns are ordered from most specific to least specific.
 */
function getCardReplacements() {
    return [
        // === CARD PATTERNS ===
        
        // Pattern: className="transition-all duration-200" + multi-line inline style
        [/(<Card\s*\n(\s*)className="transition-all duration-200"\n\s*style=\{\{\n\s*border: `var\(--borderWidth, 2px\) solid transparent`,\n\s*borderRadius: `var\(--borderRadius, 12px\)`,\n\s*fontFamily: `var\(--fontFamily, "Inter"\)`,\n\s*transform: `scale\(var\(--scale, 1\)\)`,\n\s*background: `linear-gradient\(135deg,\s*\n\s*var\(--theme-content1, #FAFAFA\) 20%,\s*\n\s*var\(--theme-content2, #F4F4F5\) 10%,\s*\n\s*var\(--theme-content3, #F1F3F4\) 20%\)`,\n\s*\}\}\n\s*>)/g,
         (match, full, indent) => `<Card\n${indent}className="aero-card"\n${indent}>`],

        // Pattern: Same but without transform line
        [/(<Card\s*\n(\s*)className="transition-all duration-200"\n\s*style=\{\{\n\s*border: `var\(--borderWidth, 2px\) solid transparent`,\n\s*borderRadius: `var\(--borderRadius, 12px\)`,\n\s*fontFamily: `var\(--fontFamily, "Inter"\)`,\n\s*background: `linear-gradient\(135deg,\s*\n\s*var\(--theme-content1, #FAFAFA\) 20%,\s*\n\s*var\(--theme-content2, #F4F4F5\) 10%,\s*\n\s*var\(--theme-content3, #F1F3F4\) 20%\)`,\n\s*\}\}\n\s*>)/g,
         (match, full, indent) => `<Card\n${indent}className="aero-card"\n${indent}>`],

        // Pattern: style={getCardStyle()}, style={getThemedCardStyle()}, style={getThemedPageCardStyle()}
        [/className="transition-all duration-200"\s*\n\s*style=\{getCardStyle\(\)\}\s*\n\s*>/g,
         'className="aero-card"\n>'],
        [/className="transition-all duration-200"\s*\n\s*style=\{getThemedCardStyle\(\)\}\s*\n\s*>/g,
         'className="aero-card"\n>'],
        [/className="transition-all duration-200"\s+style=\{getThemedPageCardStyle\(\)\}/g,
         'className="aero-card"'],
        [/className="transition-all duration-200"\s+style=\{getCardStyle\(\)\}/g,
         'className="aero-card"'],
        [/className="transition-all duration-200"\s+style=\{getThemedCardStyle\(\)\}/g,
         'className="aero-card"'],

        // === CARD HEADER PATTERNS ===

        // Pattern: Multi-line CardHeader with borderColor + color-mix gradient
        [/<CardHeader\s*\n(\s*)className="border-b p-0"\n\s*style=\{\{\n\s*borderColor: `var\(--theme-divider, #E4E4E7\)`,\n\s*background: `linear-gradient\(135deg,\s*\n\s*color-mix\(in srgb, var\(--theme-content1\) 50%, transparent\) 20%,\s*\n\s*color-mix\(in srgb, var\(--theme-content2\) 30%, transparent\) 10%\)`,\n\s*\}\}\n\s*>/g,
         (match, indent) => `<CardHeader\n${indent}className="aero-card-header border-b p-0"\n${indent}>`],

        // Pattern: CardHeader with borderColor only (no gradient) - multi-line
        [/<CardHeader\s*\n(\s*)className="border-b p-0"\n\s*style=\{\{\n\s*borderColor: `var\(--theme-divider, #E4E4E7\)`,\n\s*\}\}\n\s*>/g,
         (match, indent) => `<CardHeader\n${indent}className="aero-card-header border-b p-0"\n${indent}>`],

        // Pattern: Single-line CardHeader style with both borderColor + gradient
        [/<CardHeader className="border-b p-0" style=\{\{ borderColor: `var\(--theme-divider, #E4E4E7\)`, background: `linear-gradient\(135deg, color-mix\(in srgb, var\(--theme-content1\) 50%, transparent\) 20%, color-mix\(in srgb, var\(--theme-content2\) 30%, transparent\) 10%\)` \}\}>/g,
         '<CardHeader className="aero-card-header border-b p-0">'],

        // Pattern: CardHeader with only borderColor (single line)
        [/<CardHeader className="border-b p-0" style=\{\{ borderColor: `var\(--theme-divider, #E4E4E7\)` \}\}>/g,
         '<CardHeader className="aero-card-header border-b p-0">'],
        [/<CardHeader className="border-b pb-2" style=\{\{ borderColor: `var\(--theme-divider, #E4E4E7\)` \}\}>/g,
         '<CardHeader className="aero-card-header border-b pb-2">'],

        // Pattern: CardHeader with style={getCardHeaderStyle()} or style={getThemedPageCardHeaderStyle()}
        [/className="border-b p-0"\s+style=\{getCardHeaderStyle\(\)\}/g,
         'className="aero-card-header border-b p-0"'],
        [/className="border-b p-0"\s+style=\{getThemedPageCardHeaderStyle\(\)\}/g,
         'className="aero-card-header border-b p-0"'],
        [/className="border-b p-0"\s*\n\s*style=\{getCardHeaderStyle\(\)\}/g,
         'className="aero-card-header border-b p-0"'],

        // Pattern: CardHeader with className="border-b border-divider p-0" + color-mix background only
        [/<CardHeader className="border-b border-divider p-0"\s*\n\s*style=\{\{\n\s*background: `linear-gradient\(135deg,\s*\n\s*color-mix\(in srgb, var\(--theme-content1\) 50%, transparent\) 20%,\s*\n\s*color-mix\(in srgb, var\(--theme-content2\) 30%, transparent\) 10%\)`,\n\s*\}\}\n\s*>/g,
         '<CardHeader className="aero-card-header border-b border-divider p-0">'],

        // === HELPER FUNCTION DEFINITIONS TO REMOVE ===

        // Remove getCardStyle() definitions
        [/\nconst getCardStyle = \(\) => \(\{[\s\S]*?\}\);\n/g, '\n'],
        [/\nconst getThemedCardStyle = \(\) => \(\{[\s\S]*?\}\);\n/g, '\n'],
        [/\nconst getThemedPageCardStyle = \(\) => \(\{[\s\S]*?\}\);\n/g, '\n'],
        [/\nconst getCardHeaderStyle = \(\) => \(\{[\s\S]*?\}\);\n/g, '\n'],
        [/\nconst getThemedPageCardHeaderStyle = \(\) => \(\{[\s\S]*?\}\);\n/g, '\n'],
        [/\nconst getThemedCardHeaderStyle = \(\) => \(\{[\s\S]*?\}\);\n/g, '\n'],

        // Also handle: Top-of-function definitions (indented)
        [/\n(\s+)const getCardStyle = \(\) => \(\{[\s\S]*?\}\);\n/g, '\n'],
        [/\n(\s+)const getThemedCardStyle = \(\) => \(\{[\s\S]*?\}\);\n/g, '\n'],
    ];
}

/**
 * Additional replacements for helper function patterns used via getThemedCardStyle import
 */
function getHelperStyleReplacements() {
    return [
        // Pattern: <CardHeader style={{...borderColor + gradient...}}>  with borderColor and gradient inline
        // These are CardHeaders that have a borderColor: var(--theme-divider) inline
        [/(\s*style=\{\{\n\s*borderColor: `var\(--theme-divider, #E4E4E7\)`,\n\s*background: `linear-gradient\(135deg,\s*\n\s*color-mix\(in srgb, var\(--theme-content1\) 50%, transparent\) 20%,\s*\n\s*color-mix\(in srgb, var\(--theme-content2\) 30%, transparent\) 10%\)`,\n\s*\}\})/g,
         ''],

        // CardHeader with just borderColor (inside multi-line style block on CardHeader that already has className)
        [/(\s*style=\{\{\n\s*borderColor: `var\(--theme-divider, #E4E4E7\)`,\n\s*\}\})/g,
         ''],
    ];
}

function processFile(filePath) {
    stats.filesScanned++;
    const rel = relative(UI_DIR, filePath).replace(/\\/g, '/');
    
    if (shouldSkip(rel)) {
        stats.skipped.push(rel);
        return;
    }

    const original = readFileSync(filePath, 'utf-8');
    
    // Quick check
    if (!original.includes('--theme-content') && 
        !original.includes('getCardStyle') && 
        !original.includes('getThemedCardStyle') &&
        !original.includes('getThemedPageCardStyle') &&
        !original.includes('--theme-divider') &&
        !original.includes('getCardHeaderStyle') &&
        !original.includes('getThemedPageCardHeaderStyle')) {
        return;
    }

    let modified = original;
    const replacements = getCardReplacements();
    
    for (const [pattern, replacement] of replacements) {
        const before = modified;
        modified = modified.replace(pattern, replacement);
        if (modified !== before) {
            const matchCount = (before.match(pattern) || []).length;
            stats.replacements += matchCount;
        }
    }

    if (modified !== original) {
        if (DRY_RUN) {
            console.log(`[DRY RUN] Would modify: ${rel}`);
        } else {
            writeFileSync(filePath, modified, 'utf-8');
            console.log(`Modified: ${rel}`);
        }
        stats.filesModified++;
    }
}

// Main
console.log(`\n🔄 Phase 2 v3: Migrating inline Card styles to .aero-card CSS classes`);
console.log(`   Directory: ${UI_DIR}`);
console.log(`   Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}\n`);

const files = getAllJsxFiles(UI_DIR);
for (const file of files) {
    processFile(file);
}

console.log(`\n📊 Migration Summary:`);
console.log(`   Files scanned: ${stats.filesScanned}`);
console.log(`   Files modified: ${stats.filesModified}`);
console.log(`   Total replacements: ${stats.replacements}`);
if (stats.skipped.length > 0) {
    console.log(`   Skipped: ${stats.skipped.join(', ')}`);
}
console.log('');
