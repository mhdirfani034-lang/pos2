/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { usePOS } from '../../context/POSContext';
import {
  Store,
  Clock,
  User,
  LogOut,
  ChevronDown,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

interface NavbarProps {
  onOpenLogin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenLogin }) => {
  const { currentUser, switchUser, users, logout, resetToDefaultData } = usePOS();
  const [currentTime, setCurrentTime] = useState<string>('');
  const [userMenuOpen, setUserMenuOpen] = useState<boolean>(false);

  // Live digital clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        new Intl.DateTimeFormat('id-ID', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }).format(now)
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 lg:px-6 py-2.5">
      <div className="flex items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-950 text-slate-950 font-black">
            <Store className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base lg:text-lg text-white tracking-tight">
                TokoKu <span className="text-emerald-400 font-semibold text-xs px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">POS</span>
              </h1>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              Sistem Penjualan &amp; Manajemen Ritel Modern
            </p>
          </div>
        </div>

        {/* Center: Live clock */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs font-mono text-slate-300">
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          <span>{currentTime || 'Memuat waktu...'}</span>
        </div>

        {/* Right: Active User Profile & Quick Switcher */}
        <div className="flex items-center gap-3">
          {/* Reset Demo Data Button */}
          <button
            onClick={resetToDefaultData}
            type="button"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition"
            title="Reset Database TokoKu ke Data Awal"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                type="button"
                className="flex items-center gap-2.5 p-1.5 pl-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-left transition select-none"
              >
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-bold text-white leading-tight">
                    {currentUser.nama}
                  </div>
                  <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 capitalize">
                    {currentUser.role === 'admin' ? (
                      <span className="text-purple-400 font-semibold">Admin (Pemilik)</span>
                    ) : (
                      <span className="text-emerald-400 font-semibold">Kasir Toko</span>
                    )}
                  </div>
                </div>

                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs uppercase shadow ${
                    currentUser.role === 'admin'
                      ? 'bg-purple-600 text-white'
                      : 'bg-emerald-500 text-slate-950'
                  }`}
                >
                  {currentUser.nama.slice(0, 2)}
                </div>

                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* User Switch Dropdown */}
              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-40 p-2 space-y-1 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-2 border-b border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                        Ganti Pengguna Cepat
                      </div>
                      <div className="text-xs text-slate-300 mt-0.5">
                        Pilih profil untuk menguji hak akses:
                      </div>
                    </div>

                    <div className="space-y-1 pt-1 max-h-56 overflow-y-auto">
                      {users.map((u) => {
                        const isSelected = currentUser.id_user === u.id_user;
                        const isInactive = u.status === 'nonaktif';

                        return (
                          <button
                            key={u.id_user}
                            type="button"
                            disabled={isInactive}
                            onClick={() => {
                              switchUser(u);
                              setUserMenuOpen(false);
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition ${
                              isInactive
                                ? 'opacity-40 cursor-not-allowed bg-slate-950/40 text-slate-500'
                                : isSelected
                                ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                                : 'hover:bg-slate-800 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${
                                  u.role === 'admin' ? 'bg-purple-400' : 'bg-emerald-400'
                                }`}
                              />
                              <span className="truncate">{u.nama}</span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 text-[10px]">
                              <span className="text-slate-400 capitalize">{u.role}</span>
                              {isInactive && (
                                <span className="text-rose-400 font-bold">(Nonaktif)</span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="pt-2 border-t border-slate-800">
                      <button
                        onClick={() => {
                          logout();
                          setUserMenuOpen(false);
                          onOpenLogin();
                        }}
                        type="button"
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-400 hover:text-white hover:bg-rose-500/20 rounded-xl transition"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Keluar (Logout)</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              type="button"
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              Masuk / Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
