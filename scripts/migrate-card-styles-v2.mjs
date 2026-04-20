/**
 * Phase 2: Migrate inline Card/CardHeader styles to .aero-card / .aero-card-header CSS classes.
 * 
 * v2: Safer regex approach that processes style blocks line-by-line instead of using
 * dangerous [\s\S]*? patterns that can match across block boundaries.
 * 
 * Run: node scripts/migrate-card-styles-v2.mjs [--dry-run]
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
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
 * Safe approach: Find <Card ... style={{...}}> blocks by parsing line-by-line.
 * Looks for Card/CardHeader opening tags and checks if their style block contains theme vars.
 */
function processFile(filePath) {
    stats.filesScanned++;
    
    const rel = relative(UI_DIR, filePath);
    if (shouldSkip(rel)) {
        stats.skipped.push(rel);
        return;
    }

    const original = readFileSync(filePath, 'utf-8');
    
    // Quick check - skip files without relevant patterns
    if (!original.includes('--theme-content1') && 
        !original.includes('getCardStyle') && 
        !original.includes('getThemedPageCardStyle') &&
        !original.includes('--theme-divider')) {
        return;
    }

    let modified = original;

    // --- Pass 1: Replace helper function usage (style={getCardStyle()}) ---
    modified = replaceHelperUsage(modified);
    
    // --- Pass 2: Remove helper function definitions ---
    modified = removeHelperDefinitions(modified);

    // --- Pass 3: Replace inline Card style blocks ---
    modified = replaceInlineStyles(modified, 'Card', rel);
    
    // --- Pass 4: Replace inline CardHeader style blocks ---
    modified = replaceInlineStyles(modified, 'CardHeader', rel);

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

/**
 * Replace inline style blocks on Card/CardHeader elements.
 * Strategy: Find opening tags, extract the style block safely using brace counting,
 * check if it's a theme style block, and replace appropriately.
 */
function replaceInlineStyles(content, tagName, filePath) {
    const lines = content.split('\n');
    const result = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];
        const trimmed = line.trim();

        // Check for single-line Card/CardHeader with inline style
        if (tagName === 'CardHeader' && isSingleLineHeaderWithStyle(trimmed, tagName)) {
            const replaced = replaceSingleLineHeader(line);
            if (replaced !== null) {
                result.push(replaced);
                stats.headerStylesReplaced++;
                i++;
                continue;
            }
        }

        // Look for opening tag of Card or CardHeader
        if (isTagOpening(trimmed, tagName)) {
            // Collect the full tag including style block
            const { tagLines, endIdx } = collectFullTag(lines, i);
            const tagText = tagLines.join('\n');
            
            if (isThemeStyleBlock(tagText, tagName)) {
                const replacement = generateReplacement(tagText, tagName, line);
                if (replacement !== null) {
                    result.push(replacement);
                    if (tagName === 'Card') stats.cardStylesReplaced++;
                    else stats.headerStylesReplaced++;
                    i = endIdx + 1;
                    continue;
                }
            }
        }

        result.push(line);
        i++;
    }

    return result.join('\n');
}

/**
 * Check if a line starts opening a specific tag
 */
function isTagOpening(trimmed, tagName) {
    // Match: <Card or <CardHeader followed by space, newline, or className/style
    if (tagName === 'Card') {
        return /^<Card(\s|$)/.test(trimmed) && !trimmed.startsWith('<CardBody') && !trimmed.startsWith('<CardHeader');
    }
    return trimmed.startsWith(`<${tagName}`) && !trimmed.startsWith(`<${tagName}s`);
}

/**
 * Check if a single line has a complete CardHeader with style
 */
function isSingleLineHeaderWithStyle(trimmed, tagName) {
    return tagName === 'CardHeader' && 
           trimmed.startsWith('<CardHeader') && 
           trimmed.includes('style={{') && 
           trimmed.includes('}}') &&
           trimmed.endsWith('>');
}

/**
 * Replace a single-line CardHeader with theme style
 */
function replaceSingleLineHeader(line) {
    const trimmed = line.trim();
    // <CardHeader className="border-b p-0" style={{ borderColor: ..., background: ... }}>
    if (trimmed.includes('--theme-divider') || trimmed.includes('--theme-content')) {
        const indent = line.match(/^(\s*)/)[1];
        // Extract existing className
        const classMatch = trimmed.match(/className="([^"]+)"/);
        const existingClass = classMatch ? classMatch[1] : '';
        
        // Add aero-card-header to className
        let newClass = existingClass;
        if (!newClass.includes('aero-card-header')) {
            newClass = `aero-card-header ${newClass}`.trim();
        }
        
        return `${indent}<CardHeader className="${newClass}">`;
    }
    return null;
}

