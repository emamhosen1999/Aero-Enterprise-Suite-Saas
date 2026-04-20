/**
 * Phase 2: Migrate inline Card/CardHeader styles to .aero-card / .aero-card-header CSS classes.
 * 
 * This script handles three pattern types:
 * 1. Standard inline style blocks on <Card> and <CardHeader>
 * 2. Local helper functions (getCardStyle, getThemedPageCardStyle, etc.)
 * 3. StandardPageLayout helper functions
 * 
 * Run: node scripts/migrate-card-styles.mjs [--dry-run]
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const UI_DIR = join(import.meta.dirname, '..', 'packages', 'aero-ui', 'resources', 'js');
const DRY_RUN = process.argv.includes('--dry-run');

const stats = { filesScanned: 0, filesModified: 0, cardStylesReplaced: 0, headerStylesReplaced: 0, helperFunctionsRemoved: 0, skipped: [] };

function getAllJsxFiles(dir) {
    const results = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...getAllJsxFiles(fullPath));
        } else if (entry.name.endsWith('.jsx') || entry.name.endsWith('.js')) {
            results.push(fullPath);
        }
    }
    return results;
}

/**
 * Pattern 1: Standard inline Card style block
 * Matches <Card className="transition-all duration-200" style={{...5 theme props...}}>
 * with varying indentation
 */
function replaceInlineCardStyles(content, filePath) {
    let modified = content;
    let count = 0;

    // Pattern 1a: Multi-line Card with standard 5-prop inline style
    // Matches the exact theme style block with any indentation
    const cardPattern = /(<Card\s*\n\s*className="transition-all duration-200"\n\s*style=\{\{[\s\S]*?border:.*?--borderWidth.*?\n[\s\S]*?borderRadius:.*?--borderRadius.*?\n[\s\S]*?fontFamily:.*?--fontFamily.*?\n[\s\S]*?transform:.*?--scale.*?\n[\s\S]*?background:.*?linear-gradient[\s\S]*?--theme-content[\s\S]*?\}\}\n\s*>)/g;

    modified = modified.replace(cardPattern, (match) => {
        count++;
        // Extract the indentation from the <Card line
        const indent = match.match(/^(\s*)<Card/)?.[1] || '';
        return `${indent}<Card className="aero-card">`;
    });

    // Pattern 1b: Card with className="transition-all duration-200" on same line, style on next lines
    // Some files have slightly different formatting
    const cardPattern2 = /(<Card\s+className="transition-all duration-200"\s+style=\{\{\s*\n[\s\S]*?border:.*?--borderWidth.*?\n[\s\S]*?borderRadius:.*?--borderRadius.*?\n[\s\S]*?fontFamily:.*?--fontFamily.*?\n[\s\S]*?transform:.*?--scale.*?\n[\s\S]*?background:.*?linear-gradient[\s\S]*?--theme-content[\s\S]*?\}\}\s*\n\s*>)/g;

    modified = modified.replace(cardPattern2, (match) => {
        count++;
        const indent = match.match(/^(\s*)<Card/)?.[1] || '';
        return `${indent}<Card className="aero-card">`;
    });

    // Pattern 1c: Single-line Card style (RFI pages and others with compressed formatting)
    const cardPatternSingleLine = /<Card\s+className="transition-all duration-200"\s+style=\{\{[^}]*border:[^}]*borderRadius:[^}]*fontFamily:[^}]*transform:[^}]*background:[^}]*\}\}\s*>/g;

    modified = modified.replace(cardPatternSingleLine, (match) => {
        count++;
        const indent = match.match(/^(\s*)<Card/)?.[1] || '';
        return `${indent}<Card className="aero-card">`;
    });

    stats.cardStylesReplaced += count;
    return modified;
}

/**
 * Pattern 2: Standard inline CardHeader style block
 * Matches <CardHeader className="border-b p-0" style={{borderColor:..., background: color-mix...}}>
 */
function replaceInlineCardHeaderStyles(content, filePath) {
    let modified = content;
    let count = 0;

    // Pattern 2a: Multi-line CardHeader with borderColor + color-mix gradient
    const headerPattern = /(<CardHeader\s*\n\s*className="border-b p-0"\n\s*style=\{\{\s*\n\s*borderColor:.*?--theme-divider.*?\n[\s\S]*?background:.*?linear-gradient[\s\S]*?color-mix[\s\S]*?\}\}\s*\n\s*>)/g;

    modified = modified.replace(headerPattern, (match) => {
        count++;
        const indent = match.match(/^(\s*)<CardHeader/)?.[1] || '';
        return `${indent}<CardHeader className="aero-card-header border-b p-0">`;
    });

    // Pattern 2b: CardHeader with style on same line as className
    const headerPattern2 = /(<CardHeader\s+className="border-b p-0"\s+style=\{\{\s*\n[\s\S]*?borderColor:.*?--theme-divider.*?\n[\s\S]*?background:.*?linear-gradient[\s\S]*?color-mix[\s\S]*?\}\}\s*\n\s*>)/g;

    modified = modified.replace(headerPattern2, (match) => {
        count++;
        const indent = match.match(/^(\s*)<CardHeader/)?.[1] || '';
        return `${indent}<CardHeader className="aero-card-header border-b p-0">`;
    });

    // Pattern 2c: Simpler CardHeader with only borderColor (no gradient) — like SystemHealth
    const headerPattern3 = /<CardHeader\s+style=\{\{\s*\n?\s*borderBottom:.*?--theme-divider.*?\n?\s*\}\}>/g;

    modified = modified.replace(headerPattern3, (match) => {
        count++;
        const indent = match.match(/^(\s*)<CardHeader/)?.[1] || '';
        return `${indent}<CardHeader className="aero-card-header">`;
    });

    stats.headerStylesReplaced += count;
    return modified;
}

