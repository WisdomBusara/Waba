
import React, { useState, useEffect } from 'react';
import { ZapIcon, MenuIcon, BellIcon, MicIcon, LogOutIcon } from './icons';
import { Button } from './ui/Button';
import DarkModeSwitcher from './DarkModeSwitcher';
import LiveAssistant from './LiveAssistant';
import BulkBillingWizard from './BulkBillingWizard';
import { fetchFromApi } from '../lib/api';

interface HeaderProps {
  showToast: (message: string, type?: 'success' | 'error') => void;
  activeView: string;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;
  onLogout: () => void;
  onNavigate: (view: string) => void;
}

const Header: React.FC<HeaderProps> = ({ showToast, activeView, sidebarOpen, setSidebarOpen, isDarkMode, setIsDarkMode, onLogout, onNavigate }) => {
  const [isBulkBillingOpen, setIsBulkBillingOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const data = await fetchFromApi('notifications');
        if (data && data.unreadCount !== undefined) {
          setUnreadCount(data.unreadCount);
        }
      } catch (error) {
        console.error('Failed to fetch unread notifications count', error);
      }
    };
    
    fetchUnreadCount();
    // Poll every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    onLogout();
    showToast('Logged out successfully', 'success');
  };

  return (
    <>
      <header className="sticky top-0 z-40 flex w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="flex flex-grow items-center justify-between px-4 py-3 shadow-sm md:px-6 2xl:px-11">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              aria-controls="sidebar"
              onClick={(e) => {
                e.stopPropagation();
                setSidebarOpen(!sidebarOpen);
              }}
              className="block rounded-sm border border-slate-300 bg-slate-100 p-1.5 shadow-sm dark:border-slate-700 dark:bg-slate-800 lg:hidden"
            >
              <MenuIcon className="h-5 w-5" />
            </button>
            <div className="hidden sm:block">
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{activeView}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3 2xsm:gap-7">
            {activeView === 'Dashboard' && (
              <div className="hidden sm:block">
                  <Button
                      onClick={() => setIsBulkBillingOpen(true)}
                      variant="primary"
                  >
                      <ZapIcon className="h-5 w-5 mr-2" />
                      <span>Run Billing</span>
                  </Button>
              </div>
            )}
            
            <DarkModeSwitcher isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />

            <button
              onClick={() => setIsAssistantOpen(true)}
              className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800" title="Live Assistant">
              <MicIcon className="h-6 w-6 text-slate-600 dark:text-slate-300 hover:text-primary" />
            </button>

            <button 
              onClick={() => onNavigate('Notifications')}
              className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800" 
              title="Notifications"
            >
              <BellIcon className="h-6 w-6 text-slate-600 dark:text-slate-300 hover:text-primary" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            
            <div className="flex items-center gap-4">
              <span className="hidden text-right lg:block">
                <span className="block text-sm font-medium text-black dark:text-white">J. Kamau</span>
                <span className="block text-xs">Administrator</span>
              </span>
              <img
                  className="h-10 w-10 rounded-full object-cover"
                  src={`https://i.pravatar.cc/100?u=admin`}
                  alt="User avatar"
              />
              <button
                onClick={handleLogout}
                className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-red-500 hover:text-red-600"
                title="Log Out"
              >
                <LogOutIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>
      {isAssistantOpen && <LiveAssistant onClose={() => setIsAssistantOpen(false)} showToast={showToast} />}
      {isBulkBillingOpen && (
          <BulkBillingWizard 
            onClose={() => setIsBulkBillingOpen(false)} 
            onComplete={() => {
                setIsBulkBillingOpen(false);
                showToast("Billing cycle processed successfully.", "success");
            }}
            showToast={showToast}
          />
      )}
    </>
  );
};

export default Header;
