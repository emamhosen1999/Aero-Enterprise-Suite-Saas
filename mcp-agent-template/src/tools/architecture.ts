import path from "path";
import { fileExists, getRepoRoot, readJsonFile, readPackageComposer, getPackages, getHostAppPackages, readHostAppComposer } from "./utils.js";

interface DistributionRules {
  monorepo?: boolean;
  description?: string;
  distributions: {
    [key: string]: {
      hostApp?: string;
      required: string[];
      forbidden: string[];
      user_model: string;
      tenancy: boolean;
      description?: string;
    };
  };
  packages: {
    [key: string]: {
      description: string;
      type: string;
      dependencies: string[];
    };
  };
}

interface DistributionResult {
  type: "saas" | "standalone" | "unknown";
  confidence: number;
  indicators: string[];
  packages: string[];
}

interface ArchitectureViolation {
  severity: "error" | "warning";
  message: string;
  package?: string;
  suggestion?: string;
}

interface ArchitectureCheckResult {
  valid: boolean;
  distribution: string;
  violations: ArchitectureViolation[];
}

/**
 * Load architecture rules from configuration file
 */
async function loadRules(): Promise<DistributionRules> {
  const repoRoot = await getRepoRoot();
  const rulesPath = path.join(repoRoot, "mcp-agent-template", "architecture.rules.json");
  return await readJsonFile<DistributionRules>(rulesPath);
}

/**
 * Detect whether the repository is configured for SaaS or Standalone mode
 */
export async function detectDistribution(): Promise<DistributionResult> {
  const repoRoot = await getRepoRoot();
  const rules = await loadRules();
  const packages = await getPackages();
  
  const indicators: string[] = [];
  let distributionType: "saas" | "standalone" | "unknown" = "unknown";
  let confidence = 0;

  // Check for aero-platform package
  if (packages.includes("aero-platform")) {
    indicators.push("✓ aero-platform package found (SaaS indicator)");
    confidence += 50;
  }

  // Check for tenancy configuration
  const tenancyConfig = path.join(repoRoot, "config", "tenancy.php");
  if (await fileExists(tenancyConfig)) {
    indicators.push("✓ tenancy.php configuration found (SaaS indicator)");
    confidence += 20;
  }

  // Check for apps/saas-host
  const saasHost = path.join(repoRoot, "apps", "saas-host");
  if (await fileExists(saasHost)) {
    indicators.push("✓ apps/saas-host directory found (SaaS indicator)");
    confidence += 15;
  }

  // Check for apps/standalone-host
  const standaloneHost = path.join(repoRoot, "apps", "standalone-host");
  if (await fileExists(standaloneHost)) {
    indicators.push("✓ apps/standalone-host directory found");
    confidence += 10;
  }

  // Check composer dependencies
  const coreComposer = await readPackageComposer("aero-core");
  if (coreComposer) {
    if (coreComposer.require?.["stancl/tenancy"]) {
      indicators.push("✓ stancl/tenancy dependency found (SaaS indicator)");
      confidence += 15;
    }
  }

  // Determine distribution type based on confidence
  if (packages.includes("aero-platform") && confidence >= 50) {
    distributionType = "saas";
  } else if (!packages.includes("aero-platform") && packages.includes("aero-core")) {
    distributionType = "standalone";
    indicators.push("✗ aero-platform package NOT found (Standalone mode)");
  }

  return {
    type: distributionType,
    confidence,
    indicators,
    packages,
  };
}

/**
 * Check for architecture violations based on distribution rules
 */
