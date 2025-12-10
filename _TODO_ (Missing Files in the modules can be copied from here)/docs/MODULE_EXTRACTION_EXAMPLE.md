# Practical Example: Extracting the Support Module

This document provides a step-by-step walkthrough of extracting the Support & Ticketing module into a separate package repository.

## Why Support Module?

The Support module is chosen as an example because:
- ✅ Relatively self-contained
- ✅ Clear boundaries with other modules
- ✅ Has both backend and frontend components
- ✅ Uses tenant-scoped data
- ✅ Demonstrates event-driven communication

## Module Overview

**Module Code**: `support`  
**Description**: Customer support ticketing system  
**Current Location**: Integrated in monolithic app  
**Dependencies**: Core module only (no hard dependencies on other business modules)

### Current Structure in Monolith

```
app/
├── Http/Controllers/Tenant/Support/
│   ├── TicketController.php
│   ├── DepartmentController.php
│   ├── AgentController.php
│   ├── KnowledgeBaseController.php
│   └── ...
├── Models/
│   ├── SupportTicket.php
│   ├── SupportDepartment.php
│   ├── SupportAgent.php
│   └── ...
├── Services/Tenant/Support/ (if exists)
└── Policies/
    └── SupportTicketPolicy.php

resources/js/Tenant/Pages/Support/
├── TicketList.jsx
├── TicketDetail.jsx
├── CreateTicket.jsx
└── ...

routes/support.php

database/migrations/tenant/
├── 2024_xx_xx_create_support_tickets_table.php
├── 2024_xx_xx_create_support_departments_table.php
└── ...
```

---

## Step 1: Create Package Repository

### 1.1 Initialize Repository

```bash
# Create new repository
mkdir aero-support-module
cd aero-support-module

# Initialize git
git init
git branch -M main

# Create .gitignore
cat > .gitignore << 'EOF'
/vendor/
/node_modules/
.env
.env.testing
.phpunit.result.cache
composer.lock
package-lock.json
EOF
```

### 1.2 Create Package Structure

```bash
# Create directory structure
mkdir -p src/{Http/{Controllers,Middleware,Requests},Models,Services,Policies,Events,Listeners,Jobs,Providers,routes}
mkdir -p resources/{js/{Pages,Components,Tables,Forms},views}
mkdir -p database/{migrations,seeders,factories}
mkdir -p tests/{Feature,Unit}
mkdir -p config
mkdir -p public/assets
```

### 1.3 Initialize Composer

```bash
composer init \
    --name="aero/support-module" \
    --description="Customer Support & Ticketing Module for Aero Enterprise Suite" \
    --type="library" \
    --license="proprietary"
```

### 1.4 Create composer.json

```json
{
    "name": "aero/support-module",
    "description": "Customer Support & Ticketing Module for Aero Enterprise Suite",
    "type": "library",
    "license": "proprietary",
    "authors": [
        {
            "name": "Aero Development Team",
            "email": "dev@aero-erp.com"
        }
    ],
    "require": {
        "php": "^8.2",
        "laravel/framework": "^11.0",
        "inertiajs/inertia-laravel": "2.x-dev",
        "stancl/tenancy": "^3.9",
        "spatie/laravel-permission": "^6.20"
    },
    "require-dev": {
        "phpunit/phpunit": "^11.0",
        "orchestra/testbench": "^9.0",
        "mockery/mockery": "^1.6"
    },
    "autoload": {
        "psr-4": {
            "Aero\\Support\\": "src/"
        }
    },
    "autoload-dev": {
        "psr-4": {
            "Aero\\Support\\Tests\\": "tests/"
        }
    },
    "extra": {
        "laravel": {
            "providers": [
                "Aero\\Support\\Providers\\SupportServiceProvider"
            ]
        },
        "aero": {
            "module-code": "support",
            "platform-compatibility": "^2.0",
            "category": "customer_relations"
        }
    },
    "minimum-stability": "dev",
    "prefer-stable": true
}
```

### 1.5 Create package.json

