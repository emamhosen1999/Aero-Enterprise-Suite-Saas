import { checkDualArchitectureCompliance, detectDistribution } from "../src/tools/architecture.js";
import { log, logError } from "../src/tools/utils.js";

/**
 * Run a comprehensive dual architecture compliance check
 * This validates if both host apps (saas-host and standalone-host) are properly configured
 */
async function runDualComplianceCheck() {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║     Dual Architecture Compliance Check                      ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  try {
    log("Running comprehensive dual architecture compliance check...");
    
    const results = await checkDualArchitectureCompliance();
    
    // Display Monorepo Info
    if (results.monorepo) {
      console.log("📂 MONOREPO ARCHITECTURE");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("This repository contains packages for BOTH distributions.");
      console.log("Compliance is validated per host app configuration.\n");
    }

    // Display Available Packages
    console.log("📦 AVAILABLE PACKAGES");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Total packages in packages/ directory: ${results.allPackagesInRepo?.length || results.currentDistribution.packages.length}`);
    (results.allPackagesInRepo || results.currentDistribution.packages).forEach((pkg: string) => {
      console.log(`  • ${pkg}`);
    });

    // Display Host App Configurations
    console.log("\n\n🖥️  HOST APP CONFIGURATIONS");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    if (results.hostApps) {
      console.log(`\nSaaS Host (${results.hostApps.saas.path}):`);
      console.log(`  Packages: ${results.hostApps.saas.packages.length}`);
      results.hostApps.saas.packages.forEach((pkg: string) => {
        console.log(`    ✓ ${pkg}`);
      });

      console.log(`\nStandalone Host (${results.hostApps.standalone.path}):`);
      console.log(`  Packages: ${results.hostApps.standalone.packages.length}`);
      results.hostApps.standalone.packages.forEach((pkg: string) => {
        console.log(`    ✓ ${pkg}`);
      });
    }
    
    // Display SaaS Compliance
    console.log("\n\n🏢 SAAS HOST COMPLIANCE");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    if (results.compliance.saas.valid) {
      console.log("Status: ✅ COMPLIANT");
      console.log(`Packages configured: ${results.compliance.saas.compatiblePackages.length}`);
    } else {
      console.log("Status: ❌ NON-COMPLIANT");
      console.log(`Violations: ${results.compliance.saas.violations.length}`);
      console.log("\nViolations:");
      results.compliance.saas.violations.forEach((violation: any) => {
        console.log(`  [${violation.severity.toUpperCase()}] ${violation.message}`);
        if (violation.suggestion) {
          console.log(`    → ${violation.suggestion}`);
        }
      });
    }
    
    // Display Standalone Compliance
    console.log("\n\n🖥️  STANDALONE HOST COMPLIANCE");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    if (results.compliance.standalone.valid) {
      console.log("Status: ✅ COMPLIANT");
      console.log(`Packages configured: ${results.compliance.standalone.compatiblePackages.length}`);
    } else {
      console.log("Status: ❌ NON-COMPLIANT");
      console.log(`Violations: ${results.compliance.standalone.violations.length}`);
      console.log("\nViolations:");
      results.compliance.standalone.violations.forEach((violation: any) => {
        console.log(`  [${violation.severity.toUpperCase()}] ${violation.message}`);
        if (violation.suggestion) {
          console.log(`    → ${violation.suggestion}`);
        }
      });
    }
    
    // Display Recommendations
    console.log("\n\n💡 RECOMMENDATIONS");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    results.recommendations.forEach((rec: string) => {
      console.log(rec);
    });
    
    // Summary
    console.log("\n\n📋 DEPLOYMENT CAPABILITY SUMMARY");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    const deploymentModes: string[] = [];
    if (results.compliance.saas.valid) deploymentModes.push("SaaS");
    if (results.compliance.standalone.valid) deploymentModes.push("Standalone");
    
    if (deploymentModes.length === 2) {
      console.log("✅ DUAL MODE READY");
      console.log("   Both host apps are properly configured for their respective modes");
      console.log("\n   Deployment Options:");
      console.log("   1. SaaS Multi-Tenant: Deploy using apps/saas-host");
      console.log("   2. Standalone Single-Tenant: Deploy using apps/standalone-host");
    } else if (deploymentModes.length === 1) {
      console.log(`⚠️  SINGLE MODE READY: ${deploymentModes[0].toUpperCase()}`);
      console.log(`   Only the ${deploymentModes[0]} host app is properly configured`);
      
      if (!results.compliance.saas.valid) {
        console.log("\n   To fix SaaS host:");
        results.compliance.saas.violations.forEach((v: any) => {
          console.log(`   - ${v.suggestion}`);
        });
      }
      if (!results.compliance.standalone.valid) {
        console.log("\n   To fix Standalone host:");
        results.compliance.standalone.violations.forEach((v: any) => {
          console.log(`   - ${v.suggestion}`);
        });
      }
    } else {
      console.log("❌ NO VALID DEPLOYMENT MODE");
      console.log("   Neither host app is properly configured");
      console.log("   Fix violations above to enable deployments");
    }
    
    console.log("\n" + "═".repeat(64) + "\n");
    
    // Exit code based on compliance (success if at least one mode is valid)
    if (deploymentModes.length === 0) {
      process.exit(1);
    }
    
  } catch (error: any) {
    logError("Dual compliance check failed", error);
    process.exit(1);
  }
}

// Run the compliance check
runDualComplianceCheck();
