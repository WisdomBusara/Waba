
import React, { useState, useEffect, useRef } from 'react';
import { DashboardIcon, UsersIcon, FileTextIcon, CreditCardIcon, BarChartIcon, SettingsIcon, DropletIcon, LogoIcon, ChevronLeftIcon, ChevronDownIcon, UserIcon } from './icons';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeView: string;
  setActiveView: (view: string) => void;
}

const NavLink = ({ item, activeView, setActiveView, setSidebarOpen, sidebarExpanded }: any) => {
    const isActive = activeView === item.label;
    return (
        <button
            onClick={() => {
                setActiveView(item.label);
                setSidebarOpen(false);
            }}
            className={`group relative flex items-center gap-2.5 rounded-lg px-4 py-2 font-medium w-full text-left duration-300 ease-in-out hover:bg-slate-800/50 ${isActive ? 'bg-blue-600/30 text-white' : 'text-slate-300 hover:text-white'}`}
        >
            <item.icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
            <span className={`text-slate-200 group-hover:text-white ${!sidebarExpanded && 'hidden'}`}>{item.label}</span>
        </button>
    );
};

const NavGroup = ({ group, activeView, setActiveView, setSidebarOpen, sidebarExpanded }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    
    const isActiveGroup = group.items.some((item: any) => item.label === activeView);

    useEffect(() => {
        if(isActiveGroup) {
            setIsOpen(true);
        }
    }, [isActiveGroup]);


    return (
        <div className="py-2">
            <button 
                onClick={() => sidebarExpanded && setIsOpen(!isOpen)} 
                className="group relative flex items-center justify-between gap-2.5 rounded-lg px-4 py-2 font-medium w-full text-left duration-300 ease-in-out hover:bg-slate-800/50"
            >
                <div className="flex items-center gap-2.5">
                    <group.icon className={`h-5 w-5 ${isActiveGroup ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                    <span className={`text-slate-200 group-hover:text-white ${!sidebarExpanded && 'hidden'}`}>{group.label}</span>
                </div>
                {sidebarExpanded && <ChevronDownIcon className={`w-4 h-4 text-slate-400 transition-transform ${isOpen && 'rotate-180'}`} />}
            </button>
            {sidebarExpanded && isOpen && (
                <ul className="mt-2 ml-6 space-y-1 border-l border-slate-700 pl-4">
                    {group.items.map((item: any) => (
                        <li key={item.label}>
                           <NavLink item={item} activeView={activeView} setActiveView={setActiveView} setSidebarOpen={setSidebarOpen} sidebarExpanded={sidebarExpanded} />
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen, activeView, setActiveView }) => {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  
  const trigger = useRef<HTMLButtonElement>(null);
  const sidebar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (!sidebar.current || !trigger.current) return;
      if (!sidebarOpen || sidebar.current.contains(target as Node) || trigger.current.contains(target as Node)) return;
      setSidebarOpen(false);
    };
    document.addEventListener('click', clickHandler);
    return () => document.removeEventListener('click', clickHandler);
  });

  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserRole(user.role);
      } catch (e) {
        console.error('Failed to parse user from local storage');
      }
    }
  }, []);

  const navItems = [
    {
        title: 'MENU',
        links: [
            { icon: DashboardIcon, label: 'Dashboard' },
            { icon: BarChartIcon, label: 'Reports' },
        ]
    },
    {
        title: 'MANAGEMENT',
        links: [
            { icon: UsersIcon, label: 'Customers' },
            { icon: DropletIcon, label: 'Meters & Readings' },
            { icon: FileTextIcon, label: 'Assets' },
            { 
                label: 'Billing',
                icon: FileTextIcon,
                items: [
                    { icon: FileTextIcon, label: 'Invoices' },
                    { icon: CreditCardIcon, label: 'Payments' },
                ]
            }
        ]
    },
    {
        title: 'SYSTEM',
        links: [
             ...(userRole === 'Admin' ? [{ icon: UserIcon, label: 'Users' }] : []),
             ...(userRole === 'Admin' ? [{ icon: FileTextIcon, label: 'Audit Logs' }] : []),
             { icon: SettingsIcon, label: 'Settings' },
        ]
    }
  ];

  return (
     <aside
      ref={sidebar}
      className={`absolute left-0 top-0 z-50 flex h-screen flex-col overflow-y-hidden bg-slate-900/90 backdrop-blur-lg text-slate-200 duration-300 ease-linear lg:static lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } ${sidebarExpanded ? 'w-72' : 'w-20'}`}
    >
      <div className="flex items-center justify-between gap-2 px-6 py-5.5 lg:py-6.5">
        <a href="#" className={`flex items-center gap-2 ${!sidebarExpanded && 'justify-center w-full'}`}>
            <LogoIcon className="h-9 w-9 text-blue-500" />
            <span className={`text-2xl font-bold ${!sidebarExpanded && 'hidden'}`}>WABA</span>
        </a>
        <button
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
            className="hidden lg:block p-1.5 rounded-full bg-slate-800 hover:bg-slate-700"
        >
            <ChevronLeftIcon className={`w-5 h-5 transition-transform duration-300 ${!sidebarExpanded && 'rotate-180'}`} />
        </button>
      </div>

      <div className="flex flex-col overflow-y-auto duration-300 ease-linear">
        <nav className="mt-5 px-4 lg:px-6">
            {navItems.map((group) => (
                <div key={group.title}>
                    <h3 className={`mb-4 ml-4 text-sm font-semibold text-slate-400 ${!sidebarExpanded && 'hidden'}`}>{group.title}</h3>
                    <ul className="mb-6 flex flex-col gap-1.5">
                    {group.links.map((item) => (
                        <li key={item.label}>
                            {'items' in item ? (
                                <NavGroup group={item} activeView={activeView} setActiveView={setActiveView} setSidebarOpen={setSidebarOpen} sidebarExpanded={sidebarExpanded} />
                            ) : (
                                <NavLink item={item} activeView={activeView} setActiveView={setActiveView} setSidebarOpen={setSidebarOpen} sidebarExpanded={sidebarExpanded} />
                            )}
                        </li>
                    ))}
                    </ul>
                </div>
            ))}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
