// =======================================
// Imports externos
// =======================================

import React, { createContext, useState, useEffect } from 'react';

// =======================================
// Imports de Tipos
// =======================================

import type { ThemeContextType } from './theme.types';

// =======================================
// Contexto
// =======================================

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// =======================================
// Provider
// =======================================

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export { ThemeContext };
