/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { usePOS } from '../../context/POSContext';
import { formatRupiah, formatAngka, formatTanggal, formatTanggalLengkap } from '../../utils/formatters';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  CreditCard,
  Download,
  Printer,
  Calendar,
  Layers,
  Award,
  ChevronRight,
  Eye,
} from 'lucide-react';

type PeriodFilter = 'today' | 'yesterday' | 'week' | 'month' | 'all';

export const SalesReport: React.FC = () => {
  const { transactions, products, setActiveReceipt } = usePOS();

  const [period, setPeriod] = useState<PeriodFilter>('week');
  const [selectedCashier, setSelectedCashier] = useState<string>('all');

  // Filter transactions based on date period & cashier
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return transactions.filter((trx) => {
      const trxDate = new Date(trx.tanggal);

      let matchPeriod = true;
      if (period === 'today') {
        matchPeriod = trxDate >= startOfToday;
      } else if (period === 'yesterday') {
        const startOfYesterday = new Date(startOfToday);
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);
        matchPeriod = trxDate >= startOfYesterday && trxDate < startOfToday;
      } else if (period === 'week') {
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        matchPeriod = trxDate >= sevenDaysAgo;
      } else if (period === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        matchPeriod = trxDate >= startOfMonth;
      }

      const matchCashier =
        selectedCashier === 'all' || trx.kasir_username === selectedCashier;

      return matchPeriod && matchCashier;
    });
  }, [transactions, period, selectedCashier]);

  // Aggregate Metrics
  const totalOmzet = filteredTransactions.reduce((sum, t) => sum + t.total, 0);
  const totalTrxCount = filteredTransactions.length;
  const avgBasketSize = totalTrxCount > 0 ? Math.round(totalOmzet / totalTrxCount) : 0;
  
  const totalItemsSold = filteredTransactions.reduce(
    (sum, t) => sum + t.details.reduce((itemSum, d) => itemSum + d.jumlah, 0),
    0
  );

  // Payment method breakdown
  const paymentBreakdown = useMemo(() => {
    const counts: Record<string, { total: number; count: number }> = {
      Tunai: { total: 0, count: 0 },
      QRIS: { total: 0, count: 0 },
      'Debit/Transfer': { total: 0, count: 0 },
    };

    filteredTransactions.forEach((t) => {
      if (!counts[t.metode_pembayaran]) {
        counts[t.metode_pembayaran] = { total: 0, count: 0 };
      }
      counts[t.metode_pembayaran].total += t.total;
      counts[t.metode_pembayaran].count += 1;
    });

    return counts;
  }, [filteredTransactions]);

  // Best Selling Products calculation
  const bestSellers = useMemo(() => {
    const itemMap: Record<number, { nama: string; qty: number; revenue: number; kategori: string }> = {};

    filteredTransactions.forEach((t) => {
      t.details.forEach((d) => {
        if (!itemMap[d.id_produk]) {
          itemMap[d.id_produk] = {
            nama: d.nama_produk,
            qty: 0,
            revenue: 0,
            kategori: d.kategori || 'Umum',
          };
        }
        itemMap[d.id_produk].qty += d.jumlah;
        itemMap[d.id_produk].revenue += d.subtotal;
      });
    });

    return Object.values(itemMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [filteredTransactions]);

  // Export CSV
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      alert('Tidak ada transaksi untuk diekspor pada periode ini.');
      return;
    }

    const headers = [
      'No Invoice',
      'Tanggal',
      'Kasir',
      'Metode Bayar',
      'Total (Rp)',
      'Uang Bayar (Rp)',
      'Kembalian (Rp)',
      'Jumlah Rincian Barang',
    ];

    const rows = filteredTransactions.map((t) => [
      t.nomor_invoice,
      `"${formatTanggalLengkap(t.tanggal)}"`,
      `"${t.kasir_nama}"`,
      t.metode_pembayaran,
      t.total,
      t.bayar,
      t.kembalian,
      t.details.reduce((s, d) => s + d.jumlah, 0),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Penjualan_TokoKu_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
            Laporan & Rekap Penjualan
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Analisis omzet, rekap transaksi, dan statistik barang terlaris TokoKu
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportCSV}
            type="button"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Ekspor CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            type="button"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Rekap</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-xs text-slate-400 mr-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> Periode:
          </span>
          {[
            { id: 'today', label: 'Hari Ini' },
            { id: 'yesterday', label: 'Kemarin' },
            { id: 'week', label: '7 Hari Terakhir' },
            { id: 'month', label: 'Bulan Ini' },
            { id: 'all', label: 'Semua Waktu' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setPeriod(item.id as PeriodFilter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                period === item.id
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Filter Kasir:</span>
          <select
            value={selectedCashier}
            onChange={(e) => setSelectedCashier(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">Semua Kasir</option>
            <option value="admin">Bambang (Admin)</option>
            <option value="budi">Budi Santoso</option>
            <option value="siti">Siti Rahmawati</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Omzet
            </span>
            <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-2">
            {formatRupiah(totalOmzet)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Hasil penjualan bersih
          </span>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Jumlah Transaksi
            </span>
            <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white mt-2">
            {formatAngka(totalTrxCount)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Struk kasir diterbitkan
          </span>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Item Terjual
            </span>
            <div className="p-2 bg-purple-500/20 rounded-xl text-purple-400">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-purple-300 mt-2">
            {formatAngka(totalItemsSold)} unit
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Produk keluar dari stok
          </span>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Rata-rata Belanja
            </span>
            <div className="p-2 bg-amber-500/20 rounded-xl text-amber-400">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-400 mt-2">
            {formatRupiah(avgBasketSize)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Nilai transaksi per pelanggan
          </span>
        </div>
      </div>

      {/* Middle Grid: Top Products & Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top 5 Best Sellers */}
        <div className="lg:col-span-2 bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-white text-sm">Produk Terlaris (Top 5)</h3>
            </div>
            <span className="text-xs text-slate-400">Berdasarkan kuantitas terjual</span>
          </div>

          {bestSellers.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              Belum ada data produk terjual pada periode ini.
            </div>
          ) : (
            <div className="space-y-3">
              {bestSellers.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-900/60 border border-slate-700/50 rounded-xl flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        idx === 0
                          ? 'bg-amber-500 text-slate-950'
                          : idx === 1
                          ? 'bg-slate-300 text-slate-950'
                          : idx === 2
                          ? 'bg-amber-700 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-white truncate">
                        {item.nama}
                      </h4>
                      <span className="text-[10px] text-slate-400">
                        Kategori: {item.kategori}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-emerald-400">
                      {formatRupiah(item.revenue)}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {item.qty} unit terjual
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Methods Breakdown */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              Metode Pembayaran
            </h3>

            <div className="space-y-3">
              {Object.entries(paymentBreakdown).map(([method, data]) => {
                const percentage = totalOmzet > 0 ? Math.round((data.total / totalOmzet) * 100) : 0;

                return (
                  <div key={method} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-300">{method}</span>
                      <span className="font-bold text-white">
                        {formatRupiah(data.total)} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          method === 'Tunai'
                            ? 'bg-emerald-500'
                            : method === 'QRIS'
                            ? 'bg-blue-500'
                            : 'bg-purple-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 block">
                      {data.count} transaksi
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 p-3 bg-slate-900/80 rounded-xl border border-slate-700/50 text-[11px] text-slate-400">
            Paling banyak digunakan:{' '}
            <strong className="text-emerald-400">
              {paymentBreakdown['Tunai'].count >= paymentBreakdown['QRIS'].count ? 'Tunai (Cash)' : 'QRIS'}
            </strong>
          </div>
        </div>
      </div>

      {/* Transactions Details Table for Selected Period */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-900/60 border-b border-slate-700 flex items-center justify-between">
          <h3 className="font-bold text-white text-sm">
            Daftar Transaksi Periode Ini ({filteredTransactions.length})
          </h3>
          <span className="text-xs text-slate-400">
            Klik nomor invoice untuk melihat dan mencetak struk
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-700">
              <tr>
                <th className="py-3 px-4 font-semibold">No. Invoice</th>
                <th className="py-3 px-4 font-semibold">Tanggal & Waktu</th>
                <th className="py-3 px-4 font-semibold">Kasir</th>
                <th className="py-3 px-4 font-semibold">Metode</th>
                <th className="py-3 px-4 font-semibold">Total Nilai</th>
                <th className="py-3 px-4 font-semibold text-right">Struk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Tidak ada transaksi pada periode yang dipilih.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((trx) => (
                  <tr
                    key={trx.id_transaksi}
                    className="hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                      {trx.nomor_invoice}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {formatTanggalLengkap(trx.tanggal)}
                    </td>
                    <td className="py-3 px-4 text-white font-medium">
                      {trx.kasir_nama}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 text-[10px]">
                        {trx.metode_pembayaran}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-white">
                      {formatRupiah(trx.total)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setActiveReceipt(trx)}
                        type="button"
                        className="px-2.5 py-1 rounded bg-slate-900 hover:bg-emerald-600 hover:text-white text-slate-300 border border-slate-700 transition inline-flex items-center gap-1 text-[11px]"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Lihat Struk</span>
                      </button>
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
