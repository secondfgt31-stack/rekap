import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle2, Clock, Download, Printer, AlertCircle, XCircle } from 'lucide-react';
import { PayrollRekapResponse } from '../../types';

export const AdminPayroll: React.FC = () => {
  const [month, setMonth] = useState<string>(String(new Date().getMonth() + 1));
  const [year, setYear] = useState<string>(String(new Date().getFullYear()));
  const [rekap, setRekap] = useState<PayrollRekapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const fetchRekap = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/payroll/rekap?month=${month}&year=${year}`);
      const data = await res.json();
      setRekap(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRekap();
  }, [month, year]);

  const handleTogglePayment = async (employeeId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'PAID' ? 'UNPAID' : 'PAID';
    if (newStatus === 'UNPAID') {
      const emp = rekap?.members.find(m => m.employee_id === employeeId);
      setSelectedEmp(emp);
      setCancelModalOpen(true);
      return;
    }

    try {
      const res = await fetch('/api/payments/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: employeeId,
          period_month: Number(month),
          period_year: Number(year),
          status: 'PAID',
          notes: 'Dibayar lunas oleh admin'
        })
      });
      if (!res.ok) throw new Error('Gagal mengubah status pembayaran');
      fetchRekap();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const confirmCancelPayment = async () => {
    if (!selectedEmp) return;
    try {
      const res = await fetch('/api/payments/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: selectedEmp.employee_id,
          period_month: Number(month),
          period_year: Number(year),
          status: 'UNPAID',
          notes: cancelReason || 'Dibatalkan oleh admin'
        })
      });
      if (!res.ok) throw new Error('Gagal membatalkan pembayaran');
      setCancelModalOpen(false);
      setSelectedEmp(null);
      setCancelReason('');
      fetchRekap();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleExportCSV = () => {
    if (!rekap) return;
    let csvContent = 'data:text/csv;charset=utf-8,No,Nickname,Role,Total Chapter,Gaji,Status Bayar\n';
    rekap.members.forEach((m, idx) => {
      csvContent += `${idx + 1},"${m.nickname}",${m.role},${m.total_chapters},${m.gaji},${m.status_bayar}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `payroll_${month}_${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const monthName = new Date(Number(year), Number(month) - 1, 1).toLocaleString('id-ID', { month: 'long' });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Manajemen Payroll & Rekap Gaji</h1>
          <p className="text-slate-400 text-sm">Kelola status pembayaran gaji bulanan dan rincian per anggota.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
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

          <button
            onClick={handleExportCSV}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-sm font-medium transition-all flex items-center space-x-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-sm font-medium transition-all flex items-center space-x-1.5 shadow-lg shadow-indigo-600/30"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / PDF</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-500">Memuat data payroll...</div>
      ) : !rekap ? (
        <div className="py-20 text-center text-slate-500">Gagal memuat rekap.</div>
      ) : (
        <>
          {/* Summary Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Payout ({monthName})</span>
              <h3 className="text-2xl font-bold text-emerald-400 mt-2">Rp{rekap.total_gaji.toLocaleString('id-ID')}</h3>
              <p className="text-xs text-slate-500 mt-1">{rekap.total_chapters} Total Chapter</p>
            </div>
            {rekap.roles.map((r) => (
              <div key={r.role} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{r.role} Payout</span>
                <h3 className="text-2xl font-bold text-white mt-2">Rp{r.total_gaji.toLocaleString('id-ID')}</h3>
                <p className="text-xs text-slate-500 mt-1">{r.total_chapters} Chapter</p>
              </div>
            ))}
          </div>

          {/* Members Payroll Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Status Pembayaran Anggota</h3>
                <p className="text-xs text-slate-400 mt-0.5">Tandai sudah dibayar atau batalkan pembayaran dengan alasan audit log.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800/50 border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="py-3.5 px-4 w-16 text-center">No</th>
                    <th className="py-3.5 px-4">Nickname</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4 text-center">Total Chapter</th>
                    <th className="py-3.5 px-4 text-right">Gaji</th>
                    <th className="py-3.5 px-4 text-center">Status Bayar</th>
                    <th className="py-3.5 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
                  {rekap.members.map((m, idx) => (
                    <tr key={m.employee_id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 text-center font-mono text-slate-500">{idx + 1}</td>
                      <td className="py-3.5 px-4 font-bold text-white">{m.nickname}</td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          m.role === 'Translator' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          m.role === 'Editor' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                          'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {m.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-white">{m.total_chapters}</td>
                      <td className="py-3.5 px-4 text-right font-semibold text-emerald-400">
                        Rp{m.gaji.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {m.status_bayar === 'PAID' ? (
                          <span className="inline-flex items-center space-x-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Sudah Dibayar</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-semibold">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Belum Dibayar</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleTogglePayment(m.employee_id, m.status_bayar)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                            m.status_bayar === 'PAID'
                              ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20'
                          }`}
                        >
                          {m.status_bayar === 'PAID' ? 'Batalkan Pembayaran' : 'Tandai Dibayar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Cancel Payment Modal with Reason */}
      {cancelModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Batalkan Pembayaran Gaji</h3>
            <p className="text-sm text-slate-400">
              Anda akan membatalkan status pembayaran untuk <span className="text-white font-bold">{selectedEmp?.nickname}</span>. Berikan catatan atau alasan untuk audit log:
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Contoh: Kesalahan nominal transfer, perlu direvisi..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 h-24"
            />
            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setCancelModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium"
              >
                Tutup
              </button>
              <button
                onClick={confirmCancelPayment}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium shadow-lg shadow-red-600/30"
              >
                Konfirmasi Batalkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
