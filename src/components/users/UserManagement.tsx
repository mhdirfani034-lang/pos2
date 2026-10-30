/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { User, UserRole, UserStatus } from '../../types';
import {
  Users,
  UserPlus,
  ShieldCheck,
  UserCheck,
  UserX,
  Edit2,
  Trash2,
  X,
  Lock,
  Phone,
  Mail,
  AlertCircle,
  KeyRound,
} from 'lucide-react';

export const UserManagement: React.FC = () => {
  const { users, addUser, updateUser, toggleUserStatus, deleteUser, currentUser, transactions } =
    usePOS();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form states
  const [nama, setNama] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('123');
  const [role, setRole] = useState<UserRole>('kasir');
  const [status, setStatus] = useState<UserStatus>('aktif');
  const [email, setEmail] = useState('');
  const [telepon, setTelepon] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const openAddModal = () => {
    setEditingUser(null);
    setNama('');
    setUsername('');
    setPassword('123');
    setRole('kasir');
    setStatus('aktif');
    setEmail('');
    setTelepon('');
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setNama(u.nama);
    setUsername(u.username);
    setPassword(u.password || '');
    setRole(u.role);
    setStatus(u.status);
    setEmail(u.email || '');
    setTelepon(u.telepon || '');
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim() || !username.trim()) {
      setErrorMessage('Nama lengkap dan username wajib diisi.');
      return;
    }

    // Check username uniqueness
    const normalizedUser = username.trim().toLowerCase();
    const existing = users.find(
      (u) =>
        u.username.toLowerCase() === normalizedUser &&
        (!editingUser || u.id_user !== editingUser.id_user)
    );

    if (existing) {
      setErrorMessage(`Username "${username}" sudah digunakan oleh pengguna lain.`);
      return;
    }

    if (editingUser) {
      updateUser(editingUser.id_user, {
        nama: nama.trim(),
        username: normalizedUser,
        password: password.trim() || '123',
        role,
        status,
        email: email.trim(),
        telepon: telepon.trim(),
      });
    } else {
      addUser({
        nama: nama.trim(),
        username: normalizedUser,
        password: password.trim() || '123',
        role,
        status,
        email: email.trim(),
        telepon: telepon.trim(),
      });
    }

    setIsModalOpen(false);
  };

  const handleDelete = (u: User) => {
    if (confirm(`Apakah Anda yakin ingin menghapus akun "${u.nama}"?`)) {
      const res = deleteUser(u.id_user);
      if (!res.success) {
        alert(res.message);
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-400" />
            Kelola Akun Kasir & Pengguna
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Hak akses sistem, manajemen staf kasir TokoKu, dan kontrol status aktif / nonaktif
          </p>
        </div>

        <button
          onClick={openAddModal}
          type="button"
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-950 transition self-start sm:self-auto cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Akun Kasir</span>
        </button>
      </div>

      {/* Info Card per UML Spec */}
      <div className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-xl text-xs text-slate-300 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-white">Prinsip Keamanan Sistem TokoKu (RBAC Users):</span>
          <p className="text-slate-400 mt-0.5">
            Akun bertipe <strong className="text-emerald-400">Kasir</strong> hanya dapat melakukan transaksi penjualan dan melihat riwayat transaksinya sendiri.
            Jika akun diset <strong className="text-rose-400">Nonaktif</strong>, pengguna tersebut tidak akan dapat login ke dalam sistem POS.
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-700">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Pengguna & Username</th>
                <th className="py-3.5 px-4 font-semibold">Peran (Role)</th>
                <th className="py-3.5 px-4 font-semibold">Status Akun</th>
                <th className="py-3.5 px-4 font-semibold">Transaksi Diproses</th>
                <th className="py-3.5 px-4 font-semibold">Kontak</th>
                <th className="py-3.5 px-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {users.map((u) => {
                const isCurrent = currentUser?.id_user === u.id_user;
                const userTrxCount = transactions.filter((t) => t.id_user === u.id_user).length;

                return (
                  <tr
                    key={u.id_user}
                    className="hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs uppercase shadow ${
                            u.role === 'admin'
                              ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                              : 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                          }`}
                        >
                          {u.nama.slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-semibold text-white text-sm flex items-center gap-1.5">
                            <span>{u.nama}</span>
                            {isCurrent && (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                                Anda
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-slate-400 text-[11px]">
                            @{u.username}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {u.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 text-[11px] font-semibold">
                          <ShieldCheck className="w-3 h-3 text-purple-400" /> Admin (Pemilik)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-300 text-[11px] font-semibold">
                          <UserCheck className="w-3 h-3 text-sky-400" /> Kasir Toko
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {u.status === 'aktif' ? (
                        <button
                          onClick={() => toggleUserStatus(u.id_user)}
                          type="button"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-bold hover:bg-emerald-500/30 transition cursor-pointer"
                          title="Klik untuk nonaktifkan"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>Aktif</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => toggleUserStatus(u.id_user)}
                          type="button"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 text-[11px] font-bold hover:bg-rose-500/30 transition cursor-pointer"
                          title="Klik untuk aktifkan"
                        >
                          <UserX className="w-3 h-3 text-rose-400" />
                          <span>Nonaktif</span>
                        </button>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-white text-xs">
                        {userTrxCount} transaksi
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 text-[11px] space-y-0.5">
                      {u.telepon && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span>{u.telepon}</span>
                        </div>
                      )}
                      {u.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-500" />
                          <span>{u.email}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(u)}
                          type="button"
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                          title="Edit Pengguna"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          disabled={isCurrent}
                          onClick={() => handleDelete(u)}
                          type="button"
                          className={`p-1.5 rounded-lg border transition ${
                            isCurrent
                              ? 'bg-slate-900/40 text-slate-600 border-slate-800 cursor-not-allowed'
                              : 'bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border-slate-700 hover:border-rose-800'
                          }`}
                          title={isCurrent ? 'Tidak dapat menghapus akun Anda sendiri' : 'Hapus Akun'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-6">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/40">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                {editingUser ? 'Edit Akun Pengguna' : 'Tambah Akun Kasir Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Nama Lengkap <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Contoh: Rian Pratama"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Username <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="rian"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Kata Sandi (Password) <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="123"
                      className="w-full pl-9 pr-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Peran (Role)
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="kasir">Kasir</option>
                    <option value="admin">Admin (Pemilik Toko)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Status Akun
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as UserStatus)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="aktif">Aktif (Bisa Login)</option>
                    <option value="nonaktif">Nonaktif (Dilarang Login)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Nomor HP / WhatsApp
                </label>
                <input
                  type="text"
                  value={telepon}
                  onChange={(e) => setTelepon(e.target.value)}
                  placeholder="08..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Email (Opsional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@tokoku.id"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-bold shadow-lg transition"
                >
                  {editingUser ? 'Simpan Perubahan' : 'Buat Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
