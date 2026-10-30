/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Transaksi } from '../../types';
import { formatRupiah, formatTanggalLengkap, formatWaktu } from '../../utils/formatters';
import { Printer, X, CheckCircle2, Copy, Download, Store } from 'lucide-react';

interface ReceiptModalProps {
  receipt: Transaksi | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ receipt, onClose }) => {
  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const lines = [
      '========================================',
      '              TOKOKU POS               ',
      '      Minimarket & Retail Modern       ',
      '   Jl. Sudirman No. 88, Jakarta Selatan ',
      '           Telp: (021) 789-1234         ',
      '========================================',
      `No. Struk : ${receipt.nomor_invoice}`,
      `Tanggal   : ${formatTanggalLengkap(receipt.tanggal)}`,
      `Kasir     : ${receipt.kasir_nama}`,
      `Metode    : ${receipt.metode_pembayaran}`,
      '----------------------------------------',
      ...receipt.details.map(
        (d) =>
          `${d.nama_produk.padEnd(20).slice(0, 20)} ${d.jumlah}x ${formatRupiah(d.harga_satuan)} = ${formatRupiah(d.subtotal)}`
      ),
      '----------------------------------------',
      `TOTAL BELANJA : ${formatRupiah(receipt.total)}`,
      `BAYAR (${receipt.metode_pembayaran}): ${formatRupiah(receipt.bayar)}`,
      `KEMBALIAN     : ${formatRupiah(receipt.kembalian)}`,
      '========================================',
      ' Terima Kasih Telah Berbelanja di TokoKu',
      '   Barang yang sudah dibeli tidak dapat  ',
      '               ditukar                  ',
      '========================================',
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    alert('Teks struk berhasil disalin ke clipboard!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/50">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-white text-base">Struk Pembayaran</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Thermal Paper Style */}
        <div className="p-6 bg-slate-950 flex flex-col items-center">
          <div
            id="printable-receipt"
            className="w-full max-w-[340px] bg-white text-neutral-900 p-5 rounded-sm shadow-md font-mono-receipt text-xs leading-relaxed border-t-4 border-emerald-500 relative select-none"
          >
            {/* Toko Header */}
            <div className="text-center pb-3 border-b border-dashed border-neutral-300">
              <div className="flex items-center justify-center gap-1 font-bold text-sm tracking-wider uppercase text-neutral-900">
                <Store className="w-4 h-4 inline-block text-emerald-600" />
                <span>TOKOKU POS</span>
              </div>
              <p className="text-[11px] text-neutral-600 font-sans mt-0.5">Minimarket & Retail Modern</p>
              <p className="text-[10px] text-neutral-500 font-sans">Jl. Sudirman No. 88, Jakarta Selatan</p>
              <p className="text-[10px] text-neutral-500 font-sans">Telp: (021) 789-1234</p>
            </div>

            {/* Invoice Info */}
            <div className="py-2.5 border-b border-dashed border-neutral-300 text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="text-neutral-500">No. Struk:</span>
                <span className="font-bold text-neutral-800">{receipt.nomor_invoice}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Tanggal:</span>
                <span>{formatTanggalLengkap(receipt.tanggal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Kasir:</span>
                <span className="font-medium text-neutral-800">{receipt.kasir_nama}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Metode:</span>
                <span className="inline-block px-1.5 py-0.2 bg-neutral-100 rounded text-[10px] font-semibold">
                  {receipt.metode_pembayaran}
                </span>
              </div>
            </div>

            {/* Items List */}
            <div className="py-3 border-b border-dashed border-neutral-300 space-y-2 text-[11px]">
              {receipt.details.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="font-medium text-neutral-900 truncate">
                    {item.nama_produk}
                  </div>
                  <div className="flex justify-between text-neutral-600 text-[10px]">
                    <span>
                      {item.jumlah} x {formatRupiah(item.harga_satuan)}
                    </span>
                    <span className="font-semibold text-neutral-900">
                      {formatRupiah(item.subtotal)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="py-3 border-b border-dashed border-neutral-300 space-y-1 text-[11px]">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal ({receipt.details.reduce((a, b) => a + b.jumlah, 0)} item)</span>
                <span>{formatRupiah(receipt.total)}</span>
              </div>
              <div className="flex justify-between font-bold text-xs text-neutral-900 pt-1 border-t border-neutral-200">
                <span>TOTAL AKHIR</span>
                <span className="text-emerald-700">{formatRupiah(receipt.total)}</span>
              </div>
              <div className="flex justify-between text-neutral-700 pt-1">
                <span>Bayar ({receipt.metode_pembayaran})</span>
                <span>{formatRupiah(receipt.bayar)}</span>
              </div>
              <div className="flex justify-between font-semibold text-neutral-900">
                <span>Kembalian</span>
                <span className={receipt.kembalian > 0 ? 'text-emerald-600' : ''}>
                  {formatRupiah(receipt.kembalian)}
                </span>
              </div>
            </div>

            {/* Barcode & Footer */}
            <div className="pt-3 text-center space-y-2">
              <div className="flex flex-col items-center">
                {/* Visual barcode mockup */}
                <div className="h-9 flex items-center justify-center space-x-[2px] opacity-80 my-1">
                  {[4, 2, 6, 2, 5, 1, 7, 3, 2, 5, 2, 4, 1, 6, 3, 5, 2, 7, 4, 2, 3, 6, 1, 4, 3, 5, 2, 6].map((w, i) => (
                    <span
                      key={i}
                      className="inline-block bg-neutral-900 h-8"
                      style={{ width: `${w}px` }}
                    />
                  ))}
                </div>
                <span className="text-[9px] tracking-widest text-neutral-500">
                  {receipt.nomor_invoice}
                </span>
              </div>
              <p className="text-[10px] text-neutral-500 italic">
                Terima kasih atas kunjungan Anda!
              </p>
              <p className="text-[9px] text-neutral-400">
                Barang yang sudah dibeli tidak dapat ditukar atau dikembalikan
              </p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex flex-wrap gap-2 justify-between items-center">
          <button
            onClick={handleCopyText}
            type="button"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Salin Struk</span>
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              type="button"
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
            >
              Tutup
            </button>
            <button
              onClick={handlePrint}
              type="button"
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-lg shadow-lg shadow-emerald-950 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Struk (Print)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
