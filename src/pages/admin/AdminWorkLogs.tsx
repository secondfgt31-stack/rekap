import React, { useState, useEffect } from 'react';
import { Search, AlertTriangle, CheckCircle2, XCircle, Trash2, Check, UserCheck, UserPlus, X } from 'lucide-react';
import { WorkLog, Employee } from '../../types';

export const AdminWorkLogs: React.FC = () => {
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Verification Modal State
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<WorkLog | null>(null);
  const [actionType, setActionType] = useState<'match' | 'register' | 'reject'>('match');
  const [targetEmployeeId, setTargetEmployeeId] = useState<number | ''>('');
  const [newNickname, setNewNickname] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resLogs, resEmp] = await Promise.all([
        fetch(`/api/work-logs?status=${statusFilter}`),
        fetch('/api/employees')
      ]);
      const dataLogs = await resLogs.json();
      const dataEmp = await resEmp.json();
      setLogs(Array.isArray(dataLogs) ? dataLogs : []);
      setEmployees(Array.isArray(dataEmp) ? dataEmp : []);
    } catch (e) {
      console.error(e);
      setLogs([]);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const handleOpenVerify = (log: WorkLog) => {
    setSelectedLog(log);
    if (employees.length === 0) {
      setActionType('register');
      setTargetEmployeeId('');
    } else {
      setActionType('match');
      setTargetEmployeeId(employees[0].id);
    }
    setNewNickname(log.nickname_input);
    setVerifyModalOpen(true);
  };

  const handleVerifySubmit = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!selectedLog) return;

    const finalEmployeeId = targetEmployeeId || employees[0]?.id || 1;
    const finalNewNickname = newNickname.trim() || selectedLog.nickname_input;

    try {
      const res = await fetch(`/api/work-logs/${selectedLog.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionType,
          employee_id: finalEmployeeId,
          new_nickname: finalNewNickname
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memverifikasi laporan');

      setVerifyModalOpen(false);
      setSelectedLog(null);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteLog = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus laporan ini?')) return;
    try {
      const res = await fetch(`/api/work-logs/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus laporan');
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Manajemen Work Logs & Verifikasi</h1>
          <p className="text-slate-400 text-sm">Tinjau laporan pekerjaan dan verifikasi nickname bermasalah (Pending Review).</p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="All">Semua Status</option>
            <option value="PENDING_REVIEW">Pending Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/50 border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">Tanggal</th>
                <th className="py-3.5 px-4">Nickname Input</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Judul Komik</th>
                <th className="py-3.5 px-4 text-center">Chapter</th>
                <th className="py-3.5 px-4 text-right">Nominal</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Aksi / Verifikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">Memuat work logs...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">Tidak ada work logs ditemukan.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 text-slate-400 text-xs">{log.work_date}</td>
                    <td className="py-3.5 px-4 font-bold text-white">
                      {log.nickname_input}
                      {log.status === 'PENDING_REVIEW' && (
                        <span className="block text-xs text-red-400 font-normal">Typo / Unregistered</span>
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
                        <span className="inline-flex items-center space-x-1 bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-1 rounded-full text-xs font-medium animate-pulse">
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
                    <td className="py-3.5 px-4 text-center space-x-2 whitespace-nowrap">
                      {log.status === 'PENDING_REVIEW' && (
                        <button
                          type="button"
                          onClick={() => handleOpenVerify(log)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                        >
                          Verifikasi
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteLog(log.id)}
                        className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer inline-flex items-center justify-center"
                        title="Hapus Laporan"
                      >
                        <Trash2 className="w-4 h-4 pointer-events-none" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verification Modal */}
      {verifyModalOpen && selectedLog && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 pointer-events-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg space-y-5 shadow-2xl relative z-50 pointer-events-auto">
            <div>
              <h3 className="text-lg font-bold text-white">Verifikasi Nickname Bermasalah</h3>
              <p className="text-sm text-slate-400 mt-1">
                Laporan dari <span className="text-white font-bold">{selectedLog.nickname_input}</span> ({selectedLog.role_input} - {selectedLog.title} Ch.{selectedLog.chapter}) tidak cocok dengan database. Pilih tindakan:
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="flex items-center space-x-3 bg-slate-800/60 p-3 rounded-xl border border-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="actionType"
                    checked={actionType === 'match'}
                    onChange={() => setActionType('match')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-white block">Cocokkan dengan Karyawan Terdaftar</span>
                    <span className="text-xs text-slate-400">Hubungkan laporan ini ke salah satu karyawan aktif yang ada.</span>
                  </div>
                </label>

                {actionType === 'match' && (
                  <div className="pl-6 pt-1">
                    <select
                      value={targetEmployeeId}
                      onChange={(e) => setTargetEmployeeId(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    >
                      {employees.map(e => (
                        <option key={e.id} value={e.id}>{e.nickname} ({e.role})</option>
                      ))}
                    </select>
                  </div>
                )}

                <label className="flex items-center space-x-3 bg-slate-800/60 p-3 rounded-xl border border-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="actionType"
                    checked={actionType === 'register'}
                    onChange={() => setActionType('register')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-white block">Daftarkan sebagai Karyawan Baru</span>
                    <span className="text-xs text-slate-400">Buat profil karyawan baru berdasarkan laporan ini.</span>
                  </div>
                </label>

                {actionType === 'register' && (
                  <div className="pl-6 pt-1">
                    <input
                      type="text"
                      value={newNickname}
                      onChange={(e) => setNewNickname(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                      placeholder="Nickname baru"
                    />
                  </div>
                )}

                <label className="flex items-center space-x-3 bg-slate-800/60 p-3 rounded-xl border border-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="actionType"
                    checked={actionType === 'reject'}
                    onChange={() => setActionType('reject')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-white block">Tolak Laporan (Reject)</span>
                    <span className="text-xs text-slate-400">Tolak laporan karena tidak valid atau spam.</span>
                  </div>
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setVerifyModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleVerifySubmit}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-lg shadow-indigo-600/30 cursor-pointer"
                >
                  Proses Verifikasi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
