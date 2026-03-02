/**
 * content.ts — Template-based content generation tools.
 *
 * Each function returns a structured string (Markdown) so it can be
 * rendered directly or piped into a file.  No external LLM calls are
 * made — the agent assembles content from the real source code via the
 * scanner, ensuring accuracy.
 */
import { scanPackage, scanAllPackages, readPackageReadme, getPackageGitLog, PackageSummary } from "./scanner.js";
import { getRepoRoot, getPackages } from "./utils.js";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function titleCase(str: string): string {
  return str.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function humanPackageName(pkg: string): string {
  return titleCase(pkg.replace(/^aero-/, ""));
}

function badgeRow(summary: PackageSummary): string {
  const badges = [
    `![Type](https://img.shields.io/badge/type-${summary.type}-blue)`,
    `![Version](https://img.shields.io/badge/version-${summary.version}-green)`,
    summary.hasTests ? `![Tests](https://img.shields.io/badge/tests-yes-brightgreen)` : `![Tests](https://img.shields.io/badge/tests-none-red)`,
  ];
  return badges.join(" ");
}

// ---------------------------------------------------------------------------
// README generation
// ---------------------------------------------------------------------------

export interface GenerateReadmeResult {
  packageName: string;
  markdown: string;
  stats: {
    models: number;
    controllers: number;
    routes: number;
    migrations: number;
    pages: number;
    services: number;
  };
}

export async function generatePackageReadme(packageName: string): Promise<GenerateReadmeResult> {
  const summary = await scanPackage(packageName);
  const displayName = humanPackageName(packageName);

  const routeList = summary.routes.slice(0, 20).map(
    (r) => `| \`${r.method}\` | \`${r.uri}\` | ${r.name || "—"} |`
  );

  const modelList = summary.models.map((m) => `- \`${m}\``).join("\n");
  const serviceList = summary.services.map((s) => `- \`${s}\``).join("\n");
  const pageList = summary.pages.map((p) => `- \`${p}\``).join("\n");
  const migrationList = summary.migrations.map((m) => `- \`${m}\``).join("\n");

  const md = `# ${displayName} Module

${badgeRow(summary)}

> ${summary.description || `The ${displayName} module for the Aero Enterprise Suite.`}

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Models](#models)
- [Services](#services)
- [API Routes](#api-routes)
- [Frontend Pages](#frontend-pages)
- [Database Migrations](#database-migrations)
- [Installation](#installation)
- [Configuration](#configuration)
- [Testing](#testing)

---

## Overview

The **${displayName}** module is part of the **Aero Enterprise Suite SaaS** — a multi-tenant,
multi-module ERP platform built with **Laravel 11 + Inertia.js v2 + React 18 + HeroUI**.

This module provides:
${summary.models.length > 0 ? `- **${summary.models.length} Eloquent models** covering the core data entities` : ""}
${summary.controllers.length > 0 ? `- **${summary.controllers.length} controllers** for HTTP request handling` : ""}
${summary.routes.length > 0 ? `- **${summary.routes.length} routes** exposed to tenant users` : ""}
${summary.pages.length > 0 ? `- **${summary.pages.length} Inertia/React pages** for the frontend UI` : ""}
${summary.services.length > 0 ? `- **${summary.services.length} service classes** encapsulating business logic` : ""}
${summary.migrations.length > 0 ? `- **${summary.migrations.length} database migrations**` : ""}

---

## Features

- Full multi-tenancy support via **stancl/tenancy** (database-per-tenant isolation)
- Role-Based Access Control (RBAC) via **Spatie Laravel Permission**
- Plan-gated access through the Module System \`config/modules.php\`
- Responsive, theme-aware UI built with **HeroUI** components
- Dark-mode support using Tailwind CSS v4
- Real-time toast notifications via \`showToast.promise()\`

---

## Models

${modelList || "_No models found._"}

---

## Services

${serviceList || "_No services found._"}

---

## API Routes

${summary.routes.length > 0 ? `| Method | URI | Name |\n|--------|-----|------|\n${routeList.join("\n")}` : "_No routes found._"}
${summary.routes.length > 20 ? `\n_...and ${summary.routes.length - 20} more routes._` : ""}

---

## Frontend Pages

${pageList || "_No pages found._"}

---

## Database Migrations

${migrationList || "_No migrations found._"}

---

## Installation

\`\`\`bash
# In your host application (aeos365 or standalone-host)
composer require aero/${packageName}

# Run the module migrations inside the tenant context
php artisan tenant:migrate
\`\`\`

Add the service provider to \`bootstrap/providers.php\` (Laravel 12) or \`config/app.php\` (Laravel 10):

\`\`\`php
Aero\\${displayName.replace(/ /g, "\\")}\\Providers\\${displayName.replace(/ /g, "")}ServiceProvider::class,
\`\`\`

---

## Configuration

Publish the module config:

\`\`\`bash
php artisan vendor:publish --tag=${packageName}-config
\`\`\`

Then adjust \`config/${packageName}.php\` to your environment.

---

## Testing

${summary.hasTests
  ? `\`\`\`bash\nphp artisan test --filter=${displayName.replace(/ /g, "")}\n\`\`\``
  : "⚠️ No test suite is currently present for this module. Contributions welcome!"}

---

## License

Proprietary — Aero Enterprise Suite. All rights reserved.
`;

  return {
    packageName,
    markdown: md,
    stats: {
      models: summary.models.length,
      controllers: summary.controllers.length,
      routes: summary.routes.length,
      migrations: summary.migrations.length,
      pages: summary.pages.length,
      services: summary.services.length,
    },
  };
}

// ---------------------------------------------------------------------------
// Changelog generation
// ---------------------------------------------------------------------------

export interface GenerateChangelogResult {
  packageName: string;
  markdown: string;
  commitCount: number;
}

export async function generateChangelog(
  packageName: string,
  limit = 30
): Promise<GenerateChangelogResult> {
  const gitLog = await getPackageGitLog(packageName, limit);
  const displayName = humanPackageName(packageName);
  const lines = gitLog.split("\n").filter(Boolean);

  // Categorise commits by conventional-commit prefix
  const features: string[] = [];
  const fixes: string[] = [];
  const refactors: string[] = [];
  const docs: string[] = [];
  const others: string[] = [];

  for (const line of lines) {
    const msg = line.replace(/^[a-f0-9]+ /, "").trim();
    if (/^feat(\(.+\))?:/i.test(msg)) features.push(msg);
    else if (/^fix(\(.+\))?:/i.test(msg)) fixes.push(msg);
    else if (/^refactor(\(.+\))?:/i.test(msg)) refactors.push(msg);
    else if (/^docs?(\(.+\))?:/i.test(msg)) docs.push(msg);
    else others.push(msg);
  }

  const section = (title: string, items: string[]) =>
    items.length > 0
      ? `### ${title}\n\n${items.map((i) => `- ${i}`).join("\n")}\n`
      : "";

  const today = new Date().toISOString().split("T")[0];

  const md = `# Changelog — ${displayName}

> Auto-generated on ${today} from the last ${limit} commits.

---

## [Unreleased]

${section("✨ New Features", features)}
${section("🐛 Bug Fixes", fixes)}
${section("♻️ Refactors", refactors)}
${section("📖 Documentation", docs)}
${section("🔧 Other Changes", others)}

${lines.length === 0 ? "_No git history found for this package._" : ""}
`;

  return { packageName, markdown: md.trim(), commitCount: lines.length };
}

