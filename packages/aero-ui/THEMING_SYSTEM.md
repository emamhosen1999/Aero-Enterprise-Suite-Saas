# Aero Enterprise Suite - Theming System

## Overview

The Aero Enterprise Suite uses a comprehensive theming system that automatically styles all HeroUI components, including Cards, without requiring manual styling in each component.

## Architecture

### 1. Global Card Styling (`resources/css/app.css`)

All HeroUI `Card` components are **automatically styled** through global CSS rules that target their distinctive class combinations:

```css
/* Automatically applies to all cards with these classes */
.bg-content1.rounded-large {
    background: linear-gradient(135deg, 
        var(--theme-content1, #FAFAFA) 0%, 
        var(--theme-content2, #F4F4F5) 50%, 
        var(--theme-content3, #E4E4E7) 100%);
    border: var(--borderWidth, 2px) solid transparent;
    border-radius: var(--borderRadius, 12px);
    font-family: var(--fontFamily, "Inter");
    transition: all 0.2s ease-in-out;
}
```

**Features:**
- ✅ Gradient backgrounds using CSS variables
- ✅ Dynamic border width and radius
- ✅ Custom font family support
- ✅ Smooth transitions
- ✅ Dark mode support (`.dark` variant)
- ✅ Hover effects with scale and shadow

### 2. Theme Configuration (`resources/js/theme/index.js`)

The theme system provides:

#### Available Themes
- **heroui** - Default clean theme (Inter font, 12px radius, 2px borders)
- **modern** - Vibrant gradient theme (Roboto font, 4px radius, 1px borders)
- **elegant** - Classic minimalist theme (Playfair Display, 0px radius, 3px borders)
- **coffee** - Warm brown tones (Poppins font, 20px radius, 4px borders)
- **emerald** - Green accent theme (default settings with emerald colors)

#### Theme Structure
```javascript
{
  name: 'Theme Name',
  layout: {
    fontFamily: 'Inter',
    borderRadius: '12px',
    borderWidth: '2px',
    scale: '100%',
    disabledOpacity: '0.5'
  },
  background: {
    type: 'color', // or 'image'
    color: '#ffffff' // or gradient/image URL
  },
  colors: {
    background: '#FFFFFF',
    foreground: '#11181C',
    divider: '#E4E4E7',
    content1: '#FFFFFF',
    content2: '#F4F4F5',
    content3: '#E4E4E7',
    content4: '#D4D4D8',
    // ... primary, secondary, success, warning, danger
  }
}
```

### 3. CSS Variables System

The theme is applied through CSS custom properties at the document root:

```javascript
// Applied by applyThemeToDocument() function
--theme-primary: #006FEE
--theme-secondary: #17C964
--theme-content1: #FFFFFF
--theme-content2: #F4F4F5
--theme-content3: #E4E4E7
--theme-divider: #E4E4E7
--borderRadius: 12px
--borderWidth: 2px
--fontFamily: Inter
--scale: 100%
```

## Usage

### ✅ Correct Usage - Use Plain HeroUI Cards

```jsx
import { Card, CardHeader, CardBody } from '@heroui/react';

export default function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <h2>Title</h2>
      </CardHeader>
      <CardBody>
        <p>Content automatically themed!</p>
      </CardBody>
    </Card>
  );
}
```

The card will **automatically** receive:
- Theme-appropriate gradient background
- Correct border radius and width
- Proper font family
- Dark mode styling (if enabled)
- Hover effects

### ❌ Incorrect Usage - Don't Use Manual Styling

```jsx
// ❌ DON'T DO THIS - Redundant and overrides global theme
<Card style={{
  background: 'linear-gradient(...)',
  borderRadius: '12px'
}}>
  ...
</Card>

// ❌ DON'T DO THIS - ThemedCard component doesn't exist
import { ThemedCard } from '@/Components/UI/ThemedCard';
<Card>...</Card>
```

### Custom Card Styling (When Needed)

