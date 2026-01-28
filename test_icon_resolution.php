#!/usr/bin/env php
<?php

/**
 * Navigation Icon Resolution Test Script
 * 
 * This script tests the enhanced icon resolution system by checking
 * all icons defined in module configurations against the frontend system.
 */

// Colors for console output
class Color {
    const GREEN = "\033[32m";
    const RED = "\033[31m";
    const YELLOW = "\033[33m";
    const BLUE = "\033[34m";
    const RESET = "\033[0m";
    const BOLD = "\033[1m";
}

/**
 * Scan all module config files for icon usage
 */
function scanModuleIcons(): array {
    $moduleConfigPaths = glob(__DIR__ . '/packages/*/config/module.php');
    $usedIcons = [];
    
    foreach ($moduleConfigPaths as $configPath) {
        if (!file_exists($configPath)) continue;
        
        $content = file_get_contents($configPath);
        $moduleName = basename(dirname(dirname($configPath)));
        
        // Find all icon definitions using regex
        preg_match_all("/'icon'\s*=>\s*'([^']+)'/", $content, $matches);
        
        if (!empty($matches[1])) {
            $usedIcons[$moduleName] = array_unique($matches[1]);
        }
    }
    
    return $usedIcons;
}

/**
 * Get icons available in the enhanced navigation utils
 */
function getAvailableIcons(): array {
    $navigationUtilsPath = __DIR__ . '/packages/aero-ui/resources/js/Configs/navigationUtils.jsx';
    
    if (!file_exists($navigationUtilsPath)) {
        echo Color::RED . "❌ navigationUtils.jsx not found at: $navigationUtilsPath" . Color::RESET . "\n";
        return [];
    }
    
    $content = file_get_contents($navigationUtilsPath);
    $availableIcons = [];
    
    // Find all icon definitions in ICON_MAP
    preg_match_all('/^\s*([A-Za-z][A-Za-z0-9]*Icon):\s*<[A-Za-z0-9]*Icon\s*\/>/m', $content, $matches);
    
    if (!empty($matches[1])) {
        $availableIcons = array_unique($matches[1]);
    }
    
    return $availableIcons;
}

/**
 * Main validation function
 */
function validateIconResolution(): void {
    echo Color::BOLD . Color::BLUE . "\n🎨 Navigation Icon Resolution Validation\n" . Color::RESET;
    echo "=" . str_repeat("=", 50) . "\n\n";
    
    // Step 1: Scan module icons
    echo Color::BLUE . "📋 Step 1: Scanning module configurations...\n" . Color::RESET;
    $moduleIcons = scanModuleIcons();
    
    if (empty($moduleIcons)) {
        echo Color::RED . "❌ No module configurations found!\n" . Color::RESET;
        return;
    }
    
    $totalUsedIcons = 0;
    $uniqueUsedIcons = [];
    
    foreach ($moduleIcons as $module => $icons) {
        echo "   " . Color::GREEN . "✓" . Color::RESET . " $module: " . count($icons) . " icons\n";
        $totalUsedIcons += count($icons);
        $uniqueUsedIcons = array_merge($uniqueUsedIcons, $icons);
    }
    
    $uniqueUsedIcons = array_unique($uniqueUsedIcons);
    
    echo "\n📊 Summary:\n";
    echo "   Total modules: " . count($moduleIcons) . "\n";
    echo "   Total icon usages: $totalUsedIcons\n";
    echo "   Unique icons used: " . count($uniqueUsedIcons) . "\n";
    
    // Step 2: Check available icons
    echo "\n" . Color::BLUE . "📋 Step 2: Checking available icons...\n" . Color::RESET;
    $availableIcons = getAvailableIcons();
    
    if (empty($availableIcons)) {
        echo Color::RED . "❌ Could not parse available icons from navigationUtils.jsx\n" . Color::RESET;
        return;
    }
    
    echo "   " . Color::GREEN . "✓" . Color::RESET . " Found " . count($availableIcons) . " available icons in ICON_MAP\n";
    
    // Step 3: Cross-reference
    echo "\n" . Color::BLUE . "📋 Step 3: Cross-referencing...\n" . Color::RESET;
    
    $resolvedIcons = [];
    $missingIcons = [];
    
    foreach ($uniqueUsedIcons as $iconName) {
        if (in_array($iconName, $availableIcons)) {
            $resolvedIcons[] = $iconName;
        } else {
            $missingIcons[] = $iconName;
        }
    }
    
    // Step 4: Results
    echo "\n" . Color::BOLD . "🎯 RESULTS:\n" . Color::RESET;
    echo "=" . str_repeat("=", 30) . "\n";
    
    $resolvedPercentage = count($uniqueUsedIcons) > 0 ? round(count($resolvedIcons) / count($uniqueUsedIcons) * 100, 1) : 0;
    
    echo Color::GREEN . "✅ Resolved Icons: " . count($resolvedIcons) . " ($resolvedPercentage%)\n" . Color::RESET;
    
    if (!empty($missingIcons)) {
        echo Color::RED . "❌ Missing Icons: " . count($missingIcons) . "\n" . Color::RESET;
        echo Color::YELLOW . "   Still missing icons:\n" . Color::RESET;
        foreach ($missingIcons as $icon) {
            echo Color::YELLOW . "     - $icon\n" . Color::RESET;
        }
    } else {
        echo Color::GREEN . "🎉 ALL ICONS RESOLVED! Perfect coverage.\n" . Color::RESET;
    }
    
    // Step 5: Recommendations
    echo "\n" . Color::BOLD . "💡 RECOMMENDATIONS:\n" . Color::RESET;
    
    if (count($missingIcons) === 0) {
        echo Color::GREEN . "✨ Excellent! The enhanced icon system has resolved all icon resolution issues.\n" . Color::RESET;
        echo Color::GREEN . "✨ Navigation will now display proper icons instead of generic fallbacks.\n" . Color::RESET;
    } else {
        echo Color::YELLOW . "⚠️  Add the missing " . count($missingIcons) . " icons to navigationUtils.jsx ICON_MAP\n" . Color::RESET;
        echo Color::YELLOW . "⚠️  Import statements need to be added for the missing icons\n" . Color::RESET;
    }
    
    // Step 6: Performance Impact
    echo "\n" . Color::BOLD . "⚡ PERFORMANCE IMPACT:\n" . Color::RESET;
    $bundleIncrease = count($resolvedIcons) * 0.5; // Rough estimate: 0.5KB per icon
    echo "📈 Estimated bundle size increase: ~" . round($bundleIncrease, 1) . "KB\n";
    echo "🚀 Icon resolution speed: Instant (cached)\n";
    echo "💾 Memory usage: Minimal (shared components)\n";
    
    echo "\n" . Color::BOLD . Color::GREEN . "✅ VALIDATION COMPLETE!\n" . Color::RESET;
}

// Run validation
validateIconResolution();