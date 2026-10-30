/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import {
  Store,
  Lock,
  User as UserIcon,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  ShieldAlert,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { login, currentUser } = usePOS();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen && currentUser) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const res = login(username, password);
    if (!res.success) {
      setErrorMessage(res.message);
    } else {
      onClose();
    }
  };

  const quickLogin = (u: string, p = '123') => {
    setUsername(u);
    setPassword(p);
    setErrorMessage(null);

    const res = login(u, p);
    if (!res.success) {
      setErrorMessage(res.message);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header Branding */}
        <div className="p-6 bg-gradient-to-b from-slate-800 to-slate-900 text-center border-b border-slate-800">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 mx-auto flex items-center justify-center shadow-xl shadow-emerald-950/60 text-slate-950 mb-3">
            <Store className="w-7 h-7 text-slate-950" />
          </div>
          <h2 className="text-xl font-black text-white">Sistem POS TokoKu</h2>
          <p className="text-xs text-slate-400 mt-1">
            Masuk ke sistem kasir &amp; manajemen penjualan
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5">
          {errorMessage && (
            <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Username Akun
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin / budi / siti"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Kata Sandi (Password)
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition cursor-pointer"
            >
              <span>Masuk ke Sistem</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Login Preset Buttons */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Akun Pengujian Demo (1-Klik Masuk):
            </span>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => quickLogin('admin')}
                className="p-2.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/60 text-purple-200 text-left transition"
              >
                <div className="font-bold flex items-center justify-between">
                  <span>Admin</span>
                  <span className="text-[9px] px-1 bg-purple-800/80 rounded">Pemilik</span>
                </div>
                <div className="text-[10px] text-purple-300/80 mt-0.5">user: admin | pass: 123</div>
              </button>

              <button
                type="button"
                onClick={() => quickLogin('budi')}
                className="p-2.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/60 text-emerald-200 text-left transition"
              >
                <div className="font-bold flex items-center justify-between">
                  <span>Budi</span>
                  <span className="text-[9px] px-1 bg-emerald-800/80 rounded">Kasir 1</span>
                </div>
                <div className="text-[10px] text-emerald-300/80 mt-0.5">user: budi | pass: 123</div>
              </button>

              <button
                type="button"
                onClick={() => quickLogin('siti')}
                className="p-2.5 rounded-xl bg-teal-950/40 hover:bg-teal-900/60 border border-teal-800/60 text-teal-200 text-left transition"
              >
                <div className="font-bold flex items-center justify-between">
                  <span>Siti</span>
                  <span className="text-[9px] px-1 bg-teal-800/80 rounded">Kasir 2</span>
                </div>
                <div className="text-[10px] text-teal-300/80 mt-0.5">user: siti | pass: 123</div>
              </button>

              <button
                type="button"
                onClick={() => quickLogin('ahmad')}
                className="p-2.5 rounded-xl bg-rose-950/30 hover:bg-rose-900/50 border border-rose-900/50 text-rose-300 text-left transition"
              >
                <div className="font-bold flex items-center justify-between">
                  <span>Ahmad</span>
                  <span className="text-[9px] px-1 bg-rose-900/80 rounded text-rose-200">Nonaktif</span>
                </div>
                <div className="text-[10px] text-rose-400/80 mt-0.5">Tes Tolak Login Nonaktif</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
