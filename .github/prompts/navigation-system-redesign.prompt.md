---
description: "Complete redesign of the navigation system: unified pipeline (config/module.php → frontend), next-gen UI/UX with AI features, remove all legacy code"
name: "Navigation System Redesign — Next-Gen"
argument-hint: "Redesign navigation: unified pipeline, advanced UI/UX, remove legacy"
agent: "AEOS Lead Architect"
---

# Navigation System Redesign — Unified Pipeline + Next-Gen UI/UX

## Objective

Redesign the **entire navigation architecture** from backend to frontend as a unified, single-source-of-truth system. Transform it into a next-generation navigation experience that has never existed before—powered by AI, dynamic context-awareness, personalization, and adaptive behavior. Eliminate all legacy/stale code and create one clean pipeline: **config/module.php → NavigationRegistry → Inertia → Frontend Components**.

**Key Mandate**: No legacy code. One pipeline. Advanced UX that evolves with user behavior.

---

## Current State Analysis

### Backend Pipeline (Fragmented)
- **config/module.php** (source): 4-level hierarchy (module → submodule → component → action) — *primary source*
- **NavigationRegistry** (`packages/aero-core/src/Services/NavigationRegistry.php`): Aggregates module navigation, builds dashboard, self-service, and module menus — *transformation layer*
- **HandleInertiaRequests** (`packages/aero-core/src/Http/Middleware/HandleInertiaRequests.php`): Passes navigation via Inertia props — *delivery layer*

### Frontend Pipeline (Multiple Entry Points / Legacy)
- **New Navigation System** (active, partial):
  - `NavigationProvider.jsx` + `Sidebar.jsx` + `Header.jsx` + `MenuItem3D.jsx` (3D styling, nested menus, responsive)
  - `useNavigation()` hook (consumes Inertia props)
  - `CommandPalette.jsx` (⌘K global search)
  - `BottomNav.jsx` (mobile-only navigation)
  - `navigationUtils.jsx` (helper functions)

- **Legacy Components** (stale, should be removed):
  - `DesktopSidebar.jsx`, `MobileSidebar.jsx` (old responsive sidebars)
  - `DesktopHeader.jsx`, `MobileHeader.jsx` (old header variants)
  - `App.old.jsx` (old app layout — full file needs removal)
  - `useLegacyPages()` hook in `Configs/navigationUtils.jsx` (hardcoded pages, not backend-driven)
  - `sidebarUtils.jsx` (old sidebar utilities)
  - Old `Breadcrumb.jsx` logic (finds pages by hardcoded names, not dynamic)
  - `ModuleAwareSidebar.jsx` in Components/Navigation/ (unused wrapper)
  - `TimeOffNavigation.jsx` (special-case nav, should be generalized)

- **Hybrid/Partially Used**:
  - `App.jsx` — currently wraps both new NavProvider AND old useLegacyPages, causing duplication

### Problems
1. **Two navigation sources**: Backend-driven (`props.navigation` from NavigationRegistry) AND hardcoded pages (`useLegacyPages`)
2. **Unused components clutter codebase**: 6+ desktop/mobile header/sidebar variants
3. **Inconsistent breadcrumbs**: Old logic searches pages by name; should use backend hierarchy
4. **No personalization**: Navigation is static per role; doesn't adapt to user behavior
5. **No context-awareness**: Can't surface contextual actions (quick approvals, pending tasks)
6. **No dynamic sections**: Can't show "AI-recommended pages", "trending actions", "your workspace"
7. **Command palette is lightweight**: Only fuzzy search + recent pages; no AI suggestions or smart actions
8. **Mobile nav fragmented**: Bottom nav hardcoded; should sync with sidebar
9. **No adaptive layout**: Can't reorder based on user habits, usage frequency, or module subscription state

---

## Design Goals (Next-Gen)

### 1. Single Unified Pipeline
**Flow**: `config/module.php` → `NavigationRegistry` → `Inertia props.navigation` → `Frontend Navigation Components`

- One source-of-truth: backend config drives frontend entirely
- Zero hardcoded pages or menus in frontend
- NavigationRegistry as the only transformation point
- Frontend receives fully-prepared navigation tree with metadata

### 2. Next-Generation UI/UX
Transform navigation from "static menu list" to "intelligent command center":

