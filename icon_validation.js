/**
 * Icon Resolution Validation Script
 * 
 * This script validates that all icons used in module configurations
 * are now properly resolved with the enhanced system.
 */

import { ICON_MAP, getIcon } from '../packages/aero-ui/resources/js/Configs/navigationUtils.jsx';

// All icons currently used in module configurations
const USED_ICONS = [
    'HomeIcon', 'UserGroupIcon', 'CalendarDaysIcon', 'Cog6ToothIcon', 'Cog8ToothIcon',
    'CalendarIcon', 'ArrowRightOnRectangleIcon', 'EnvelopeIcon', 'DocumentTextIcon',
    'BriefcaseIcon', 'FolderIcon', 'ChartBarSquareIcon', 'ChartBarIcon', 'ChartPieIcon',
    'CreditCardIcon', 'BuildingOfficeIcon', 'BuildingOffice2Icon', 'BanknotesIcon',
    'WrenchScrewdriverIcon', 'ClipboardDocumentCheckIcon', 'ClipboardDocumentListIcon',
    'DocumentDuplicateIcon', 'ShieldCheckIcon', 'UserIcon', 'UsersIcon', 'ArchiveBoxIcon',
    'AcademicCapIcon', 'CubeIcon', 'ScaleIcon', 'BuildingStorefrontIcon', 'ArrowPathIcon',
    'CurrencyDollarIcon', 'ClockIcon', 'UserCircleIcon', 'UserPlusIcon', 'SparklesIcon',
    'ChatBubbleLeftRightIcon', 'FunnelIcon', 'ViewColumnsIcon', 'ExclamationTriangleIcon',
    'ExclamationCircleIcon', 'LinkIcon', 'KeyIcon', 'ArrowsRightLeftIcon',
    'DocumentChartBarIcon', 'PresentationChartLineIcon', 'CommandLineIcon',
    'ComputerDesktopIcon', 'PaintBrushIcon', 'LanguageIcon', 'GlobeAltIcon',
    'CircleStackIcon', 'ServerIcon', 'PuzzlePieceIcon', 'QueueListIcon',
    'RectangleStackIcon', 'ShoppingCartIcon', 'TruckIcon',
    // Previously missing icons (now should be available)
    'ArrowTrendingUpIcon', 'BeakerIcon', 'BellAlertIcon', 'BellIcon', 'BoltIcon',
    'BookOpenIcon', 'BuildingLibraryIcon', 'CalculatorIcon', 'CheckCircleIcon',
    'CloudArrowDownIcon', 'CogIcon', 'CpuChipIcon', 'CubeTransparentIcon',
    'DocumentCheckIcon', 'DocumentIcon', 'FlagIcon', 'FolderOpenIcon', 'GiftIcon',
    'GlobeAmericasIcon', 'IdentificationIcon', 'LifebuoyIcon', 'ListBulletIcon',
    'LockClosedIcon', 'MagnifyingGlassIcon', 'MapIcon', 'MapPinIcon', 'MegaphoneIcon',
    'PhotoIcon', 'QuestionMarkCircleIcon', 'ReceiptPercentIcon', 'ShareIcon',
    'SignalIcon', 'TableCellsIcon', 'TagIcon', 'VariableIcon', 'ViewfinderCircleIcon',
    'XMarkIcon'
];

/**
 * Validate icon resolution
 */
export function validateIconResolution() {
    const results = {
        total: USED_ICONS.length,
        resolved: 0,
        missing: [],
        fallbacks: [],
        success: true
    };

    console.log('🎨 Validating Enhanced Icon Resolution System...\n');

    USED_ICONS.forEach(iconName => {
        try {
            // Test direct resolution
            const resolved = ICON_MAP[iconName];
            const viaFunction = getIcon(iconName);
            
            if (resolved && viaFunction) {
                results.resolved++;
                console.log(`✅ ${iconName} - RESOLVED`);
            } else if (viaFunction) {
                // Icon resolved via fallback system
                results.fallbacks.push(iconName);
                console.log(`⚠️  ${iconName} - FALLBACK USED`);
            } else {
                // Icon completely missing
                results.missing.push(iconName);
                results.success = false;
                console.log(`❌ ${iconName} - MISSING`);
            }
        } catch (error) {
            results.missing.push(iconName);
            results.success = false;
            console.log(`❌ ${iconName} - ERROR: ${error.message}`);
        }
    });

    console.log('\n📊 VALIDATION RESULTS:');
    console.log(`Total Icons: ${results.total}`);
    console.log(`✅ Resolved: ${results.resolved} (${Math.round(results.resolved/results.total*100)}%)`);
    console.log(`⚠️  Fallbacks: ${results.fallbacks.length}`);
    console.log(`❌ Missing: ${results.missing.length}`);

    if (results.fallbacks.length > 0) {
        console.log('\n⚠️  Icons using fallback system:');
        results.fallbacks.forEach(icon => console.log(`   - ${icon}`));
    }

    if (results.missing.length > 0) {
        console.log('\n❌ Still missing icons:');
        results.missing.forEach(icon => console.log(`   - ${icon}`));
    }

    if (results.success && results.missing.length === 0) {
        console.log('\n🎉 SUCCESS! All icons are now properly resolved!');
        console.log('✨ The enhanced icon system has eliminated all missing icons.');
    } else {
        console.log('\n⚠️  Some icons still need attention.');
    }

    return results;
}

