import React, { useState, useEffect } from 'react';
import { Calendar, Award, DollarSign, CheckCircle2, Clock, Users } from 'lucide-react';
import { PayrollRekapResponse } from '../types';

export const PublicRekap: React.FC = () => {
  const [month, setMonth] = useState<string>(String(new Date().getMonth() + 1));
  const [year, setYear] = useState<string>(String(new Date().getFullYear()));
  const [rekap, setRekap] = useState<PayrollRekapResponse | null>(null);
  const [loading, setLoading] = useState(true);

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

  const monthName = new Date(Number(year), Number(month) - 1, 1).toLocaleString('id-ID', { month: 'long' });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Rekap Gaji & Pekerjaan</h1>
          <p className="text-slate-400 text-sm mt-1">Transparansi rekapitulasi gaji bulanan dan tahunan seluruh karyawan.</p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
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
            className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-500">Memuat rekap gaji...</div>
      ) : !rekap ? (
        <div className="py-20 text-center text-slate-500">Gagal memuat rekap.</div>
      ) : (
        <>
          {/* Exact Text Format Block requested by user prompt */}
          <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-6 font-mono text-xs sm:text-sm text-slate-300 shadow-xl space-y-2">
            <div className="text-indigo-400 font-bold text-base mb-3 border-b border-slate-800 pb-2">
              === REKAP GAJI BULANAN ===
            </div>
            <div>=== Bulan : <span className="text-white font-bold">{monthName}</span>, Tahun : <span className="text-white font-bold">{year}</span> ===</div>
            <div>=== Total Chapter : <span className="text-white font-bold">{rekap.total_chapters}</span> ===</div>
            <div>=== Total Gaji : <span className="text-emerald-400 font-bold">Rp{rekap.total_gaji.toLocaleString('id-ID')}</span> ===</div>
            
            <div className="pt-2 text-indigo-400 font-bold border-b border-slate-800 pb-1">=== Per Role ===</div>
            {rekap.roles.map((r) => (
              <div key={r.role}>
                {r.role} : <span className="text-white font-bold">Rp{r.total_gaji.toLocaleString('id-ID')}</span> ({r.total_chapters} chapter)
              </div>
            ))}
            <div>=== Total (Jan - Des Tahun {year}) : <span className="text-emerald-400 font-bold">Rp{rekap.total_yearly.toLocaleString('id-ID')}</span> ===</div>
          </div>

          {/* Grid Cards Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {rekap.roles.map((r) => (
              <div key={r.role} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{r.role} Role</span>
                  <h3 className="text-2xl font-bold text-white mt-1">Rp{r.total_gaji.toLocaleString('id-ID')}</h3>
                  <p className="text-sm text-slate-400 mt-1">{r.total_chapters} Chapter diselesaikan</p>
                </div>
                <div className={`p-3 rounded-2xl ${
                  r.role === 'Translator' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                  r.role === 'Editor' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                  'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  <Award className="w-6 h-6" />
                </div>
              </div>
            ))}
          </div>

          {/* Per Anggota Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden space-y-4">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Per Anggota ({monthName} {year})</h3>
                <p className="text-xs text-slate-400 mt-0.5">Rincian chapter dan status pembayaran gaji per anggota.</p>
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
                  {rekap.members.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">Tidak ada anggota aktif.</td>
                    </tr>
                  ) : (
                    rekap.members.map((m, idx) => (
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
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Yearly Breakdown (Jan - Dec) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-white">Ringkasan Tahunan ({year})</h3>
            <p className="text-xs text-slate-400">Total pengeluaran gaji dari bulan Januari sampai Desember.</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 pt-2">
              {rekap.yearly_breakdown.map((item) => (
                <div key={item.month} className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3.5 text-center">
                  <span className="text-xs text-slate-400 block font-medium">{item.monthName}</span>
                  <span className="text-sm font-bold text-emerald-400 mt-1 block">
                    Rp{item.total.toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-sm">
              <span className="text-slate-400 font-medium">Total Pengeluaran Tahun {year}:</span>
              <span className="text-lg font-bold text-white">Rp{rekap.total_yearly.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