#### 2.1 AI-Powered Command Palette (Enhanced)
- **Intelligent Search**: Semantic search (not just fuzzy), understands intent ("show me pending approvals" → finds leaves.approvals)
- **AI Suggestions**: Based on user behavior, time of day, pending tasks
- **Smart Actions**: Suggests workflows ("you have 5 pending leaves → approve/reject buttons inline")
- **Context-Aware**: Different suggestions in HRM vs Finance module
- **Recent + Pinned**: Both user's recent pages AND system-recommended shortcuts
- **Performance Indicators**: Show notification badges for items needing attention
- **Multi-Command Chaining**: "Go to HR > Leaves > Approvals > Filter by dept > Export" in one flow

#### 2.2 Adaptive Sidebar (Intelligent)
- **Smart Grouping**: Auto-reorder based on user's access level and frequently used modules
- **Usage-Based Sorting**: Most-used modules float to top; rarely used modules collapse into "More"
- **Contextual Quick Actions**: Show 3-4 most relevant actions for current module (e.g., on HR page → Add Employee, View Attendance, Approve Leaves)
- **AI-Suggested Workflows**: "Based on your activity, try Workforce Planning" when you open HR
- **Breadcrumb-Aware Menu**: Highlight current location + show quick-jump breadcrumbs
- **Personalization**: User can pin/unpin/reorder menu items (persisted in profile)
- **Subscription-Aware Collapse**: Modules user doesn't have access to → one-tap "Upgrade" action

#### 2.3 Unified Header Navigation
- **Module Bar**: Shows active module + related modules (quick-switch)
- **Global Quick Actions**: Search + Notifications + Theme + Profile (right-aligned)
- **Breadcrumb Trail**: Context-aware breadcrumbs that show full path + allow jumping
- **Action Indicators**: Badges for pending approvals, alerts, milestones

#### 2.4 Intelligent Mobile Navigation
- **Smart Bottom Nav**: Shows 4 most-used items for user (personalized, not hardcoded)
- **Smart Drawer**: Full menu accessible via drawer with same smart sorting as desktop
- **One-Swipe Actions**: Swipe to toggle sidebar, swipe for quick actions
- **Gesture Navigation**: Back/forward swipe between related pages

#### 2.5 Breadcrumb System (Smart)
- **Dynamic Generation**: Built from backend hierarchy + current route
- **Clickable Jumps**: Each breadcrumb level is clickable to jump
- **Context Actions**: Right side of breadcrumb shows 2-3 quick actions for current page

### 3. Advanced Features (Never Done Before)
- **AI Learning**: Navigation learns from user clicks, time spent, approval patterns → personalized suggestions
- **Predictive Navigation**: "You usually go to Payroll after HR Dashboard" → suggest it
- **Team Context**: When impersonating/managing team, show their workspace navigation
- **Dashboard Integration**: Navigation adapts based on dashboard widgets you've pinned
- **Search Analytics**: System tracks what users search for → informs UX improvements
- **Role-Based Templates**: Different nav layouts for different roles (e.g., Manager vs HR Admin)
- **Keyboard-First**: All navigation actions available via keyboard shortcuts (Cmd+P, Cmd+1-9, Cmd+arrows)
- **Time-Based Navigation**: During payroll season, Payroll module floats to top
- **Notification-Driven**: Badges on nav items show pending work; clicking badge takes to items

---

## Implementation Scope

### PHASE 1: Unify Backend Pipeline

#### 1.1 Consolidate NavigationRegistry
**File**: `packages/aero-core/src/Services/NavigationRegistry.php` (consolidate + enhance)

Ensure NavigationRegistry is the **ONLY** place where navigation transformation happens:

```php
class NavigationRegistry
{
    /**
     * Enriched navigation for frontend with metadata
     * 
     * Each item includes:
     * - Core: name, icon, path/route, priority, access
     * - Smart: metadata for AI (category, searchKeywords, frequencyHint)
     * - Actions: related quick actions
     * - Badges: pending counts
     */
    public function toFrontend(
        ?string $scope = null,
        $user = null,
        ?array $subscribedModules = null,
        ?array $userMetadata = null // User behavior analytics
    ): array {
        // 1. Build dashboard navigation (single, multi, or none)
        // 2. Build self-service "My Workspace"
        // 3. Build module-specific navigation trees
        // 4. Enrich each item with AI metadata
        // 5. Sort by: priority, user preferences, usage analytics
        // 6. Add quick actions for each item
        // 7. Add badge counts (pending approvals, etc.)
        // 8. Return fully prepared tree ready for frontend rendering
    }

    /**
     * Get usage analytics from user behavior (for personalization)
     */
    public function getUserNavigationMetadata(User $user): array {
        // Track: most-clicked items, time spent, search queries
        // Return: personalization hints for frontend
    }

    /**
     * AI-powered suggestions based on current context
     */
    public function getContextAwareSuggestions(User $user, string $currentModule): array {
        // Based on user's role, current location, time of day, pending tasks
        // Return: 3-5 recommended navigation items or actions
    }
}
```