```json
{
    "name": "@aero/support-module",
    "version": "1.0.0",
    "description": "Support module frontend assets",
    "scripts": {
        "dev": "vite",
        "build": "vite build"
    },
    "dependencies": {
        "@heroicons/react": "^2.2.0",
        "@heroui/react": "^2.8.2",
        "@inertiajs/react": "^1.0.0",
        "react": "^18.2.0",
        "react-dom": "^18.2.0"
    },
    "devDependencies": {
        "@vitejs/plugin-react": "^4.2.0",
        "vite": "^5.0.0"
    }
}
```

---

## Step 2: Migrate Code

### 2.1 Copy Backend Files

```bash
# From main repository root
MAIN_REPO="/path/to/Aero-Enterprise-Suite-Saas"
MODULE_REPO="/path/to/aero-support-module"

# Copy controllers
cp -r "$MAIN_REPO/app/Http/Controllers/Tenant/Support/"* "$MODULE_REPO/src/Http/Controllers/"

# Copy models
cp "$MAIN_REPO/app/Models/SupportTicket.php" "$MODULE_REPO/src/Models/"
cp "$MAIN_REPO/app/Models/SupportDepartment.php" "$MODULE_REPO/src/Models/"
cp "$MAIN_REPO/app/Models/SupportAgent.php" "$MODULE_REPO/src/Models/"
# ... copy other related models

# Copy services (if they exist)
if [ -d "$MAIN_REPO/app/Services/Tenant/Support" ]; then
    cp -r "$MAIN_REPO/app/Services/Tenant/Support/"* "$MODULE_REPO/src/Services/"
fi

# Copy policies
cp "$MAIN_REPO/app/Policies/SupportTicketPolicy.php" "$MODULE_REPO/src/Policies/"

# Copy routes
cp "$MAIN_REPO/routes/support.php" "$MODULE_REPO/src/routes/web.php"

# Copy migrations
cp "$MAIN_REPO/database/migrations/tenant/"*support* "$MODULE_REPO/database/migrations/"

# Copy frontend
cp -r "$MAIN_REPO/resources/js/Tenant/Pages/Support" "$MODULE_REPO/resources/js/Pages/"
# Copy related components if any
```

### 2.2 Update Namespaces

#### Before:
```php
namespace App\Http\Controllers\Tenant\Support;
namespace App\Models;
namespace App\Services\Tenant\Support;
namespace App\Policies;
```

#### After:
```php
namespace Aero\Support\Http\Controllers;
namespace Aero\Support\Models;
namespace Aero\Support\Services;
namespace Aero\Support\Policies;
```

#### Automated Script (update-namespaces.sh):

```bash
#!/bin/bash

# Run from module repository root
find src -type f -name "*.php" -exec sed -i \
    -e 's/namespace App\\Http\\Controllers\\Tenant\\Support/namespace Aero\\Support\\Http\\Controllers/g' \
    -e 's/namespace App\\Models/namespace Aero\\Support\\Models/g' \
    -e 's/namespace App\\Services\\Tenant\\Support/namespace Aero\\Support\\Services/g' \
    -e 's/namespace App\\Policies/namespace Aero\\Support\\Policies/g' \
    -e 's/use App\\Http\\Controllers\\Tenant\\Support\\/use Aero\\Support\\Http\\Controllers\\/g' \
    -e 's/use App\\Models\\/use Aero\\Support\\Models\\/g' \
    -e 's/use App\\Services\\Tenant\\Support\\/use Aero\\Support\\Services\\/g' \
    -e 's/use App\\Policies\\/use Aero\\Support\\Policies\\/g' \
    {} +

echo "Namespaces updated successfully!"
```

---

## Step 3: Create Service Provider

### src/Providers/SupportServiceProvider.php

