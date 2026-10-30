/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { usePOS } from '../../context/POSContext';
import {
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  History,
  ShieldCheck,
  UserCheck,
  Server,
} from 'lucide-react';

export type ActiveTab =
  | 'pos'
  | 'products'
  | 'users'
  | 'reports'
  | 'history'
  | 'laravel';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { currentUser } = usePOS();
  const isAdmin = currentUser?.role === 'admin';

  const menuItems = [
    {
      id: 'pos' as ActiveTab,
      label: 'Transaksi Kasir',
      icon: ShoppingCart,
      badge: 'Kasir & Admin',
      show: true,
    },
    {
      id: 'products' as ActiveTab,
      label: isAdmin ? 'Kelola Produk & Foto' : 'Katalog & Cek Stok',
      icon: Package,
      badge: isAdmin ? 'Admin' : 'Kasir',
      show: true,
    },
    {
      id: 'history' as ActiveTab,
      label: isAdmin ? 'Semua Riwayat Transaksi' : 'Riwayat Transaksi Saya',
      icon: History,
      badge: isAdmin ? 'Semua' : 'Sendiri',
      show: true,
    },
    {
      id: 'reports' as ActiveTab,
      label: 'Laporan Penjualan',
      icon: TrendingUp,
      badge: 'Admin Only',
      show: isAdmin, // Only shown to admin
    },
    {
      id: 'users' as ActiveTab,
      label: 'Kelola Akun Kasir',
      icon: Users,
      badge: 'Admin Only',
      show: isAdmin, // Only shown to admin
    },
    {
      id: 'laravel' as ActiveTab,
      label: 'Backend Laravel 11',
      icon: Server,
      badge: 'API & ORM',
      show: true,
    },
  ];

  return (
    <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 p-4 flex flex-col justify-between shrink-0">
      <div className="space-y-6">
        {/* Role identifier badge */}
        <div className="p-3 bg-slate-800/80 border border-slate-700/60 rounded-xl flex items-center gap-2.5">
          {isAdmin ? (
            <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg">
              <ShieldCheck className="w-4 h-4" />
            </div>
          ) : (
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <UserCheck className="w-4 h-4" />
            </div>
          )}
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              Hak Akses Aktif
            </span>
            <span className="font-bold text-xs text-white truncate block">
              {isAdmin ? 'Admin / Pemilik Toko' : 'Kasir Shift Aktif'}
            </span>
          </div>
        </div>

        {/* Navigation menu list */}
        <nav className="space-y-1.5">
          <div className="px-3 pb-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Menu Utama
          </div>

          {menuItems
            .filter((m) => m.show)
            .map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>

                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold tracking-tight ${
                      isActive
                        ? 'bg-slate-950/20 text-slate-950'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                </button>
              );
            })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
        <div className="flex justify-between">
          <span>Framework:</span>
          <span className="text-rose-400 font-semibold font-mono">Laravel 11 API</span>
        </div>
        <div className="flex justify-between">
          <span>Status Database:</span>
          <span className="text-emerald-400 font-medium">Tersimpan Lokal</span>
        </div>
      </div>
    </aside>
  );
};
