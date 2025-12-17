import fs from "fs/promises";
import path from "path";
import { detectDistribution, checkArchitectureViolations } from "../src/tools/architecture.js";
import { buildDependencyGraph, findCircularDependencies, calculatePackageMetrics } from "../src/tools/dependency.js";
import { listModels, listRoutes, listMigrations } from "../src/tools/laravel.js";
import { listPages, listComponents } from "../src/tools/react.js";
import { getRepoRoot, log, logError } from "../src/tools/utils.js";
/**
 * Generate comprehensive distribution and dependency report
 */
async function generateReport() {
    log("Generating aeos365 monorepo report...");
    try {
        // Architecture analysis
        log("1. Detecting distribution type...");
        const distro = await detectDistribution();
        log("2. Checking architecture violations...");
        const violations = await checkArchitectureViolations();
        // Dependency analysis
        log("3. Building dependency graph...");
        const graph = await buildDependencyGraph();
        log("4. Finding circular dependencies...");
        const circular = await findCircularDependencies();
        log("5. Calculating package metrics...");
        const metrics = await calculatePackageMetrics();
        // Code statistics
        log("6. Collecting code statistics...");
        const models = await listModels();
        const routes = await listRoutes();
        const migrations = await listMigrations();
        const pages = await listPages();
        const components = await listComponents();
        // Build report
        const report = {
            generatedAt: new Date().toISOString(),
            distribution: distro,
            architectureCheck: violations,
            dependencyGraph: {
                totalPackages: Object.keys(graph.nodes).length,
                totalEdges: graph.edges.length,
                levels: graph.levels.length,
                nodes: graph.nodes,
                edges: graph.edges,
            },
            circularDependencies: {
                found: circular.length > 0,
                count: circular.length,
                cycles: circular,
            },
            packageMetrics: metrics,
            statistics: {
                models: models.length,
                routes: routes.length,
                migrations: migrations.length,
                pages: pages.length,
                components: components.length,
            },
        };
        // Write report to file
        const repoRoot = await getRepoRoot();
        const reportPath = path.join(repoRoot, "mcp-report.json");
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        log(`✓ Report generated: ${reportPath}`);
        // Print summary
        console.log("\n=== Report Summary ===");
        console.log(`Distribution: ${report.distribution.type.toUpperCase()}`);
        console.log(`Confidence: ${report.distribution.confidence}%`);
        console.log(`\nArchitecture:`);
        console.log(`  Valid: ${report.architectureCheck.valid ? "✓" : "✗"}`);
        console.log(`  Violations: ${report.architectureCheck.violations.length}`);
        if (report.architectureCheck.violations.length > 0) {
            console.log(`\n  Issues:`);
            for (const violation of report.architectureCheck.violations) {
                console.log(`    [${violation.severity.toUpperCase()}] ${violation.message}`);
            }
        }
        console.log(`\nDependencies:`);
        console.log(`  Total Packages: ${report.dependencyGraph.totalPackages}`);
        console.log(`  Dependencies: ${report.dependencyGraph.totalEdges}`);
        console.log(`  Dependency Levels: ${report.dependencyGraph.levels}`);
        console.log(`  Circular Dependencies: ${report.circularDependencies.count}`);
        if (report.circularDependencies.found) {
            console.log(`\n  Circular Dependency Cycles:`);
            for (const cycle of report.circularDependencies.cycles) {
                console.log(`    ${cycle.join(" → ")}`);
            }
        }
        console.log(`\nCode Statistics:`);
        console.log(`  Models: ${report.statistics.models}`);
        console.log(`  Routes: ${report.statistics.routes}`);
        console.log(`  Migrations: ${report.statistics.migrations}`);
        console.log(`  Pages: ${report.statistics.pages}`);
        console.log(`  Components: ${report.statistics.components}`);
        console.log(`\nTop 5 Most Important Packages (by dependents):`);
        for (let i = 0; i < Math.min(5, report.packageMetrics.packages.length); i++) {
            const pkg = report.packageMetrics.packages[i];
            console.log(`  ${i + 1}. ${pkg.package} (${pkg.directDependents} dependents, ${pkg.directDependencies} dependencies)`);
        }
        console.log(`\n=== End of Report ===\n`);
    }
    catch (error) {
        logError("Failed to generate report", error);
        process.exit(1);
    }
}
// Run the report generator
generateReport();
//# sourceMappingURL=report.js.map