// ---------------------------------------------------------------------------
// API documentation
// ---------------------------------------------------------------------------

export interface GenerateApiDocsResult {
  packageName: string;
  markdown: string;
  endpointCount: number;
}

export async function generateApiDocs(packageName: string): Promise<GenerateApiDocsResult> {
  const summary = await scanPackage(packageName);
  const displayName = humanPackageName(packageName);

  const endpointRows = summary.routes.map((r) => {
    const guardNote = r.uri.includes("admin") ? " _(landlord guard)_" : " _(tenant guard)_";
    return `| \`${r.method}\` | \`${r.uri}\` | ${r.name || "—"} |${guardNote} |`;
  });

  const md = `# API Reference — ${displayName}

> Auto-generated from route definitions in \`packages/${packageName}/routes/\`.

---

## Authentication

All tenant routes are protected by the **\`web\`** guard (cookie-based session auth via Laravel Fortify).
Admin / landlord routes require the **\`landlord\`** guard.

All responses follow the standard Inertia.js protocol for page visits, or standard JSON for XHR requests.

---

## Endpoints

| Method | URI | Route Name | Guard |
|--------|-----|------------|-------|
${endpointRows.join("\n") || "| — | — | _No routes defined_ | — |"}

---

## Standard Response Shapes

### Success (JSON)
\`\`\`json
{
  "data": { },
  "message": "Operation successful"
}
\`\`\`

### Validation Error (422)
\`\`\`json
{
  "message": "The given data was invalid.",
  "errors": {
    "field": ["Error message"]
  }
}
\`\`\`

### Unauthorized (401 / 403)
\`\`\`json
{
  "message": "Unauthenticated."
}
\`\`\`

---

## Notes

- Route model binding is used across all resource routes.
- Pagination is applied to list endpoints (default: 30 items/page).
- All timestamps are returned in **ISO 8601** format (UTC).
`;

  return { packageName, markdown: md, endpointCount: summary.routes.length };
}