export async function checkArchitectureViolations(): Promise<ArchitectureCheckResult> {
  const rules = await loadRules();
  const detection = await detectDistribution();
  const violations: ArchitectureViolation[] = [];

  if (detection.type === "unknown") {
    violations.push({
      severity: "error",
      message: "Unable to determine distribution type (SaaS or Standalone)",
      suggestion: "Ensure aero-core or aero-platform package is present",
    });
    
    return {
      valid: false,
      distribution: "unknown",
      violations,
    };
  }

  const distroRules = rules.distributions[detection.type];

  // Check required packages
  for (const required of distroRules.required) {
    if (!detection.packages.includes(required)) {
      violations.push({
        severity: "error",
        message: `Required package '${required}' is missing for ${detection.type} distribution`,
        package: required,
        suggestion: `Add ${required} package to packages/ directory`,
      });
    }
  }

  // Check forbidden packages
  for (const forbidden of distroRules.forbidden) {
    if (detection.packages.includes(forbidden)) {
      violations.push({
        severity: "error",
        message: `Forbidden package '${forbidden}' found in ${detection.type} distribution`,
        package: forbidden,
        suggestion: `Remove ${forbidden} package or switch to SaaS distribution`,
      });
    }
  }

  // Check for orphaned dependencies
  for (const pkg of detection.packages) {
    const composer = await readPackageComposer(pkg);
    if (composer?.require) {
      const aeroDeps = Object.keys(composer.require)
        .filter(dep => dep.startsWith("aero/"))
        .map(dep => dep.replace("aero/", "aero-"));
      
      for (const dep of aeroDeps) {
        if (!detection.packages.includes(dep)) {
          violations.push({
            severity: "warning",
            message: `Package '${pkg}' depends on '${dep}' which is not present`,
            package: pkg,
            suggestion: `Add ${dep} package or remove dependency from ${pkg}/composer.json`,
          });
        }
      }
    }
  }

  return {
    valid: violations.filter(v => v.severity === "error").length === 0,
    distribution: detection.type,
    violations,
  };
}

/**
 * Get package information
 */
export async function getPackageInfo(packageName: string): Promise<any> {
  const rules = await loadRules();
  const composer = await readPackageComposer(packageName);
  
  return {
    name: packageName,
    metadata: rules.packages[packageName] || null,
    composer: composer,
  };
}

/**
 * List all packages with their metadata
 */
export async function listAllPackages(): Promise<any[]> {
  const packages = await getPackages();
  const rules = await loadRules();
  
  return packages.map(pkg => ({
    name: pkg,
    ...rules.packages[pkg],
  }));
}

/**
 * Check compliance for both SaaS and Standalone distributions
 * For monorepo: checks each host app's composer.json to validate compliance
 * The packages/ directory is a shared library - presence there is not a violation
 */
