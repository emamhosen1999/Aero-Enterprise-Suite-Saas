# Core Module Audit Tracker

Source: `packages/aero-core/config/module.php`

**Status legend:** ⏳ Pending · 🔄 In Progress · ✅ Complete · ❌ Blocked

Audit each component for:
- **HRMAC**: permission keys, route middleware, frontend `useHRMAC`/`useHasPermission` hooks, backend policy enforcement
- **Backend**: Controller, Service (with `DB::transaction` for multi-write ops), Form Request, Model, Migration, Route, Multi-tenant scope, Inertia::render shape
- **Frontend** (`packages/aero-ui`): Inertia React page, Skeleton loader, ErrorBoundary, HeroUI components, standard `useForm`/table primitives, barrel export

---

## Self Service
| Status | Feature | HRMAC | Backend | Frontend |
|---|---|---|---|---|
| 🔄 In Progress | my-profile | — | — | — |
| ⏳ Pending | my-notifications | — | — | — |

## Dashboards
| Status | Feature |
|---|---|
| ⏳ Pending | admin-dashboard |
| ⏳ Pending | announcements |
| ⏳ Pending | hrm-dashboard |
| ⏳ Pending | employee-dashboard |

## Subscription & Billing (SaaS only)
| Status | Feature |
|---|---|
| ⏳ Pending | plans |
| ⏳ Pending | usage |
| ⏳ Pending | invoices |

## User Management
| Status | Feature |
|---|---|
| ⏳ Pending | users |
| ⏳ Pending | user_invitations |
| ⏳ Pending | user_profile |

## Authentication
| Status | Feature |
|---|---|
| ⏳ Pending | devices |
| ⏳ Pending | two_factor |
| ⏳ Pending | password_reset |
| ⏳ Pending | email_verification |
| ⏳ Pending | sessions |

## Roles & Permissions
| Status | Feature |
|---|---|
| ⏳ Pending | roles |
| ⏳ Pending | module_access |

## Audit Logs
| Status | Feature |
|---|---|
| ⏳ Pending | activity_logs |
| ⏳ Pending | security_logs |
| ⏳ Pending | queue_monitor |

## Notifications
| Status | Feature |
|---|---|
| ⏳ Pending | channels |
| ⏳ Pending | templates |

## File Manager
| Status | Feature |
|---|---|
| ⏳ Pending | storage |
| ⏳ Pending | media_library |

## Settings
| Status | Feature |
|---|---|
| ⏳ Pending | general |
| ⏳ Pending | security |
| ⏳ Pending | localization |
| ⏳ Pending | branding |
| ⏳ Pending | mail_settings |
| ⏳ Pending | integrations |
| ⏳ Pending | password_policy |
| ⏳ Pending | ip_whitelist |

## Organization
| Status | Feature |
|---|---|
| ⏳ Pending | org_profile |
| ⏳ Pending | org_identity |
| ⏳ Pending | org_addresses |
| ⏳ Pending | fiscal_year |
| ⏳ Pending | org_contacts |

## SSO & Identity
| Status | Feature |
|---|---|
| ⏳ Pending | sso_saml |
| ⏳ Pending | sso_oidc |
| ⏳ Pending | oauth_provider |
| ⏳ Pending | scim_provisioning |
| ⏳ Pending | social_login |
| ⏳ Pending | magic_link |
| ⏳ Pending | passkeys |
| ⏳ Pending | mfa_policies |
| ⏳ Pending | session_policies |
| ⏳ Pending | login_activity |
| ⏳ Pending | verification |
| ⏳ Pending | account_recovery |

## API & Webhooks
| Status | Feature |
|---|---|
| ⏳ Pending | api_keys |
| ⏳ Pending | pat |
| ⏳ Pending | webhooks_outbound |
| ⏳ Pending | rate_limits |
| ⏳ Pending | api_usage |
| ⏳ Pending | api_docs |

## Workflow Engine
| Status | Feature |
|---|---|
| ⏳ Pending | approval_workflows |
| ⏳ Pending | automations |
| ⏳ Pending | workflow_runs |

## Custom Fields
| Status | Feature |
|---|---|
| ⏳ Pending | field_definitions |

## Tags & Labels
| Status | Feature |
|---|---|
| ⏳ Pending | tag_management |

## Saved Views
| Status | Feature |
|---|---|
| ⏳ Pending | views |

## Form Builder
| Status | Feature |
|---|---|
| ⏳ Pending | forms |
| ⏳ Pending | submissions |

## Global Search
| Status | Feature |
|---|---|
| ⏳ Pending | search_ui |
| ⏳ Pending | search_index |

## Translations / i18n
| Status | Feature |
|---|---|
| ⏳ Pending | languages |
| ⏳ Pending | translation_editor |

## User Preferences
| Status | Feature |
|---|---|
| ⏳ Pending | notification_preferences |
| ⏳ Pending | theme_preferences |
| ⏳ Pending | locale_preferences |
| ⏳ Pending | accessibility |

## Comments & Mentions
| Status | Feature |
|---|---|
| ⏳ Pending | comments |
| ⏳ Pending | mentions_inbox |
| ⏳ Pending | activity_feed |

## Help & Support
| Status | Feature |
|---|---|
| ⏳ Pending | help_center |
| ⏳ Pending | knowledge_base |
| ⏳ Pending | support_tickets |
| ⏳ Pending | onboarding_tours |
| ⏳ Pending | whats_new |
| ⏳ Pending | feedback |
| ⏳ Pending | live_chat |

## Data Privacy
| Status | Feature |
|---|---|
| ⏳ Pending | data_export |
| ⏳ Pending | data_import |
| ⏳ Pending | retention_policies |
| ⏳ Pending | dsar |
| ⏳ Pending | consent_management |
| ⏳ Pending | cookie_consent |
| ⏳ Pending | trash |
| ⏳ Pending | compliance_mode |

## Email Engine
| Status | Feature |
|---|---|
| ⏳ Pending | email_templates |

---

## Currently In Progress
**Feature:** `my-profile`
- Submodule: `self_service`
- Type: `page`
- Route: `/profile`
- HRMAC keys: `core.self_service.my-profile.view`, `core.self_service.my-profile.edit`
- Sub-checks:
  - [ ] HRMAC permission entries
  - [ ] HRMAC route middleware
  - [ ] HRMAC frontend hook usage
  - [ ] Backend Controller
  - [ ] Backend Service (DB::transaction)
  - [ ] Backend Form Request
  - [ ] Backend Route registration
  - [ ] Multi-tenant scoping
  - [ ] Inertia React page
  - [ ] Skeleton loader
  - [ ] ErrorBoundary wrapping
  - [ ] HeroUI components
  - [ ] Barrel export
