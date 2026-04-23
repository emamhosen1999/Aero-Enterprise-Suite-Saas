import { checkDualArchitectureCompliance, detectDistribution } from "../src/tools/architecture.js";
import { log, logError } from "../src/tools/utils.js";

/**
 * Run a comprehensive dual architecture compliance check
 * This validates if the repository can support SaaS, Standalone, or both deployment modes
 */
async function runDualComplianceCheck() {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║     Dual Architecture Compliance Check                      ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  try {
    log("Running comprehensive dual architecture compliance check...");
    
    const results = await checkDualArchitectureCompliance();
    
    // Display Current Distribution
    console.log("📊 CURRENT DISTRIBUTION");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Distribution Type:    ${results.currentDistribution.type.toUpperCase()}`);
    console.log(`Confidence Level:     ${results.currentDistribution.confidence}%`);
    console.log(`Active Packages:      ${results.currentDistribution.packages.length}`);
    console.log("\nDetection Indicators:");
    results.currentDistribution.indicators.forEach((indicator: string) => {
      console.log(`  ${indicator}`);
    });
    
    // Display SaaS Compliance
    console.log("\n\n🏢 SAAS DISTRIBUTION COMPLIANCE");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    if (results.compliance.saas.valid) {
      console.log("Status: ✅ COMPLIANT");
      console.log(`Compatible Packages: ${results.compliance.saas.compatiblePackages.length}`);
      console.log("\nCompatible Packages:");
      results.compliance.saas.compatiblePackages.forEach((pkg: string) => {
        console.log(`  ✓ ${pkg}`);
      });
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
      
      if (results.compliance.saas.incompatiblePackages.length > 0) {
        console.log("\nIncompatible/Missing Packages:");
        results.compliance.saas.incompatiblePackages.forEach((pkg: string) => {
          console.log(`  ✗ ${pkg}`);
        });
      }
    }
    
    // Display Standalone Compliance
    console.log("\n\n🖥️  STANDALONE DISTRIBUTION COMPLIANCE");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    if (results.compliance.standalone.valid) {
      console.log("Status: ✅ COMPLIANT");
      console.log(`Compatible Packages: ${results.compliance.standalone.compatiblePackages.length}`);
      console.log("\nCompatible Packages:");
      results.compliance.standalone.compatiblePackages.forEach((pkg: string) => {
        console.log(`  ✓ ${pkg}`);
      });
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
      
      if (results.compliance.standalone.incompatiblePackages.length > 0) {
        console.log("\nIncompatible Packages:");
        results.compliance.standalone.incompatiblePackages.forEach((pkg: string) => {
          console.log(`  ✗ ${pkg}`);
        });
      }
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
      console.log("✅ DUAL MODE CAPABLE");
      console.log("   This repository can be deployed as BOTH SaaS and Standalone");
      console.log("\n   Deployment Options:");
      console.log("   1. SaaS Multi-Tenant: Use apps/saas-host with aero-platform");
      console.log("   2. Standalone Single-Tenant: Use apps/standalone-host without aero-platform");
    } else if (deploymentModes.length === 1) {
      console.log(`✅ SINGLE MODE: ${deploymentModes[0].toUpperCase()}`);
      console.log(`   This repository can only be deployed as ${deploymentModes[0]}`);
      
      if (deploymentModes[0] === "SaaS") {
        console.log("\n   To enable Standalone mode:");
        console.log("   - Remove aero-platform package");
        console.log("   - Ensure aero-core is present");
      } else {
        console.log("\n   To enable SaaS mode:");
        console.log("   - Add aero-platform package");
        console.log("   - Configure multi-tenancy");
      }
    } else {
      console.log("❌ NO VALID DEPLOYMENT MODE");
      console.log("   This repository cannot be deployed in either mode");
      console.log("   Fix violations above to enable at least one deployment mode");
    }
    
    console.log("\n" + "═".repeat(64) + "\n");
    
    // Exit code based on compliance
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
