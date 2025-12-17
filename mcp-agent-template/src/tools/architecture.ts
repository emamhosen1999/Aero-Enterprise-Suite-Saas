import path from "path";
import { fileExists, getRepoRoot, readJsonFile, readPackageComposer, getPackages } from "./utils.js";

interface DistributionRules {
  distributions: {
    [key: string]: {
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