```php
<?php

namespace Aero\Support\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Route;
use Aero\Support\Services\SupportService;

class SupportServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        // Register main support service
        $this->app->singleton('support', function ($app) {
            return new SupportService();
        });

        // Register other services
        $this->app->singleton('support.ticket', function ($app) {
            return new \Aero\Support\Services\TicketService();
        });

        // Merge configuration
        $this->mergeConfigFrom(
            __DIR__.'/../../config/support.php', 'support'
        );
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Load migrations
        $this->loadMigrationsFrom(__DIR__.'/../../database/migrations');

        // Register routes
        $this->registerRoutes();

        // Register views
        $this->loadViewsFrom(__DIR__.'/../../resources/views', 'support');

        // Publish configuration
        $this->publishes([
            __DIR__.'/../../config/support.php' => config_path('support.php'),
        ], 'support-config');

        // Publish frontend assets
        $this->publishes([
            __DIR__.'/../../resources/js' => resource_path('js/Modules/Support'),
        ], 'support-assets');

        // Publish migrations (optional - for customization)
        $this->publishes([
            __DIR__.'/../../database/migrations' => database_path('migrations'),
        ], 'support-migrations');

        // Register policies
        $this->registerPolicies();

        // Register events and listeners
        $this->registerEvents();
    }

    /**
     * Register routes.
     */
    protected function registerRoutes(): void
    {
        Route::middleware(['web', 'auth', 'tenant.setup'])
            ->prefix('support')
            ->name('support.')
            ->group(__DIR__.'/../../src/routes/web.php');

        // API routes
        if (file_exists(__DIR__.'/../../src/routes/api.php')) {
            Route::middleware(['api', 'auth:sanctum', 'tenant.setup'])
                ->prefix('api/support')
                ->name('api.support.')
                ->group(__DIR__.'/../../src/routes/api.php');
        }
    }

    /**
     * Register policies.
     */
    protected function registerPolicies(): void
    {
        if (class_exists(\Illuminate\Support\Facades\Gate::class)) {
            \Illuminate\Support\Facades\Gate::policy(
                \Aero\Support\Models\SupportTicket::class,
                \Aero\Support\Policies\SupportTicketPolicy::class
            );
        }
    }

    /**
     * Register events and listeners.
     */
    protected function registerEvents(): void
    {
        if (file_exists(__DIR__.'/../Events') && file_exists(__DIR__.'/../Listeners')) {
            $this->loadEventsFrom(__DIR__.'/../Events');
        }
    }
}
```

---

## Step 4: Create Configuration File

### config/support.php

```php
<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Support Module Configuration
    |--------------------------------------------------------------------------
    */

    'enabled' => env('SUPPORT_MODULE_ENABLED', true),

    /*
    |--------------------------------------------------------------------------
    | Ticket Settings
    |--------------------------------------------------------------------------
    */
    'ticket' => [
        'auto_assign' => env('SUPPORT_AUTO_ASSIGN', true),
        'allow_guest_tickets' => env('SUPPORT_ALLOW_GUEST_TICKETS', false),
        'default_priority' => env('SUPPORT_DEFAULT_PRIORITY', 'medium'),
        'priorities' => ['low', 'medium', 'high', 'urgent'],
        'statuses' => ['open', 'in_progress', 'pending', 'resolved', 'closed'],
    ],

    /*
    |--------------------------------------------------------------------------
    | SLA Settings
    |--------------------------------------------------------------------------
    */
    'sla' => [
        'enabled' => env('SUPPORT_SLA_ENABLED', true),
        'response_time' => [
            'urgent' => 1,  // hours
            'high' => 4,
            'medium' => 8,
            'low' => 24,
        ],
        'resolution_time' => [
            'urgent' => 4,  // hours
            'high' => 12,
            'medium' => 24,
            'low' => 48,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Notification Settings
    |--------------------------------------------------------------------------
    */
    'notifications' => [
        'ticket_created' => env('SUPPORT_NOTIFY_TICKET_CREATED', true),
        'ticket_assigned' => env('SUPPORT_NOTIFY_TICKET_ASSIGNED', true),
        'ticket_replied' => env('SUPPORT_NOTIFY_TICKET_REPLIED', true),
        'ticket_resolved' => env('SUPPORT_NOTIFY_TICKET_RESOLVED', true),
        'sla_breach' => env('SUPPORT_NOTIFY_SLA_BREACH', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | Multi-Channel Settings
    |--------------------------------------------------------------------------
    */
    'channels' => [
        'email' => [
            'enabled' => env('SUPPORT_EMAIL_ENABLED', true),
            'imap_host' => env('SUPPORT_IMAP_HOST'),
            'imap_port' => env('SUPPORT_IMAP_PORT', 993),
        ],
        'chat' => [
            'enabled' => env('SUPPORT_CHAT_ENABLED', false),
        ],
        'whatsapp' => [
            'enabled' => env('SUPPORT_WHATSAPP_ENABLED', false),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | File Attachments
    |--------------------------------------------------------------------------
    */
    'attachments' => [
        'enabled' => env('SUPPORT_ATTACHMENTS_ENABLED', true),
        'max_size' => env('SUPPORT_MAX_ATTACHMENT_SIZE', 10), // MB
        'allowed_types' => ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'gif', 'txt'],
    ],

    /*
    |--------------------------------------------------------------------------
    | Knowledge Base
    |--------------------------------------------------------------------------
    */
    'knowledge_base' => [
        'enabled' => env('SUPPORT_KB_ENABLED', true),
        'public_access' => env('SUPPORT_KB_PUBLIC', false),
        'categories' => true,
    ],
];
```