/**
 * Collect lines from tag opening to closing >
 * Uses brace counting to find the end of the style block
 */
function collectFullTag(lines, startIdx) {
    const tagLines = [];
    let braceDepth = 0;
    let foundStyleOpen = false;
    let foundTagClose = false;
    let i = startIdx;

    while (i < lines.length) {
        const line = lines[i];
        tagLines.push(line);

        // Count {{ and }} for style blocks
        for (let j = 0; j < line.length; j++) {
            if (line[j] === '{' && j + 1 < line.length && line[j + 1] === '{') {
                braceDepth++;
                foundStyleOpen = true;
                j++; // skip next {
            } else if (line[j] === '}' && j + 1 < line.length && line[j + 1] === '}') {
                braceDepth--;
                j++; // skip next }
            }
        }

        // Check if line ends with > after style block is closed
        const trimmed = line.trim();
        if (foundStyleOpen && braceDepth === 0 && trimmed === '>') {
            foundTagClose = true;
            return { tagLines, endIdx: i };
        }
        // Also check for }}> on same line or }}\n>
        if (foundStyleOpen && braceDepth === 0 && trimmed.endsWith('>')) {
            foundTagClose = true;
            return { tagLines, endIdx: i };
        }
        // Check for > on the NEXT line after }}
        if (foundStyleOpen && braceDepth === 0) {
            // Look ahead for >
            if (i + 1 < lines.length && lines[i + 1].trim() === '>') {
                tagLines.push(lines[i + 1]);
                return { tagLines, endIdx: i + 1 };
            }
            return { tagLines, endIdx: i };
        }

        // Safety: don't look more than 15 lines for a single tag
        if (tagLines.length > 15) {
            return { tagLines, endIdx: i };
        }

        i++;
    }

    return { tagLines, endIdx: i - 1 };
}

/**
 * Check if the collected tag text contains theme inline styles
 */
function isThemeStyleBlock(tagText, tagName) {
    if (tagName === 'Card') {
        // Must have theme-content gradient background in style
        return tagText.includes('style=') && 
               tagText.includes('--theme-content') &&
               (tagText.includes('linear-gradient') || tagText.includes('--borderWidth'));
    } else if (tagName === 'CardHeader') {
        // Must have theme-divider or color-mix gradient
        return tagText.includes('style=') && 
               (tagText.includes('--theme-divider') || tagText.includes('color-mix'));
    }
    return false;
}

/**
 * Generate replacement line for a Card/CardHeader tag
 */
function generateReplacement(tagText, tagName, firstLine) {
    const indent = firstLine.match(/^(\s*)/)[1];
    
    if (tagName === 'Card') {
        // Extract existing className
        const classMatch = tagText.match(/className="([^"]+)"/);
        const existingClass = classMatch ? classMatch[1] : '';
        
        // If it had "transition-all duration-200", replace entirely with aero-card
        // since .aero-card already includes transition
        if (existingClass === 'transition-all duration-200') {
            return `${indent}<Card className="aero-card">`;
        }
        
        // Otherwise, add aero-card to existing classes
        let newClass = existingClass;
        if (!newClass.includes('aero-card')) {
            newClass = newClass ? `aero-card ${newClass}` : 'aero-card';
        }
        return `${indent}<Card className="${newClass}">`;
    }
    
    if (tagName === 'CardHeader') {
        const classMatch = tagText.match(/className="([^"]+)"/);
        const existingClass = classMatch ? classMatch[1] : '';
        
        let newClass = existingClass;
        if (!newClass.includes('aero-card-header')) {
            newClass = newClass ? `aero-card-header ${newClass}` : 'aero-card-header';
        }
        return `${indent}<CardHeader className="${newClass}">`;
    }
    
    return null;
}

/**
 * Replace style={getCardStyle()} / style={getThemedPageCardStyle()} with className
 */