export async function checkDualArchitectureCompliance(): Promise<any> {
  const rules = await loadRules();
  const allPackages = await getPackages(); // All packages in packages/ directory
  const repoRoot = await getRepoRoot();

  // Get packages actually used by each host app
  const saasHostPackages = await getHostAppPackages(rules.distributions.saas.hostApp || "apps/saas-host");
  const standaloneHostPackages = await getHostAppPackages(rules.distributions.standalone.hostApp || "apps/standalone-host");

  const results = {
    monorepo: rules.monorepo || false,
    currentDistribution: await detectDistribution(),
    allPackagesInRepo: allPackages,
    hostApps: {
      saas: {
        path: rules.distributions.saas.hostApp || "apps/saas-host",
        packages: saasHostPackages,
      },
      standalone: {
        path: rules.distributions.standalone.hostApp || "apps/standalone-host",
        packages: standaloneHostPackages,
      },
    },
    compliance: {
      saas: {
        valid: true,
        violations: [] as ArchitectureViolation[],
        compatiblePackages: [] as string[],
        incompatiblePackages: [] as string[],
      },
      standalone: {
        valid: true,
        violations: [] as ArchitectureViolation[],
        compatiblePackages: [] as string[],
        incompatiblePackages: [] as string[],
      },
    },
    recommendations: [] as string[],
  };

  // ============================================
  // Check SaaS Host App Compliance
  // ============================================
  const saasRules = rules.distributions.saas;
  
  // Check required packages for SaaS host
  for (const required of saasRules.required) {
    if (!saasHostPackages.includes(required)) {
      results.compliance.saas.valid = false;
      results.compliance.saas.violations.push({
        severity: "error",
        message: `Required package '${required}' is missing from saas-host composer.json`,
        package: required,
        suggestion: `Add "aero/${required.replace('aero-', '')}": "@dev" to apps/saas-host/composer.json`,
      });
      results.compliance.saas.incompatiblePackages.push(required);
    }
  }

  // Check forbidden packages for SaaS host (typically none)
  for (const forbidden of saasRules.forbidden) {
    if (saasHostPackages.includes(forbidden)) {
      results.compliance.saas.valid = false;
      results.compliance.saas.violations.push({
        severity: "error",
        message: `Forbidden package '${forbidden}' found in saas-host composer.json`,
        package: forbidden,
        suggestion: `Remove "aero/${forbidden.replace('aero-', '')}" from apps/saas-host/composer.json`,
      });
      results.compliance.saas.incompatiblePackages.push(forbidden);
    }
  }

  // All packages in SaaS host are compatible
  results.compliance.saas.compatiblePackages = [...saasHostPackages];

  // ============================================
  // Check Standalone Host App Compliance
  // ============================================
  const standaloneRules = rules.distributions.standalone;
  
  // Check required packages for Standalone host
  for (const required of standaloneRules.required) {
    if (!standaloneHostPackages.includes(required)) {
      results.compliance.standalone.valid = false;
      results.compliance.standalone.violations.push({
        severity: "error",
        message: `Required package '${required}' is missing from standalone-host composer.json`,
        package: required,
        suggestion: `Add "aero/${required.replace('aero-', '')}": "@dev" to apps/standalone-host/composer.json`,
      });
      results.compliance.standalone.incompatiblePackages.push(required);
    }
  }

  // Check forbidden packages for Standalone host (e.g., aero-platform)
  for (const forbidden of standaloneRules.forbidden) {
    if (standaloneHostPackages.includes(forbidden)) {
      results.compliance.standalone.valid = false;
      results.compliance.standalone.violations.push({
        severity: "error",
        message: `Forbidden package '${forbidden}' found in standalone-host composer.json`,
        package: forbidden,
        suggestion: `Remove "aero/${forbidden.replace('aero-', '')}" from apps/standalone-host/composer.json`,
      });
      results.compliance.standalone.incompatiblePackages.push(forbidden);
    }
  }

  // All packages in Standalone host are compatible
  results.compliance.standalone.compatiblePackages = [...standaloneHostPackages];

  // ============================================
  // Generate Recommendations
  // ============================================
  if (rules.monorepo) {
    results.recommendations.push("ℹ️  This is a MONOREPO containing packages for both distributions");
    results.recommendations.push("   Compliance is checked per host app, not per packages/ directory\n");
  }

  if (results.compliance.saas.valid && results.compliance.standalone.valid) {
    results.recommendations.push("✓ DUAL MODE CAPABLE - Both host apps are properly configured");
    results.recommendations.push("  - SaaS deployment: Use apps/saas-host");
    results.recommendations.push("  - Standalone deployment: Use apps/standalone-host");
  } else {
    if (results.compliance.saas.valid) {
      results.recommendations.push("✓ SaaS host (apps/saas-host) is properly configured");
    } else {
      results.recommendations.push(`✗ SaaS host has ${results.compliance.saas.violations.length} violation(s)`);
    }
    
    if (results.compliance.standalone.valid) {
      results.recommendations.push("✓ Standalone host (apps/standalone-host) is properly configured");
    } else {
      results.recommendations.push(`✗ Standalone host has ${results.compliance.standalone.violations.length} violation(s)`);
    }
  }

  // Package summary
  results.recommendations.push(`\n📦 Package Summary:`);
  results.recommendations.push(`  - ${allPackages.length} total packages in packages/ directory`);
  results.recommendations.push(`  - ${saasHostPackages.length} packages used by saas-host`);
  results.recommendations.push(`  - ${standaloneHostPackages.length} packages used by standalone-host`);

  return results;
}
