import { useContext } from 'react';
import { ThemeContext } from './ThemeContext';
import type { ThemeContextType } from './theme.types';

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser utilizado dentro de um ThemeProvider.');
  }
  return context;
};
