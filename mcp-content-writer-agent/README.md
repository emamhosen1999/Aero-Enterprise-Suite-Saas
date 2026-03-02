# Aero Content Writer Agent

An **MCP (Model Context Protocol)** server that auto-generates high-quality content for the
Aero Enterprise Suite monorepo by scanning the actual source code — no hallucinations, no
manual effort.

---

## Available Tools

| Tool | Description |
|------|-------------|
| `generate_package_readme` | Full README.md for any `aero-*` package |
| `generate_changelog` | CHANGELOG from git commit history (auto-categorises by conventional commits) |
| `generate_api_docs` | API Reference from route files |
| `generate_feature_description` | Marketing-friendly feature write-up |
| `generate_release_notes` | Professional release notes with upgrade guide |
| `generate_user_guide` | Step-by-step user guide for end-users |
| `generate_module_overview` | Full inventory of all packages (models, routes, pages, tests) |
| `suggest_content_improvements` | Prioritised list of documentation gaps across all packages |

---

## Setup

```bash
cd mcp-content-writer-agent
npm install
npm run build
```

---

## Usage with VS Code (GitHub Copilot / MCP)

Add to your `.vscode/mcp.json`:

```json
{
  "servers": {
    "aero-content-writer": {
      "type": "stdio",
      "command": "node",
      "args": ["${workspaceFolder}/mcp-content-writer-agent/dist/index.js"]
    }
  }
}
```

Then ask Copilot to use it:

> "Use the content writer agent to generate a README for the aero-hrm package."

---

## Example Prompts

```
Generate a README for aero-finance
Generate the changelog for aero-crm with the last 50 commits
Generate API docs for aero-pos
Generate release notes for aero-hrm version 2.0.0
Generate a user guide for aero-ims
Show me what content is missing across all packages
```

---

## Architecture

```
mcp-content-writer-agent/
├── src/
│   ├── index.ts          # MCP server entry — registers all tools
│   └── tools/
│       ├── utils.ts      # Shared helpers (file I/O, git, logging)
│       ├── scanner.ts    # Reads packages to extract metadata
│       └── content.ts    # Content generation functions (README, changelog, etc.)
├── dist/                 # Compiled JavaScript (after npm run build)
├── package.json
└── tsconfig.json
```

---

## How It Works

1. **Scanner** reads source files (PHP models, route files, migrations, React pages, etc.)
   and produces a structured `PackageSummary`.
2. **Content generators** use those summaries to fill Markdown templates with real data.
3. The **MCP server** exposes each generator as a named tool consumable by GitHub Copilot
   or any MCP-compatible client.

All content is derived from the actual codebase — no AI inference is needed, ensuring
accuracy and consistency with the real source of truth.
