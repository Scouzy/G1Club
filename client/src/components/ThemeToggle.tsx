import React from 'react';
import { Moon, Sun, Stars } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label="Changer le thème"
      title={theme === 'light' ? 'Passer en sombre' : theme === 'dark' ? 'Passer en nuit' : 'Passer en clair'}
    >
      {theme === 'light' ? (
        <Moon className="h-5 w-5 text-gray-600" />
      ) : theme === 'dark' ? (
        <Stars className="h-5 w-5 text-blue-300" />
      ) : (
        <Sun className="h-5 w-5 text-yellow-500" />
      )}
    </button>
  );
};
