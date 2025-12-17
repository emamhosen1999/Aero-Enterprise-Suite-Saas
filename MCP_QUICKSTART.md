# MCP Multi-Agent Template - Quick Start Guide

## What is MCP?

The Model Context Protocol (MCP) is a protocol that enables AI agents to interact with external tools and data sources. This template provides a comprehensive MCP server for the aeos365 monorepo, giving AI agents deep visibility into the codebase structure, dependencies, and architecture.

## Quick Start

### 1. Install Dependencies

```bash
cd mcp-agent-template
npm install
```

### 2. Build the TypeScript Code

```bash
npm run build
```

### 3. Generate a Repository Report

```bash
npm run report
```

This generates `mcp-report.json` in the repository root with:
- Distribution type detection (SaaS vs Standalone)
- Architecture validation
- Dependency graph analysis
- Code statistics (models, routes, pages, components)
- Package metrics

**Example Output:**
```
Distribution: SAAS (75% confidence)
Architecture: ✓ Valid, 0 violations
Packages: 13 packages, 214 models, 614 routes
Dependencies: No circular dependencies found
```

### 4. Run the MCP Server

```bash
npm run dev
```

The server runs in stdio mode for MCP protocol communication.

## Connecting AI Agents

### Option 1: Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

```json
{
  "mcpServers": {
    "aeos365": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-agent-template/dist/index.js"],
      "cwd": "/absolute/path/to/Aero-Enterprise-Suite-Saas"
    }
  }
}
```

Replace `/absolute/path/to/` with your actual repository path.

### Option 2: GitHub Copilot

If using Copilot MCP extensions, configure in your workspace settings.

### Option 3: Custom MCP Client

Connect any MCP-compatible client using stdio transport to `dist/index.js`.

## Available Tools by Agent

### 🏗️ Architect Agent
- **detect_distribution** - Auto-detect SaaS/Standalone mode
- **check_architecture_violations** - Validate distribution rules
- **get_package_info** - Get package details
- **list_all_packages** - List all packages with metadata

### 🔧 Laravel Agent  
- **list_models** - List Eloquent models
- **list_routes** - List all routes
- **list_migrations** - List database migrations
- **list_controllers** - List controllers
- **list_middleware** - List middleware
- **list_service_providers** - List service providers

### ⚛️ Frontend Agent
- **list_pages** - List Inertia pages
- **list_components** - List React components
- **analyze_component_dependencies** - Analyze component imports
- **find_components_using_heroui** - Find HeroUI component usage
- **get_page_hierarchy** - Get page routing structure
- **list_forms** / **list_tables** - List form/table components

### 🔍 Reviewer Agent
- **git_diff** - Get diffs for commits/branches
- **git_blame** - Get line-by-line authorship
- **git_log** - Get commit history
- **git_status** - Get working directory status
- **get_package_history** - Get package commit history
- **get_package_contributors** - Get package contributors

### 📊 Dependency Agent
- **build_dependency_graph** - Build complete dependency graph
- **find_circular_dependencies** - Detect circular dependencies
- **get_package_dependency_tree** - Get dependency tree
- **get_package_dependents** - Get reverse dependencies
- **calculate_package_metrics** - Calculate stability metrics
- **generate_graphviz_dot** - Generate visual dependency graph

## Example Usage

### Pre-PR Architecture Check

```bash
cd mcp-agent-template
npm run report
# Review mcp-report.json for violations
```

### With AI Agent (via Claude/Copilot)

```
You: "Show me all models in aero-hrm package"
Agent: Uses list_models tool → Filters by aero-hrm

You: "Which packages depend on aero-core?"
Agent: Uses get_package_dependents tool → Shows 11 packages

You: "Are there any circular dependencies?"
Agent: Uses find_circular_dependencies tool → Reports none found

You: "Analyze the UsersList page dependencies"
Agent: Uses analyze_component_dependencies tool → Shows HeroUI components used
```

## Common Workflows

### 1. New Package Validation
```bash
npm run report
# Check architectureCheck.violations in mcp-report.json
```

### 2. Dependency Analysis Before Refactoring
- Run `get_package_dependents` to see impact
- Run `calculate_package_metrics` to understand stability
- Run `build_dependency_graph` to visualize structure

### 3. Code Review Assistance
- Use `git_diff` to see recent changes
- Use `get_package_history` to understand evolution
- Use `list_models` / `list_routes` to verify completeness

### 4. Frontend Component Audit
- Run `find_components_using_heroui` to ensure consistency
- Run `list_forms` / `list_tables` to catalog reusable components
- Run `analyze_component_dependencies` to check for proper imports

## Architecture Rules

The `architecture.rules.json` defines:

### SaaS Mode
- ✅ Requires: `aero-platform` package
- ❌ Forbids: None
- Uses `LandlordUser` model
- Multi-tenancy enabled

### Standalone Mode  
- ✅ Requires: `aero-core` package
- ❌ Forbids: `aero-platform` package
- Uses `User` model
- Single-tenant only

## Troubleshooting

### "Command not found" errors
```bash
npm install
npm run build
```

### MCP server won't connect
- Ensure path to `dist/index.js` is absolute in config
- Ensure `cwd` points to repository root
- Check that TypeScript compiled successfully

### Report shows wrong distribution
- Check `packages/` directory for aero-platform presence
- Review `architecture.rules.json` for rule definitions

## Files

- **Source**: `mcp-agent-template/src/` (TypeScript)
- **Built**: `mcp-agent-template/dist/` (JavaScript, gitignored)
- **Config**: `mcp-agent-template/architecture.rules.json`
- **Docs**: `mcp-agent-template/README.md` (detailed)
- **Report**: `mcp-report.json` (generated, gitignored)

## Next Steps

1. Run `npm run report` to understand current architecture
2. Connect Claude Desktop or another MCP client
3. Ask the AI agent questions about the codebase
4. Use before PRs to validate architecture compliance
5. Extend with custom tools as needed

## Support

For issues:
- Check `mcp-agent-template/README.md` for detailed docs
- Review `mcp-report.json` for architecture insights
- Create an issue in the repository

---

**Powered by Model Context Protocol**  
**Version**: 1.0.0
