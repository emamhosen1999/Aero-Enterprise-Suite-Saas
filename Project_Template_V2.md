├── apps/                                 # Host Applications
│   ├── saas-host/                        # Multi-tenant SaaS deployment
│   │   ├── .env                          # Environment: DB_DATABASE=eos365
│   │   ├── composer.json                 # Requires ALL packages
│   │   ├── config/tenancy.php            # Multi-tenancy configuration
│   │   └── public/                       # Web root
│   │
│   └── standalone-host/                  # Single-tenant deployment
│       ├── .env                          # Environment: DB_DATABASE=aero_hrm
│       ├── composer.json                 # Requires SELECTED packages only
│       └── public/                       # Web root
│
├── packages/                             # Independent Composer Packages
│   ├── aero-core/                        # REQUIRED: Authentication, Users, Roles
│   ├── aero-platform/                    # SaaS ONLY: Tenancy, Billing, Plans
│   ├── aero-hrm/                         # Human Resource Management
│   ├── aero-crm/                         # Customer Relationship Management
│   ├── aero-finance/                     # Accounting & Financial Management
│   ├── aero-ims/                         # Inventory Management System
│   ├── aero-pos/                         # Point of Sale
│   ├── aero-project/                     # Project Management
│   ├── aero-scm/                         # Supply Chain Management
│   ├── aero-dms/                         # Document Management System
│   ├── aero-quality/                     # Quality Control & Assurance
│   ├── aero-compliance/                  # Regulatory Compliance
│   ├── aero-assist/                      # AI Assistant (RAG-based)
│   └── aero-ui/                          # Shared React/HeroUI Components
│
├── config/
│   └── products.php                      # Standalone product definitions
│
└── docs/                                 # Documentation
