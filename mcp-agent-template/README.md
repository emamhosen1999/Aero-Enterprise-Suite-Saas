# aeos365 MCP Multi-Agent Template

A comprehensive Model Context Protocol (MCP) server for the Aero Enterprise Suite SaaS monorepo, providing multi-agent support for architecture analysis, dependency management, Laravel/React code inspection, and Git operations.

## Overview

This MCP server enables AI agents to understand and interact with the aeos365 monorepo structure, providing tools for:

- **Architecture Analysis**: Detect SaaS vs Standalone mode, validate architecture rules
- **Dependency Management**: Build dependency graphs, find circular dependencies, calculate metrics
- **Laravel Inspection**: List models, routes, migrations, controllers, middleware
- **React Analysis**: Inspect pages, components, forms, tables, and their dependencies
- **Git Operations**: Diff, blame, log, status, and package history

## Architecture

### Multi-Agent Support

The MCP server supports multiple specialized agents, each with access to specific tools:

| Agent | Tools | Purpose |
|-------|-------|---------|
| **Architect Agent** | `detect_distribution`, `check_architecture_violations`, `get_package_info`, `list_all_packages` | Validate architecture rules and distribution type |
| **Laravel Agent** | `list_models`, `list_routes`, `list_migrations`, `list_controllers`, `list_middleware`, `list_service_providers` | Inspect Laravel backend code |
| **Frontend Agent** | `list_pages`, `list_components`, `analyze_component_dependencies`, `find_components_using_heroui`, `get_page_hierarchy`, `list_forms`, `list_tables` | Analyze React/Inertia frontend |
| **Reviewer Agent** | `git_diff`, `git_blame`, `git_log`, `git_status`, `get_package_history`, `get_package_contributors` | Review code changes and history |
| **Dependency Agent** | `build_dependency_graph`, `find_circular_dependencies`, `get_package_dependency_tree`, `get_package_dependents`, `calculate_package_metrics`, `generate_graphviz_dot` | Analyze package dependencies |

## Installation

### Prerequisites

- Node.js 18+ with TypeScript support
- Git
- Access to the aeos365 monorepo

### Setup

1. Navigate to the MCP template directory:
   ```bash
   cd mcp-agent-template
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the TypeScript code:
   ```bash
   npm run build
   ```

## Usage

### 1. Start MCP Server

Run the MCP server in development mode:

```bash
npm run dev
```

The server runs in stdio mode and communicates via stdin/stdout for MCP protocol.

### 2. Generate Report

Generate a comprehensive distribution and dependency report:

```bash
npm run report
```

This creates `mcp-report.json` in the repository root with:
- Distribution type (SaaS/Standalone) detection
- Architecture violations
- Dependency graph and circular dependencies
- Package metrics and statistics
- Code statistics (models, routes, pages, components)

### 3. Connect AI Agents

#### Using with Claude Desktop

Add to your Claude Desktop MCP configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "aeos365": {
      "command": "node",
      "args": ["/path/to/Aero-Enterprise-Suite-Saas/mcp-agent-template/dist/index.js"],
      "cwd": "/path/to/Aero-Enterprise-Suite-Saas"
    }
  }
}
```

#### Using with GitHub Copilot

If using Copilot MCP, configure the server in your workspace settings.

#### Custom MCP Clients

Connect any MCP-compatible client using the stdio transport protocol.

## Available Tools

### Architecture Tools

#### `detect_distribution`
Detects whether the repository is configured for SaaS or Standalone mode.

**Returns:**
```json
{
  "type": "saas",
  "confidence": 85,
  "indicators": ["✓ aero-platform package found (SaaS indicator)", ...],
  "packages": ["aero-core", "aero-platform", ...]
}
```

#### `check_architecture_violations`
Validates architecture rules based on distribution type.

**Returns:**
```json
{
  "valid": true,
  "distribution": "saas",
  "violations": []
}
```

#### `get_package_info`
Get detailed information about a specific package.

**Parameters:**
- `packageName` (string): Name of package (e.g., "aero-core")