#### 1.2 Enhance HandleInertiaRequests
**File**: `packages/aero-core/src/Http/Middleware/HandleInertiaRequests.php`

Ensure it passes enriched navigation data:

```php
protected function getNavigation() {
    if (!app()->bound(NavigationRegistry::class)) {
        return [];
    }
    
    $registry = app(NavigationRegistry::class);
    $user = Auth::user();
    
    return $registry->toFrontend(
        scope: $this->getScope(),
        user: $user,
        subscribedModules: $this->getSubscribedModules(),
        userMetadata: $this->getUserBehaviorMetadata() // NEW: for personalization
    );
}

// NEW: Track navigation usage
protected function trackNavigationUsage($user, $path) {
    // Store in user_navigation_analytics table
}
```

#### 1.3 Create Navigation Analytics Table
**File**: `packages/aero-core/database/migrations/202X_create_user_navigation_analytics_table.php`

```php
Schema::create('user_navigation_analytics', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained();
    $table->string('navigation_path'); // e.g., 'hrm.employees'
    $table->string('action'); // click, hover, search
    $table->integer('duration_seconds')->nullable(); // time spent on page
    $table->integer('click_count')->default(1);
    $table->integer('frequency_this_week')->default(1);
    $table->timestamps();
    $table->index(['user_id', 'navigation_path']);
});
```

### PHASE 2: Remove All Legacy Frontend Code

#### 2.1 Delete Stale Components
**Files to DELETE entirely**:

| File | Reason |
|------|--------|
| `packages/aero-ui/resources/js/Layouts/DesktopSidebar.jsx` | Replaced by `Navigation/Sidebar.jsx` |
| `packages/aero-ui/resources/js/Layouts/MobileSidebar.jsx` | Replaced by `Navigation/Sidebar.jsx` (handles both) |
| `packages/aero-ui/resources/js/Layouts/DesktopHeader.jsx` | Replaced by `Navigation/Header.jsx` |
| `packages/aero-ui/resources/js/Layouts/MobileHeader.jsx` | Replaced by `Navigation/Header.jsx` |
| `packages/aero-ui/resources/js/Layouts/App.old.jsx` | Old app layout — fully replaced by `App.jsx` |
| `packages/aero-ui/resources/js/Layouts/sidebarUtils.jsx` | Functionality moved to `Navigation/navigationUtils.jsx` |
| `packages/aero-ui/resources/js/Components/Navigation/ModuleAwareSidebar.jsx` | Unused wrapper — consolidate into main Sidebar |
| `packages/aero-ui/resources/js/Components/Navigation/TimeOffNavigation.jsx` | Special case — generalize time-off as a module in config |

#### 2.2 Eliminate useLegacyPages Hook
**File**: `packages/aero-ui/resources/js/Configs/navigationUtils.jsx` (refactor)

- Remove `useLegacyPages()` entirely
- Remove hardcoded pages array
- Keep ONLY helper functions (`filterNavigationByAccess`, icon resolution, etc.)
- All page data comes from `props.navigation` (backend-driven)

#### 2.3 Update App.jsx to Remove Legacy
**File**: `packages/aero-ui/resources/js/Layouts/App.jsx`

- Remove: `const pages = useLegacyPages();` — this line completely
- Remove: All references to `pages` prop
- Remove: All conditional logic checking old pages structure
- Keep: New NavigationProvider wrapping, new Sidebar/Header components, CommandPalette

#### 2.4 Simplify Breadcrumb Logic
**File**: `packages/aero-ui/resources/js/Components/Common/Breadcrumb.jsx` (rewrite)

Old logic: Find pages by route name from hardcoded array
New logic: Build breadcrumbs from backend navigation hierarchy + current route:

```jsx
// Backend gives us:
// navigation[0].name = "HRM"
// navigation[0].children[0].name = "Employees"
// navigation[0].children[0].children[0].name = "List"
// Current route matches: hrm.employees.list

// Breadcrumb output: Home > HRM > Employees > List
// Each level clickable to jump to that page
```

