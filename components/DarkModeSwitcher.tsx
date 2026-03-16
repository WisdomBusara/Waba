import React from 'react';
import { SunIcon, MoonIcon } from './icons';

interface DarkModeSwitcherProps {
  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;
}

const DarkModeSwitcher: React.FC<DarkModeSwitcherProps> = ({ isDarkMode, setIsDarkMode }) => {
  return (
    <button
      onClick={() => setIsDarkMode(!isDarkMode)}
      className="relative flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <SunIcon className={`w-5 h-5 transition-transform duration-300 ${isDarkMode ? 'transform rotate-90 scale-0' : 'transform rotate-0 scale-100'}`} />
      <MoonIcon className={`w-5 h-5 absolute transition-transform duration-300 ${isDarkMode ? 'transform rotate-0 scale-100' : 'transform -rotate-90 scale-0'}`} />
    </button>
  );
};

export default DarkModeSwitcher;
