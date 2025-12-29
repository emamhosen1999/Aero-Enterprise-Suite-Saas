# Enterprise Navigation System - Design Wireframe

## Overview
A modern, responsive, 3D-styled navigation system for the Aero Enterprise Suite SaaS platform.
Supports infinite nested menus, all screen sizes, and provides excellent UX for enterprise users.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         NAVIGATION SYSTEM                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐    ┌────────────────────────────────────────────────┐ │
│  │   Sidebar        │    │              Header                            │ │
│  │   (Desktop)      │    │                                                │ │
│  │                  │    │  ┌─────┬──────────────────┬──────────────────┐ │ │
│  │  ┌────────────┐  │    │  │Logo │   Main Menu      │  Actions Section │ │ │
│  │  │ Branding   │  │    │  │     │   (Horizontal)   │  (Search,Notif,  │ │ │
│  │  │ Header     │  │    │  │     │                  │   Profile)       │ │ │
│  │  └────────────┘  │    │  └─────┴──────────────────┴──────────────────┘ │ │
│  │                  │    │                                                │ │
│  │  ┌────────────┐  │    └────────────────────────────────────────────────┘ │
│  │  │ Search     │  │                                                       │
│  │  └────────────┘  │    ┌────────────────────────────────────────────────┐ │
│  │                  │    │              Mobile Navigation                 │ │
│  │  ┌────────────┐  │    │                                                │ │
│  │  │ Navigation │  │    │  ┌──────────────────────────────────────────┐ │ │
│  │  │ Groups     │◄──────│  │  Slide-out Drawer (Full Height)          │ │ │
│  │  │ (Scrollable)│ │    │  │  - Same structure as Desktop Sidebar     │ │ │
│  │  │            │  │    │  │  - Touch-optimized interactions          │ │ │
│  │  └────────────┘  │    │  └──────────────────────────────────────────┘ │ │
│  │                  │    └────────────────────────────────────────────────┘ │
│  │  ┌────────────┐  │                                                       │
│  │  │ Footer     │  │                                                       │
│  │  │ (User/     │  │                                                       │
│  │  │  Status)   │  │                                                       │
│  │  └────────────┘  │                                                       │
│  │                  │                                                       │
│  └──────────────────┘                                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Structure

### 1. Sidebar Component (Desktop)
```
Width: 280px (expanded) / 72px (collapsed/icon mode)

┌──────────────────────────────────────────┐
│ ╔══════════════════════════════════════╗ │  ◄── Branding Header (Sticky)
│ ║  [Logo]  Company Name                ║ │      Height: 64px
│ ║         Tenant: {tenant_name}        ║ │      3D floating effect
│ ╚══════════════════════════════════════╝ │
├──────────────────────────────────────────┤
│ ┌────────────────────────────────────────┐│  ◄── Search Bar
│ │ 🔍 Search menus...             [⌘K]  ││      Collapsible in icon mode
│ └────────────────────────────────────────┘│
├──────────────────────────────────────────┤
│                                          │  ◄── Navigation Content (Scrollable)
│  ┌────────────────────────────────────┐  │
│  │ MAIN NAVIGATION                   │  │      ◄── Group Label
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │      ◄── Menu Item (Level 0)
│  │ 📊 Dashboard                      │  │      Height: 44px
│  └────────────────────────────────────┘  │      Hover: 3D lift effect
│                                          │
│  ┌────────────────────────────────────┐  │      ◄── Menu Item with Submenu
│  │ 👥 Human Resources           ▼  [3]│  │      Shows count badge
│  ├────────────────────────────────────┤  │
│  │  │                                 │  │      ◄── Submenu Container
│  │  ├─ 📋 Employees                   │  │      Level 1 (indent: 16px)
│  │  │   ├─ All Employees              │  │      Level 2 (indent: 32px)
│  │  │   ├─ Add Employee               │  │      Level 3+ (indent: 48px max)
│  │  │   └─ Departments                │  │
│  │  │       ├─ View All               │  │      ◄── Infinite nesting
│  │  │       └─ Add Department         │  │
│  │  ├─ 📅 Leaves                      │  │
│  │  └─ ⏰ Attendance                  │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ SETTINGS                          │  │      ◄── Settings Group
│  └────────────────────────────────────┘  │
│  ┌────────────────────────────────────┐  │
│  │ ⚙️ System Settings            ▼   │  │
│  └────────────────────────────────────┘  │
│                                          │
├──────────────────────────────────────────┤
│ ╔══════════════════════════════════════╗ │  ◄── Footer (Sticky)
│ ║  [Avatar] User Name                  ║ │      Height: 72px
│ ║          Role • Online               ║ │      3D floating effect
│ ║  [Collapse] [Theme] [Logout]         ║ │      Quick actions
│ ╚══════════════════════════════════════╝ │
└──────────────────────────────────────────┘
```