### PHASE 3: Build Advanced Navigation Components

#### 3.1 Enhanced CommandPalette
**File**: `packages/aero-ui/resources/js/Components/Navigation/CommandPalette.jsx` (rewrite)

```jsx
/**
 * Command Palette — Intelligence Layer
 * 
 * Features:
 * - Semantic search (intent-aware, not just fuzzy)
 * - AI suggestions (based on user behavior, pending tasks, time)
 * - Smart actions (inline approvals, quick workflows)
 * - Keyboard shortcuts (Cmd+1 = Dashboard, Cmd+2 = Next module, etc.)
 * - Recent + Pinned + Suggested sections
 * - Badges for notifications
 */
const CommandPalette = ({ isOpen, onClose, navigation, userMetadata, aiSuggestions }) => {
  // 1. Flatten navigation tree with search keywords
  // 2. Semantic search: user query + user context → intent detection
  // 3. Show sections: Recent, Pinned, AI Suggestions, All Pages
  // 4. Each item shows: icon + name + breadcrumb + badge (if pending)
  // 5. Actions: hover → show quick actions (Approve, Go, etc.)
  // 6. Keyboard: Cmd+P to open, ↑↓ to navigate, Enter to select
  // 7. Smart filtering: Based on user's subscribed modules only
};
```

#### 3.2 Intelligent Sidebar
**File**: `packages/aero-ui/resources/js/Layouts/Navigation/Sidebar.jsx` (enhance)

```jsx
/**
 * Enhanced Sidebar — Smart Organization
 * 
 * Features:
 * - Auto-sort by user usage (most-used at top)
 * - Collapse rarely-used modules into "More"
 * - Show pending counts as badges
 * - Contextual quick actions on hover
 * - Pinnable/draggable items for personalization
 * - Breadcrumb-aware highlighting
 */
const Sidebar = ({ navigation, userMetadata, userPreferences }) => {
  // 1. Apply user preferences (pinned, custom order)
  // 2. Sort by: usage frequency, priority, subscription status
  // 3. Group: Main modules, Settings, Upgrade (unsubscribed)
  // 4. For each item: show badge count if pending
  // 5. On hover: show 3 quick actions (Add, View, Approve, etc.)
  // 6. Support drag-to-reorder for personalization
  // 7. Save user's sidebar layout to profile
};
```

#### 3.3 Adaptive Mobile Navigation
**File**: `packages/aero-ui/resources/js/Layouts/BottomNav.jsx` (rewrite)

```jsx
/**
 * Smart Mobile Navigation
 * 
 * Features:
 * - 4 personalized bottom nav items (based on user usage)
 * - Full menu accessible via swipe-up drawer
 * - Same smart sorting as desktop sidebar
 * - Quick action buttons on long-press
 * - Badge indicators
 */
const BottomNav = ({ navigation, userMetadata, userPreferences }) => {
  // 1. Select top 4 items for user (from usage analytics)
  // 2. Show as icon + label on bottom
  // 3. Drawer on swipe-up: full navigation + search
  // 4. Each item: long-press → show quick actions
  // 5. Sync with sidebar state (pinned items appear here)
};
```

#### 3.4 Context-Aware Header
**File**: `packages/aero-ui/resources/js/Layouts/Navigation/Header.jsx` (enhance)

```jsx
/**
 * Enhanced Header Navigation
 * 
 * Features:
 * - Module bar: active + related modules (quick switch)
 * - Breadcrumb trail: full path + jump capability
 * - Global actions: search, notifications, theme, profile
 * - Action indicators: badges for pending work
 */
const Header = ({ navigation, currentModule, breadcrumbs }) => {
  // 1. Show active module + highlight related modules nearby
  // 2. Breadcrumbs from backend hierarchy (clickable jump)
  // 3. Right side: Search + Notifications + Theme + Profile
  // 4. Show badge counts from backend (pending approvals, etc.)
};
```

### PHASE 4: Add Personalization System

#### 4.1 User Preferences Model
**File**: `packages/aero-core/src/Models/UserNavigationPreference.php` (new)

