import React, { useState } from 'react';
import { Send, CheckCircle2, AlertCircle, BookOpen, User, Briefcase, Hash } from 'lucide-react';
import { Role } from '../types';

export const PublicLaporan: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const [nickname, setNickname] = useState('');
  const [role, setRole] = useState<Role>('Translator');
  const [title, setTitle] = useState('');
  const [chapters, setChapters] = useState<string[]>(['']);
  const [workDate, setWorkDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [discordFormatMessage, setDiscordFormatMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const handleChapterChange = (index: number, value: string) => {
    const newChapters = [...chapters];
    newChapters[index] = value;
    setChapters(newChapters);
  };

  const addChapterField = () => {
    setChapters([...chapters, '']);
  };

  const removeChapterField = (index: number) => {
    if (chapters.length === 1) return;
    const newChapters = chapters.filter((_, i) => i !== index);
    setChapters(newChapters);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');
    setDiscordFormatMessage('');
    setCopied(false);

    try {
      const validChapters = chapters.map(c => Number(c)).filter(c => !isNaN(c) && c > 0);
      if (validChapters.length === 0) {
        throw new Error('Masukkan setidaknya satu nomor chapter yang valid');
      }

      for (const ch of validChapters) {
        const res = await fetch('/api/work-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nickname,
            role,
            title,
            chapter: ch,
            work_date: workDate
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Gagal mengirim laporan');
      }

      const sortedCh = [...validChapters].sort((a, b) => a - b);
      let chapterStr = '';
      if (sortedCh.length === 1) {
        chapterStr = `Chapter ${sortedCh[0]}`;
      } else {
        const minCh = sortedCh[0];
        const maxCh = sortedCh[sortedCh.length - 1];
        chapterStr = `Chapter ${minCh}-${maxCh}`;
      }

      const titleSlug = title.trim().replace(/\s+/g, '-');
      const discordText = `#${titleSlug}, ${role}, ${chapterStr} Done, <@807916985831784459>`;
      setDiscordFormatMessage(discordText);
      setSuccessMessage('Laporan berhasil dikirim dan tercatat di Catatan Laporan (Logs)!');
      setNickname('');
      setTitle('');
      setChapters(['']);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyDiscord = () => {
    if (!discordFormatMessage) return;
    navigator.clipboard.writeText(discordFormatMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
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

          {discordFormatMessage && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-indigo-500/10 border border-indigo-500/30 p-5 rounded-2xl space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-indigo-300">Format Pesan untuk Discord (#report-by-dc):</span>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={handleCopyDiscord}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-lg shadow-indigo-600/30 flex items-center space-x-1.5"
                    >
                      <span>Salin Teks</span>
                    </button>
                    {copied && (
                      <div className="absolute -top-10 right-0 bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-xl shadow-xl flex items-center space-x-1.5 animate-bounce whitespace-nowrap z-10 border border-emerald-400/30">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                        <span>Berhasil Disalin!</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl font-mono text-xs text-indigo-200 select-all border border-indigo-500/20 break-all">
                  {discordFormatMessage}
                </div>
              </div>
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

          <div>
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
              <span>Chapter</span>
            </label>
            <div className="space-y-3">
              {chapters.map((ch, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    required
                    value={ch}
                    onChange={(e) => handleChapterChange(idx, e.target.value)}
                    placeholder={`Nomor Chapter (cth: ${10 + idx})`}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  {chapters.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeChapterField(idx)}
                      className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                      title="Hapus Chapter"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addChapterField}
              className="mt-3 text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 transition-colors"
            >
              <span>+ Chapter Lain</span>
            </button>
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
