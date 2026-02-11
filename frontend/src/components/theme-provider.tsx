import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

interface ThemeContextType {
  // Dark mode is always enabled, but we keep the context for consistency
  isDark: true;
}

const ThemeContext = createContext<ThemeContextType>({ isDark: true });

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Force dark mode
  return (
    <ThemeContext.Provider value={{ isDark: true }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