---

## Step 5: Update Models for Package

### src/Models/SupportTicket.php

```php
<?php

namespace Aero\Support\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Stancl\Tenancy\Database\Concerns\BelongsToTenant;

class SupportTicket extends Model
{
    use HasFactory, SoftDeletes, BelongsToTenant;

    protected $fillable = [
        'ticket_number',
        'subject',
        'description',
        'priority',
        'status',
        'department_id',
        'assigned_to',
        'customer_id',
        'category_id',
        'sla_breach_at',
        'resolved_at',
        'closed_at',
    ];

    protected $casts = [
        'sla_breach_at' => 'datetime',
        'resolved_at' => 'datetime',
        'closed_at' => 'datetime',
    ];

    /**
     * Boot method - generate ticket number
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($ticket) {
            if (!$ticket->ticket_number) {
                $ticket->ticket_number = static::generateTicketNumber();
            }
        });
    }

    /**
     * Generate unique ticket number
     */
    protected static function generateTicketNumber(): string
    {
        $prefix = 'TKT';
        $timestamp = now()->format('YmdHis');
        $random = strtoupper(substr(md5(uniqid()), 0, 4));
        
        return "{$prefix}-{$timestamp}-{$random}";
    }

    /**
     * Relationships
     */
    public function department()
    {
        return $this->belongsTo(SupportDepartment::class, 'department_id');
    }

    public function assignedAgent()
    {
        return $this->belongsTo(\App\Models\User::class, 'assigned_to');
    }

    public function customer()
    {
        return $this->belongsTo(\App\Models\User::class, 'customer_id');
    }

    public function category()
    {
        return $this->belongsTo(TicketCategory::class, 'category_id');
    }

    public function replies()
    {
        return $this->hasMany(TicketReply::class, 'ticket_id');
    }

    public function attachments()
    {
        return $this->hasMany(TicketAttachment::class, 'ticket_id');
    }

    /**
     * Scopes
     */
    public function scopeOpen($query)
    {
        return $query->where('status', 'open');
    }

    public function scopeAssignedTo($query, $userId)
    {
        return $query->where('assigned_to', $userId);
    }

    public function scopeByPriority($query, $priority)
    {
        return $query->where('priority', $priority);
    }

    /**
     * Helpers
     */
    public function isOpen(): bool
    {
        return $this->status === 'open';
    }

    public function isClosed(): bool
    {
        return $this->status === 'closed';
    }

    public function hasSLABreach(): bool
    {
        return $this->sla_breach_at && now()->greaterThan($this->sla_breach_at);
    }
}
```

---

## Step 6: Update Routes

### src/routes/web.php

