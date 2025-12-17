import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import * as arch from "./tools/architecture.js";
import * as laravel from "./tools/laravel.js";
import * as react from "./tools/react.js";
import * as git from "./tools/git.js";
import * as dep from "./tools/dependency.js";
import { formatJson, log, logError } from "./tools/utils.js";

/**
 * MCP Server for aeos365 monorepo multi-agent support
 */
class AeroMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "aeos365-mcp-node",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        // Architecture Tools
        {
          name: "detect_distribution",
          description: "Detect whether the repository is configured for SaaS or Standalone mode",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "check_architecture_violations",
          description: "Check for architecture violations based on distribution rules",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "get_package_info",
          description: "Get detailed information about a specific package",
          inputSchema: {
            type: "object",
            properties: {
              packageName: {
                type: "string",
                description: "Name of the package (e.g., aero-core, aero-platform)",
              },
            },
            required: ["packageName"],
          },
        },
        {
          name: "list_all_packages",
          description: "List all packages with their metadata",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },

        // Laravel Tools
        {
          name: "list_models",
          description: "List all Eloquent models across packages",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "list_routes",
          description: "List all routes from route files across packages",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "list_migrations",
          description: "List all database migrations across packages",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "list_controllers",
          description: "List all controllers, optionally filtered by package",
          inputSchema: {
            type: "object",
            properties: {
              packageName: {
                type: "string",
                description: "Optional package name to filter controllers",
              },
            },
          },
        },
        {
          name: "list_middleware",
          description: "List all middleware, optionally filtered by package",
          inputSchema: {
            type: "object",
            properties: {
              packageName: {
                type: "string",
                description: "Optional package name to filter middleware",
              },
            },
          },
        },
        {
          name: "list_service_providers",
          description: "List all service providers across packages",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },

        // React Tools
        {
          name: "list_pages",
          description: "List all Inertia pages across packages",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "list_components",
          description: "List all React components across packages",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "analyze_component_dependencies",
          description: "Analyze dependencies for a specific component",
          inputSchema: {
            type: "object",
            properties: {
              componentPath: {
                type: "string",
                description: "Relative path to the component file",
              },
            },
            required: ["componentPath"],
          },
        },
        {
          name: "find_components_using_heroui",
          description: "Find components using a specific HeroUI component",
          inputSchema: {
            type: "object",
            properties: {
              heroUIComponent: {
                type: "string",
                description: "Name of the HeroUI component (e.g., Button, Table, Modal)",
              },
            },
            required: ["heroUIComponent"],
          },
        },
        {
          name: "get_page_hierarchy",
          description: "Get page hierarchy and routing structure",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "list_forms",
          description: "List all form components across packages",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "list_tables",
          description: "List all table components across packages",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },

        // Git Tools
        {
          name: "git_diff",
          description: "Get git diff for a specific target (commit, branch, or file)",
          inputSchema: {
            type: "object",
            properties: {
              target: {
                type: "string",
                description: "Git target (commit hash, branch name, or file path). Defaults to HEAD",
                default: "HEAD",
              },
            },
          },
        },
        {
          name: "git_blame",
          description: "Get git blame for a specific file",
          inputSchema: {
            type: "object",
            properties: {
              file: {
                type: "string",
                description: "Path to the file",
              },
              startLine: {
                type: "number",
                description: "Optional start line number",
              },
              endLine: {
                type: "number",
                description: "Optional end line number",
              },
            },
            required: ["file"],
          },
        },
        {
          name: "git_log",
          description: "Get git commit history for the repository or a specific file",
          inputSchema: {
            type: "object",
            properties: {
              file: {
                type: "string",
                description: "Optional file path to get history for",
              },
              limit: {
                type: "number",
                description: "Number of commits to return (default: 10)",
                default: 10,
              },
            },
          },
        },
        {
          name: "git_status",
          description: "Get status of changed files in working directory",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "get_package_history",
          description: "Get recent commits that modified a specific package",
          inputSchema: {
            type: "object",
            properties: {
              packageName: {
                type: "string",
                description: "Name of the package",
              },
              limit: {
                type: "number",
                description: "Number of commits to return (default: 10)",
                default: 10,
              },
            },
            required: ["packageName"],
          },
        },
        {
          name: "get_package_contributors",
          description: "Get contributors for a specific package",
          inputSchema: {
            type: "object",
            properties: {
              packageName: {
                type: "string",
                description: "Name of the package",
              },
            },
            required: ["packageName"],
          },
        },

        // Dependency Tools
        {
          name: "build_dependency_graph",
          description: "Build dependency graph for all packages",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "find_circular_dependencies",
          description: "Find circular dependencies between packages",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "get_package_dependency_tree",
          description: "Get dependency tree for a specific package",
          inputSchema: {
            type: "object",
            properties: {
              packageName: {
                type: "string",
                description: "Name of the package",
              },
            },
            required: ["packageName"],
          },
        },
        {
          name: "get_package_dependents",
          description: "Get packages that depend on a specific package",
          inputSchema: {
            type: "object",
            properties: {
              packageName: {
                type: "string",
                description: "Name of the package",
              },
            },
            required: ["packageName"],
          },
        },
        {
          name: "calculate_package_metrics",
          description: "Calculate metrics for all packages (dependencies, dependents, stability)",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "generate_graphviz_dot",
          description: "Generate Graphviz DOT format for dependency visualization",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args = {} } = request.params;
        log(`Tool called: ${name}`);

        let result: any;

        switch (name) {
          // Architecture tools
          case "detect_distribution":
            result = await arch.detectDistribution();
            break;
          case "check_architecture_violations":
            result = await arch.checkArchitectureViolations();
            break;
          case "get_package_info":
            result = await arch.getPackageInfo((args as any).packageName as string);
            break;
          case "list_all_packages":
            result = await arch.listAllPackages();
            break;

          // Laravel tools
          case "list_models":
            result = await laravel.listModels();
            break;
          case "list_routes":
            result = await laravel.listRoutes();
            break;
          case "list_migrations":
            result = await laravel.listMigrations();
            break;
          case "list_controllers":
            result = await laravel.listControllers((args as any).packageName as string | undefined);
            break;
          case "list_middleware":
            result = await laravel.listMiddleware((args as any).packageName as string | undefined);
            break;
          case "list_service_providers":
            result = await laravel.listServiceProviders();
            break;

          // React tools
          case "list_pages":
            result = await react.listPages();
            break;
          case "list_components":
            result = await react.listComponents();
            break;
          case "analyze_component_dependencies":
            result = await react.analyzeComponentDependencies((args as any).componentPath as string);
            break;
          case "find_components_using_heroui":
            result = await react.findComponentsUsingHeroUI((args as any).heroUIComponent as string);
            break;
          case "get_page_hierarchy":
            result = await react.getPageHierarchy();
            break;
          case "list_forms":
            result = await react.listForms();
            break;
          case "list_tables":
            result = await react.listTables();
            break;

          // Git tools
          case "git_diff":
            result = await git.gitDiff(((args as any).target as string) || "HEAD");
            break;
          case "git_blame":
            result = await git.gitBlame(
              (args as any).file as string,
              (args as any).startLine as number | undefined,
              (args as any).endLine as number | undefined
            );
            break;
          case "git_log":
            result = await git.gitLog(
              (args as any).file as string | undefined,
              ((args as any).limit as number) || 10
            );
            break;
          case "git_status":
            result = await git.gitStatus();
            break;
          case "get_package_history":
            result = await git.getPackageHistory(
              (args as any).packageName as string,
              ((args as any).limit as number) || 10
            );
            break;
          case "get_package_contributors":
            result = await git.getPackageContributors((args as any).packageName as string);
            break;

          // Dependency tools
          case "build_dependency_graph":
            result = await dep.buildDependencyGraph();
            break;
          case "find_circular_dependencies":
            result = await dep.findCircularDependencies();
            break;
          case "get_package_dependency_tree":
            result = await dep.getPackageDependencyTree((args as any).packageName as string);
            break;
          case "get_package_dependents":
            result = await dep.getPackageDependents((args as any).packageName as string);
            break;
          case "calculate_package_metrics":
            result = await dep.calculatePackageMetrics();
            break;
          case "generate_graphviz_dot":
            result = await dep.generateGraphvizDot();
            break;

          default:
            throw new Error(`Unknown tool: ${name}`);
        }

        return {
          content: [
            {
              type: "text",
              text: formatJson(result),
            },
          ],
        };
      } catch (error: any) {
        logError(`Tool execution failed: ${request.params.name}`, error);
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    log("Aero MCP Server running with multi-agent support...");
  }
}

// Start the server
const server = new AeroMCPServer();
server.run().catch((error) => {
  logError("Failed to start MCP server", error);
  process.exit(1);
});
