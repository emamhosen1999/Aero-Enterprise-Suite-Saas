import { useTheme } from '@/Context/ThemeContext';

/**
 * Hook that returns whether the current theme appearance is dark.
 * Handles all dark variants: dim, dark, midnight, and system preference.
 * 
 * Use this instead of `themeSettings?.mode === 'dark'` to properly
 * support all dark mode gradations.
 * 
 * @returns {boolean} true if current mode resolves to any dark variant
 */
export const useIsDark = () => {
  const { isDark } = useTheme();
  return isDark;
};

export default useIsDark;