```php
<?php

use Illuminate\Support\Facades\Route;
use Aero\Support\Http\Controllers\TicketController;
use Aero\Support\Http\Controllers\DepartmentController;
use Aero\Support\Http\Controllers\AgentController;
use Aero\Support\Http\Controllers\KnowledgeBaseController;

/*
|--------------------------------------------------------------------------
| Support Module Routes
|--------------------------------------------------------------------------
*/

Route::middleware(['web', 'auth', 'tenant.setup'])->group(function () {
    
    // Tickets
    Route::prefix('tickets')->name('tickets.')->group(function () {
        Route::get('/', [TicketController::class, 'index'])->name('index');
        Route::get('/create', [TicketController::class, 'create'])->name('create');
        Route::post('/', [TicketController::class, 'store'])->name('store');
        Route::get('/{ticket}', [TicketController::class, 'show'])->name('show');
        Route::put('/{ticket}', [TicketController::class, 'update'])->name('update');
        Route::delete('/{ticket}', [TicketController::class, 'destroy'])->name('destroy');
        
        // Ticket actions
        Route::post('/{ticket}/assign', [TicketController::class, 'assign'])->name('assign');
        Route::post('/{ticket}/reply', [TicketController::class, 'reply'])->name('reply');
        Route::post('/{ticket}/close', [TicketController::class, 'close'])->name('close');
        Route::post('/{ticket}/reopen', [TicketController::class, 'reopen'])->name('reopen');
    });

    // Departments
    Route::resource('departments', DepartmentController::class);

    // Agents
    Route::prefix('agents')->name('agents.')->group(function () {
        Route::get('/', [AgentController::class, 'index'])->name('index');
        Route::post('/', [AgentController::class, 'store'])->name('store');
        Route::delete('/{agent}', [AgentController::class, 'destroy'])->name('destroy');
    });

    // Knowledge Base
    Route::prefix('kb')->name('kb.')->group(function () {
        Route::get('/', [KnowledgeBaseController::class, 'index'])->name('index');
        Route::get('/articles', [KnowledgeBaseController::class, 'articles'])->name('articles.index');
        Route::get('/articles/create', [KnowledgeBaseController::class, 'create'])->name('articles.create');
        Route::post('/articles', [KnowledgeBaseController::class, 'store'])->name('articles.store');
        Route::get('/articles/{article}', [KnowledgeBaseController::class, 'show'])->name('articles.show');
        Route::put('/articles/{article}', [KnowledgeBaseController::class, 'update'])->name('articles.update');
        Route::delete('/articles/{article}', [KnowledgeBaseController::class, 'destroy'])->name('articles.destroy');
    });
});
```

---

## Step 7: Update Controllers

### src/Http/Controllers/TicketController.php

```php
<?php

namespace Aero\Support\Http\Controllers;

use App\Http\Controllers\Controller;
use Aero\Support\Models\SupportTicket;
use Aero\Support\Services\TicketService;
use Aero\Support\Http\Requests\StoreTicketRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TicketController extends Controller
{
    public function __construct(
        protected TicketService $ticketService
    ) {
        // Apply permissions
        $this->middleware('permission:support.tickets.view')->only(['index', 'show']);
        $this->middleware('permission:support.tickets.create')->only(['create', 'store']);
        $this->middleware('permission:support.tickets.update')->only(['update', 'assign']);
        $this->middleware('permission:support.tickets.delete')->only('destroy');
    }

    /**
     * Display ticket list
     */
    public function index(Request $request)
    {
        $tickets = SupportTicket::query()
            ->with(['department', 'assignedAgent', 'customer'])
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->priority, fn($q) => $q->where('priority', $request->priority))
            ->when($request->assigned_to, fn($q) => $q->where('assigned_to', $request->assigned_to))
            ->latest()
            ->paginate(10);

        return Inertia::render('Support::TicketList', [
            'tickets' => $tickets,
            'filters' => $request->only(['status', 'priority', 'assigned_to']),
        ]);
    }

    /**
     * Show ticket creation form
     */
    public function create()
    {
        return Inertia::render('Support::CreateTicket', [
            'departments' => \Aero\Support\Models\SupportDepartment::all(),
            'categories' => \Aero\Support\Models\TicketCategory::all(),
        ]);
    }

    /**
     * Store new ticket
     */
    public function store(StoreTicketRequest $request)
    {
        $ticket = $this->ticketService->createTicket($request->validated());

        return redirect()
            ->route('support.tickets.show', $ticket)
            ->with('success', 'Ticket created successfully');
    }

    /**
     * Display ticket details
     */
    public function show(SupportTicket $ticket)
    {
        $ticket->load(['department', 'assignedAgent', 'customer', 'replies.user', 'attachments']);

        return Inertia::render('Support::TicketDetail', [
            'ticket' => $ticket,
        ]);
    }

    /**
     * Update ticket
     */
    public function update(Request $request, SupportTicket $ticket)
    {
        $ticket->update($request->validated());

        return back()->with('success', 'Ticket updated successfully');
    }

    /**
     * Assign ticket to agent
     */
    public function assign(Request $request, SupportTicket $ticket)
    {
        $this->ticketService->assignTicket($ticket, $request->agent_id);

        return back()->with('success', 'Ticket assigned successfully');
    }

    /**
     * Add reply to ticket
     */
    public function reply(Request $request, SupportTicket $ticket)
    {
        $this->ticketService->addReply($ticket, $request->all());

        return back()->with('success', 'Reply added successfully');
    }

    /**
     * Close ticket
     */
    public function close(SupportTicket $ticket)
    {
        $this->ticketService->closeTicket($ticket);

        return back()->with('success', 'Ticket closed successfully');
    }

    /**
     * Delete ticket
     */
    public function destroy(SupportTicket $ticket)
    {
        $ticket->delete();

        return redirect()
            ->route('support.tickets.index')
            ->with('success', 'Ticket deleted successfully');
    }
}
```