#### `list_all_packages`
List all packages with their metadata from `architecture.rules.json`.

### Laravel Tools

#### `list_models`
List all Eloquent models across packages.

**Returns:**
```json
[
  {
    "name": "User",
    "package": "aero-core",
    "path": "packages/aero-core/src/Models/User.php",
    "namespace": "Aero\\Core\\Models",
    "traits": ["HasFactory", "SoftDeletes"]
  }
]
```

#### `list_routes`
List all routes from route files.

#### `list_migrations`
List all database migrations in chronological order.

#### `list_controllers`
List all controllers, optionally filtered by package.

**Parameters:**
- `packageName` (string, optional): Filter by package name

#### `list_middleware`
List all middleware classes.

#### `list_service_providers`
List all service providers.

### React Tools

#### `list_pages`
List all Inertia pages across packages.

**Returns:**
```json
[
  {
    "name": "Tenant/Pages/UsersList",
    "package": "aero-core",
    "path": "packages/aero-core/resources/js/Pages/Tenant/Pages/UsersList.jsx",
    "components": ["@/Components/PageHeader", "@/Tables/UsersTable"]
  }
]
```

#### `list_components`
List all React components (Components, Forms, Tables, Modals).

#### `analyze_component_dependencies`
Analyze dependencies for a specific component.

**Parameters:**
- `componentPath` (string): Relative path to component file

**Returns:**
```json
{
  "path": "packages/aero-core/resources/js/Components/PageHeader.jsx",
  "heroUIComponents": ["Button", "Card", "Chip"],
  "heroicons": ["PlusIcon", "MagnifyingGlassIcon"],
  "hooks": ["useState", "useEffect"],
  "usesInertia": true,
  "usesForm": false
}
```

#### `find_components_using_heroui`
Find all components using a specific HeroUI component.

**Parameters:**
- `heroUIComponent` (string): HeroUI component name (e.g., "Button", "Table")

#### `get_page_hierarchy`
Get hierarchical structure of all pages.

#### `list_forms`
List all form components.

#### `list_tables`
List all table components.

### Git Tools

#### `git_diff`
Get git diff for a specific target.

**Parameters:**
- `target` (string, default: "HEAD"): Commit hash, branch name, or file path

**Returns:**
```json
{
  "files": [
    {
      "path": "packages/aero-core/src/Models/User.php",
      "status": "modified",
      "insertions": 10,
      "deletions": 5
    }
  ],
  "summary": {
    "filesChanged": 1,
    "insertions": 10,
    "deletions": 5
  }
}
```

#### `git_blame`
Get git blame for a specific file.

**Parameters:**
- `file` (string): Path to file
- `startLine` (number, optional): Start line number
- `endLine` (number, optional): End line number

#### `git_log`
Get commit history for repository or specific file.

**Parameters:**
- `file` (string, optional): File path to get history for
- `limit` (number, default: 10): Number of commits to return

#### `git_status`
Get status of changed files in working directory.

#### `get_package_history`
Get recent commits that modified a specific package.

**Parameters:**
- `packageName` (string): Package name
- `limit` (number, default: 10): Number of commits

#### `get_package_contributors`
Get contributors for a specific package.

**Parameters:**
- `packageName` (string): Package name

### Dependency Tools

#### `build_dependency_graph`
Build complete dependency graph for all packages.

**Returns:**
```json
{
  "nodes": {
    "aero-core": {
      "package": "aero-core",
      "dependencies": [],
      "dependents": ["aero-platform", "aero-hrm", ...],
      "depth": 0
    }
  },
  "edges": [
    { "from": "aero-platform", "to": "aero-core" }
  ],
  "levels": [
    ["aero-core"],
    ["aero-platform", "aero-hrm", ...]
  ]
}
```

#### `find_circular_dependencies`
Find circular dependencies between packages.

**Returns:**
```json
[
  ["aero-hrm", "aero-finance", "aero-hrm"]
]
```

#### `get_package_dependency_tree`
Get dependency tree for a specific package.

**Parameters:**
- `packageName` (string): Package name

