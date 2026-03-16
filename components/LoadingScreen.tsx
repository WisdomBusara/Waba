import React from 'react';
import { LogoIcon } from './icons';

const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-gray-100 dark:bg-gray-900 flex items-center justify-center z-50">
      <div className="relative flex items-center justify-center w-32 h-32">
        <div className="absolute w-full h-full loading-ripple"></div>
        <div className="absolute w-full h-full loading-ripple" style={{ animationDelay: '0.5s' }}></div>
        <LogoIcon className="h-16 w-16 text-blue-500 z-10 animate-pulse" />
      </div>
    </div>
  );
};
export default LoadingScreen;