---

## Step 8: Create Frontend Integration

### resources/js/Pages/TicketList.jsx

```jsx
import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Card, CardBody, CardHeader, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Button, Input, Select, SelectItem } from '@heroui/react';
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';

export default function TicketList({ tickets, filters }) {
    const [search, setSearch] = useState(filters.search || '');

    const statusColorMap = {
        open: 'primary',
        in_progress: 'warning',
        pending: 'default',
        resolved: 'success',
        closed: 'danger',
    };

    const priorityColorMap = {
        low: 'success',
        medium: 'warning',
        high: 'danger',
        urgent: 'danger',
    };

    const handleSearch = (value) => {
        setSearch(value);
        router.get(route('support.tickets.index'), { search: value }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Support Tickets" />
            
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">Support Tickets</h1>
                        <p className="text-default-500">Manage customer support requests</p>
                    </div>
                    <Link href={route('support.tickets.create')}>
                        <Button color="primary" startContent={<PlusIcon className="w-5 h-5" />}>
                            Create Ticket
                        </Button>
                    </Link>
                </div>

                {/* Filters */}
                <Card>
                    <CardBody>
                        <div className="flex gap-4">
                            <Input
                                placeholder="Search tickets..."
                                value={search}
                                onValueChange={handleSearch}
                                startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
                                className="max-w-xs"
                            />
                            <Select
                                placeholder="Status"
                                selectedKeys={filters.status ? [filters.status] : []}
                                className="max-w-xs"
                            >
                                <SelectItem key="open">Open</SelectItem>
                                <SelectItem key="in_progress">In Progress</SelectItem>
                                <SelectItem key="pending">Pending</SelectItem>
                                <SelectItem key="resolved">Resolved</SelectItem>
                                <SelectItem key="closed">Closed</SelectItem>
                            </Select>
                            <Select
                                placeholder="Priority"
                                selectedKeys={filters.priority ? [filters.priority] : []}
                                className="max-w-xs"
                            >
                                <SelectItem key="low">Low</SelectItem>
                                <SelectItem key="medium">Medium</SelectItem>
                                <SelectItem key="high">High</SelectItem>
                                <SelectItem key="urgent">Urgent</SelectItem>
                            </Select>
                        </div>
                    </CardBody>
                </Card>

                {/* Tickets Table */}
                <Card>
                    <Table aria-label="Support tickets">
                        <TableHeader>
                            <TableColumn>TICKET #</TableColumn>
                            <TableColumn>SUBJECT</TableColumn>
                            <TableColumn>CUSTOMER</TableColumn>
                            <TableColumn>STATUS</TableColumn>
                            <TableColumn>PRIORITY</TableColumn>
                            <TableColumn>ASSIGNED TO</TableColumn>
                            <TableColumn>CREATED</TableColumn>
                        </TableHeader>
                        <TableBody>
                            {tickets.data.map((ticket) => (
                                <TableRow key={ticket.id}>
                                    <TableCell>
                                        <Link href={route('support.tickets.show', ticket.id)} className="text-primary">
                                            {ticket.ticket_number}
                                        </Link>
                                    </TableCell>
                                    <TableCell>{ticket.subject}</TableCell>
                                    <TableCell>{ticket.customer?.name}</TableCell>
                                    <TableCell>
                                        <Chip color={statusColorMap[ticket.status]} size="sm">
                                            {ticket.status}
                                        </Chip>
                                    </TableCell>
                                    <TableCell>
                                        <Chip color={priorityColorMap[ticket.priority]} size="sm">
                                            {ticket.priority}
                                        </Chip>
                                    </TableCell>
                                    <TableCell>{ticket.assigned_agent?.name || 'Unassigned'}</TableCell>
                                    <TableCell>{new Date(ticket.created_at).toLocaleDateString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            </div>
        </>
    );
}
```