```php
class UserNavigationPreference extends Model
{
    protected $fillable = [
        'user_id',
        'sidebar_collapsed',
        'sidebar_custom_order', // JSON array of menu item IDs in preferred order
        'pinned_items', // JSON array of frequently used items
        'hidden_modules', // JSON array of modules to hide
        'mobile_bottom_nav_items', // JSON array of 4 selected items for mobile
        'theme_preference', // light, dark, auto
        'sidebar_width', // px
    ];
}

class UserNavigationAnalytic extends Model
{
    // Track user behavior for personalization
    protected $fillable = [
        'user_id',
        'navigation_path',
        'action', // click, search, hover
        'duration_seconds',
        'click_count',
        'frequency_this_week',
    ];
}
```

#### 4.2 Personalization Controller
**File**: `packages/aero-core/src/Http/Controllers/UserNavigationController.php` (new)

```php
class UserNavigationController extends Controller
{
    // PATCH /user/navigation/preferences — update sidebar order, pinned items, etc.
    public function updatePreferences(Request $request): JsonResponse
    {
        $user = Auth::user();
        $validated = $request->validate([
            'sidebar_custom_order' => 'array',
            'pinned_items' => 'array',
            'hidden_modules' => 'array',
            'mobile_bottom_nav_items' => 'array|size:4',
        ]);
        
        $user->navigationPreference()->updateOrCreate(
            ['user_id' => $user->id],
            $validated
        );
        
        return response()->json(['message' => 'Preferences saved']);
    }
    
    // GET /user/navigation/preferences
    public function getPreferences(): JsonResponse
    {
        return response()->json(
            Auth::user()->navigationPreference
        );
    }
    
    // POST /user/navigation/track — log navigation usage
    public function trackUsage(Request $request): JsonResponse
    {
        UserNavigationAnalytic::create([
            'user_id' => Auth::id(),
            'navigation_path' => $request->input('path'),
            'action' => $request->input('action'),
            'duration_seconds' => $request->input('duration'),
        ]);
        
        return response()->json(['success' => true]);
    }
}
```

### PHASE 5: AI Integration (Advanced)

#### 5.1 AI Suggestion Service
**File**: `packages/aero-core/src/Services/AINavigationSuggestionService.php` (new)

```php
class AINavigationSuggestionService
{
    /**
     * Get AI-powered navigation suggestions for user
     * Based on: role, behavior patterns, pending tasks, time of day, module context
     */
    public function getSuggestions(User $user, ?string $currentModule = null): array
    {
        // 1. Analyze user behavior (most clicked items, time spent, search patterns)
        // 2. Get pending tasks (leaves to approve, expenses to review, etc.)
        // 3. Detect patterns (user always visits Finance after HR, does payroll on Fridays)
        // 4. Time-based hints (payroll season → float Payroll to top)
        // 5. Role-based templates (Manager sees approvals, HR Admin sees analytics)
        // 6. Return: 3-5 contextual suggestions with reasoning
        
        return [
            ['path' => 'hrm.leaves.approvals', 'reason' => 'You have 5 pending leave approvals', 'badge' => 5],
            ['path' => 'finance.payroll', 'reason' => 'Payroll due this Friday', 'badge' => null],
            // ...
        ];
    }
    
    /**
     * Predict next navigation action (for proactive suggestions)
     */
    public function predictNextAction(User $user): ?array
    {
        // ML-powered prediction: based on user's click history, what will they do next?
        // E.g., after Dashboard → HRM → Employees, user usually goes to Attendance
        // Suggest: "Next, view attendance?"
    }
    
    /**
     * Semantic search intent detection
     */
    public function detectSearchIntent(string $query): array
    {
        // Parse user query semantically, not just keyword matching
        // E.g., "show me pending" → intent: SHOW_PENDING → returns all pending items across modules
        // E.g., "approve leaves" → intent: APPROVE → returns leaves.approvals page
    }
}
```

#### 5.2 Frontend AI Integration
**File**: `packages/aero-ui/resources/js/Hooks/useAINavigation.js` (new)

```javascript
/**
 * Hook for AI-powered navigation features
 */
export function useAINavigation() {
  const [suggestions, setSuggestions] = useState([]);
  const [prediction, setPrediction] = useState(null);
  
  // Fetch AI suggestions on component mount
  useEffect(() => {
    fetchSuggestions();
  }, []);
  
  const fetchSuggestions = async () => {
    const response = await axios.get('/api/navigation/ai-suggestions');
    setSuggestions(response.data);
  };
  
  const trackNavigationUsage = (path, action, duration) => {
    // Track user behavior for AI learning
    axios.post('/user/navigation/track', { path, action, duration });
  };
  
  return { suggestions, prediction, trackNavigationUsage };
}
```