If you need to override the default styling for a specific use case, use Tailwind classes or inline styles **sparingly**:

```jsx
// Override specific properties only when necessary
<Card className="bg-warning/10"> {/* Custom background for alert card */}
  <CardBody>
    <p>Warning message</p>
  </CardBody>
</Card>
```

## Theme Management

### Applying Themes

Themes are managed through the `ThemeContext` and `ThemeSettingDrawer` component:

```jsx
import { applyThemeToDocument } from '@/theme';

// Apply a theme
const theme = {
  mode: 'light', // or 'dark'
  activeTheme: 'heroui', // or 'modern', 'elegant', etc.
  layout: {
    fontFamily: 'Inter',
    borderRadius: '12px',
    borderWidth: '2px'
  }
};

applyThemeToDocument(theme);
```

### Dark Mode

Dark mode is automatically handled:

```javascript
// Dark mode colors are automatically applied
const darkModeColors = {
  background: '#000000',
  foreground: '#ECEDEE',
  content1: '#18181B',
  content2: '#27272A',
  content3: '#3F3F46',
  content4: '#52525B'
};
```

When `mode: 'dark'` is set, the `.dark` class is added to `<html>` and dark variants are used.

## Benefits of Global Card Styling

1. **Consistency** - All cards look uniform across the application
2. **Maintainability** - Change theme once, affects all cards
3. **Performance** - No per-component style calculations
4. **Simplicity** - Developers don't need to remember to style cards
5. **Theme-Aware** - Cards automatically respond to theme changes
6. **Dark Mode** - Automatic dark mode support

## Component Examples

Check these components for proper card usage:

- `resources/js/Components/StatsCards.jsx` - Stats cards with proper theming
- `resources/js/Components/Auth/TwoFactorSettings.jsx` - Settings card
- `resources/js/Components/PunchStatusCard.jsx` - Status display card
- `resources/js/Components/UpdatesCards.jsx` - Update notification cards

## Migration Guide

If you find code using manual card styling:

### Before:
```jsx
import { getThemedCardStyle } from '@/Components/UI/ThemedCard';

<Card style={getThemedCardStyle()}>
  <CardBody>Content</CardBody>
</Card>
```

### After:
```jsx
// Simply remove the style prop - global CSS handles it
<Card>
  <CardBody>Content</CardBody>
</Card>
```

## Troubleshooting

### Cards not showing theme styling?

1. **Check CSS is imported** - Ensure `resources/css/app.css` is loaded in your app entry point
2. **Verify card classes** - HeroUI cards should have `.bg-content1` and `.rounded-*` classes
3. **Check theme is applied** - Verify CSS variables are set in browser DevTools on `<html>` element
4. **Inspect specificity** - Make sure no inline styles override the global CSS

### Theme not updating?

1. **Check localStorage** - Theme settings are persisted in `heroui-theme-settings`
2. **Verify applyThemeToDocument** - Ensure the function is called when theme changes
3. **Check CSS variable cascade** - Variables should be set on `:root` or `html` element

## Advanced: Custom Themes

To create a custom theme, add it to `theme/index.js`:

```javascript
export const heroUIThemes = {
  // ... existing themes
  myCustomTheme: {
    name: 'My Custom Theme',
    layout: {
      fontFamily: 'Custom Font',
      borderRadius: '8px',
      borderWidth: '1px',
      scale: '100%',
      disabledOpacity: '0.5'
    },
    colors: {
      background: '#F0F0F0',
      foreground: '#1A1A1A',
      content1: '#FFFFFF',
      content2: '#F5F5F5',
      content3: '#E0E0E0',
      // ... other colors
    }
  }
};
```

Then apply it via `ThemeSettingDrawer` or programmatically.

## Conclusion

The theming system is **centralized and automatic**. There is **no need** for `ThemedCard`, `getThemedCardStyle()`, or manual card styling in most cases. Simply use HeroUI's `Card` component directly and let the global CSS handle the theming.
