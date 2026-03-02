import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import * as content from "./tools/content.js";
import { formatJson, log, logError } from "./tools/utils.js";

/**
 * Aero Content Writer MCP Agent
 *
 * Provides tools for auto-generating high-quality content (README files,
 * changelogs, API docs, user guides, release notes, feature descriptions,
 * and content improvement suggestions) directly from the monorepo source.
 */
class ContentWriterServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "aero-content-writer",
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

  private setupHandlers(): void {
    // -----------------------------------------------------------------------
    // List tools
    // -----------------------------------------------------------------------
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        // ── README ──────────────────────────────────────────────────────────
        {
          name: "generate_package_readme",
          description:
            "Auto-generate a comprehensive README.md for any aero-* package by scanning its source code. " +
            "Produces sections for overview, models, services, routes, pages, migrations, installation, and testing.",
          inputSchema: {
            type: "object",
            properties: {
              packageName: {
                type: "string",
                description: "The package directory name, e.g. aero-hrm, aero-crm, aero-finance.",
              },
            },
            required: ["packageName"],
          },
        },

        // ── Changelog ───────────────────────────────────────────────────────
        {
          name: "generate_changelog",
          description:
            "Generate a Markdown CHANGELOG for a package by parsing its git commit history. " +
            "Commits are automatically categorised by conventional-commit prefixes (feat, fix, refactor, docs).",
          inputSchema: {
            type: "object",
            properties: {
              packageName: {
                type: "string",
                description: "Package name, e.g. aero-hrm.",
              },
              limit: {
                type: "number",
                description: "Number of recent commits to include (default: 30).",
                default: 30,
              },
            },
            required: ["packageName"],
          },
        },

        // ── API docs ────────────────────────────────────────────────────────
        {
          name: "generate_api_docs",
          description:
            "Generate an API Reference document for a package by scanning its route files. " +
            "Includes method, URI, route name, guard context, and standard response shapes.",
          inputSchema: {
            type: "object",
            properties: {
              packageName: {
                type: "string",
                description: "Package name, e.g. aero-crm.",
              },
            },
            required: ["packageName"],
          },
        },

        // ── Feature description ─────────────────────────────────────────────
        {
          name: "generate_feature_description",
          description:
            "Generate a polished, marketing-friendly feature description for a module. " +
            "Suitable for use in a product page, sales deck, or onboarding email.",
          inputSchema: {
            type: "object",
            properties: {
              packageName: {
                type: "string",
                description: "Package name, e.g. aero-pos.",
              },
            },
            required: ["packageName"],
          },
        },

        // ── Release notes ───────────────────────────────────────────────────
        {
          name: "generate_release_notes",
          description:
            "Generate professional release notes for a package version. " +
            "Includes breaking changes, new features, bug fixes, module stats, and an upgrade guide.",
          inputSchema: {
            type: "object",
            properties: {
              packageName: {
                type: "string",
                description: "Package name, e.g. aero-finance.",
              },
              version: {
                type: "string",
                description: "Version string to use in the heading (e.g. 2.1.0). Defaults to composer.json version.",
              },
            },
            required: ["packageName"],
          },
        },

        // ── User guide ──────────────────────────────────────────────────────
        {
          name: "generate_user_guide",
          description:
            "Generate a step-by-step user guide for a module — suitable for an internal knowledge base or help centre. " +
            "Covers navigation, CRUD workflows, permissions, tips, and FAQ.",
          inputSchema: {
            type: "object",
            properties: {
              packageName: {
                type: "string",
                description: "Package name, e.g. aero-hrm.",
              },
            },
            required: ["packageName"],
          },
        },

        // ── Module overview ─────────────────────────────────────────────────
        {
          name: "generate_module_overview",
          description:
            "Generate a full module inventory document that lists every aero-* package with its type, " +
            "model count, route count, page count, and test coverage status. Great for a project wiki.",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },

        // ── Improvement suggestions ─────────────────────────────────────────
        {
          name: "suggest_content_improvements",
          description:
            "Scan all packages and return a prioritised list of content-related improvement suggestions: " +
            "missing READMEs, missing tests, empty descriptions, models without routes, etc.",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
      ],
    }));

    // -----------------------------------------------------------------------
    // Handle tool calls
    // -----------------------------------------------------------------------
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args = {} } = request.params;
        log(`Tool called: ${name}`);

        let result: unknown;

        switch (name) {
          case "generate_package_readme":
            result = await content.generatePackageReadme(
              (args as { packageName: string }).packageName
            );
            break;

          case "generate_changelog":
            result = await content.generateChangelog(
              (args as { packageName: string; limit?: number }).packageName,
              (args as { packageName: string; limit?: number }).limit ?? 30
            );
            break;

          case "generate_api_docs":
            result = await content.generateApiDocs(
              (args as { packageName: string }).packageName
            );
            break;

          case "generate_feature_description":
            result = await content.generateFeatureDescription(
              (args as { packageName: string }).packageName
            );
            break;

          case "generate_release_notes":
            result = await content.generateReleaseNotes(
              (args as { packageName: string; version?: string }).packageName,
              (args as { packageName: string; version?: string }).version
            );
            break;

          case "generate_user_guide":
            result = await content.generateUserGuide(
              (args as { packageName: string }).packageName
            );
            break;

          case "generate_module_overview":
            result = await content.generateModuleOverview();
            break;

          case "suggest_content_improvements":
            result = await content.suggestContentImprovements();
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
      } catch (error: unknown) {
        const err = error as Error;
        logError(`Tool execution failed: ${request.params.name}`, err);
        return {
          content: [
            {
              type: "text",
              text: `Error: ${err.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    log("Aero Content Writer Agent running...");
  }
}

const server = new ContentWriterServer();
server.run().catch((error: unknown) => {
  logError("Failed to start Content Writer Agent", error);
  process.exit(1);
});
