<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Support & Ticketing Routes (Tenant Context)
|--------------------------------------------------------------------------
|
| Routes for tenant-level support and ticketing functionality.
| Access controlled via module middleware matching config/modules.php hierarchy.
|
| Module: support
| Submodules: ticket-management, department-agent, routing-sla, knowledge-base,
|             canned-responses, support-analytics, customer-feedback,
|             multi-channel, support-admin-tools
|
*/

Route::middleware(['auth', 'verified'])->prefix('support')->name('support.')->group(function () {

    // =========================================================================
    // 11.1 TICKET MANAGEMENT
    // Access: support.ticket-management
    // =========================================================================
    Route::middleware(['module:support,ticket-management'])->prefix('tickets')->name('tickets.')->group(function () {
        Route::get('/', function () {
            return Inertia::render('Tenant/Pages/Support/Tickets/Index');
        })->name('index');

        Route::get('/my', function () {
            return Inertia::render('Tenant/Pages/Support/Tickets/MyTickets');
        })->middleware(['module:support,ticket-management,my-tickets,view'])->name('my');

        Route::get('/assigned', function () {
            return Inertia::render('Tenant/Pages/Support/Tickets/AssignedTickets');
        })->middleware(['module:support,ticket-management,assigned-tickets,view'])->name('assigned');

        Route::get('/sla-violations', function () {
            return Inertia::render('Tenant/Pages/Support/Tickets/SlaViolations');
        })->middleware(['module:support,ticket-management,sla-violations,view'])->name('sla-violations');

        Route::get('/categories', function () {
            return Inertia::render('Tenant/Pages/Support/Tickets/Categories');
        })->middleware(['module:support,ticket-management,ticket-categories,view'])->name('categories');

        Route::get('/priorities', function () {
            return Inertia::render('Tenant/Pages/Support/Tickets/Priorities');
        })->middleware(['module:support,ticket-management,ticket-priorities,view'])->name('priorities');

        Route::get('/{ticket}', function ($ticket) {
            return Inertia::render('Tenant/Pages/Support/Tickets/Show', ['ticketId' => $ticket]);
        })->middleware(['module:support,ticket-management,ticket-detail,view'])->name('show');
    });

    // =========================================================================
    // 11.2 DEPARTMENT & AGENT MANAGEMENT
    // Access: support.department-agent
    // =========================================================================
    Route::middleware(['module:support,department-agent'])->group(function () {
        Route::prefix('departments')->name('departments.')->group(function () {
            Route::get('/', function () {
                return Inertia::render('Tenant/Pages/Support/Departments/Index');
            })->middleware(['module:support,department-agent,departments,view'])->name('index');
        });

        Route::prefix('agents')->name('agents.')->group(function () {
            Route::get('/', function () {
                return Inertia::render('Tenant/Pages/Support/Agents/Index');
            })->middleware(['module:support,department-agent,agents,view'])->name('index');
        });

        Route::prefix('agent-roles')->name('agent-roles.')->group(function () {
            Route::get('/', function () {
                return Inertia::render('Tenant/Pages/Support/AgentRoles/Index');
            })->middleware(['module:support,department-agent,agent-roles,view'])->name('index');
        });

        Route::prefix('schedules')->name('schedules.')->group(function () {
            Route::get('/', function () {
                return Inertia::render('Tenant/Pages/Support/Schedules/Index');
            })->middleware(['module:support,department-agent,schedules,view'])->name('index');
        });

        Route::prefix('auto-assign')->name('auto-assign.')->group(function () {
            Route::get('/', function () {
                return Inertia::render('Tenant/Pages/Support/AutoAssign/Index');
            })->middleware(['module:support,department-agent,auto-assign,view'])->name('index');
        });
    });

    // =========================================================================
    // 11.3 ROUTING & SLA
    // Access: support.routing-sla
    // =========================================================================
    Route::middleware(['module:support,routing-sla'])->prefix('sla')->name('sla.')->group(function () {
        Route::get('/policies', function () {
            return Inertia::render('Tenant/Pages/Support/Sla/Policies');
        })->middleware(['module:support,routing-sla,sla-policies,view'])->name('policies');

        Route::get('/routing', function () {
            return Inertia::render('Tenant/Pages/Support/Sla/Routing');
        })->middleware(['module:support,routing-sla,routing-rules,view'])->name('routing');

        Route::get('/escalation', function () {
            return Inertia::render('Tenant/Pages/Support/Sla/Escalation');
        })->middleware(['module:support,routing-sla,escalation-rules,view'])->name('escalation');
    });

    // =========================================================================
    // 11.4 KNOWLEDGE BASE
    // Access: support.knowledge-base
    // =========================================================================
    Route::middleware(['module:support,knowledge-base'])->prefix('kb')->name('kb.')->group(function () {
        Route::get('/categories', function () {
            return Inertia::render('Tenant/Pages/Support/Kb/Categories');
        })->middleware(['module:support,knowledge-base,kb-categories,view'])->name('categories');

        Route::get('/articles', function () {
            return Inertia::render('Tenant/Pages/Support/Kb/Articles');
        })->middleware(['module:support,knowledge-base,kb-articles,view'])->name('articles');

        Route::get('/templates', function () {
            return Inertia::render('Tenant/Pages/Support/Kb/Templates');
        })->middleware(['module:support,knowledge-base,article-templates,view'])->name('templates');

        Route::get('/analytics', function () {
            return Inertia::render('Tenant/Pages/Support/Kb/Analytics');
        })->middleware(['module:support,knowledge-base,article-analytics,view'])->name('analytics');
    });

    // =========================================================================
    // 11.5 CANNED RESPONSES
    // Access: support.canned-responses
    // =========================================================================
    Route::middleware(['module:support,canned-responses'])->prefix('canned')->name('canned.')->group(function () {
        Route::get('/templates', function () {
            return Inertia::render('Tenant/Pages/Support/Canned/Templates');
        })->middleware(['module:support,canned-responses,response-templates,view'])->name('templates');

        Route::get('/categories', function () {
            return Inertia::render('Tenant/Pages/Support/Canned/Categories');
        })->middleware(['module:support,canned-responses,macro-categories,view'])->name('categories');
    });

    // =========================================================================
    // 11.6 REPORTING & ANALYTICS
    // Access: support.support-analytics
    // =========================================================================
    Route::middleware(['module:support,support-analytics'])->prefix('analytics')->name('analytics.')->group(function () {
        Route::get('/volume', function () {
            return Inertia::render('Tenant/Pages/Support/Analytics/Volume');
        })->middleware(['module:support,support-analytics,ticket-volume,view'])->name('volume');

        Route::get('/agents', function () {
            return Inertia::render('Tenant/Pages/Support/Analytics/Agents');
        })->middleware(['module:support,support-analytics,agent-performance,view'])->name('agents');

        Route::get('/sla', function () {
            return Inertia::render('Tenant/Pages/Support/Analytics/Sla');
        })->middleware(['module:support,support-analytics,sla-compliance,view'])->name('sla');

        Route::get('/csat', function () {
            return Inertia::render('Tenant/Pages/Support/Analytics/Csat');
        })->middleware(['module:support,support-analytics,csat-reports,view'])->name('csat');
    });

    // =========================================================================
    // 11.7 CUSTOMER FEEDBACK
    // Access: support.customer-feedback
    // =========================================================================
    Route::middleware(['module:support,customer-feedback'])->prefix('feedback')->name('feedback.')->group(function () {
        Route::get('/ratings', function () {
            return Inertia::render('Tenant/Pages/Support/Feedback/Ratings');
        })->middleware(['module:support,customer-feedback,csat-ratings,view'])->name('ratings');

        Route::get('/forms', function () {
            return Inertia::render('Tenant/Pages/Support/Feedback/Forms');
        })->middleware(['module:support,customer-feedback,feedback-forms,view'])->name('forms');

        Route::get('/logs', function () {
            return Inertia::render('Tenant/Pages/Support/Feedback/Logs');
        })->middleware(['module:support,customer-feedback,satisfaction-logs,view'])->name('logs');
    });

    // =========================================================================
    // 11.8 MULTI-CHANNEL SUPPORT
    // Access: support.multi-channel
    // =========================================================================
    Route::middleware(['module:support,multi-channel'])->prefix('channels')->name('channels.')->group(function () {
        Route::get('/email', function () {
            return Inertia::render('Tenant/Pages/Support/Channels/Email');
        })->middleware(['module:support,multi-channel,email-channel,view'])->name('email');

        Route::get('/chat', function () {
            return Inertia::render('Tenant/Pages/Support/Channels/Chat');
        })->middleware(['module:support,multi-channel,chat-widget,view'])->name('chat');

        Route::get('/whatsapp', function () {
            return Inertia::render('Tenant/Pages/Support/Channels/Whatsapp');
        })->middleware(['module:support,multi-channel,whatsapp-channel,view'])->name('whatsapp');

        Route::get('/sms', function () {
            return Inertia::render('Tenant/Pages/Support/Channels/Sms');
        })->middleware(['module:support,multi-channel,sms-channel,view'])->name('sms');

        Route::get('/logs', function () {
            return Inertia::render('Tenant/Pages/Support/Channels/Logs');
        })->middleware(['module:support,multi-channel,channel-logs,view'])->name('logs');
    });

    // =========================================================================
    // 11.9 ADMIN TOOLS
    // Access: support.support-admin-tools
    // =========================================================================
    Route::middleware(['module:support,support-admin-tools'])->prefix('tools')->name('tools.')->group(function () {
        Route::get('/tags', function () {
            return Inertia::render('Tenant/Pages/Support/Tools/Tags');
        })->middleware(['module:support,support-admin-tools,ticket-tags,view'])->name('tags');

        Route::get('/fields', function () {
            return Inertia::render('Tenant/Pages/Support/Tools/Fields');
        })->middleware(['module:support,support-admin-tools,custom-fields,view'])->name('fields');

        Route::get('/forms', function () {
            return Inertia::render('Tenant/Pages/Support/Tools/Forms');
        })->middleware(['module:support,support-admin-tools,ticket-forms,view'])->name('forms');
    });
});
