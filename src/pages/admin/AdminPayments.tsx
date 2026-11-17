import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, Clock, Calendar } from 'lucide-react';

export const AdminPayments: React.FC = () => {
  const [month, setMonth] = useState<string>(String(new Date().getMonth() + 1));
  const [year, setYear] = useState<string>(String(new Date().getFullYear()));
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/payroll/rekap?month=${month}&year=${year}`);
      const data = await res.json();
      setPayments(data.members || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [month, year]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Riwayat Pembayaran (Payments)</h1>
          <p className="text-slate-400 text-sm">Monitor catatan pelunasan gaji periode bulanan.</p>
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

      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/50 border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">Nickname</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4 text-center">Periode</th>
                <th className="py-3.5 px-4 text-center">Total Chapter</th>
                <th className="py-3.5 px-4 text-right">Nominal Gaji</th>
                <th className="py-3.5 px-4 text-center">Status Pembayaran</th>
                <th className="py-3.5 px-4">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">Memuat pembayaran...</td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">Tidak ada data pembayaran.</td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.employee_id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">{p.nickname}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        p.role === 'Translator' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        p.role === 'Editor' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                        'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {p.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-400 text-xs">
                      {month}/{year}
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold text-white">{p.total_chapters}</td>
                    <td className="py-3.5 px-4 text-right font-semibold text-emerald-400">
                      Rp{p.gaji.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {p.status_bayar === 'PAID' ? (
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
                    <td className="py-3.5 px-4 text-slate-400 text-xs">
                      {p.payment_notes || '-'}
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
