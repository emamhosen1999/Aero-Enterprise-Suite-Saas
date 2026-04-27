# Aero UI - Dynamic Theme Engine

A React component library with a fully dynamic, zero-leakage styling engine for multi-tenant SaaS interfaces.

## Features

- **Dynamic Theme Configuration**: JSON-schema based theme configuration that's serializable and persisted
- **Zero-Leakage Styling**: Page-level development requires no custom CSS
- **ThemeDrawer**: Advanced UI controls for manipulating global theme state
- **Polymorphic Components**: Components intelligently fall back to global configuration
- **Layout Shells**: Dynamic layout switching without losing page state
- **Performance Optimized**: CSS variables updated directly, avoiding React re-renders

## Installation

### Composer Package

This is a Laravel package. Install via Composer:

```bash
composer require aero/ui
```

### Frontend Dependencies

```bash
npm install @aero/ui
```

## Laravel Integration

### 1. Publish Assets (Optional)

```bash
php artisan vendor:publish --provider="Aero\Ui\AeroUIServiceProvider"
```

### 2. Vite Configuration

Use the provided vite.config.js.stub or ensure your vite.config.js includes:

```javascript
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: [
                'vendor/aero/ui/resources/css/app.css',
                'vendor/aero/ui/resources/js/app.jsx',
            ],
            refresh: [
                'vendor/aero/ui/resources/js/**/*.{js,jsx}',
                'vendor/aero/ui/resources/css/**/*.css',
            ],
        }),
        react(),
    ],
    resolve: {
        alias: {
            '@': 'vendor/aero/ui/resources/js',
        },
    },
});
```

### 3. Blade Template

Update your `app.blade.php` to load the Aero UI:

```blade
<!DOCTYPE html>
<html>
<head>
    <!-- ... existing meta tags ... -->
    @viteReactRefresh
    @vite(['vendor/aero/ui/resources/css/app.css', 'vendor/aero/ui/resources/js/app.jsx'])
</head>
<body>
    @inertia
</body>
</html>
```

## Usage

### Basic Setup

```jsx
// In your Inertia page or component
import { ThemeProvider, ThemeDrawer, Card, Button, AppShell } from '@aero/ui';

export default function Dashboard() {
    return (
        <ThemeProvider>
            <div className="aeos">
                <AppShell
                    sidebar={<ThemeDrawer />}
                    header={<YourHeader />}
                >
                    <Card>
                        <h1>Welcome to Aero UI</h1>
                        <Button>Click me</Button>
                    </Card>
                </AppShell>
            </div>
        </ThemeProvider>
    );
}
```

### Using Demo Pages

The package includes demo pages for testing:

```jsx
// Use the demo page to test the theme system
import Demo from '@aero/ui/Pages/Demo';

// Or use the basic app wrapper
import App from '@aero/ui/Pages/App';
```

### Advanced Configuration

```jsx
<ThemeProvider
    initialConfig={{
        colorMode: 'dark-warm',
        density: 'comfortable',
        componentVariants: {
            card: 'glass',
            button: 'soft'
        }
    }}
    persistKey="my-app-theme"
>
    {/* Your app */}
</ThemeProvider>
```

## Quick Start

```jsx
import { ThemeProvider, ThemeDrawer, Card, Button } from '@aero/ui';
import '@aero/ui/theme/aeos.css'; // Required: Load the Aeos design system CSS
import '@aero/ui/theme/theme-drawer.css'; // Optional: For ThemeDrawer styles

function App() {
  return (
    <ThemeProvider>
      <div className="aeos"> {/* Required: aeos class on root */}
        <ThemeDrawer />
        <main>
          <Card>
            <h1>Welcome to Aero UI</h1>
            <Button>Click me</Button>
          </Card>
        </main>
      </div>
    </ThemeProvider>
  );
}
```

## Theme Configuration

The theme system is controlled by a global configuration object:

```javascript
{
  colorMode: 'dark', // 'dark' | 'dark-warm' | 'dark-cool' | 'light' | 'light-warm' | 'light-cool'
  componentVariants: {
    card: 'default', // 'default' | 'glass' | 'outlined' | 'elevated' | 'bento'
    button: 'default',
    input: 'default',
    badge: 'default'
  },
  density: 'comfortable', // 'compact' | 'comfortable' | 'spacious'
  typographyScale: 'medium', // 'small' | 'medium' | 'large'
  layoutShell: 'sidebar-collapse', // 'top-nav' | 'sidebar-collapse' | 'dual-panel'
  customOverrides: {} // Additional CSS variables
}
```

## Components

### ThemeProvider

Wraps your app and provides theme context.

```jsx
<ThemeProvider initialConfig={{ colorMode: 'light' }} persistKey="my-app-theme">
  <App />
</ThemeProvider>
```

### ThemeDrawer

Advanced controls for theme manipulation.

```jsx
<ThemeDrawer />
```

### Components with Global Variants

All components respect the global theme configuration:

```jsx
// Uses global card variant
<Card>Content</Card>

// Override with prop
<Card variant="glass">Content</Card>
```

Available components:
- `Card` - Container with variant styles
- `Button` - Interactive button
- `Input` - Form input field
- `Badge` - Status indicator

### AppShell

Dynamic layout container:

```jsx
<AppShell
  header={<Header />}
  sidebar={<Sidebar />}
>
  <MainContent />
</AppShell>
```

## CSS Architecture

The system uses CSS custom properties (variables) mapped from JavaScript configuration:

- **Color Modes**: Applied via body class changes (`.aeos`, `.aeos--light`, etc.)
- **Dynamic Variables**: Spacing, typography, and component styles updated via `--aeos-*` variables
- **Performance**: Direct DOM manipulation avoids React re-renders

## Zero-Leakage Rule

- No custom CSS required at the page/component level
- All styling controlled by global theme configuration
- Components provide sensible defaults and respect global settings
- New themes/configurations added via JSON without code changes

## Persistence

Theme configuration is automatically persisted to localStorage and restored on app load. Customize the persistence key:

```jsx
<ThemeProvider persistKey="my-custom-key">
```

## Extending the System

Add new themes or configurations by updating the schema and utilities. The system is designed to be evolvable without modifying component logic.