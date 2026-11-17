import React, { useState } from 'react';
import { Send, CheckCircle2, AlertCircle, BookOpen, User, Briefcase, Hash } from 'lucide-react';
import { Role } from '../types';

export const PublicLaporan: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const [nickname, setNickname] = useState('');
  const [role, setRole] = useState<Role>('Translator');
  const [title, setTitle] = useState('');
  const [chapter, setChapter] = useState('');
  const [workDate, setWorkDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const res = await fetch('/api/work-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname,
          role,
          title,
          chapter: Number(chapter),
          work_date: workDate
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengirim laporan');

      if (data.status === 'PENDING_REVIEW') {
        setSuccessMessage('Laporan berhasil dikirim! Namun nickname Anda tidak terdaftar persis di sistem dan ditandai untuk verifikasi admin (Pending Review).');
      } else {
        setSuccessMessage('Laporan pekerjaan berhasil dikirim, tercatat di database, dan notifikasi dikirim ke Discord!');
      }

      setNickname('');
      setTitle('');
      setChapter('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white">
          <div className="flex items-center space-x-3">
            <div className="bg-white/10 p-3 rounded-xl backdrop-blur-md">
              <Send className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Kirim Laporan Pekerjaan</h1>
              <p className="text-indigo-100 text-sm mt-1">
                Formulir pengiriman laporan chapter penerjemah dan editor komik.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {successMessage && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-4 rounded-xl flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-sm">{successMessage}</div>
            </div>
          )}

          {errorMessage && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-xl flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="text-sm">{errorMessage}</div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center space-x-1.5">
                <User className="w-4 h-4 text-indigo-400" />
                <span>Nickname Karyawan</span>
              </label>
              <input
                type="text"
                required
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Contoh: Andi"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <p className="text-xs text-slate-500 mt-1">Pastikan nickname sesuai dengan data terdaftar.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center space-x-1.5">
                <Briefcase className="w-4 h-4 text-indigo-400" />
                <span>Role Pekerjaan</span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="Translator">Translator (Rp3.000 / ch)</option>
                <option value="Editor">Editor (Rp3.000 / ch)</option>
                <option value="Solo">Solo (Rp6.000 / ch)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center space-x-1.5">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span>Judul Komik</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Solo Leveling Season 2"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center space-x-1.5">
                <Hash className="w-4 h-4 text-indigo-400" />
                <span>Jumlah Chapter</span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={chapter}
                onChange={(e) => setChapter(e.target.value)}
                placeholder="Contoh: 5"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Tanggal Pekerjaan</label>
            <input
              type="date"
              required
              value={workDate}
              onChange={(e) => setWorkDate(e.target.value)}
              className="w-full sm:w-1/2 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="pt-4 flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={() => onNavigate('logs')}
              className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 font-medium transition-colors"
            >
              Lihat Logs Laporan
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Mengirim...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Kirim Laporan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
