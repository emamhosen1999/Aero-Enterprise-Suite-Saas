/**
 * Reset Theme to Light Mode
 * Run this in the browser console to reset dark mode to light
 * while keeping your background and other settings
 */

// Read current theme
const currentTheme = JSON.parse(localStorage.getItem('aero-theme-settings-v2') || '{}');

// Update only the mode to light
const updatedTheme = {
  ...currentTheme,
  mode: 'light'
};

// Save back to localStorage
localStorage.setItem('aero-theme-settings-v2', JSON.stringify(updatedTheme));

// Reload the page to apply changes
window.location.reload();
