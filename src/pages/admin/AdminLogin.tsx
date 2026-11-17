import React, { useState } from 'react';
import { Shield, Lock, User, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminLogin: React.FC<{ onLoginSuccess: () => void }> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login gagal');

      login(data.token, data.user);
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Username atau password salah');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="bg-indigo-600/10 border border-indigo-500/30 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto text-indigo-400">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Admin Portal Login</h1>
          <p className="text-sm text-slate-400">Masuk untuk mengelola gaji, karyawan, dan laporan komik.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-3.5 rounded-xl flex items-center space-x-2 text-sm">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Username</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                placeholder="Username admin"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                placeholder="Password"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">Default: admin / admin123</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
          >
            {loading ? 'Memproses...' : 'Masuk Admin Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
};