#### `get_package_dependents`
Get packages that depend on a specific package.

**Parameters:**
- `packageName` (string): Package name

#### `calculate_package_metrics`
Calculate metrics for all packages.

**Returns:**
```json
{
  "packages": [
    {
      "package": "aero-core",
      "directDependencies": 0,
      "directDependents": 11,
      "depth": 0,
      "stability": 0.92
    }
  ],
  "summary": {
    "totalPackages": 14,
    "maxDepth": 2,
    "averageDependencies": 1.2,
    "mostDepended": "aero-core"
  }
}
```

#### `generate_graphviz_dot`
Generate Graphviz DOT format for dependency visualization.

**Returns:** DOT format string that can be rendered with Graphviz.

```bash
# To visualize:
npm run report
dot -Tpng dependency-graph.dot -o dependency-graph.png
```

## Architecture Rules

The `architecture.rules.json` file defines distribution rules and package metadata:

### Distribution Rules

- **SaaS Mode**: Requires `aero-platform`, uses `LandlordUser` model, tenancy enabled
- **Standalone Mode**: Requires `aero-core`, forbids `aero-platform`, uses `User` model, tenancy disabled

### Package Types

- `required`: Core package needed for all distributions
- `saas-only`: Only available in SaaS mode
- `module`: Optional module that can be added to either distribution

## Example Workflows

### 1. Pre-PR Architecture Check

```bash
npm run report
# Review mcp-report.json for violations
# Fix any architecture violations before submitting PR
```

### 2. Analyze Package Dependencies

Using the MCP server with an AI agent:

```
Agent: "Show me the dependency tree for aero-hrm"
Tool: get_package_dependency_tree(packageName: "aero-hrm")

Agent: "Which packages depend on aero-core?"
Tool: get_package_dependents(packageName: "aero-core")
```

### 3. Code Review Assistance

```
Agent: "Show me recent changes to aero-platform"
Tool: get_package_history(packageName: "aero-platform", limit: 20)

Agent: "Get diff for these changes"
Tool: git_diff(target: "HEAD~5")
```

### 4. Frontend Component Analysis

```
Agent: "List all components using HeroUI Table"
Tool: find_components_using_heroui(heroUIComponent: "Table")

Agent: "Analyze dependencies for UsersList page"
Tool: analyze_component_dependencies(componentPath: "packages/aero-core/resources/js/Pages/Tenant/Pages/UsersList.jsx")
```

## Development

### Project Structure

```
mcp-agent-template/
├── src/
│   ├── tools/           # Tool implementations
│   │   ├── architecture.ts
│   │   ├── dependency.ts
│   │   ├── git.ts
│   │   ├── laravel.ts
│   │   ├── react.ts
│   │   └── utils.ts
│   └── index.ts         # MCP server entrypoint
├── scripts/
│   └── report.ts        # Report generator
├── architecture.rules.json
├── package.json
├── tsconfig.json
└── README.md
```

### Adding New Tools

1. Add the tool implementation to the appropriate file in `src/tools/`
2. Export the function from the tool module
3. Register the tool in `src/index.ts`:
   - Add to `ListToolsRequestSchema` handler
   - Add case to `CallToolRequestSchema` handler

### Building and Testing

```bash
# Build TypeScript
npm run build

# Run in dev mode (with auto-reload)
npm run dev

# Generate report
npm run report
```

## Troubleshooting

### "Command failed" errors

Ensure you're running from the repository root or the MCP server can access Git commands.

### TypeScript compilation errors

```bash
npm install
npm run build
```

### MCP connection issues

Ensure the MCP client is configured with the correct path to the built `dist/index.js` file.

## Contributing

When adding new features:

1. Follow the existing tool structure
2. Update `architecture.rules.json` if adding new package types
3. Add tool documentation to this README
4. Test with the report generator

## License

MIT License - See repository root for details.

## Support

For issues or questions:
- Create an issue in the repository
- Contact the Aero development team
- Refer to the main project documentation

---

**Version**: 1.0.0  
**Last Updated**: December 2025
