import { createContext, useContext, useState, useEffect } from 'react';

interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

type ThemeMode = 'dark' | 'light' | 'system';
type Theme = {
  mode: ThemeMode;
};

const initialState: ThemeProviderState = {
  theme: { mode: 'dark' },
  setTheme: () => null
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = { mode: 'dark' },
  storageKey = 'vite-ui-theme',
  ...props
}: ThemeProviderProps) {
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => {
    try {
      const storedValue = localStorage.getItem(storageKey);
      return storedValue ? JSON.parse(storedValue) : defaultTheme;
    } catch (error) {
      console.error("Failed to read theme from localStorage", error);
      return defaultTheme;
    }
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (currentTheme.mode === 'system') {
      const systemMode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemMode);
    } else {
      root.classList.add(currentTheme.mode);
    }

    try {
      localStorage.setItem(storageKey, JSON.stringify(currentTheme));
    } catch (error) {
      console.error("Failed to write theme to localStorage", error);
    }
  }, [currentTheme, storageKey]);

  const value = {
    theme: currentTheme,
    setTheme: (theme: Theme) => {
      setCurrentTheme(theme);
    }
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};


