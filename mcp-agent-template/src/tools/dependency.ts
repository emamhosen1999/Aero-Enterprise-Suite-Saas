import path from "path";
import { getRepoRoot, getPackages, readPackageComposer, formatJson } from "./utils.js";

interface DependencyNode {
  package: string;
  dependencies: string[];
  dependents: string[];
  depth: number;
}

interface DependencyGraph {
  nodes: Record<string, DependencyNode>;
  edges: Array<{ from: string; to: string }>;
  levels: string[][];
}

/**
 * Build dependency graph for all packages
 */
export async function buildDependencyGraph(): Promise<DependencyGraph> {
  const packages = await getPackages();
  const nodes: Record<string, DependencyNode> = {};
  const edges: Array<{ from: string; to: string }> = [];

  // Initialize nodes
  for (const pkg of packages) {
    nodes[pkg] = {
      package: pkg,
      dependencies: [],
      dependents: [],
      depth: 0,
    };
  }

  // Build dependency relationships
  for (const pkg of packages) {
    const composer = await readPackageComposer(pkg);
    if (composer?.require) {
      const aeroDeps = Object.keys(composer.require)
        .filter(dep => dep.startsWith("aero/"))
        .map(dep => dep.replace("aero/", "aero-"));

      for (const dep of aeroDeps) {
        if (nodes[dep]) {
          nodes[pkg].dependencies.push(dep);
          nodes[dep].dependents.push(pkg);
          edges.push({ from: pkg, to: dep });
        }
      }
    }
  }

  // Calculate depth (distance from leaf nodes)
  const calculateDepth = (pkg: string, visited = new Set<string>()): number => {
    if (visited.has(pkg)) return 0; // Circular dependency protection
    visited.add(pkg);

    const node = nodes[pkg];
    if (node.dependencies.length === 0) {
      return 0;
    }

    const depths = node.dependencies.map(dep => calculateDepth(dep, new Set(visited)));
    return Math.max(...depths) + 1;
  };

  for (const pkg of packages) {
    nodes[pkg].depth = calculateDepth(pkg);
  }

  // Group packages by depth level
  const maxDepth = Math.max(...packages.map(pkg => nodes[pkg].depth));
  const levels: string[][] = Array.from({ length: maxDepth + 1 }, () => []);
  
  for (const pkg of packages) {
    levels[nodes[pkg].depth].push(pkg);
  }

  return {
    nodes,
    edges,
    levels,
  };
}

/**
 * Find circular dependencies
 */
export async function findCircularDependencies(): Promise<string[][]> {
  const graph = await buildDependencyGraph();
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  const dfs = (pkg: string, path: string[]): void => {
    visited.add(pkg);
    recursionStack.add(pkg);
    path.push(pkg);

    const node = graph.nodes[pkg];
    for (const dep of node.dependencies) {
      if (!visited.has(dep)) {
        dfs(dep, [...path]);
      } else if (recursionStack.has(dep)) {
        // Found a cycle
        const cycleStart = path.indexOf(dep);
        const cycle = path.slice(cycleStart);
        cycle.push(dep);
        cycles.push(cycle);
      }
    }

    recursionStack.delete(pkg);
  };

  for (const pkg of Object.keys(graph.nodes)) {
    if (!visited.has(pkg)) {
      dfs(pkg, []);
    }
  }

  return cycles;
}

/**
 * Get dependency tree for a specific package
 */
export async function getPackageDependencyTree(packageName: string): Promise<any> {
  const graph = await buildDependencyGraph();
  const node = graph.nodes[packageName];

  if (!node) {
    throw new Error(`Package '${packageName}' not found`);
  }

  const buildTree = (pkg: string, visited = new Set<string>()): any => {
    if (visited.has(pkg)) {
      return { package: pkg, circular: true };
    }
    visited.add(pkg);

    const node = graph.nodes[pkg];
    return {
      package: pkg,
      dependencies: node.dependencies.map(dep => buildTree(dep, new Set(visited))),
      dependents: node.dependents.length,
    };
  };

  return buildTree(packageName);
}

/**
 * Get packages that depend on a specific package
 */
export async function getPackageDependents(packageName: string): Promise<string[]> {
  const graph = await buildDependencyGraph();
  const node = graph.nodes[packageName];

  if (!node) {
    throw new Error(`Package '${packageName}' not found`);
  }

  return node.dependents;
}

/**
 * Calculate package metrics
 */
export async function calculatePackageMetrics(): Promise<any> {
  const graph = await buildDependencyGraph();
  const packages = Object.keys(graph.nodes);

  const metrics = packages.map(pkg => {
    const node = graph.nodes[pkg];
    return {
      package: pkg,
      directDependencies: node.dependencies.length,
      directDependents: node.dependents.length,
      depth: node.depth,
      stability: node.dependents.length / (node.dependencies.length + node.dependents.length + 1),
    };
  });

  // Sort by importance (dependents count)
  metrics.sort((a, b) => b.directDependents - a.directDependents);

  return {
    packages: metrics,
    summary: {
      totalPackages: packages.length,
      maxDepth: Math.max(...metrics.map(m => m.depth)),
      averageDependencies: metrics.reduce((sum, m) => sum + m.directDependencies, 0) / packages.length,
      mostDepended: metrics[0].package,
    },
  };
}

/**
 * Generate Graphviz DOT format for visualization
 */
export async function generateGraphvizDot(): Promise<string> {
  const graph = await buildDependencyGraph();
  
  let dot = 'digraph Dependencies {\n';
  dot += '  rankdir=LR;\n';
  dot += '  node [shape=box, style=rounded];\n\n';

  // Add nodes with colors based on type
  for (const pkg of Object.keys(graph.nodes)) {
    const node = graph.nodes[pkg];
    let color = 'lightblue';
    
    if (pkg === 'aero-core') {
      color = 'lightgreen';
    } else if (pkg === 'aero-platform') {
      color = 'lightyellow';
    } else if (node.dependencies.length === 0) {
      color = 'lightgray';
    }
    
    dot += `  "${pkg}" [fillcolor="${color}", style=filled];\n`;
  }

  dot += '\n';

  // Add edges
  for (const edge of graph.edges) {
    dot += `  "${edge.from}" -> "${edge.to}";\n`;
  }

  dot += '}\n';
  
  return dot;
}
