import React from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  Users, 
  FileSpreadsheet, 
  CreditCard, 
  BarChart3, 
  MessageSquare, 
  Settings as SettingsIcon,
  X
} from 'lucide-react';

interface SidebarProps {
  currentAdminTab: string;
  setCurrentAdminTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
  pendingReviewCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentAdminTab, 
  setCurrentAdminTab, 
  isOpen, 
  onClose,
  pendingReviewCount = 0
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'payroll', label: 'Payroll & Rekap', icon: Receipt },
    { id: 'employees', label: 'Manajemen Karyawan', icon: Users },
    { id: 'work-logs', label: 'Work Logs', icon: FileSpreadsheet, badge: pendingReviewCount },
    { id: 'payments', label: 'Pembayaran', icon: CreditCard },
    { id: 'reports', label: 'Laporan & Statistik', icon: BarChart3 },
    { id: 'discord', label: 'Integrasi Discord', icon: MessageSquare },
    { id: 'settings', label: 'Settings & Payrate', icon: SettingsIcon },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed md:sticky top-16 z-40 h-[calc(100vh-4rem)] w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-4 border-b border-slate-800 flex items-center justify-between md:hidden">
          <span className="font-semibold text-slate-200">Menu Admin</span>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentAdminTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentAdminTab(item.id);
                  onClose();
                }}
                className={`
                  w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all
                  ${isActive 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }
                `}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && item.badge > 0 ? (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold animate-pulse">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
          Comic Payroll System v2.4 • Production Ready
        </div>
      </aside>
    </>
  );
};
