/**
 * Phase 2 v4: Line-by-line Card/CardHeader style migration.
 * 
 * Strategy: Find `<Card` or `<CardHeader` opening tags, collect just that tag's
 * lines (by tracking `<` and `>` balance, NOT `{` and `}`), then replace
 * the style attribute and adjust className.
 * 
 * Run: node scripts/migrate-card-styles-v4.mjs [--dry-run]
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, relative } from 'path';

const UI_DIR = join(import.meta.dirname, '..', 'packages', 'aero-ui', 'resources', 'js');
const DRY_RUN = process.argv.includes('--dry-run');

const stats = { filesScanned: 0, filesModified: 0, cardStyles: 0, headerStyles: 0, helpers: 0, skipped: [] };

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
    const n = rel.replace(/\\/g, '/');
    const skip = [
        'Auth/Login.jsx', 'Auth/Register.jsx', 'Auth/ForgotPassword.jsx',
        'Auth/ResetPassword.jsx', 'Auth/VerifyEmail.jsx', 'Auth/AdminSetup.jsx',
        'Auth/AcceptInvitation.jsx', 'ThemedCard.jsx', 'ThemeSettingDrawer.jsx',
        'ProfileMenu.jsx', 'AuthLayout.jsx', 'SessionExpiredModal.jsx', 'StatisticCard.jsx',
    ];
    return skip.some(p => n.includes(p));
}

/**
 * Check if text contains the Card gradient theme pattern.
 */
function hasCardGradient(text) {
    return text.includes('--theme-content1') && text.includes('--theme-content2') && text.includes('linear-gradient');
}

/**
 * Check if text contains a Card helper style call.
 */
function hasCardHelper(text) {
    return /style=\{(getCardStyle|getThemedCardStyle|getThemedPageCardStyle)\(\)\}/.test(text);
}

/**
 * Check if text contains CardHeader divider/gradient patterns.
 */
function hasHeaderStyle(text) {
    return (text.includes('--theme-divider') || text.includes('color-mix')) && 
           (text.includes('borderColor') || text.includes('background'));
}

function hasHeaderHelper(text) {
    return /style=\{(getCardHeaderStyle|getThemedPageCardHeaderStyle|getThemedCardHeaderStyle)\(\)\}/.test(text);
}

/**
 * Process a single file. We work line-by-line and when we see `<Card ` or `<CardHeader `,
 * we collect that tag's full text by counting JSX expression braces `{` `}` to know
 * when the style={{...}} is complete, and stopping at the `>` that closes the tag
 * ONLY when brace depth is 0.
 */
function processFile(filePath) {
    stats.filesScanned++;
    const rel = relative(UI_DIR, filePath).replace(/\\/g, '/');
    if (shouldSkip(rel)) { stats.skipped.push(rel); return; }

    const content = readFileSync(filePath, 'utf-8');
    
    // Quick check: does file have anything to migrate?
    if (!content.includes('--theme-content') && 
        !content.includes('getCardStyle') && !content.includes('getThemedCardStyle') &&
        !content.includes('getThemedPageCardStyle') &&
        !content.includes('--theme-divider') &&
        !content.includes('getCardHeaderStyle') && !content.includes('getThemedPageCardHeaderStyle') &&
        !content.includes('getThemedCardHeaderStyle')) {
        return;
    }

    const lines = content.split('\n');
    const result = [];
    let i = 0;
    let modified = false;

    while (i < lines.length) {
        const line = lines[i];
        const trimmed = line.trim();

        // Detect <Card opening (not <CardHeader, not <CardBody)
        if (/^\s*<Card\s/.test(line) && !trimmed.startsWith('<CardH') && !trimmed.startsWith('<CardB') && !trimmed.startsWith('<CardF')) {
            const tagResult = collectTag(lines, i);
            const tagText = tagResult.lines.join('\n');
            
            if (hasCardGradient(tagText) || hasCardHelper(tagText)) {
                const replaced = replaceCardTag(tagResult.lines, line.match(/^(\s*)/)[1]);
                result.push(...replaced);
                i = tagResult.endIdx + 1;
                modified = true;
                stats.cardStyles++;
                continue;
            }
        }

        // Detect <CardHeader opening
        if (/^\s*<CardHeader[\s>]/.test(line)) {
            const tagResult = collectTag(lines, i);
            const tagText = tagResult.lines.join('\n');
            
            if (hasHeaderStyle(tagText) || hasHeaderHelper(tagText)) {
                const replaced = replaceHeaderTag(tagResult.lines, line.match(/^(\s*)/)[1]);
                result.push(...replaced);
                i = tagResult.endIdx + 1;
                modified = true;
                stats.headerStyles++;
                continue;
            }
        }

        result.push(line);
        i++;
    }

    // Remove helper function definitions
    let finalContent = result.join('\n');
    const helperPatterns = [
        /\n[ \t]*const getCardStyle = \(\) => \(\{[^;]*\}\);\n/gs,
        /\n[ \t]*const getThemedCardStyle = \(\) => \(\{[^;]*\}\);\n/gs,
        /\n[ \t]*const getThemedPageCardStyle = \(\) => \(\{[^;]*\}\);\n/gs,
        /\n[ \t]*const getCardHeaderStyle = \(\) => \(\{[^;]*\}\);\n/gs,
        /\n[ \t]*const getThemedPageCardHeaderStyle = \(\) => \(\{[^;]*\}\);\n/gs,
        /\n[ \t]*const getThemedCardHeaderStyle = \(\) => \(\{[^;]*\}\);\n/gs,
    ];
    for (const pattern of helperPatterns) {
        const before = finalContent;
        finalContent = finalContent.replace(pattern, '\n');
        if (finalContent !== before) stats.helpers++;
    }
    if (finalContent !== result.join('\n')) modified = true;

    if (modified) {
        if (DRY_RUN) {
            console.log(`[DRY RUN] Would modify: ${rel}`);
        } else {
            writeFileSync(filePath, finalContent, 'utf-8');
            console.log(`Modified: ${rel}`);
        }
        stats.filesModified++;
    }
}