// ---------------------------------------------------------------------------
// Feature description (marketing / release-notes style)
// ---------------------------------------------------------------------------

export interface GenerateFeatureDescriptionResult {
  packageName: string;
  markdown: string;
}

export async function generateFeatureDescription(
  packageName: string
): Promise<GenerateFeatureDescriptionResult> {
  const summary = await scanPackage(packageName);
  const displayName = humanPackageName(packageName);

  const highlights = [
    summary.models.length > 0 && `Manages **${summary.models.length} core entities**: ${summary.models.slice(0, 5).join(", ")}${summary.models.length > 5 ? ", and more" : ""}.`,
    summary.pages.length > 0 && `Ships with **${summary.pages.length} UI screens** built on HeroUI + React 18.`,
    summary.routes.length > 0 && `Exposes **${summary.routes.length} API/web endpoints** for full CRUD workflows.`,
    summary.services.length > 0 && `Powered by **${summary.services.length} service classes** ensuring clean separation of business logic.`,
  ].filter(Boolean) as string[];

  const md = `## ${displayName}

${summary.description || `Comprehensive ${displayName} capabilities for the Aero Enterprise Suite.`}

### Key Highlights

${highlights.map((h) => `- ${h}`).join("\n")}

### Who Is It For?

The **${displayName}** module is designed for organisations that need a robust,
multi-tenant ${displayName.toLowerCase()} solution with:

- Fine-grained **role-based access control** (RBAC)
- Full **multi-tenancy isolation** — each tenant's data is completely separate
- A **modern, responsive UI** that adapts to any screen size
- Seamless integration with the rest of the Aero Enterprise Suite

### Integration

Because ${displayName} is part of the Aero package ecosystem, it works out of the box with:

- **Aero Core** — Auth, Users, Roles, Permissions
- **Aero Platform** — SaaS tenancy, billing, and plan-gating
- **All sibling modules** — share employees, departments, contacts, and more

### Getting Started

Activate the module from the **Platform Admin** panel or via:

\`\`\`bash
php artisan module:enable ${packageName.replace("aero-", "")}
\`\`\`
`;

  return { packageName, markdown: md };
}

// ---------------------------------------------------------------------------
// Release notes
// ---------------------------------------------------------------------------

export interface GenerateReleaseNotesResult {
  packageName: string;
  version: string;
  markdown: string;
}

