import React, { useState, useEffect } from 'react';
import { MessageSquare, Save, CheckCircle2, Send, Terminal } from 'lucide-react';
import { DiscordSettingsData, DiscordLog } from '../../types';

export const AdminDiscord: React.FC = () => {
  const [settings, setSettings] = useState<DiscordSettingsData | null>(null);
  const [logs, setLogs] = useState<DiscordLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  
  // Test command simulator
  const [testCommand, setTestCommand] = useState('rekap');
  const [testOutput, setTestOutput] = useState('');

  const fetchDiscord = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/discord/settings');
      const data = await res.json();
      setSettings(data.settings);
      setLogs(data.logs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscord();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSuccess('');
    try {
      const res = await fetch('/api/discord/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (!res.ok) throw new Error('Gagal menyimpan konfigurasi Discord');
      setSuccess('Konfigurasi Discord berhasil disimpan!');
      fetchDiscord();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleTestCommand = async () => {
    try {
      const res = await fetch('/api/discord/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: testCommand })
      });
      const data = await res.json();
      setTestOutput(data.data?.content || JSON.stringify(data));
    } catch (err: any) {
      setTestOutput(`Error: ${err.message}`);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-slate-500">Memuat integrasi Discord...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Integrasi Discord</h1>
        <p className="text-slate-400 text-sm">Kelola Discord Webhook untuk notifikasi otomatis dan Discord Slash Commands.</p>
      </div>

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-4 rounded-xl flex items-center space-x-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-sm">{success}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-lg font-bold text-white">Konfigurasi Webhook & Bot</h3>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Discord Webhook URL</label>
              <input
                type="url"
                value={settings?.webhook_url || ''}
                onChange={(e) => setSettings({ ...settings!, webhook_url: e.target.value })}
                placeholder="https://discord.com/api/webhooks/..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Application ID</label>
                <input
                  type="text"
                  value={settings?.application_id || ''}
                  onChange={(e) => setSettings({ ...settings!, application_id: e.target.value })}
                  placeholder="Discord App ID"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Guild ID (Server)</label>
                <input
                  type="text"
                  value={settings?.guild_id || ''}
                  onChange={(e) => setSettings({ ...settings!, guild_id: e.target.value })}
                  placeholder="Discord Guild ID"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Bot Token</label>
              <input
                type="password"
                value={settings?.bot_token || ''}
                onChange={(e) => setSettings({ ...settings!, bot_token: e.target.value })}
                placeholder="Discord Bot Token"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <input
                type="checkbox"
                id="enabled"
                checked={settings?.enabled === 1}
                onChange={(e) => setSettings({ ...settings!, enabled: e.target.checked ? 1 : 0 })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-800 border-slate-700"
              />
              <label htmlFor="enabled" className="text-sm font-medium text-slate-300">Aktifkan Notifikasi Discord Otomatis</label>
            </div>

            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Konfigurasi</span>
            </button>
          </form>
        </div>

        {/* Slash Command Simulator */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center space-x-2">
            <Terminal className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-white">Simulator Discord Slash Commands</h3>
          </div>
          <p className="text-xs text-slate-400">Uji respons Discord Interactions slash commands secara langsung.</p>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Pilih Slash Command</label>
              <select
                value={testCommand}
                onChange={(e) => setTestCommand(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="rekap">/rekap - Ringkasan gaji bulan berjalan</option>
                <option value="anggota">/anggota - Daftar karyawan aktif</option>
                <option value="pending">/pending - Laporan pending review</option>
              </select>
            </div>

            <button
              onClick={handleTestCommand}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium px-4 py-2.5 rounded-xl transition-all flex items-center space-x-2 text-sm"
            >
              <Send className="w-4 h-4" />
              <span>Jalankan Command</span>
            </button>

            {testOutput && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-indigo-300 whitespace-pre-wrap mt-2">
                {testOutput}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Discord Logs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden space-y-3">
        <div className="p-6 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white">Riwayat Notifikasi Discord</h3>
          <p className="text-xs text-slate-400 mt-0.5">Catatan pengiriman webhook dan interaksi bot.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/50 border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">Waktu</th>
                <th className="py-3.5 px-4">Tipe Event</th>
                <th className="py-3.5 px-4">Payload</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm text-slate-300 font-mono text-xs">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500 font-sans">Belum ada log Discord.</td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 text-slate-400">{l.sent_at}</td>
                    <td className="py-3 px-4 text-indigo-400 font-bold">{l.type}</td>
                    <td className="py-3 px-4 text-slate-300 max-w-xs truncate">{l.payload}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-xs font-sans">
                        {l.status}
                      </span>
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
