import React, { useState, useEffect } from 'react';
import { Users, BookOpen, DollarSign, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid } from 'recharts';
import { AdminDashboardStats } from '../../types';

export const AdminDashboard: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState('2026');
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/dashboard?year=${year}&month=${month}`);
      const data = await res.json();
      setStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [year, month]);

  if (loading) {
    return <div className="py-20 text-center text-slate-500">Memuat dashboard admin...</div>;
  }

  if (!stats) {
    return <div className="py-20 text-center text-slate-500">Gagal memuat statistik.</div>;
  }

  const activeEmployees = Number(stats.active_employees || 0);
  const chaptersThisMonth = Number(stats.chapters_this_month || 0);
  const payoutThisMonth = Number(stats.payout_this_month || 0);
  const totalPaid = Number(stats.total_paid || 0);
  const totalUnpaid = Number(stats.total_unpaid || 0);
  const pendingReviewCount = Number(stats.pending_review_count || 0);
  const monthlyExpenditure = Array.isArray(stats.monthly_expenditure) ? stats.monthly_expenditure : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Admin Dashboard</h1>
          <p className="text-slate-400 text-sm">Ringkasan pengeluaran gaji, statistik chapter, dan kontrol sistem.</p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString('id-ID', { month: 'long' })}
              </option>
            ))}
          </select>

          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>
        </div>
      </div>

      {pendingReviewCount > 0 && (
        <div 
          onClick={() => onNavigate('work-logs')}
          className="bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-red-500/20 transition-all shadow-lg"
        >
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-6 h-6 text-red-400 animate-bounce" />
            <div>
              <h4 className="font-bold text-white">Ada {pendingReviewCount} Laporan Nickname Bermasalah!</h4>
              <p className="text-xs text-red-200">Terdapat laporan dengan nickname typo atau belum terdaftar yang memerlukan verifikasi.</p>
            </div>
          </div>
          <span className="text-xs bg-red-600 text-white font-bold px-3 py-1.5 rounded-xl">Periksa Sekarang</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Karyawan Aktif</span>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-white mt-3">{activeEmployees}</h3>
          <p className="text-xs text-slate-500 mt-1">Translator, Editor, Solo</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Chapter Bulan Ini</span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-white mt-3">{chaptersThisMonth}</h3>
          <p className="text-xs text-slate-500 mt-1">Total chapter diselesaikan</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Pengeluaran Gaji</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-emerald-400 mt-3">Rp{payoutThisMonth.toLocaleString('id-ID')}</h3>
          <p className="text-xs text-slate-500 mt-1">Bulan terpilih</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Gaji Belum Dibayar</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-amber-400 mt-3">Rp{totalUnpaid.toLocaleString('id-ID')}</h3>
          <p className="text-xs text-slate-500 mt-1">Status UNPAID</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Gaji Sudah Dibayar</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-emerald-400 mt-3">Rp{totalPaid.toLocaleString('id-ID')}</h3>
          <p className="text-xs text-slate-500 mt-1">Status PAID</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Expenditure Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div>
            <h3 className="text-lg font-bold text-white">Grafik Pengeluaran Gaji Bulanan</h3>
            <p className="text-xs text-slate-400">Tren pengeluaran gaji dari bulan Januari hingga Desember {year}.</p>
          </div>
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyExpenditure}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `Rp${Number(v || 0) / 1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff' }}
                  formatter={(value: any) => [`Rp${Number(value || 0).toLocaleString('id-ID')}`, 'Pengeluaran']}
                />
                <Bar dataKey="payout" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Chapters Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div>
            <h3 className="text-lg font-bold text-white">Grafik Jumlah Chapter Bulanan</h3>
            <p className="text-xs text-slate-400">Total chapter komik yang dikerjakan per bulan.</p>
          </div>
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyExpenditure}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff' }}
                  formatter={(value: any) => [`${Number(value || 0)} Chapter`, 'Chapter']}
                />
                <Line type="monotone" dataKey="chapters" stroke="#a855f7" strokeWidth={3} dot={{ fill: '#a855f7', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
