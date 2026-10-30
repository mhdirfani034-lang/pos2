/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { usePOS } from '../../context/POSContext';
import { Transaksi } from '../../types';
import { formatRupiah, formatTanggalLengkap } from '../../utils/formatters';
import {
  History,
  Search,
  Printer,
  ChevronDown,
  ChevronUp,
  Receipt,
  UserCheck,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

export const TransactionHistory: React.FC = () => {
  const { transactions, currentUser, setActiveReceipt } = usePOS();

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const isKasir = currentUser?.role === 'kasir';

  // Filter transactions
  const displayedTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // If cashier, only show their own transactions per UML specification
      if (isKasir && t.id_user !== currentUser?.id_user) {
        return false;
      }

      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;

      const matchInvoice = t.nomor_invoice.toLowerCase().includes(q);
      const matchKasir = t.kasir_nama.toLowerCase().includes(q);
      const matchItems = t.details.some((d) =>
        d.nama_produk.toLowerCase().includes(q)
      );

      return matchInvoice || matchKasir || matchItems;
    });
  }, [transactions, currentUser, isKasir, searchQuery]);

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <History className="w-6 h-6 text-emerald-400" />
            {isKasir ? 'Riwayat Transaksi Saya' : 'Riwayat Semua Transaksi Toko'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isKasir
              ? `Menampilkan riwayat penjualan yang diproses oleh akun kasir: ${currentUser?.nama}`
              : 'Daftar seluruh transaksi kasir yang tercatat dalam database sistem TokoKu'}
          </p>
        </div>

        {isKasir && (
          <div className="px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 self-start sm:self-auto">
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Shift Kasir: Riwayat Transaksi Sendiri</span>
          </div>
        )}
      </div>

      {/* Search Input */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nomor invoice (TRX-...), nama barang, atau nama kasir..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <span className="text-xs text-slate-400 whitespace-nowrap">
          {displayedTransactions.length} transaksi ditemukan
        </span>
      </div>

      {/* Transactions Table & Accordion Details */}
      <div className="space-y-3">
        {displayedTransactions.length === 0 ? (
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-12 text-center">
            <History className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h4 className="text-slate-300 font-semibold">Tidak ada riwayat transaksi</h4>
            <p className="text-slate-500 text-xs mt-1">
              {isKasir
                ? 'Anda belum memiliki transaksi tersimpan pada sesi ini.'
                : 'Belum ada transaksi yang sesuai dengan kata kunci pencarian.'}
            </p>
          </div>
        ) : (
          displayedTransactions.map((trx) => {
            const isExpanded = expandedId === trx.id_transaksi;
            const totalItemsCount = trx.details.reduce((sum, d) => sum + d.jumlah, 0);

            return (
              <div
                key={trx.id_transaksi}
                className="bg-slate-800/80 border border-slate-700/80 rounded-xl overflow-hidden shadow-md transition"
              >
                {/* Main Row Summary */}
                <div
                  onClick={() => toggleExpand(trx.id_transaksi)}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer hover:bg-slate-700/40 select-none transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-emerald-400">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white text-sm">
                          {trx.nomor_invoice}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold">
                          {trx.metode_pembayaran}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span>{formatTanggalLengkap(trx.tanggal)}</span>
                        <span>&bull;</span>
                        <span>Kasir: {trx.kasir_nama}</span>
                        <span>&bull;</span>
                        <span>{totalItemsCount} item</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-2 md:pt-0 border-slate-700/60">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] text-slate-400 block">Total Transaksi</span>
                      <span className="text-base font-extrabold text-emerald-400">
                        {formatRupiah(trx.total)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveReceipt(trx);
                        }}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-emerald-600 hover:text-white text-slate-300 rounded-lg text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5"
                        title="Cetak Ulang Struk"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Cetak Struk</span>
                      </button>

                      <div className="text-slate-400 p-1">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div className="p-4 bg-slate-900/90 border-t border-slate-700/80 space-y-3">
                    <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Rincian Barang Belanja (Detail Transaksi)
                    </h5>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-slate-950 text-slate-500 uppercase text-[10px]">
                          <tr>
                            <th className="py-2 px-3">Nama Produk</th>
                            <th className="py-2 px-3">Kategori</th>
                            <th className="py-2 px-3 text-right">Harga Satuan</th>
                            <th className="py-2 px-3 text-center">Jumlah</th>
                            <th className="py-2 px-3 text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {trx.details.map((d) => (
                            <tr key={d.id_detail}>
                              <td className="py-2 px-3 font-medium text-white">
                                {d.nama_produk}
                              </td>
                              <td className="py-2 px-3 text-slate-400">
                                {d.kategori || '-'}
                              </td>
                              <td className="py-2 px-3 text-right">
                                {formatRupiah(d.harga_satuan)}
                              </td>
                              <td className="py-2 px-3 text-center font-bold">
                                {d.jumlah}
                              </td>
                              <td className="py-2 px-3 text-right font-semibold text-emerald-400">
                                {formatRupiah(d.subtotal)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex flex-wrap justify-between items-center text-xs text-slate-400">
                      <div>
                        {trx.catatan && (
                          <span>Catatan: <strong className="text-slate-200">{trx.catatan}</strong></span>
                        )}
                      </div>
                      <div className="flex gap-4">
                        <span>
                          Bayar: <strong className="text-white">{formatRupiah(trx.bayar)}</strong>
                        </span>
                        <span>
                          Kembalian: <strong className="text-emerald-400">{formatRupiah(trx.kembalian)}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