function replaceHelperUsage(content) {
    let modified = content;
    
    // Card: className="transition-all duration-200" style={getCardStyle()}>
    modified = modified.replace(
        /className="transition-all duration-200"\s+style=\{getCardStyle\(\)\}/g,
        () => { stats.cardStylesReplaced++; return 'className="aero-card"'; }
    );
    modified = modified.replace(
        /className="transition-all duration-200"\s+style=\{getThemedPageCardStyle\(\)\}/g,
        () => { stats.cardStylesReplaced++; return 'className="aero-card"'; }
    );

    // CardHeader: className="border-b p-0" style={getCardHeaderStyle()}>
    modified = modified.replace(
        /className="border-b p-0"\s+style=\{getCardHeaderStyle\(\)\}/g,
        () => { stats.headerStylesReplaced++; return 'className="aero-card-header border-b p-0"'; }
    );
    modified = modified.replace(
        /className="border-b p-0"\s+style=\{getThemedPageCardHeaderStyle\(\)\}/g,
        () => { stats.headerStylesReplaced++; return 'className="aero-card-header border-b p-0"'; }
    );

    // Generic: style={getCardStyle()}> without specific className
    modified = modified.replace(
        /(<Card[^>]*?)\s+style=\{getCardStyle\(\)\}>/g,
        (match, prefix) => {
            if (prefix.includes('aero-card')) return match;
            stats.cardStylesReplaced++;
            if (prefix.includes('className="')) {
                return prefix.replace(/className="([^"]*)"/, 'className="aero-card $1"') + '>';
            }
            return prefix + ' className="aero-card">';
        }
    );
    modified = modified.replace(
        /(<Card[^>]*?)\s+style=\{getThemedPageCardStyle\(\)\}>/g,
        (match, prefix) => {
            if (prefix.includes('aero-card')) return match;
            stats.cardStylesReplaced++;
            if (prefix.includes('className="')) {
                return prefix.replace(/className="([^"]*)"/, 'className="aero-card $1"') + '>';
            }
            return prefix + ' className="aero-card">';
        }
    );

    // CardHeader with getCardHeaderStyle but different className
    modified = modified.replace(
        /(<CardHeader[^>]*?)\s+style=\{getCardHeaderStyle\(\)\}>/g,
        (match, prefix) => {
            if (prefix.includes('aero-card-header')) return match;
            stats.headerStylesReplaced++;
            if (prefix.includes('className="')) {
                return prefix.replace(/className="([^"]*)"/, 'className="aero-card-header $1"') + '>';
            }
            return prefix + ' className="aero-card-header">';
        }
    );
    modified = modified.replace(
        /(<CardHeader[^>]*?)\s+style=\{getThemedPageCardHeaderStyle\(\)\}>/g,
        (match, prefix) => {
            if (prefix.includes('aero-card-header')) return match;
            stats.headerStylesReplaced++;
            if (prefix.includes('className="')) {
                return prefix.replace(/className="([^"]*)"/, 'className="aero-card-header $1"') + '>';
            }
            return prefix + ' className="aero-card-header">';
        }
    );

    return modified;
}

/**
 * Remove helper function definitions (getCardStyle, getThemedPageCardStyle, etc.)
 */
function removeHelperDefinitions(content) {
    let modified = content;
    
    // Find and remove const getCardStyle = () => ({...}); blocks
    const funcPatterns = [
        /const getCardStyle = \(\) => \(\{[^}]*(?:\{[^}]*\}[^}]*)*\}\);\s*\n?/g,
        /const getThemedPageCardStyle = \(\) => \(\{[^}]*(?:\{[^}]*\}[^}]*)*\}\);\s*\n?/g,
        /const getCardHeaderStyle = \(\) => \(\{[^}]*(?:\{[^}]*\}[^}]*)*\}\);\s*\n?/g,
        /const getThemedPageCardHeaderStyle = \(\) => \(\{[^}]*(?:\{[^}]*\}[^}]*)*\}\);\s*\n?/g,
    ];

    for (const pattern of funcPatterns) {
        const matches = modified.match(pattern);
        if (matches) {
            modified = modified.replace(pattern, '');
            stats.helperFunctionsRemoved += matches.length;
        }
    }

    return modified;
}

/**
 * Skip files that shouldn't be migrated
 */
function shouldSkip(rel) {
    const normalized = rel.replace(/\\/g, '/');
    const skipPatterns = [
        'Auth/Login.jsx',
        'Auth/Register.jsx',
        'Auth/ForgotPassword.jsx',
        'Auth/ResetPassword.jsx',
        'Auth/VerifyEmail.jsx',
        'Auth/AdminSetup.jsx',
        'Auth/AcceptInvitation.jsx',
        'ThemedCard.jsx',
        'ThemeSettingDrawer.jsx',
        'ProfileMenu.jsx',
        'AuthLayout.jsx',
        'SessionExpiredModal.jsx',
        'StatisticCard.jsx',
    ];
    return skipPatterns.some(p => normalized.includes(p));
}

// Main
console.log(`\n🔄 Phase 2: Migrating inline Card styles to .aero-card CSS classes (v2)`);
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