### 2. Sidebar Collapsed (Icon Mode)
```
Width: 72px

┌──────────┐
│ [Logo]   │  ◄── Logo only
├──────────┤
│   🔍     │  ◄── Search icon
├──────────┤
│   📊     │  ◄── Dashboard icon
│   👥     │  ◄── HRM icon (expandable on hover)
│   💰     │  ◄── Finance icon
│   📦     │  ◄── Inventory icon
│   ...    │
├──────────┤
│ [Avatar] │  ◄── User avatar only
└──────────┘

Hover Behavior:
- Hovering expands a flyout panel to the right
- Flyout shows full menu with submenus
```

### 3. Header Component (Desktop)
```
Height: 64px

┌─────────────────────────────────────────────────────────────────────────────┐
│  ┌─────┐  ┌───────────────────────────────────────────┐  ┌────────────────┐ │
│  │ ☰   │  │  Dashboard │ HRM ▼ │ Finance ▼ │ ...    │  │ Actions        │ │
│  │Logo │  │  (visible items based on container width) │  │ 🔍 🌐 🔔 [👤] │ │
│  └─────┘  └───────────────────────────────────────────┘  └────────────────┘ │
│                                                                              │
│           ◄── Menu Container (flex-1, overflow handling) ──►                │
│                                                                              │
│  When overflow occurs:                                                       │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  Dashboard │ HRM ▼ │ Finance ▼ │ [More ▼]                              │ │
│  │                                     │                                   │ │
│  │                                     ├─ Inventory                        │ │
│  │                                     ├─ CRM                              │ │
│  │                                     └─ Settings                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4. Header Dropdown Menu (Submenu)
```
┌────────────────────────────────────┐
│ Human Resources                  ▼ │  ◄── Trigger Button
└────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│ ┌────────────────────────────────┐ │  ◄── Dropdown Panel
│ │ 📋 Employees               ▶  │ │      Min-width: 220px
│ ├────────────────────────────────┤ │      3D shadow effect
│ │ 📅 Leaves                      │ │
│ ├────────────────────────────────┤ │
│ │ ⏰ Attendance              ▶  │ │  ◄── Has nested submenu
│ ├────────────────────────────────┤ │
│ │ 📊 Reports                     │ │
│ └────────────────────────────────┘ │
└────────────────────────────────────┘
                              │
                              ▼
              ┌────────────────────────────────────┐
              │ ┌────────────────────────────────┐ │  ◄── Nested Panel
              │ │ 📋 All Employees               │ │      Positioned to right
              │ ├────────────────────────────────┤ │
              │ │ ➕ Add Employee                │ │
              │ ├────────────────────────────────┤ │
              │ │ 🏢 Departments             ▶  │ │  ◄── More nesting
              │ └────────────────────────────────┘ │
              └────────────────────────────────────┘
```

### 5. Mobile Header
```
Height: 56px

┌─────────────────────────────────────────────────────────────────┐
│  ┌─────┐                                           ┌──────────┐ │
│  │ ☰   │   Company Name                            │ 🔔 [👤]  │ │
│  └─────┘   (or Page Title)                         └──────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6. Mobile Sidebar (Drawer)
```
Width: 85vw (max 320px)
Full height slide-out from left

┌──────────────────────────────────────────┐
│ ╔══════════════════════════════════════╗ │
│ ║  [Logo]  Company Name           [✕]  ║ │  ◄── Header with close button
│ ╚══════════════════════════════════════╝ │
├──────────────────────────────────────────┤
│ ┌────────────────────────────────────────┐│
│ │ 🔍 Search menus...                   ││  ◄── Search (always visible)
│ └────────────────────────────────────────┘│
├──────────────────────────────────────────┤
│                                          │  ◄── Scrollable navigation
│  Touch-optimized menu items              │      Larger tap targets (48px)
│  Same structure as desktop               │      Accordion-style expansion
│                                          │
├──────────────────────────────────────────┤
│ ╔══════════════════════════════════════╗ │
│ ║  [Avatar] User Name                  ║ │  ◄── User info (sticky bottom)
│ ║  [Logout Button]                     ║ │
│ ╚══════════════════════════════════════╝ │
└──────────────────────────────────────────┘
```