### PHASE 6: Keyboard Shortcuts & Accessibility

#### 6.1 Keyboard Navigation System
**File**: `packages/aero-ui/resources/js/Hooks/useKeyboardNavigation.js` (new)

```javascript
/**
 * Keyboard-first navigation
 * 
 * Shortcuts:
 * - Cmd+P: Open command palette
 * - Cmd+1-9: Jump to numbered module (e.g., Cmd+1 = Dashboard, Cmd+2 = HRM, etc.)
 * - Cmd+Shift+D: Jump to dashboard
 * - Cmd+Shift+S: Focus search
 * - Cmd+Shift+C: Show command palette
 * - Cmd+← / Cmd+→: Back/forward navigation
 */
export function useKeyboardNavigation(navigation) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.metaKey || e.ctrlKey) {
        // Handle shortcuts
        if (e.key === 'p') {
          e.preventDefault();
          openCommandPalette();
        }
        if (e.key >= '1' && e.key <= '9') {
          e.preventDefault();
          const moduleIndex = parseInt(e.key) - 1;
          jumpToModule(navigation[moduleIndex]);
        }
        // ... more shortcuts
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigation]);
}
```

---

## Files to Create/Modify/Delete Summary

### DELETE (Stale Legacy Code)
```
packages/aero-ui/resources/js/Layouts/
  ✗ DesktopSidebar.jsx
  ✗ MobileSidebar.jsx
  ✗ DesktopHeader.jsx
  ✗ MobileHeader.jsx
  ✗ App.old.jsx
  ✗ sidebarUtils.jsx

packages/aero-ui/resources/js/Components/Navigation/
  ✗ ModuleAwareSidebar.jsx
  ✗ TimeOffNavigation.jsx
```

### MODIFY (Core Pipeline)
```
packages/aero-core/src/Services/
  ✓ NavigationRegistry.php — enhance toFrontend(), add AI methods
  ✓ Add AINavigationSuggestionService.php (new)

packages/aero-core/src/Http/Middleware/
  ✓ HandleInertiaRequests.php — pass userMetadata, track usage

packages/aero-core/src/Http/Controllers/
  ✓ Add UserNavigationController.php (new)

packages/aero-core/src/Models/
  ✓ Add UserNavigationPreference.php (new)
  ✓ Add UserNavigationAnalytic.php (new)

packages/aero-ui/resources/js/Layouts/
  ✓ App.jsx — remove useLegacyPages, simplify
  ✓ Navigation/Sidebar.jsx — enhance with personalization
  ✓ Navigation/Header.jsx — enhance with breadcrumbs, quick actions
  ✓ Navigation/CommandPalette.jsx — rewrite with AI
  ✓ BottomNav.jsx — rewrite with smart items

packages/aero-ui/resources/js/Components/
  ✓ Common/Breadcrumb.jsx — rewrite using backend hierarchy
  ✓ Navigation/CommandPalette.jsx — already listed above

packages/aero-ui/resources/js/Hooks/
  ✓ Add useAINavigation.js (new)
  ✓ Add useKeyboardNavigation.js (new)
  ✓ Add useNavigationPersonalization.js (new)

packages/aero-ui/resources/js/Configs/
  ✓ navigationUtils.jsx — remove useLegacyPages, keep helpers
```

### CREATE (New Infrastructure)
```
packages/aero-core/database/migrations/
  ✓ 202X_create_user_navigation_preferences_table.php
  ✓ 202X_create_user_navigation_analytics_table.php

packages/aero-core/routes/
  ✓ Add user navigation routes to api.php or web.php

packages/aero-ui/resources/js/Components/Navigation/
  ✓ AICommandPalette.jsx (enhanced command palette)
  ✓ SmartSidebar.jsx (personalization wrapper)
  ✓ ContextAwareHeader.jsx (breadcrumb + quick actions)

packages/aero-ui/resources/js/Hooks/
  ✓ useAINavigation.js
  ✓ useKeyboardNavigation.js
  ✓ useNavigationPersonalization.js
```

---

## Execution Checklist (Ordered by Dependency)

- [ ] **Phase 1: Backend Unification**
  - [ ] Enhance NavigationRegistry with enriched metadata methods
  - [ ] Create UserNavigationPreference + UserNavigationAnalytic models
  - [ ] Create database migrations for analytics tables
  - [ ] Enhance HandleInertiaRequests to pass userMetadata + track usage
  - [ ] Create UserNavigationController with preferences + tracking endpoints
  - [ ] Create AINavigationSuggestionService

