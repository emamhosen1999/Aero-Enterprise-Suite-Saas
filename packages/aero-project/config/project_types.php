<?php

/**
 * Project Types Configuration
 *
 * This file defines all available project types for the multi-domain,
 * department-agnostic project management system.
 *
 * ARCHITECTURAL PRINCIPLE:
 * - Each project type can be used by ANY department
 * - Types define domain-specific fields, workflows, and behaviors
 * - Types are NOT tied to specific departments
 *
 * Structure:
 * - code: Unique identifier for the type
 * - name: Display name
 * - description: Purpose/use case
 * - icon: HeroIcon name
 * - category: Grouping (infrastructure, it, business, research, creative)
 * - fields: Domain-specific fields to show/require
 * - workflows: Available workflow templates
 * - milestones: Default milestone templates
 * - metrics: KPIs and tracking metrics
 * - integrations: External system integrations
 */

return [

    // ============================================================
    // INFRASTRUCTURE & CONSTRUCTION
    // ============================================================

    'construction' => [
        'code' => 'construction',
        'name' => 'Construction Project',
        'description' => 'Building, civil, and infrastructure construction projects',
        'icon' => 'BuildingOfficeIcon',
        'category' => 'infrastructure',
        'color' => '#F59E0B',
        'fields' => [
            'location' => ['type' => 'text', 'required' => true, 'label' => 'Site Location'],
            'site_address' => ['type' => 'address', 'required' => true],
            'contractor_id' => ['type' => 'user', 'required' => false, 'label' => 'Main Contractor'],
            'permit_number' => ['type' => 'text', 'required' => false, 'label' => 'Building Permit'],
            'safety_officer_id' => ['type' => 'user', 'required' => false, 'label' => 'Safety Officer'],
        ],
        'workflows' => ['design-bid-build', 'design-build', 'construction-management'],
        'milestones' => [
            'design_complete' => 'Design Complete',
            'permits_approved' => 'Permits Approved',
            'foundation_complete' => 'Foundation Complete',
            'structure_complete' => 'Structure Complete',
            'mep_complete' => 'MEP Installation Complete',
            'interior_complete' => 'Interior Finish Complete',
            'final_inspection' => 'Final Inspection',
            'handover' => 'Handover to Client',
        ],
        'metrics' => ['spi', 'cpi', 'safety_incidents', 'quality_defects', 'weather_delays'],
        'features' => ['boq', 'geofencing', 'safety_tracking', 'equipment_tracking', 'subcontractor_management'],
        'integrations' => ['bim', 'surveying', 'material_tracking'],
    ],

    'road_rail' => [
        'code' => 'road_rail',
        'name' => 'Road/Rail/Pipeline Project',
        'description' => 'Linear infrastructure projects with chainage-based tracking',
        'icon' => 'ArrowsRightLeftIcon',
        'category' => 'infrastructure',
        'color' => '#6366F1',
        'fields' => [
            'start_chainage' => ['type' => 'decimal', 'required' => true, 'label' => 'Start Chainage (km)'],
            'end_chainage' => ['type' => 'decimal', 'required' => true, 'label' => 'End Chainage (km)'],
            'total_length' => ['type' => 'decimal', 'computed' => true, 'label' => 'Total Length (km)'],
            'route_type' => ['type' => 'select', 'options' => ['highway', 'railway', 'pipeline', 'canal', 'transmission'], 'required' => true],
            'terrain_type' => ['type' => 'select', 'options' => ['flat', 'hilly', 'mountainous', 'mixed']],
        ],
        'workflows' => ['linear-scheduling', 'segment-completion'],
        'milestones' => [
            'survey_complete' => 'Survey & Design Complete',
            'land_acquired' => 'Land Acquisition Complete',
            'earthwork_complete' => 'Earthwork Complete',
            'structure_complete' => 'Structures Complete',
            'track_laid' => 'Track/Surface Laid',
            'signaling_complete' => 'Signaling/Safety Complete',
            'testing_complete' => 'Testing & Commissioning',
            'operational' => 'Operational Handover',
        ],
        'metrics' => ['km_completed', 'chainage_progress', 'spi', 'cpi', 'safety_incidents'],
        'features' => ['linear_scheduling', 'chainage_boq', 'geofencing', 'progress_by_segment'],
        'integrations' => ['gis', 'surveying', 'traffic_management'],
    ],

    // ============================================================
    // IT & SOFTWARE
    // ============================================================

    'software_development' => [
        'code' => 'software_development',
        'name' => 'Software Development',
        'description' => 'Software, web, and mobile application development',
        'icon' => 'CodeBracketIcon',
        'category' => 'it',
        'color' => '#10B981',
        'fields' => [
            'methodology' => ['type' => 'select', 'options' => ['agile', 'scrum', 'kanban', 'waterfall', 'hybrid'], 'required' => true],
            'tech_stack' => ['type' => 'tags', 'label' => 'Technology Stack'],
            'repository_url' => ['type' => 'url', 'label' => 'Repository URL'],
            'environment' => ['type' => 'select', 'options' => ['dev', 'staging', 'production']],
            'sprint_duration' => ['type' => 'integer', 'default' => 14, 'label' => 'Sprint Duration (days)'],
        ],
        'workflows' => ['scrum', 'kanban', 'waterfall', 'devops'],
        'milestones' => [
            'requirements_complete' => 'Requirements Finalized',
            'design_complete' => 'Architecture & Design Complete',
            'mvp_complete' => 'MVP Complete',
            'alpha_release' => 'Alpha Release',
            'beta_release' => 'Beta Release',
            'uat_complete' => 'UAT Complete',
            'production_release' => 'Production Release',
            'maintenance_start' => 'Maintenance Phase Start',
        ],
        'metrics' => ['velocity', 'burndown', 'cycle_time', 'lead_time', 'defect_rate', 'code_coverage'],
        'features' => ['sprints', 'backlog', 'burndown_charts', 'velocity_tracking', 'code_reviews'],
        'integrations' => ['github', 'gitlab', 'jira', 'ci_cd', 'slack'],
    ],

    'it_infrastructure' => [
        'code' => 'it_infrastructure',
        'name' => 'IT Infrastructure',
        'description' => 'Network, server, cloud, and infrastructure deployment',
        'icon' => 'ServerIcon',
        'category' => 'it',
        'color' => '#8B5CF6',
        'fields' => [
            'infrastructure_type' => ['type' => 'select', 'options' => ['network', 'server', 'cloud', 'hybrid', 'data_center'], 'required' => true],
            'environment' => ['type' => 'select', 'options' => ['production', 'staging', 'development', 'disaster_recovery']],
            'vendor' => ['type' => 'text', 'label' => 'Primary Vendor'],
            'sla_target' => ['type' => 'decimal', 'label' => 'SLA Target (%)'],
        ],
        'workflows' => ['itil', 'deployment', 'migration'],
        'milestones' => [
            'assessment_complete' => 'Assessment Complete',
            'design_approved' => 'Design Approved',
            'procurement_complete' => 'Procurement Complete',
            'installation_complete' => 'Installation Complete',
            'testing_complete' => 'Testing Complete',
            'migration_complete' => 'Migration Complete',
            'go_live' => 'Go Live',
            'optimization_complete' => 'Optimization Complete',
        ],
        'metrics' => ['uptime', 'performance', 'capacity_utilization', 'incident_count', 'mttr'],
        'features' => ['change_management', 'incident_tracking', 'asset_tracking', 'capacity_planning'],
        'integrations' => ['monitoring', 'ticketing', 'cmdb', 'cloud_providers'],
    ],

    // ============================================================
    // BUSINESS & MARKETING
    // ============================================================

    'marketing_campaign' => [
        'code' => 'marketing_campaign',
        'name' => 'Marketing Campaign',
        'description' => 'Marketing, advertising, and promotional campaigns',
        'icon' => 'MegaphoneIcon',
        'category' => 'business',
        'color' => '#EC4899',
        'fields' => [
            'campaign_type' => ['type' => 'select', 'options' => ['digital', 'print', 'social', 'email', 'event', 'integrated'], 'required' => true],
            'target_audience' => ['type' => 'text', 'label' => 'Target Audience'],
            'channels' => ['type' => 'tags', 'label' => 'Marketing Channels'],
            'kpi_target' => ['type' => 'text', 'label' => 'Primary KPI Target'],
            'brand_guidelines_url' => ['type' => 'url', 'label' => 'Brand Guidelines'],
        ],
        'workflows' => ['campaign-launch', 'content-calendar', 'creative-review'],
        'milestones' => [
            'strategy_approved' => 'Strategy Approved',
            'creative_approved' => 'Creative Approved',
            'assets_produced' => 'Assets Produced',
            'launch' => 'Campaign Launch',
            'mid_campaign_review' => 'Mid-Campaign Review',
            'campaign_end' => 'Campaign End',
            'analysis_complete' => 'Analysis Complete',
        ],
        'metrics' => ['impressions', 'engagement', 'conversion_rate', 'roi', 'cac', 'ltv'],
        'features' => ['content_calendar', 'creative_approval', 'budget_tracking', 'performance_dashboards'],
        'integrations' => ['analytics', 'crm', 'social_media', 'email_marketing'],
    ],

    'product_launch' => [
        'code' => 'product_launch',
        'name' => 'Product Launch',
        'description' => 'New product development and launch projects',
        'icon' => 'RocketLaunchIcon',
        'category' => 'business',
        'color' => '#F97316',
        'fields' => [
            'product_type' => ['type' => 'select', 'options' => ['physical', 'digital', 'service', 'hybrid'], 'required' => true],
            'target_market' => ['type' => 'text', 'label' => 'Target Market'],
            'launch_date' => ['type' => 'date', 'required' => true, 'label' => 'Target Launch Date'],
            'pricing_strategy' => ['type' => 'text', 'label' => 'Pricing Strategy'],
        ],
        'workflows' => ['stage-gate', 'lean-startup', 'agile-product'],
        'milestones' => [
            'concept_approved' => 'Concept Approved',
            'design_complete' => 'Design Complete',
            'prototype_complete' => 'Prototype Complete',
            'testing_complete' => 'Testing Complete',
            'production_ready' => 'Production Ready',
            'marketing_ready' => 'Marketing Ready',
            'soft_launch' => 'Soft Launch',
            'full_launch' => 'Full Launch',
        ],
        'metrics' => ['time_to_market', 'launch_cost', 'first_week_sales', 'customer_feedback', 'market_share'],
        'features' => ['stage_gate_reviews', 'go_no_go_decisions', 'launch_checklist', 'stakeholder_approvals'],
        'integrations' => ['crm', 'inventory', 'ecommerce', 'analytics'],
    ],

    // ============================================================
    // HR & ORGANIZATIONAL
    // ============================================================

    'hr_initiative' => [
        'code' => 'hr_initiative',
        'name' => 'HR Initiative',
        'description' => 'HR programs, training, and organizational development',
        'icon' => 'UserGroupIcon',
        'category' => 'business',
        'color' => '#14B8A6',
        'fields' => [
            'initiative_type' => ['type' => 'select', 'options' => ['training', 'recruitment', 'engagement', 'policy', 'restructuring', 'culture'], 'required' => true],
            'target_departments' => ['type' => 'departments', 'label' => 'Target Departments'],
            'employee_count' => ['type' => 'integer', 'label' => 'Employees Impacted'],
            'compliance_required' => ['type' => 'boolean', 'label' => 'Compliance Related'],
        ],
        'workflows' => ['training-rollout', 'recruitment-drive', 'policy-implementation'],
        'milestones' => [
            'needs_assessment' => 'Needs Assessment Complete',
            'program_designed' => 'Program Designed',
            'stakeholder_approval' => 'Stakeholder Approval',
            'pilot_complete' => 'Pilot Complete',
            'rollout_started' => 'Rollout Started',
            'rollout_complete' => 'Full Rollout Complete',
            'impact_measured' => 'Impact Measured',
        ],
        'metrics' => ['participation_rate', 'completion_rate', 'satisfaction_score', 'cost_per_employee', 'roi'],
        'features' => ['training_tracking', 'survey_integration', 'certification_management', 'compliance_reporting'],
        'integrations' => ['lms', 'hris', 'survey_tools', 'payroll'],
    ],

    // ============================================================
    // RESEARCH & DEVELOPMENT
    // ============================================================

    'research_project' => [
        'code' => 'research_project',
        'name' => 'Research Project',
        'description' => 'R&D, innovation, and scientific research projects',
        'icon' => 'BeakerIcon',
        'category' => 'research',
        'color' => '#0EA5E9',
        'fields' => [
            'research_type' => ['type' => 'select', 'options' => ['basic', 'applied', 'experimental', 'clinical'], 'required' => true],
            'funding_source' => ['type' => 'text', 'label' => 'Funding Source'],
            'grant_number' => ['type' => 'text', 'label' => 'Grant/Award Number'],
            'irb_approval' => ['type' => 'boolean', 'label' => 'IRB Approval Required'],
            'publication_target' => ['type' => 'text', 'label' => 'Target Publication'],
        ],
        'workflows' => ['research-lifecycle', 'clinical-trial', 'innovation-funnel'],
        'milestones' => [
            'proposal_approved' => 'Proposal Approved',
            'funding_secured' => 'Funding Secured',
            'ethics_approved' => 'Ethics/IRB Approved',
            'data_collection_complete' => 'Data Collection Complete',
            'analysis_complete' => 'Analysis Complete',
            'paper_submitted' => 'Paper Submitted',
            'paper_published' => 'Paper Published',
            'knowledge_transfer' => 'Knowledge Transfer Complete',
        ],
        'metrics' => ['publications', 'citations', 'patents', 'commercialization', 'funding_utilization'],
        'features' => ['literature_management', 'data_management', 'collaboration_tools', 'publication_tracking'],
        'integrations' => ['reference_managers', 'lab_systems', 'grant_management', 'research_portals'],
    ],

    // ============================================================
    // EVENTS & CREATIVE
    // ============================================================

    'event_management' => [
        'code' => 'event_management',
        'name' => 'Event Management',
        'description' => 'Conferences, exhibitions, and corporate events',
        'icon' => 'CalendarDaysIcon',
        'category' => 'creative',
        'color' => '#A855F7',
        'fields' => [
            'event_type' => ['type' => 'select', 'options' => ['conference', 'exhibition', 'seminar', 'workshop', 'gala', 'team_building'], 'required' => true],
            'event_date' => ['type' => 'date', 'required' => true, 'label' => 'Event Date'],
            'venue' => ['type' => 'text', 'label' => 'Venue'],
            'expected_attendees' => ['type' => 'integer', 'label' => 'Expected Attendees'],
            'registration_url' => ['type' => 'url', 'label' => 'Registration URL'],
        ],
        'workflows' => ['event-planning', 'speaker-management', 'vendor-coordination'],
        'milestones' => [
            'concept_approved' => 'Concept Approved',
            'venue_booked' => 'Venue Booked',
            'speakers_confirmed' => 'Speakers Confirmed',
            'registration_open' => 'Registration Open',
            'vendors_contracted' => 'Vendors Contracted',
            'event_day' => 'Event Day',
            'post_event_survey' => 'Post-Event Survey',
            'final_report' => 'Final Report',
        ],
        'metrics' => ['attendance', 'satisfaction_score', 'leads_generated', 'cost_per_attendee', 'roi'],
        'features' => ['attendee_management', 'speaker_management', 'vendor_management', 'budget_tracking'],
        'integrations' => ['registration', 'email_marketing', 'crm', 'virtual_event'],
    ],

    // ============================================================
    // COMPLIANCE & GOVERNANCE
    // ============================================================

    'compliance_audit' => [
        'code' => 'compliance_audit',
        'name' => 'Compliance/Audit Project',
        'description' => 'Regulatory compliance, audits, and governance projects',
        'icon' => 'ClipboardDocumentCheckIcon',
        'category' => 'business',
        'color' => '#EF4444',
        'fields' => [
            'compliance_type' => ['type' => 'select', 'options' => ['iso', 'sox', 'gdpr', 'hipaa', 'pci', 'internal', 'external'], 'required' => true],
            'regulatory_body' => ['type' => 'text', 'label' => 'Regulatory Body'],
            'audit_period' => ['type' => 'text', 'label' => 'Audit Period'],
            'lead_auditor' => ['type' => 'user', 'label' => 'Lead Auditor'],
            'certification_target' => ['type' => 'date', 'label' => 'Certification Target Date'],
        ],
        'workflows' => ['audit-lifecycle', 'certification', 'remediation'],
        'milestones' => [
            'scope_defined' => 'Scope Defined',
            'documentation_gathered' => 'Documentation Gathered',
            'fieldwork_started' => 'Fieldwork Started',
            'fieldwork_complete' => 'Fieldwork Complete',
            'findings_reported' => 'Findings Reported',
            'remediation_planned' => 'Remediation Planned',
            'remediation_complete' => 'Remediation Complete',
            'certification_received' => 'Certification Received',
        ],
        'metrics' => ['findings_count', 'high_risk_findings', 'remediation_rate', 'days_to_close', 'compliance_score'],
        'features' => ['finding_tracking', 'evidence_management', 'remediation_tracking', 'compliance_dashboards'],
        'integrations' => ['grc', 'document_management', 'risk_management'],
    ],

    // ============================================================
    // GENERAL PURPOSE
    // ============================================================

    'general' => [
        'code' => 'general',
        'name' => 'General Project',
        'description' => 'Generic project type for miscellaneous initiatives',
        'icon' => 'FolderIcon',
        'category' => 'business',
        'color' => '#6B7280',
        'fields' => [
            'custom_field_1' => ['type' => 'text', 'label' => 'Custom Field 1'],
            'custom_field_2' => ['type' => 'text', 'label' => 'Custom Field 2'],
        ],
        'workflows' => ['simple', 'standard', 'advanced'],
        'milestones' => [
            'kickoff' => 'Project Kickoff',
            'planning_complete' => 'Planning Complete',
            'midpoint_review' => 'Midpoint Review',
            'final_review' => 'Final Review',
            'closure' => 'Project Closure',
        ],
        'metrics' => ['on_time_delivery', 'budget_variance', 'stakeholder_satisfaction'],
        'features' => ['task_management', 'time_tracking', 'document_management'],
        'integrations' => [],
    ],

];
