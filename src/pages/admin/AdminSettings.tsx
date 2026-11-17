import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, CheckCircle2, History, DollarSign } from 'lucide-react';
import { PayrollRate, AuditLog } from '../../types';

export const AdminSettings: React.FC = () => {
  const [rates, setRates] = useState<PayrollRate[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const [resRates, resAudit] = await Promise.all([
        fetch('/api/rates'),
        fetch('/api/audit-logs')
      ]);
      const dataRates = await resRates.json();
      const dataAudit = await resAudit.json();
      setRates(dataRates);
      setAuditLogs(dataAudit);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleRateChange = (role: string, val: string) => {
    const num = Number(val);
    setRates(rates.map(r => r.role === role ? { ...r, rate_per_chapter: isNaN(num) ? 0 : num } : r));
  };

  const handleSaveRates = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('');
    try {
      const res = await fetch('/api/rates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rates })
      });
      if (!res.ok) throw new Error('Gagal memperbarui payrate');
      setSuccess('Payrate berhasil diperbarui! Perubahan tidak mempengaruhi transaksi historis.');
      fetchSettings();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-slate-500">Memuat settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Settings & Payrate Management</h1>
        <p className="text-slate-400 text-sm">Kelola nominal payrate per chapter untuk setiap role pekerjaan dan tinjau audit log.</p>
      </div>

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-4 rounded-xl flex items-center space-x-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-sm">{success}</div>
        </div>
      )}

      {/* Payrate Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
          <DollarSign className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-bold text-white">Tarif Payrate per Chapter</h3>
        </div>
        <p className="text-xs text-slate-400">
          Perubahan payrate hanya berlaku untuk laporan baru. Transaksi historis tetap mempertahankan snapshot rate masing-masing.
        </p>

        <form onSubmit={handleSaveRates} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {rates.map((r) => (
              <div key={r.role} className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 space-y-2">
                <label className="block text-sm font-bold text-white">{r.role}</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 text-sm">Rp</span>
                  <input
                    type="number"
                    min="0"
                    required
                    value={r.rate_per_chapter}
                    onChange={(e) => handleRateChange(r.role, e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-white font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <span className="text-xs text-slate-500 block">Per chapter</span>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Payrate</span>
            </button>
          </div>
        </form>
      </div>

      {/* Audit Logs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden space-y-3">
        <div className="p-6 border-b border-slate-800 flex items-center space-x-2">
          <History className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-bold text-white">Audit Trail (Log Aktivitas Admin)</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/50 border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">Waktu</th>
                <th className="py-3.5 px-4">Aksi</th>
                <th className="py-3.5 px-4">Target</th>
                <th className="py-3.5 px-4">Detail</th>
                <th className="py-3.5 px-4">Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm text-slate-300 font-mono text-xs">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 font-sans">Belum ada audit log.</td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 text-slate-400">{log.timestamp}</td>
                    <td className="py-3 px-4 text-indigo-400 font-bold">{log.action}</td>
                    <td className="py-3 px-4 text-slate-300">{log.target_type} {log.target_id ? `#${log.target_id}` : ''}</td>
                    <td className="py-3 px-4 text-slate-300">{log.details}</td>
                    <td className="py-3 px-4 text-emerald-400">{log.performed_by}</td>
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