/**
 * Performance benchmark
 */
export function benchmarkIconResolution() {
    console.log('\n⚡ Benchmarking Icon Resolution Performance...\n');

    const iterations = 1000;
    const testIcons = ['HomeIcon', 'UserGroupIcon', 'DocumentTextIcon', 'ChartBarIcon', 'MapIcon'];

    // Test current system
    const startTime = performance.now();
    for (let i = 0; i < iterations; i++) {
        testIcons.forEach(icon => getIcon(icon));
    }
    const endTime = performance.now();

    const avgTime = (endTime - startTime) / (iterations * testIcons.length);
    
    console.log(`📈 Performance Results:`);
    console.log(`   - Average resolution time: ${avgTime.toFixed(4)}ms per icon`);
    console.log(`   - Total test time: ${(endTime - startTime).toFixed(2)}ms`);
    console.log(`   - Icons tested: ${testIcons.length} x ${iterations} = ${testIcons.length * iterations}`);

    if (avgTime < 0.01) {
        console.log('🚀 EXCELLENT: Icon resolution is very fast!');
    } else if (avgTime < 0.1) {
        console.log('✅ GOOD: Icon resolution performance is acceptable');
    } else {
        console.log('⚠️  SLOW: Icon resolution may need optimization');
    }

    return {
        avgTime,
        totalTime: endTime - startTime,
        iterations,
        iconsPerIteration: testIcons.length
    };
}

/**
 * Generate usage report
 */
export function generateIconUsageReport() {
    console.log('\n📋 Icon Usage Report\n');

    const categories = {
        'Core Navigation': ['HomeIcon', 'ArrowRightOnRectangleIcon', 'LinkIcon'],
        'User Management': ['UserIcon', 'UserGroupIcon', 'UsersIcon', 'UserCircleIcon', 'UserPlusIcon', 'IdentificationIcon'],
        'Documents & Files': ['DocumentTextIcon', 'DocumentIcon', 'DocumentCheckIcon', 'DocumentDuplicateIcon', 'FolderIcon', 'FolderOpenIcon'],
        'Communication': ['EnvelopeIcon', 'ChatBubbleLeftRightIcon', 'BellIcon', 'BellAlertIcon', 'MegaphoneIcon', 'ShareIcon'],
        'Analytics & Charts': ['ChartBarIcon', 'ChartPieIcon', 'ChartBarSquareIcon', 'DocumentChartBarIcon', 'PresentationChartLineIcon'],
        'Time & Calendar': ['CalendarIcon', 'CalendarDaysIcon', 'ClockIcon'],
        'Settings & Tools': ['Cog6ToothIcon', 'Cog8ToothIcon', 'CogIcon', 'WrenchScrewdriverIcon', 'KeyIcon'],
        'Business & Finance': ['BriefcaseIcon', 'CurrencyDollarIcon', 'CreditCardIcon', 'BanknotesIcon', 'CalculatorIcon', 'ReceiptPercentIcon'],
        'Buildings & Places': ['BuildingOfficeIcon', 'BuildingOffice2Icon', 'BuildingStorefrontIcon', 'BuildingLibraryIcon'],
        'Technology': ['ComputerDesktopIcon', 'ServerIcon', 'CommandLineIcon', 'CpuChipIcon', 'BeakerIcon'],
        'Security': ['ShieldCheckIcon', 'LockClosedIcon'],
        'Status & Feedback': ['CheckCircleIcon', 'ExclamationTriangleIcon', 'ExclamationCircleIcon', 'SignalIcon'],
    };

    let totalMapped = 0;
    Object.entries(categories).forEach(([category, icons]) => {
        const mapped = icons.filter(icon => ICON_MAP[icon]).length;
        const percentage = Math.round(mapped / icons.length * 100);
        totalMapped += mapped;
        
        console.log(`${category}: ${mapped}/${icons.length} (${percentage}%)`);
        
        const missing = icons.filter(icon => !ICON_MAP[icon]);
        if (missing.length > 0) {
            console.log(`   Missing: ${missing.join(', ')}`);
        }
    });

    const totalExpected = Object.values(categories).flat().length;
    const overallPercentage = Math.round(totalMapped / totalExpected * 100);
    
    console.log(`\n📊 Overall Coverage: ${totalMapped}/${totalExpected} (${overallPercentage}%)`);
    console.log(`🎯 Total Icons in ICON_MAP: ${Object.keys(ICON_MAP).length}`);

    return {
        totalMapped,
        totalExpected,
        percentage: overallPercentage,
        categories
    };
}

// Auto-run validation if script is executed directly
if (typeof window !== 'undefined' && window.DEBUG_ICONS) {
    validateIconResolution();
    benchmarkIconResolution();
    generateIconUsageReport();
}

export default {
    validateIconResolution,
    benchmarkIconResolution,
    generateIconUsageReport
};