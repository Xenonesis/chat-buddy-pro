import React, { createContext, useState, useContext, useEffect } from 'react';
import { checkStorageAvailability } from '../utils/storageHelpers';

type ThemeType = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  applyTheme: (newTheme: ThemeType) => void;
  storageAvailable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeType>('light');
  const [storageAvailable, setStorageAvailable] = useState<boolean>(true);

  useEffect(() => {
    // Check storage availability
    const isStorageAvailable = checkStorageAvailability();
    setStorageAvailable(isStorageAvailable);
    
    // Initialize theme
    if (isStorageAvailable) {
      const savedTheme = localStorage.getItem('buddychat_theme') as ThemeType | null;
      if (savedTheme) {
        setTheme(savedTheme);
        applyTheme(savedTheme);
      } else {
        // Default to system preference
        setTheme('system');
        applyTheme('system');
      }
    }
    
    // Add system theme preference listener
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        applySystemTheme();
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Effect to re-apply theme when it changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const applyTheme = (newTheme: ThemeType) => {
    if (newTheme === 'system') {
      applySystemTheme();
    } else {
      document.body.className = newTheme;
    }
    
    if (storageAvailable) {
      localStorage.setItem('buddychat_theme', newTheme);
    }
  };
  
  const applySystemTheme = () => {
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.body.className = isDarkMode ? 'dark' : 'light';
    document.body.classList.add('system');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, applyTheme, storageAvailable }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