export async function generateReleaseNotes(
  packageName: string,
  version?: string
): Promise<GenerateReleaseNotesResult> {
  const summary = await scanPackage(packageName);
  const gitLog = await getPackageGitLog(packageName, 50);
  const displayName = humanPackageName(packageName);
  const releaseVersion = version || summary.version || "1.0.0";
  const today = new Date().toISOString().split("T")[0];

  const commits = gitLog.split("\n").filter(Boolean);
  const features = commits.filter((c) => /feat/i.test(c));
  const fixes = commits.filter((c) => /fix/i.test(c));
  const breaking = commits.filter((c) => /breaking|BREAKING/i.test(c));

  const section = (title: string, items: string[]) =>
    items.length > 0 ? `### ${title}\n\n${items.map((i) => `- ${i.replace(/^[a-f0-9]+ /, "")}`).join("\n")}\n` : "";

  const md = `# Release Notes — ${displayName} v${releaseVersion}

**Release Date:** ${today}
**Package:** \`aero/${packageName}\`

---

${section("⚠️ Breaking Changes", breaking)}
${section("✨ New Features", features)}
${section("🐛 Bug Fixes", fixes)}

### 📊 Module Statistics

| Metric | Count |
|--------|-------|
| Models | ${summary.models.length} |
| Controllers | ${summary.controllers.length} |
| Routes | ${summary.routes.length} |
| Pages | ${summary.pages.length} |
| Services | ${summary.services.length} |
| Migrations | ${summary.migrations.length} |

---

### Upgrade Guide

1. Update your \`composer.json\`:
   \`\`\`bash
   composer require aero/${packageName}:^${releaseVersion}
   \`\`\`

2. Run migrations:
   \`\`\`bash
   php artisan tenant:migrate
   \`\`\`

3. Clear caches:
   \`\`\`bash
   php artisan config:clear && php artisan route:clear && php artisan cache:clear
   \`\`\`

4. Rebuild frontend assets:
   \`\`\`bash
   npm run build
   \`\`\`

---

_Thank you for using the Aero Enterprise Suite!_
`;

  return { packageName, version: releaseVersion, markdown: md };
}

// ---------------------------------------------------------------------------
// User guide (onboarding / how-to)
// ---------------------------------------------------------------------------

export interface GenerateUserGuideResult {
  packageName: string;
  markdown: string;
}

