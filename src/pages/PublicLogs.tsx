import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { WorkLog, Role } from '../types';

export const PublicLogs: React.FC = () => {
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [month, setMonth] = useState<string>('');
  const [year, setYear] = useState<string>('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (month) params.append('month', month);
      if (year) params.append('year', year);
      if (roleFilter !== 'All') params.append('role', roleFilter);
      if (statusFilter !== 'All') params.append('status', statusFilter);
      if (search) params.append('nickname', search);

      const res = await fetch(`/api/work-logs?${params.toString()}`);
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [month, year, roleFilter, statusFilter, search]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Catatan Laporan Pekerjaan (Logs)</h1>
          <p className="text-slate-400 text-sm">Daftar seluruh laporan chapter yang dikirim oleh penerjemah dan editor.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari nickname..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="All">Semua Role</option>
            <option value="Translator">Translator</option>
            <option value="Editor">Editor</option>
            <option value="Solo">Solo</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="All">Semua Status</option>
            <option value="APPROVED">Approved</option>
            <option value="PENDING_REVIEW">Pending Review</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">Semua Bulan</option>
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
            <option value="">Semua Tahun</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/50 border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">Tanggal Kerja</th>
                <th className="py-3.5 px-4">Nickname</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Judul Komik</th>
                <th className="py-3.5 px-4 text-center">Chapter</th>
                <th className="py-3.5 px-4 text-right">Nominal</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">Memuat data...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">Tidak ada catatan laporan ditemukan.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-400 text-xs">{log.work_date}</td>
                    <td className="py-3.5 px-4 font-medium text-white">
                      {log.nickname_input}
                      {log.status === 'PENDING_REVIEW' && (
                        <span className="ml-2 text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded">
                          Typo / Unregistered
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        log.role_input === 'Translator' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        log.role_input === 'Editor' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                        'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {log.role_input}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-200">{log.title}</td>
                    <td className="py-3.5 px-4 text-center font-semibold text-white">{log.chapter}</td>
                    <td className="py-3.5 px-4 text-right font-semibold text-emerald-400">
                      Rp{log.nominal.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {log.status === 'APPROVED' ? (
                        <span className="inline-flex items-center space-x-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full text-xs font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approved</span>
                        </span>
                      ) : log.status === 'PENDING_REVIEW' ? (
                        <span className="inline-flex items-center space-x-1 bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-1 rounded-full text-xs font-medium">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Pending Review</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 bg-slate-800 text-slate-400 border border-slate-700 px-2.5 py-1 rounded-full text-xs font-medium">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Rejected</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