/**
 * Collect a JSX opening tag starting at line `startIdx`.
 * A JSX opening tag ends when we hit a `>` at brace depth 0.
 * Brace depth tracks `{` and `}` to skip over style={{...}} expressions.
 * 
 * CRITICAL: We must NOT cross into a CHILD tag. If we see a line starting with
 * `<SomeComponent` while at brace depth 0, we've gone too far — end before it.
 */
function collectTag(lines, startIdx) {
    let braceDepth = 0;
    const collected = [];
    
    for (let i = startIdx; i < Math.min(startIdx + 30, lines.length); i++) {
        const line = lines[i];
        const trimmed = line.trim();
        
        // If we're past the first line, at brace depth 0, and this line starts a new JSX tag → stop
        if (i > startIdx && braceDepth === 0 && /^<[A-Z]/.test(trimmed)) {
            return { lines: collected, endIdx: i - 1 };
        }
        
        collected.push(line);
        
        // Count braces
        for (const ch of line) {
            if (ch === '{') braceDepth++;
            else if (ch === '}') braceDepth--;
        }
        
        // Check if tag ends on this line (> at brace depth 0, not inside a string)
        if (braceDepth === 0 && trimmed.endsWith('>') && !trimmed.endsWith('/>')) {
            return { lines: collected, endIdx: i };
        }
        // Self-closing
        if (braceDepth === 0 && trimmed.endsWith('/>')) {
            return { lines: collected, endIdx: i };
        }
    }
    
    // Fallback: couldn't find end, return just the first line
    return { lines: [lines[startIdx]], endIdx: startIdx };
}

/**
 * Replace a Card tag's lines with a simple `<Card className="aero-card">`.
 * Preserve any additional classNames that aren't "transition-all duration-200".
 */
function replaceCardTag(tagLines, indent) {
    const tagText = tagLines.join(' ');
    
    // Extract existing className
    const classMatch = tagText.match(/className="([^"]*)"/);
    let classes = classMatch ? classMatch[1] : '';
    
    // Remove "transition-all duration-200" — it's in .aero-card
    classes = classes.replace('transition-all duration-200', '').trim();
    
    // Build new className
    const newClasses = classes ? `aero-card ${classes}` : 'aero-card';
    
    return [`${indent}<Card className="${newClasses}">`];
}

/**
 * Replace a CardHeader tag's lines. Add "aero-card-header" to className,
 * remove the style attribute entirely.
 */
function replaceHeaderTag(tagLines, indent) {
    const tagText = tagLines.join(' ');
    
    // Extract existing className
    const classMatch = tagText.match(/className="([^"]*)"/);
    let classes = classMatch ? classMatch[1] : '';
    
    // Build new className with aero-card-header prepended
    const newClasses = classes ? `aero-card-header ${classes}` : 'aero-card-header';
    
    return [`${indent}<CardHeader className="${newClasses}">`];
}

// Main
console.log(`\n🔄 Phase 2 v4: Migrating inline Card/CardHeader styles to CSS classes`);
console.log(`   Directory: ${UI_DIR}`);
console.log(`   Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}\n`);

const files = getAllJsxFiles(UI_DIR);
for (const file of files) {
    processFile(file);
}

console.log(`\n📊 Migration Summary:`);
console.log(`   Files scanned: ${stats.filesScanned}`);
console.log(`   Files modified: ${stats.filesModified}`);
console.log(`   Card styles replaced: ${stats.cardStyles}`);
console.log(`   Header styles replaced: ${stats.headerStyles}`);
console.log(`   Helper functions removed: ${stats.helpers}`);
if (stats.skipped.length > 0) {
    console.log(`   Skipped: ${stats.skipped.length} files`);
}
console.log('');
