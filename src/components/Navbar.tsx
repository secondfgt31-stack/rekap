import React, { useState } from 'react';
import { BookOpen, Shield, BarChart2, ListOrdered, Send, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onToggleSidebar?: () => void;
  isAdminArea?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, onToggleSidebar, isAdminArea }) => {
  const { user, logout, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (tab: string) => {
    setCurrentTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {isAdminArea ? (
            <button
              onClick={onToggleSidebar}
              className="text-slate-300 hover:text-white p-2 rounded-lg hover:bg-slate-800"
              title="Toggle Sidebar Admin"
            >
              <Menu className="w-6 h-6" />
            </button>
          ) : (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-slate-300 hover:text-white p-2 rounded-lg hover:bg-slate-800"
              title="Menu Burger"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          )}

          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => handleNavClick('laporan')}>
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-600/30">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                ComicPay
              </span>
              <span className="text-xs text-slate-400 block -mt-1">Payroll & Work Management</span>
            </div>
          </div>
        </div>

        {/* Public Nav (Desktop) */}
        <div className="hidden md:flex items-center space-x-1">
          {!isAdminArea ? (
            <>
              <button
                onClick={() => handleNavClick('laporan')}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                  currentTab === 'laporan' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>/Laporan</span>
              </button>
              <button
                onClick={() => handleNavClick('logs')}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                  currentTab === 'logs' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <ListOrdered className="w-4 h-4" />
                <span>/Logs</span>
              </button>
              <button
                onClick={() => handleNavClick('rekap')}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                  currentTab === 'rekap' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <BarChart2 className="w-4 h-4" />
                <span>/Rekap</span>
              </button>
            </>
          ) : (
            <div className="flex items-center space-x-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs text-slate-300 font-medium">Admin Mode: {user?.username}</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {!isAdminArea ? (
            isAdmin ? (
              <button
                onClick={() => handleNavClick('admin')}
                className="bg-violet-600 hover:bg-violet-700 text-white px-3.5 py-2 rounded-lg text-sm font-medium transition-all shadow-md shadow-violet-600/30 flex items-center space-x-1.5"
              >
                <Shield className="w-4 h-4" />
                <span>Admin Dashboard</span>
              </button>
            ) : (
              <button
                onClick={() => handleNavClick('admin-login')}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-1.5"
              >
                <Shield className="w-4 h-4" />
                <span>Login Admin</span>
              </button>
            )
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleNavClick('laporan')}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              >
                Ke Halaman Publik
              </button>
              <button
                onClick={() => {
                  logout();
                  handleNavClick('laporan');
                }}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 p-2 rounded-lg transition-colors"
                title="Keluar / Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Burger Menu Drawer (Mobile & Public) */}
      {mobileMenuOpen && !isAdminArea && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 py-4 space-y-2 shadow-2xl animate-in slide-in-from-top duration-200">
          <button
            onClick={() => handleNavClick('laporan')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium flex items-center space-x-3 transition-colors ${
              currentTab === 'laporan' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Send className="w-4 h-4 text-indigo-400" />
            <span>/Laporan (Kirim Pekerjaan)</span>
          </button>
          <button
            onClick={() => handleNavClick('logs')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium flex items-center space-x-3 transition-colors ${
              currentTab === 'logs' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <ListOrdered className="w-4 h-4 text-indigo-400" />
            <span>/Logs (Catatan Laporan)</span>
          </button>
          <button
            onClick={() => handleNavClick('rekap')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium flex items-center space-x-3 transition-colors ${
              currentTab === 'rekap' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <BarChart2 className="w-4 h-4 text-indigo-400" />
            <span>/Rekap (Rekap Gaji & Bulanan)</span>
          </button>
        </div>
      )}
    </header>
  );
};
