import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, LogOut, Bell, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'STAFF':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  return (
    <nav className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 sticky top-0 z-40 transition-colors duration-200">
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
            M
          </div>
          <span className="font-bold text-xl text-gray-800 dark:text-white hidden sm:block">
            MTAMS
          </span>
        </Link>
        <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-1 rounded hidden md:inline-block">
          Demo/Educational
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Adherence Disclaimer Header */}
        <div className="hidden lg:block text-xs text-amber-600 dark:text-amber-400 max-w-md text-right leading-tight">
          ⚠️ Administrative indicator only. Not a medical risk assessment.
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
          title="Toggle Light/Dark Mode"
          aria-label="Toggle Light/Dark Mode"
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>

        {/* Notifications Icon shortcut */}
        <Link
          to="/notifications"
          className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 relative cursor-pointer"
          title="View Notifications"
        >
          <Bell className="w-5 h-5" />
        </Link>

        {/* User profile dropdown info */}
        {user && (
          <div className="flex items-center gap-3 pl-2 border-l border-gray-200 dark:border-gray-700">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                {user.name}
              </span>
              <div className="flex items-center gap-1.5 justify-end">
                <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full border ${getRoleColor(user.role)}`}>
                  {user.role}
                </span>
              </div>
            </div>
            
            <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                <UserIcon className="w-5 h-5" />
              )}
            </div>

            <button
              onClick={logout}
              className="p-2 rounded-lg text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer transition-colors"
              title="Logout"
              aria-label="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};