---

## Step 9: Install in Main Platform

### 9.1 Update Main Platform composer.json

```json
{
    "repositories": [
        {
            "type": "path",
            "url": "../aero-support-module"
        }
    ],
    "require": {
        "aero/support-module": "@dev"
    }
}
```

### 9.2 Install Package

```bash
cd /path/to/Aero-Enterprise-Suite-Saas

# Install package
composer require aero/support-module

# Publish assets
php artisan vendor:publish --tag=support-assets

# Publish config (optional)
php artisan vendor:publish --tag=support-config

# Run migrations
php artisan migrate
```

### 9.3 Update Vite Config

```javascript
// vite.config.js
export default defineConfig({
    plugins: [
        laravel({
            input: [
                'resources/js/app.jsx',
                'resources/js/Modules/Support/index.jsx', // Add module entry
            ],
            refresh: true,
        }),
        react(),
    ],
    resolve: {
        alias: {
            '@support': '/resources/js/Modules/Support',
        },
    },
});
```

### 9.4 Register in Module Config

```php
// config/modules.php - Add to external_packages
'external_packages' => [
    'support' => [
        'package' => 'aero/support-module',
        'enabled' => true,
        'version' => '^1.0',
        'provider' => 'Aero\\Support\\Providers\\SupportServiceProvider',
    ],
],
```

---

## Step 10: Testing

### 10.1 Create Tests

```php
<?php

namespace Aero\Support\Tests\Feature;

use Tests\TestCase;
use Aero\Support\Models\SupportTicket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class TicketTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_create_ticket()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post(route('support.tickets.store'), [
            'subject' => 'Test Ticket',
            'description' => 'This is a test ticket',
            'priority' => 'medium',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('support_tickets', [
            'subject' => 'Test Ticket',
        ]);
    }

    public function test_user_can_view_tickets()
    {
        $user = User::factory()->create();
        SupportTicket::factory()->count(5)->create();

        $response = $this->actingAs($user)->get(route('support.tickets.index'));

        $response->assertStatus(200);
    }
}
```

### 10.2 Run Tests

```bash
# In module repository
composer test

# In main platform
php artisan test --filter=Support
```

---

## Step 11: Documentation

Create comprehensive documentation in the module repository:

- `README.md` - Installation and usage
- `CHANGELOG.md` - Version history
- `docs/API.md` - API endpoints documentation
- `docs/INTEGRATION.md` - Integration guide for main platform

---

## Conclusion

This example demonstrates a complete module extraction from the monolithic application to a separate package. The Support module now:

✅ Lives in its own repository  
✅ Has independent versioning  
✅ Can be developed and tested independently  
✅ Integrates seamlessly with the main platform  
✅ Maintains multi-tenancy  
✅ Preserves all functionality  

The same process can be repeated for other modules like HRM, CRM, DMS, etc.