export async function generateUserGuide(
  packageName: string
): Promise<GenerateUserGuideResult> {
  const summary = await scanPackage(packageName);
  const displayName = humanPackageName(packageName);

  const pageGuides = summary.pages.slice(0, 8).map((p, i) => {
    const pageName = p.replace(/\.(jsx|tsx)$/, "").replace(/\//g, " › ");
    return `### ${i + 1}. ${pageName}\n\nNavigate to this screen to manage the corresponding data. Use the search bar and filter dropdowns to quickly locate records.`;
  });

  const md = `# User Guide — ${displayName}

> This guide explains how to use the **${displayName}** module in the Aero Enterprise Suite.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Navigation](#navigation)
- [Core Workflows](#core-workflows)
- [Permissions & Roles](#permissions--roles)
- [Tips & Tricks](#tips--tricks)
- [FAQ](#faq)

---

## Getting Started

1. Log in to your Aero tenant dashboard.
2. In the left sidebar, locate **${displayName}** under the relevant module group.
3. If the menu item is not visible, contact your administrator — your subscription plan or
   role permissions may not include access to this module.

---

## Navigation

The ${displayName} module contains the following screens:

${pageGuides.join("\n\n") || "_No pages detected._"}

---

## Core Workflows

### Creating a New Record

1. Click the **"+ Add New"** button in the top-right area of the page header.
2. Fill in all required fields (marked with \\*).
3. Click **Save** or **Submit** to persist the record.
4. A success toast notification will confirm the action.

### Editing a Record

1. Locate the record in the table using search or filters.
2. Click the **⋮** (actions) menu on the right side of the row.
3. Select **Edit** from the dropdown.
4. Update the fields and click **Save Changes**.

### Deleting a Record

1. Click the **⋮** actions menu on the row.
2. Select **Delete**.
3. Confirm the action in the confirmation dialog.

> ⚠️ Deletions are **permanent**. Make sure you have the correct record selected.

---

## Permissions & Roles

The ${displayName} module uses granular RBAC permissions:

| Permission | Description |
|------------|-------------|
| \`${packageName.replace("aero-", "")}.view\` | View records |
| \`${packageName.replace("aero-", "")}.create\` | Create new records |
| \`${packageName.replace("aero-", "")}.update\` | Edit existing records |
| \`${packageName.replace("aero-", "")}.delete\` | Delete records |

Assign these permissions to roles via **Settings › Roles & Permissions**.

---

## Tips & Tricks

- Use the **search bar** in the filter section for quick keyword lookups.
- Click column headers to **sort** the table.
- Use the **per-page** selector in the pagination bar to show more rows.
- Export data using the **Export** button (if available for your plan).

---

## FAQ

**Q: I can't see the ${displayName} module in the sidebar.**
A: Check with your platform administrator that your subscription plan includes this module and
   that your role has at least the \`view\` permission.

**Q: My changes aren't saving.**
A: Check the validation errors displayed in red beneath the form fields. All required fields
   must be filled in before saving.

**Q: How do I bulk-update records?**
A: Use the checkbox column on the left side of the table to select multiple rows, then use the
   **Bulk Actions** dropdown that appears in the header.
`;

  return { packageName, markdown: md };
}

// ---------------------------------------------------------------------------
// Module overview (for all packages — a project-level summary)
// ---------------------------------------------------------------------------

export interface ModuleOverviewResult {
  markdown: string;
  totalPackages: number;
  totalModels: number;
  totalRoutes: number;
  totalPages: number;
}

export async function generateModuleOverview(): Promise<ModuleOverviewResult> {
  const summaries = await scanAllPackages();

  const totalModels = summaries.reduce((a, s) => a + s.models.length, 0);
  const totalRoutes = summaries.reduce((a, s) => a + s.routes.length, 0);
  const totalPages = summaries.reduce((a, s) => a + s.pages.length, 0);

  const rows = summaries.map((s) => {
    const name = humanPackageName(s.name);
    return `| **${name}** | \`${s.name}\` | ${s.type} | ${s.models.length} | ${s.routes.length} | ${s.pages.length} | ${s.hasTests ? "✅" : "❌"} |`;
  });

  const today = new Date().toISOString().split("T")[0];

  const md = `# Aero Enterprise Suite — Module Overview

> Auto-generated on ${today}

---

## Platform Summary

| Metric | Count |
|--------|-------|
| Total Packages | ${summaries.length} |
| Total Models | ${totalModels} |
| Total Routes | ${totalRoutes} |
| Total UI Pages | ${totalPages} |

---

## Package Inventory

| Module | Package | Type | Models | Routes | Pages | Tests |
|--------|---------|------|--------|--------|-------|-------|
${rows.join("\n")}

---

## Architecture

- **Stack:** Laravel 11 + Inertia.js v2 + React 18 + Tailwind CSS v4 + HeroUI
- **Multi-Tenancy:** \`stancl/tenancy\` — database-per-tenant isolation
- **Auth Guards:** \`landlord\` (platform admin) + \`web\` (tenant users)
- **RBAC:** \`spatie/laravel-permission\`
- **Billing:** \`laravel/cashier\`
- **Frontend Build:** Vite + TypeScript

---

_Generated by the Aero Content Writer MCP Agent._
`;

  return { markdown: md, totalPackages: summaries.length, totalModels, totalRoutes, totalPages };
}

// ---------------------------------------------------------------------------
// Content improvement suggestions
// ---------------------------------------------------------------------------

export interface ContentSuggestion {
  type: "missing-readme" | "missing-tests" | "missing-description" | "no-routes" | "no-models";
  packageName: string;
  message: string;
  priority: "high" | "medium" | "low";
}

export async function suggestContentImprovements(): Promise<ContentSuggestion[]> {
  const summaries = await scanAllPackages();
  const suggestions: ContentSuggestion[] = [];

  for (const s of summaries) {
    if (!s.readmeExists) {
      suggestions.push({
        type: "missing-readme",
        packageName: s.name,
        message: `README.md is missing for ${s.name}. Run the generate_package_readme tool to create one.`,
        priority: "high",
      });
    }
    if (!s.hasTests) {
      suggestions.push({
        type: "missing-tests",
        packageName: s.name,
        message: `No tests directory found in ${s.name}.`,
        priority: "medium",
      });
    }
    if (!s.description) {
      suggestions.push({
        type: "missing-description",
        packageName: s.name,
        message: `composer.json description is empty for ${s.name}.`,
        priority: "low",
      });
    }
    if (s.models.length > 0 && s.routes.length === 0) {
      suggestions.push({
        type: "no-routes",
        packageName: s.name,
        message: `${s.name} has ${s.models.length} models but no routes — may need API endpoints.`,
        priority: "medium",
      });
    }
  }

  return suggestions.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  });
}
