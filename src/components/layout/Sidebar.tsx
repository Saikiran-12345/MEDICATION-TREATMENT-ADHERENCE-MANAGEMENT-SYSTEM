import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Activity,
  Pill,
  CalendarDays,
  CheckSquare,
  Percent,
  TrendingUp,
  BellRing,
  FileSpreadsheet,
  FileText,
  BarChart3,
  ShieldAlert,
  Settings as SettingsIcon,
  Database,
  CalendarCheck
} from 'lucide-react';

interface SidebarItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  roles: ('ADMIN' | 'STAFF' | 'PATIENT')[];
}

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  
  if (!user) return null;

  const menuItems: SidebarItem[] = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      roles: ['ADMIN', 'STAFF', 'PATIENT']
    },
    {
      name: 'Patients',
      path: '/patients',
      icon: <Users className="w-5 h-5" />,
      roles: ['ADMIN', 'STAFF']
    },
    {
      name: 'Treatment Plans',
      path: '/treatments',
      icon: <Activity className="w-5 h-5" />,
      roles: ['ADMIN', 'STAFF', 'PATIENT']
    },
    {
      name: 'Medications',
      path: '/medications',
      icon: <Pill className="w-5 h-5" />,
      roles: ['ADMIN', 'PATIENT']
    },
    {
      name: 'Schedules',
      path: '/schedules',
      icon: <CalendarDays className="w-5 h-5" />,
      roles: ['ADMIN', 'PATIENT']
    },
    {
      name: 'Daily Dose Tracker',
      path: '/doses',
      icon: <CheckSquare className="w-5 h-5" />,
      roles: ['ADMIN', 'STAFF', 'PATIENT']
    },
    {
      name: 'Adherence Calc',
      path: '/adherence',
      icon: <Percent className="w-5 h-5" />,
      roles: ['ADMIN', 'STAFF', 'PATIENT']
    },
    {
      name: 'Treatment Progress',
      path: '/progress',
      icon: <TrendingUp className="w-5 h-5" />,
      roles: ['ADMIN', 'STAFF', 'PATIENT']
    },
    {
      name: 'Follow-ups',
      path: '/follow-ups',
      icon: <CalendarCheck className="w-5 h-5" />,
      roles: ['ADMIN', 'STAFF', 'PATIENT']
    },
    {
      name: 'Reminders',
      path: '/reminders',
      icon: <BellRing className="w-5 h-5" />,
      roles: ['ADMIN', 'PATIENT']
    },
    {
      name: 'Notes',
      path: '/notes',
      icon: <FileSpreadsheet className="w-5 h-5" />,
      roles: ['ADMIN', 'STAFF']
    },
    {
      name: 'Reports',
      path: '/reports',
      icon: <FileText className="w-5 h-5" />,
      roles: ['ADMIN', 'STAFF']
    },
    {
      name: 'Analytics',
      path: '/analytics',
      icon: <BarChart3 className="w-5 h-5" />,
      roles: ['ADMIN', 'STAFF']
    },
    {
      name: 'Activity Log',
      path: '/activity',
      icon: <ShieldAlert className="w-5 h-5" />,
      roles: ['ADMIN']
    },
    {
      name: 'Data Management',
      path: '/data-management',
      icon: <Database className="w-5 h-5" />,
      roles: ['ADMIN']
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: <SettingsIcon className="w-5 h-5" />,
      roles: ['ADMIN', 'STAFF', 'PATIENT']
    }
  ];

  // Filter items for current user's role
  const allowedItems = menuItems.filter(item => item.roles.includes(user.role));

  return (
    <aside className="w-64 bg-gray-900 text-gray-300 flex flex-col min-h-[calc(100vh-4rem)] z-30 transition-all duration-300">
      <div className="flex-1 py-6 px-4 overflow-y-auto">
        <div className="space-y-1.5">
          {allowedItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20'
                    : 'hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              {item.icon}
              <span>{item.name}</span>
            </NavLink>
          ))}
        </div>
      </div>
      <div className="p-4 border-t border-gray-800 text-[10px] text-gray-500 text-center select-none leading-normal">
        <div>MTAMS v1.0.0 (Local-First)</div>
        <div className="mt-1 text-red-500">Not for clinical decisions.</div>
      </div>
    </aside>
  );
};
