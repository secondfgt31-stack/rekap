import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { PublicLaporan } from './pages/PublicLaporan';
import { PublicLogs } from './pages/PublicLogs';
import { PublicRekap } from './pages/PublicRekap';
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminPayroll } from './pages/admin/AdminPayroll';
import { AdminEmployees } from './pages/admin/AdminEmployees';
import { AdminWorkLogs } from './pages/admin/AdminWorkLogs';
import { AdminPayments } from './pages/admin/AdminPayments';
import { AdminDiscord } from './pages/admin/AdminDiscord';
import { AdminSettings } from './pages/admin/AdminSettings';

function MainApp() {
  const [currentTab, setCurrentTab] = useState<string>('laporan');
  const [currentAdminTab, setCurrentAdminTab] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const { isAdmin } = useAuth();

  // Fetch pending review count for badge
  useEffect(() => {
    const fetchPending = async () => {
      try {
        const res = await fetch('/api/work-logs?status=PENDING_REVIEW');
        const data = await res.json();
        setPendingCount(data.length || 0);
      } catch (e) {
        console.error(e);
      }
    };
    fetchPending();
    const interval = setInterval(fetchPending, 10000);
    return () => clearInterval(interval);
  }, []);

  const renderContent = () => {
    if (currentTab === 'laporan') {
      return <PublicLaporan onNavigate={setCurrentTab} />;
    }
    if (currentTab === 'logs') {
      return <PublicLogs />;
    }
    if (currentTab === 'rekap') {
      return <PublicRekap />;
    }
    if (currentTab === 'admin-login') {
      return <AdminLogin onLoginSuccess={() => setCurrentTab('admin')} />;
    }

    if (currentTab === 'admin') {
      if (!isAdmin) {
        return <AdminLogin onLoginSuccess={() => setCurrentTab('admin')} />;
      }

      return (
        <div className="flex min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100">
          <Sidebar
            currentAdminTab={currentAdminTab}
            setCurrentAdminTab={setCurrentAdminTab}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            pendingReviewCount={pendingCount}
          />
          <main className="flex-1 p-6 md:p-8 overflow-y-auto">
            {currentAdminTab === 'dashboard' && <AdminDashboard onNavigate={setCurrentAdminTab} />}
            {currentAdminTab === 'payroll' && <AdminPayroll />}
            {currentAdminTab === 'employees' && <AdminEmployees />}
            {currentAdminTab === 'work-logs' && <AdminWorkLogs />}
            {currentAdminTab === 'payments' && <AdminPayments />}
            {currentAdminTab === 'reports' && <AdminDashboard onNavigate={setCurrentAdminTab} />}
            {currentAdminTab === 'discord' && <AdminDiscord />}
            {currentAdminTab === 'settings' && <AdminSettings />}
          </main>
        </div>
      );
    }

    return <PublicLaporan onNavigate={setCurrentTab} />;
  };

  const isAdminArea = currentTab === 'admin' && isAdmin;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isAdminArea={isAdminArea}
      />
      <div className={isAdminArea ? '' : 'max-w-7xl mx-auto'}>
        {renderContent()}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