- [ ] **Phase 2: Clean Frontend**
  - [ ] DELETE: DesktopSidebar.jsx, MobileSidebar.jsx, DesktopHeader.jsx, MobileHeader.jsx, App.old.jsx, sidebarUtils.jsx, ModuleAwareSidebar.jsx, TimeOffNavigation.jsx
  - [ ] MODIFY: App.jsx — remove useLegacyPages entirely
  - [ ] MODIFY: navigationUtils.jsx — remove useLegacyPages hook
  - [ ] Verify: No imports of deleted files remain

- [ ] **Phase 3: Advanced Components**
  - [ ] Enhance CommandPalette.jsx with semantic search, AI suggestions, smart actions
  - [ ] Enhance Sidebar.jsx with personalization, usage-based sorting, quick actions
  - [ ] Enhance BottomNav.jsx with smart item selection based on user behavior
  - [ ] Enhance Header.jsx with module bar, breadcrumbs, action indicators
  - [ ] REWRITE: Breadcrumb.jsx to use backend navigation hierarchy

- [ ] **Phase 4: Personalization Layer**
  - [ ] Create useNavigationPersonalization.js hook
  - [ ] Create SmartSidebar.jsx wrapper with personalization logic
  - [ ] Implement user preferences UI (settings page for sidebar customization)
  - [ ] Implement drag-to-reorder functionality

- [ ] **Phase 5: AI Integration**
  - [ ] Implement semantic search in command palette
  - [ ] Implement AI suggestion fetching in CommandPalette
  - [ ] Implement behavior tracking (POST /user/navigation/track)
  - [ ] Test: AI suggestions based on user role and pending tasks

- [ ] **Phase 6: Keyboard Shortcuts**
  - [ ] Create useKeyboardNavigation.js hook
  - [ ] Implement Cmd+P, Cmd+1-9, Cmd+Shift+D, etc.
  - [ ] Add keyboard shortcut help overlay (? key)
  - [ ] Test: All shortcuts work across browsers

- [ ] **Phase 7: Testing & Polish**
  - [ ] Write tests for NavigationRegistry enrichment
  - [ ] Write tests for UserNavigationController
  - [ ] Write tests for CommandPalette (semantic search, AI suggestions)
  - [ ] Write tests for Sidebar personalization
  - [ ] Test mobile responsiveness (bottom nav, drawer)
  - [ ] Test accessibility (keyboard navigation, screen readers)
  - [ ] Performance test: navigation load time with large menus

- [ ] **Phase 8: Documentation & Migration**
  - [ ] Document new navigation pipeline (backend → frontend)
  - [ ] Document AI feature capabilities
  - [ ] Create migration guide for modules (if any config changes needed)
  - [ ] Update copilot-instructions.md with new navigation patterns
  - [ ] Create tutorial: "How to add nav items to config/module.php"

- [ ] **Phase 9: Deployment**
  - [ ] Run migrations: user_navigation_preferences, user_navigation_analytics tables
  - [ ] Deploy backend changes (NavigationRegistry, controllers, models)
  - [ ] Deploy frontend changes (delete legacy, new components, hooks)
  - [ ] Clear frontend cache (npm run build)
  - [ ] Test in production-like environment
  - [ ] Monitor: user adoption, AI suggestion effectiveness, performance

---

## Success Criteria

✅ **Single Pipeline**: Backend config flows through NavigationRegistry → Inertia → Frontend (zero hardcoded menus)
✅ **Zero Legacy Code**: All old sidebar/header components deleted; useLegacyPages removed
✅ **Next-Gen UX**: AI suggestions, personalization, keyboard shortcuts, intelligent sorting
✅ **Fully Responsive**: Desktop, tablet, mobile all use same unified components
✅ **Accessible**: Keyboard navigation, screen reader compatible, WCAG compliant
✅ **Performant**: Navigation loads fast even with 100+ menu items; analytics don't slow down UI
✅ **Extensible**: Modules can enhance nav via config/module.php; no hardcoding needed

---

## Handoff

Execute this prompt with **AEOS Lead Architect** for backend + **AEOS Frontend Engineer** for UI components. Both agents should coordinate on the unified data structure flowing from backend → frontend.