/**
 * Pattern 3: Local helper functions (getCardStyle, getThemedPageCardStyle, etc.)
 * Replace style={getCardStyle()} with className="aero-card"
 * Remove the function definition
 */
function replaceHelperFunctions(content, filePath) {
    let modified = content;
    let count = 0;

    // Find and remove getCardStyle / getThemedPageCardStyle function definitions
    const helperFuncPatterns = [
        // const getCardStyle = () => ({...});
        /\n\s*const getCardStyle = \(\) => \(\{[\s\S]*?\}\);\s*\n/g,
        /\n\s*const getThemedPageCardStyle = \(\) => \(\{[\s\S]*?\}\);\s*\n/g,
        // CardHeader helper
        /\n\s*const getCardHeaderStyle = \(\) => \(\{[\s\S]*?\}\);\s*\n/g,
        /\n\s*const getThemedPageCardHeaderStyle = \(\) => \(\{[\s\S]*?\}\);\s*\n/g,
    ];

    for (const pattern of helperFuncPatterns) {
        const matches = modified.match(pattern);
        if (matches) {
            modified = modified.replace(pattern, '\n');
            count += matches.length;
        }
    }

    // Replace style={getCardStyle()} / style={getThemedPageCardStyle()} with className  
    // Card: className="transition-all duration-200" style={getCardStyle()}>
    modified = modified.replace(
        /className="transition-all duration-200"\s+style=\{getCardStyle\(\)\}/g,
        'className="aero-card"'
    );
    modified = modified.replace(
        /className="transition-all duration-200"\s+style=\{getThemedPageCardStyle\(\)\}/g,
        'className="aero-card"'
    );

    // CardHeader: style={getCardHeaderStyle()}>  or style={getThemedPageCardHeaderStyle()}>
    modified = modified.replace(
        /className="border-b p-0"\s+style=\{getCardHeaderStyle\(\)\}/g,
        'className="aero-card-header border-b p-0"'
    );
    modified = modified.replace(
        /className="border-b p-0"\s+style=\{getThemedPageCardHeaderStyle\(\)\}/g,
        'className="aero-card-header border-b p-0"'
    );

    // Also handle: <Card ... style={getCardStyle()}> without className="transition-all..."
    modified = modified.replace(
        /(<Card[^>]*?)\s+style=\{getCardStyle\(\)\}>/g,
        (match, prefix) => {
            if (prefix.includes('aero-card')) return match; // already migrated
            if (prefix.includes('className="')) {
                return prefix.replace(/className="([^"]*)"/, 'className="$1 aero-card"') + '>';
            }
            return prefix + ' className="aero-card">';
        }
    );
    modified = modified.replace(
        /(<Card[^>]*?)\s+style=\{getThemedPageCardStyle\(\)\}>/g,
        (match, prefix) => {
            if (prefix.includes('aero-card')) return match;
            if (prefix.includes('className="')) {
                return prefix.replace(/className="([^"]*)"/, 'className="$1 aero-card"') + '>';
            }
            return prefix + ' className="aero-card">';
        }
    );

    stats.helperFunctionsRemoved += count;
    return modified;
}

/**
 * Skip files that shouldn't be migrated (custom/unique styles)
 */
function shouldSkip(filePath) {
    const skipPatterns = [
        'Auth/Login.jsx',      // Custom glassmorphic card
        'Auth/Register.jsx',   // Custom glassmorphic card
        'Auth/ForgotPassword.jsx', // Custom card
        'Auth/ResetPassword.jsx',  // Custom card
        'ThemedCard.jsx',      // The card component itself
        'ThemeSettingDrawer.jsx', // Theme settings
    ];
    const rel = relative(UI_DIR, filePath);
    return skipPatterns.some(p => rel.includes(p));
}

function processFile(filePath) {
    stats.filesScanned++;
    
    if (shouldSkip(filePath)) {
        stats.skipped.push(relative(UI_DIR, filePath));
        return;
    }

    const original = readFileSync(filePath, 'utf-8');
    
    // Check if file has any patterns to replace
    if (!original.includes('--theme-content1') && 
        !original.includes('getCardStyle') && 
        !original.includes('getThemedPageCardStyle') &&
        !original.includes('--borderWidth') &&
        !original.includes('--theme-divider')) {
        return;
    }
    
    // Skip if already fully migrated
    if (original.includes('aero-card') && !original.includes('style={{') && !original.includes('getCardStyle')) {
        return;
    }

    let modified = original;
    modified = replaceInlineCardStyles(modified, filePath);
    modified = replaceInlineCardHeaderStyles(modified, filePath);
    modified = replaceHelperFunctions(modified, filePath);

    if (modified !== original) {
        const rel = relative(UI_DIR, filePath);
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
console.log(`\n🔄 Phase 2: Migrating inline Card styles to .aero-card CSS classes`);
console.log(`   Directory: ${UI_DIR}`);
console.log(`   Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}\n`);

const files = getAllJsxFiles(UI_DIR);
for (const file of files) {
    processFile(file);
}

console.log(`\n📊 Migration Summary:`);
console.log(`   Files scanned: ${stats.filesScanned}`);
console.log(`   Files modified: ${stats.filesModified}`);
console.log(`   Card styles replaced: ${stats.cardStylesReplaced}`);
console.log(`   Header styles replaced: ${stats.headerStylesReplaced}`);
console.log(`   Helper functions removed: ${stats.helperFunctionsRemoved}`);
if (stats.skipped.length > 0) {
    console.log(`   Skipped: ${stats.skipped.join(', ')}`);
}
console.log('');
