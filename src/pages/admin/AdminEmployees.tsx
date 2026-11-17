import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Search, Shield, Trash2, Edit3, CheckCircle, XCircle } from 'lucide-react';
import { Employee, Role } from '../../types';

export const AdminEmployees: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [nickname, setNickname] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<Role>('Translator');
  const [status, setStatus] = useState('active');
  const [joinedDate, setJoinedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/employees');
      const data = await res.json();
      setEmployees(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleOpenAdd = () => {
    setEditingEmp(null);
    setNickname('');
    setUsername('');
    setRole('Translator');
    setStatus('active');
    setJoinedDate(new Date().toISOString().split('T')[0]);
    setError('');
    setModalOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmp(emp);
    setNickname(emp.nickname);
    setUsername(emp.username || '');
    setRole(emp.role);
    setStatus(emp.status);
    setJoinedDate(emp.joined_date || new Date().toISOString().split('T')[0]);
    setError('');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const url = editingEmp ? `/api/employees/${editingEmp.id}` : '/api/employees';
      const method = editingEmp ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname, username, role, status, joined_date: joinedDate })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan karyawan');

      setModalOpen(false);
      fetchEmployees();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menonaktifkan karyawan ini?')) return;
    try {
      const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menonaktifkan karyawan');
      fetchEmployees();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const matchSearch = emp.nickname.toLowerCase().includes(search.toLowerCase()) || (emp.username && emp.username.toLowerCase().includes(search.toLowerCase()));
    const matchRole = roleFilter === 'All' || emp.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Manajemen Karyawan</h1>
          <p className="text-slate-400 text-sm">Tambah, edit, dan kelola akun penerjemah serta editor.</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-600/30 flex items-center space-x-2 self-start"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Karyawan</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder="Cari berdasarkan nickname atau username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="All">Semua Role</option>
          <option value="Translator">Translator</option>
          <option value="Editor">Editor</option>
          <option value="Solo">Solo</option>
        </select>
      </div>

      {/* Employees Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/50 border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">Nickname</th>
                <th className="py-3.5 px-4">Username</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4 text-center">Total Chapter</th>
                <th className="py-3.5 px-4 text-right">Total Penghasilan</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">Memuat karyawan...</td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">Tidak ada karyawan ditemukan.</td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">{emp.nickname}</td>
                    <td className="py-3.5 px-4 text-slate-400">@{emp.username || '-'}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        emp.role === 'Translator' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        emp.role === 'Editor' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                        'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {emp.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold text-white">{emp.total_chapters || 0}</td>
                    <td className="py-3.5 px-4 text-right font-semibold text-emerald-400">
                      Rp{(emp.total_earnings || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        emp.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center space-x-2">
                      <button
                        onClick={() => handleOpenEdit(emp)}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        title="Edit Karyawan"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(emp.id)}
                        className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                        title="Nonaktifkan Karyawan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">
              {editingEmp ? 'Edit Karyawan' : 'Tambah Karyawan Baru'}
            </h3>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Nickname (Unik)</label>
                <input
                  type="text"
                  required
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Contoh: Andi"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Username / Discord Tag</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Contoh: andi#1234"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Role Pekerjaan</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Translator">Translator</option>
                  <option value="Editor">Editor</option>
                  <option value="Solo">Solo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Status Akun</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Tanggal Bergabung</label>
                <input
                  type="date"
                  required
                  value={joinedDate}
                  onChange={(e) => setJoinedDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-lg shadow-indigo-600/30"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
