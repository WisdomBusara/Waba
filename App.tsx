
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Toast from './components/Toast';
import Meters from './components/Meters';
import Settings from './components/Settings';
import Customers from './components/Customers';
import Invoices from './components/Invoices';
import Reports from './components/Reports';
import Payments from './components/Payments';
import Users from './components/Users';
import AuditLogs from './components/AuditLogs';
import LoadingScreen from './components/LoadingScreen';
import Login from './components/Login';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [activeView, setActiveView] = useState('Dashboard');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [navigationParams, setNavigationParams] = useState<any>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
           (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    // Check if user data exists in local storage
    const userStr = localStorage.getItem('user');
    if (userStr) {
        setIsAuthenticated(true);
        localStorage.setItem('isAuthenticated', 'true');
    } else {
        setIsAuthenticated(false);
        localStorage.removeItem('isAuthenticated');
    }
    
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);
  
  useEffect(() => {
    if (isDarkMode) {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark-mode-bg');
        document.body.classList.remove('light-mode-bg');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.add('light-mode-bg');
        document.body.classList.remove('dark-mode-bg');
        localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('isAuthenticated', 'true');
    showToast('Logged in successfully', 'success');
  };

  const handleLogout = async () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    setActiveView('Dashboard');
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };
  
  const closeToast = () => {
    setToast(null);
  }

  const navigateTo = useCallback((view: string, params?: any) => {
    setActiveView(view);
    setNavigationParams(params || null);
  }, []);

  const renderContent = () => {
    switch (activeView) {
      case 'Dashboard':
        return <Dashboard setActiveView={setActiveView} />;
      case 'Customers':
        return <Customers showToast={showToast} onNavigate={navigateTo} />;
      case 'Meters & Readings':
        return <Meters showToast={showToast} initialMeterId={navigationParams?.meterId} />;
      case 'Invoices':
        return <Invoices showToast={showToast} />;
      case 'Payments':
        return <Payments showToast={showToast} />;
      case 'Reports':
        return <Reports />;
      case 'Users':
        return <Users showToast={showToast} />;
      case 'Audit Logs':
        return <AuditLogs />;
      case 'Settings':
        return <Settings showToast={showToast} />;
      default:
        return <Dashboard setActiveView={setActiveView} />;
    }
  }

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return (
      <>
        <Login onLogin={handleLogin} />
        {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
      </>
    );
  }

  return (
    <div className="text-slate-800 dark:text-slate-50">
      <div className="flex h-screen overflow-hidden">
        <Sidebar 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen} 
          activeView={activeView}
          setActiveView={(view) => navigateTo(view)}
        />

        <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          <Header 
            sidebarOpen={sidebarOpen} 
            setSidebarOpen={setSidebarOpen} 
            activeView={activeView}
            showToast={showToast}
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
            onLogout={handleLogout}
          />

          <main className="flex-grow">
            <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
              {renderContent()}
            </div>
          </main>
        </div>
        {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
      </div>
    </div>
  );
};

export default App;