---

## Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 640px | Mobile header + drawer sidebar |
| Tablet | 640px - 1024px | Collapsed sidebar (icon) + header |
| Desktop | 1024px - 1440px | Expanded sidebar OR header nav |
| Large | > 1440px | Full sidebar + header actions |

---

## 3D Styling Specifications

### Elevation Levels
```
Level 0 (Surface):     z: 0,   shadow: none
Level 1 (Raised):      z: 4,   shadow: sm
Level 2 (Elevated):    z: 8,   shadow: md, slight tilt
Level 3 (Floating):    z: 16,  shadow: lg, hover glow
Level 4 (Modal):       z: 24,  shadow: xl, backdrop
```

### 3D Transform Effects
```css
/* Idle state */
.menu-item {
  transform: perspective(1000px) rotateX(0deg) translateZ(0);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Hover state */
.menu-item:hover {
  transform: perspective(1000px) rotateX(-2deg) translateZ(8px) translateY(-2px);
  box-shadow: 
    0 8px 25px -5px rgba(0,0,0,0.1),
    0 0 20px -10px var(--theme-primary);
}

/* Active state */
.menu-item.active {
  transform: perspective(1000px) translateZ(4px);
  box-shadow: 
    0 4px 15px -3px var(--theme-primary),
    inset 0 0 0 2px var(--theme-primary);
}

/* Pressed state */
.menu-item:active {
  transform: perspective(1000px) translateZ(2px) scale(0.98);
}
```

### Glow Effects
```css
/* Primary glow for active items */
.active-glow {
  box-shadow:
    0 0 10px var(--theme-primary),
    0 0 20px color-mix(in srgb, var(--theme-primary) 30%, transparent),
    0 0 40px color-mix(in srgb, var(--theme-primary) 10%, transparent);
}

/* Light beam animation */
@keyframes light-beam {
  0% { opacity: 0.3; transform: scaleX(0.8); }
  50% { opacity: 1; transform: scaleX(1); }
  100% { opacity: 0.3; transform: scaleX(0.8); }
}
```

---

## Interaction Patterns

### Menu Item States
| State | Visual | Animation |
|-------|--------|-----------|
| Default | Subtle background | None |
| Hover | Elevated, slight tilt | 200ms spring |
| Focus | Ring outline | Immediate |
| Active | Primary color bg, glow | 150ms ease |
| Pressed | Scale down, flatten | 100ms |
| Expanded | Highlighted, chevron rotated | 250ms |

### Submenu Expansion
```
1. Click parent menu item
2. Chevron rotates 90° (or 180° for vertical)
3. Submenu container animates in:
   - Height: 0 → auto (200ms ease-out)
   - Opacity: 0 → 1 (150ms)
   - Transform: rotateX(-10deg) → rotateX(0deg)
4. Child items stagger in (30ms delay each)
```

### Navigation Flow
```
User clicks menu item:
├─ Has submenu?
│   ├─ YES: Toggle submenu expansion
│   │        Update chevron rotation
│   │        Animate children in/out
│   │
│   └─ NO: Navigate to page
│          Set active state
│          Update URL
│          Close mobile drawer (if applicable)
```

---

## Accessibility Requirements

### Keyboard Navigation
- `Tab`: Move focus to next focusable element
- `Enter/Space`: Activate button / toggle submenu
- `Escape`: Close dropdown / submenu
- `Arrow Up/Down`: Navigate within menu
- `Arrow Right`: Expand submenu
- `Arrow Left`: Collapse submenu
- `Home/End`: Jump to first/last item

