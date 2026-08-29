import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { Menu, X } from 'lucide-react';

export const Layout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col transition-colors duration-200">
      <Navbar />

      <div className="flex flex-1 relative">
        {/* Desktop Sidebar */}
        <div className="hidden md:block border-r border-gray-200 dark:border-gray-800">
          <Sidebar />
        </div>

        {/* Mobile Sidebar overlay */}
        {isMobileSidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Mobile Sidebar panel */}
        <div
          className={`md:hidden fixed top-16 bottom-0 left-0 w-64 bg-gray-900 z-50 transform transition-transform duration-300 ${
            isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <Sidebar />
        </div>

        {/* Floating Mobile Menu Button */}
        <button
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="md:hidden fixed bottom-6 right-6 p-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl z-50 transition-transform active:scale-95 cursor-pointer focus:outline-none"
          aria-label="Toggle Sidebar Menu"
          title="Toggle Sidebar Menu"
        >
          {isMobileSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Main Workspace content */}
        <main className="flex-1 flex flex-col min-w-0 p-4 md:p-6 lg:p-8 overflow-y-auto">
          {/* Global Safety Header Alert */}
          <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-xl flex items-start gap-3">
            <span className="text-amber-600 dark:text-amber-400 font-bold text-lg select-none">⚠️</span>
            <div className="text-xs text-amber-800 dark:text-amber-300">
              <span className="font-semibold">Educational & Administrative Tracking System:</span> This is a demonstration healthcare application. It does <span className="underline">NOT</span> diagnose diseases, prescribe medication, recommend changing doses, or replace clinical consultations with qualified healthcare providers.
            </div>
          </div>

          <div className="flex-1">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