### ARIA Attributes
```jsx
// Menu container
<nav role="navigation" aria-label="Main navigation">

// Menu item with submenu
<button 
  aria-expanded={isOpen} 
  aria-controls="submenu-id"
  aria-haspopup="true"
>

// Submenu container
<div 
  id="submenu-id" 
  role="menu" 
  aria-hidden={!isOpen}
>

// Active menu item
<a 
  aria-current="page"
  data-active="true"
>
```

### Screen Reader Announcements
- Announce menu expansion state changes
- Announce page navigation
- Announce loading states

---

## Component Files Structure

```
packages/aero-ui/resources/js/Layouts/
├── Navigation/
│   ├── index.js                    # Exports all components
│   ├── NavigationProvider.jsx      # Context for nav state
│   │
│   ├── Sidebar/
│   │   ├── Sidebar.jsx             # Main sidebar wrapper
│   │   ├── SidebarHeader.jsx       # Branding section
│   │   ├── SidebarContent.jsx      # Scrollable nav content
│   │   ├── SidebarFooter.jsx       # User section
│   │   ├── SidebarGroup.jsx        # Group container
│   │   ├── SidebarMenu.jsx         # Menu container
│   │   ├── SidebarMenuItem.jsx     # Individual menu item
│   │   ├── SidebarMenuSub.jsx      # Nested submenu
│   │   └── SidebarCollapsed.jsx    # Icon-only mode
│   │
│   ├── Header/
│   │   ├── Header.jsx              # Main header wrapper
│   │   ├── HeaderLogo.jsx          # Logo section
│   │   ├── HeaderNav.jsx           # Navigation section
│   │   ├── HeaderNavItem.jsx       # Individual nav item
│   │   ├── HeaderActions.jsx       # Right-side actions
│   │   ├── HeaderDropdown.jsx      # Dropdown menus
│   │   └── HeaderOverflow.jsx      # "More" menu for overflow
│   │
│   ├── Mobile/
│   │   ├── MobileHeader.jsx        # Mobile-specific header
│   │   ├── MobileDrawer.jsx        # Slide-out drawer
│   │   └── MobileMenuItem.jsx      # Touch-optimized items
│   │
│   └── shared/
│       ├── MenuItem3D.jsx          # 3D styled menu item
│       ├── NestedMenu.jsx          # Recursive menu renderer
│       ├── SearchBar.jsx           # Search component
│       ├── navigationUtils.js      # Helper functions
│       └── useNavigation.js        # Custom hooks
```

---

## Implementation Priority

### Phase 1: Core Structure
1. NavigationProvider (context)
2. Basic Sidebar with groups
3. Basic Header with navigation
4. Mobile drawer

### Phase 2: Nested Menus
1. Recursive menu rendering
2. Submenu expansion/collapse
3. Infinite nesting support
4. Active state detection

### Phase 3: 3D Styling
1. Hover effects
2. Active states with glow
3. Transition animations
4. Light beam effects

### Phase 4: Responsive Polish
1. Overflow handling in header
2. Icon mode for sidebar
3. Touch optimizations
4. Smooth breakpoint transitions

### Phase 5: Accessibility
1. Keyboard navigation
2. ARIA attributes
3. Screen reader testing
4. Focus management

---

## Color Scheme (Theme-aware)

```css
:root {
  /* Surface colors */
  --nav-bg: var(--theme-content1);
  --nav-bg-hover: var(--theme-content2);
  --nav-bg-active: color-mix(in srgb, var(--theme-primary) 15%, transparent);
  
  /* Text colors */
  --nav-text: var(--theme-foreground);
  --nav-text-muted: var(--theme-foreground-500);
  --nav-text-active: var(--theme-primary);
  
  /* Border colors */
  --nav-border: var(--theme-divider);
  --nav-border-active: var(--theme-primary);
  
  /* Shadow colors */
  --nav-shadow: rgba(0, 0, 0, 0.1);
  --nav-glow: var(--theme-primary);
}

.dark {
  --nav-shadow: rgba(0, 0, 0, 0.3);
}
```

---

## Notes

1. **Performance**: Use React.memo() and useMemo() for menu items to prevent unnecessary re-renders
2. **State**: Persist sidebar open/collapsed state in localStorage
3. **Animation**: Use Framer Motion for smooth 3D transforms
4. **Icons**: Use Heroicons consistently (@heroicons/react/24/outline)
5. **Scrolling**: Use custom scrollbar styling that matches theme
