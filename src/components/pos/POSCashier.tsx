/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { usePOS } from '../../context/POSContext';
import { Produk, PaymentMethod } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import { INITIAL_CATEGORIES } from '../../data/initialData';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CheckCircle,
  AlertCircle,
  Barcode,
  Package,
  CreditCard,
  QrCode,
  Banknote,
  RotateCcw,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react';

export const POSCashier: React.FC = () => {
  const {
    products,
    cart,
    addToCart,
    updateCartQty,
    removeFromCart,
    clearCart,
    cartTotal,
    cartTotalItems,
    processCheckout,
    currentUser,
  } = usePOS();

  // Search & filter state
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [barcodeInput, setBarcodeInput] = useState<string>('');

  // Payment form state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Tunai');
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState<boolean>(false);

  // Filter products by category, name, or barcode
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCategory =
        selectedCategory === 'Semua' || p.kategori === selectedCategory;
      const query = searchQuery.trim().toLowerCase();
      const matchSearch =
        query === '' ||
        p.nama_produk.toLowerCase().includes(query) ||
        (p.barcode && p.barcode.includes(query)) ||
        p.kategori.toLowerCase().includes(query);
      return matchCategory && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Handle direct barcode submit
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const matched = products.find(
      (p) => p.barcode && p.barcode.trim() === barcodeInput.trim()
    );

    if (matched) {
      const res = addToCart(matched, 1);
      if (!res.success) {
        setCheckoutError(res.message || 'Gagal menambahkan produk');
      } else {
        setCheckoutError(null);
      }
      setBarcodeInput('');
    } else {
      setCheckoutError(`Produk dengan barcode "${barcodeInput}" tidak ditemukan.`);
    }
  };

  // Quick cash buttons
  const quickCashPresets = [
    { label: 'Uang Pas', amount: cartTotal },
    { label: 'Rp 10.000', amount: 10000 },
    { label: 'Rp 20.000', amount: 20000 },
    { label: 'Rp 50.000', amount: 50000 },
    { label: 'Rp 100.000', amount: 100000 },
    { label: 'Rp 200.000', amount: 200000 },
  ];

  // Auto set cashAmount when switching to QRIS or Debit
  const handleSelectPaymentMethod = (method: PaymentMethod) => {
    setPaymentMethod(method);
    if (method === 'QRIS' || method === 'Debit/Transfer') {
      setCashAmount(cartTotal);
    }
  };

  const kembalian = Math.max(0, cashAmount - cartTotal);
  const isCashInsufficient = paymentMethod === 'Tunai' && cashAmount < cartTotal && cartTotal > 0;

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError(null);

    const amountToPay = paymentMethod === 'Tunai' ? cashAmount : cartTotal;

    if (cart.length === 0) {
      setCheckoutError('Keranjang masih kosong!');
      return;
    }

    if (amountToPay < cartTotal) {
      setCheckoutError('Uang yang dibayarkan masih kurang.');
      return;
    }

    const res = processCheckout(amountToPay, paymentMethod, notes);
    if (!res.success) {
      setCheckoutError(res.message);
    } else {
      // Reset form
      setCashAmount(0);
      setNotes('');
      setCheckoutError(null);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full pb-8">
      {/* LEFT SECTION: Catalog, Search & Categories */}
      <div className="flex-1 flex flex-col min-w-0 space-y-4">
        {/* Top Controls: Search Bar & Barcode Simulator */}
        <div className="bg-slate-800/80 backdrop-blur border border-slate-700/60 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama produk, barcode, atau kategori..."
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                Hapus
              </button>
            )}
          </div>

          {/* Barcode Quick Entry */}
          <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
            <div className="relative">
              <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
              <input
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Scan / Input Barcode"
                className="pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-44"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
              title="Input Barcode"
            >
              Scan
            </button>
            <button
              type="button"
              onClick={() => setScannerOpen(!scannerOpen)}
              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs transition cursor-pointer"
              title="Simulator Barcode"
            >
              {scannerOpen ? 'Tutup Scanner' : 'Simulasi Scan'}
            </button>
          </form>
        </div>

        {/* Barcode quick test drawer if toggled */}
        {scannerOpen && (
          <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-3 text-xs text-emerald-200 flex flex-wrap items-center gap-2 animate-in fade-in">
            <span className="font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Coba Barcode Cepat:
            </span>
            {products.slice(0, 6).map((p) => (
              <button
                key={p.id_produk}
                type="button"
                onClick={() => {
                  addToCart(p, 1);
                }}
                className="bg-emerald-900/60 hover:bg-emerald-800 text-emerald-100 border border-emerald-700/50 px-2.5 py-1 rounded-md transition cursor-pointer"
              >
                {p.nama_produk.slice(0, 16)}... ({p.barcode})
              </button>
            ))}
          </div>
        )}

        {/* Category Filter Badges */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {INITIAL_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                type="button"
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 font-semibold shadow-md shadow-emerald-500/20'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/60'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Product Cards Grid with Photos */}
        <div className="flex-1 overflow-y-auto pr-1">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-slate-800/40 border border-slate-800 rounded-xl text-center">
              <Package className="w-12 h-12 text-slate-600 mb-3" />
              <h4 className="text-slate-300 font-medium">Tidak ada produk ditemukan</h4>
              <p className="text-slate-500 text-xs mt-1">
                Coba sesuaikan kata kunci pencarian atau ubah filter kategori.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {filteredProducts.map((prod) => {
                const inCart = cart.find((i) => i.produk.id_produk === prod.id_produk);
                const isOutOfStock = prod.stok <= 0;
                const isLowStock = prod.stok > 0 && prod.stok <= 10;

                return (
                  <div
                    key={prod.id_produk}
                    onClick={() => {
                      if (!isOutOfStock) {
                        const res = addToCart(prod, 1);
                        if (!res.success) {
                          setCheckoutError(res.message || 'Stok tidak cukup');
                        } else {
                          setCheckoutError(null);
                        }
                      }
                    }}
                    className={`group relative flex flex-col justify-between p-3 rounded-2xl border transition-all duration-200 select-none overflow-hidden ${
                      isOutOfStock
                        ? 'bg-slate-800/30 border-slate-800/80 opacity-60 cursor-not-allowed'
                        : 'bg-slate-800/90 hover:bg-slate-800 border-slate-700/70 hover:border-emerald-500/60 hover:shadow-lg hover:shadow-emerald-950/40 cursor-pointer active:scale-[0.98]'
                    }`}
                  >
                    {/* Badge In Cart */}
                    {inCart && (
                      <span className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-emerald-500 text-slate-950 text-xs font-black flex items-center justify-center shadow-lg shadow-emerald-500/50">
                        {inCart.jumlah}
                      </span>
                    )}

                    <div>
                      {/* Product Photo Showcase */}
                      <div className="w-full h-32 rounded-xl overflow-hidden bg-slate-900 mb-2.5 relative border border-slate-700/60">
                        {prod.gambar ? (
                          <img
                            src={prod.gambar}
                            alt={prod.nama_produk}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              // If image fails, replace with placeholder
                              (e.currentTarget as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 bg-slate-900/90">
                            <ImageIcon className="w-7 h-7 mb-1 text-slate-600" />
                            <span className="text-[10px] text-slate-500">Tanpa Foto</span>
                          </div>
                        )}

                        {/* Top Left: Category Pill */}
                        <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md text-[10px] font-semibold text-slate-300">
                          {prod.kategori}
                        </div>

                        {/* Bottom Left: Stock Pill */}
                        <div className="absolute bottom-1.5 left-1.5">
                          {isOutOfStock ? (
                            <span className="px-1.5 py-0.5 rounded-md bg-rose-600/90 text-white font-bold text-[10px]">
                              Habis
                            </span>
                          ) : isLowStock ? (
                            <span className="px-1.5 py-0.5 rounded-md bg-amber-500/90 text-slate-950 font-bold text-[10px]">
                              Sisa {prod.stok}
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md text-emerald-400 font-medium text-[10px]">
                              Stok {prod.stok}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Product Name */}
                      <h4 className="font-semibold text-white text-xs sm:text-sm line-clamp-2 leading-snug group-hover:text-emerald-300 transition-colors">
                        {prod.nama_produk}
                      </h4>
                    </div>

                    {/* Bottom: Price and Quick Add */}
                    <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Harga</span>
                        <span className="text-sm font-bold text-emerald-400">
                          {formatRupiah(prod.harga)}
                        </span>
                      </div>

                      <button
                        type="button"
                        disabled={isOutOfStock}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition ${
                          isOutOfStock
                            ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                            : 'bg-emerald-600/30 text-emerald-300 group-hover:bg-emerald-500 group-hover:text-slate-950'
                        }`}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SECTION: Cart & Checkout Payment Panel */}
      <div className="w-full lg:w-96 flex flex-col bg-slate-800/90 backdrop-blur border border-slate-700/80 rounded-2xl shadow-xl overflow-hidden">
        {/* Cart Header */}
        <div className="px-5 py-4 border-b border-slate-700/80 flex items-center justify-between bg-slate-800/60">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Keranjang Transaksi</h3>
              <p className="text-[11px] text-slate-400">
                Kasir: <span className="text-emerald-400 font-medium">{currentUser?.nama || 'Kasir'}</span>
              </p>
            </div>
          </div>

          {cart.length > 0 && (
            <button
              onClick={clearCart}
              type="button"
              className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Kosongkan</span>
            </button>
          )}
        </div>

        {/* Error message alert */}
        {checkoutError && (
          <div className="mx-4 mt-3 p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{checkoutError}</span>
          </div>
        )}

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-[180px] max-h-[320px]">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-10 text-center">
              <ShoppingCart className="w-10 h-10 text-slate-600 mb-2" />
              <p className="text-slate-400 text-xs font-medium">Keranjang masih kosong</p>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Klik produk di katalog untuk menambahkan
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.produk.id_produk}
                className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-3 flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                      {item.produk.gambar ? (
                        <img
                          src={item.produk.gambar}
                          alt={item.produk.nama_produk}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-4 h-4 text-slate-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h5 className="text-xs font-semibold text-white truncate">
                        {item.produk.nama_produk}
                      </h5>
                      <span className="text-[10px] text-slate-400">
                        @ {formatRupiah(item.produk.harga)}
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-emerald-400 shrink-0">
                    {formatRupiah(item.subtotal)}
                  </span>
                </div>

                {/* Qty controls */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateCartQty(item.produk.id_produk, item.jumlah - 1)}
                      className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center text-xs transition cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-semibold text-white px-2 min-w-[24px] text-center">
                      {item.jumlah}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateCartQty(item.produk.id_produk, item.jumlah + 1)}
                      className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center text-xs transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFromCart(item.produk.id_produk)}
                    className="text-slate-500 hover:text-rose-400 text-xs p-1 transition cursor-pointer"
                    title="Hapus barang"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals & Payment Section */}
        <div className="p-4 bg-slate-900/90 border-t border-slate-700/80 space-y-3">
          {/* Subtotal & Total display */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Jumlah Item</span>
              <span className="font-medium text-slate-200">{cartTotalItems} item</span>
            </div>
            <div className="flex justify-between items-baseline pt-1 border-t border-slate-800">
              <span className="font-semibold text-sm text-white">Total Bayar</span>
              <span className="text-lg font-extrabold text-emerald-400">
                {formatRupiah(cartTotal)}
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1.5 uppercase tracking-wider">
              Metode Pembayaran
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['Tunai', 'QRIS', 'Debit/Transfer'] as PaymentMethod[]).map((m) => {
                const isSelected = paymentMethod === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleSelectPaymentMethod(m)}
                    className={`py-2 px-1 text-xs font-semibold rounded-lg border flex flex-col items-center gap-1 transition cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 shadow-sm'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    {m === 'Tunai' && <Banknote className="w-3.5 h-3.5" />}
                    {m === 'QRIS' && <QrCode className="w-3.5 h-3.5" />}
                    {m === 'Debit/Transfer' && <CreditCard className="w-3.5 h-3.5" />}
                    <span className="text-[10px]">{m}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* QRIS / Cash specific controls */}
          {paymentMethod === 'QRIS' ? (
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-3">
              <div className="w-16 h-16 bg-white p-1 rounded-lg flex items-center justify-center shrink-0">
                <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center rounded text-white text-[9px] font-mono">
                  <QrCode className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="text-xs text-slate-300">
                <span className="font-semibold text-emerald-400 block">QRIS TokoKu</span>
                <span className="text-[11px] text-slate-400">Scan via BCA, GoPay, OVO, ShopeePay</span>
                <span className="text-[10px] text-slate-500 block mt-1">
                  Nominal Pas: {formatRupiah(cartTotal)}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Uang Diterima (Rp)
                </label>
                {cashAmount > 0 && (
                  <button
                    type="button"
                    onClick={() => setCashAmount(0)}
                    className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset
                  </button>
                )}
              </div>

              {/* Cash Input */}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500">
                  Rp
                </span>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={cashAmount === 0 ? '' : cashAmount}
                  onChange={(e) => setCashAmount(Number(e.target.value) || 0)}
                  placeholder="0"
                  className={`w-full pl-9 pr-3 py-2 bg-slate-950 border rounded-lg text-sm font-bold text-white placeholder-slate-500 focus:outline-none transition ${
                    isCashInsufficient
                      ? 'border-rose-500/80 focus:ring-2 focus:ring-rose-500'
                      : 'border-slate-700 focus:ring-2 focus:ring-emerald-500'
                  }`}
                />
              </div>

              {/* Quick Cash Presets */}
              <div className="grid grid-cols-3 gap-1.5">
                {quickCashPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCashAmount(preset.amount)}
                    className="py-1 px-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[11px] font-medium border border-slate-700/50 transition truncate cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Kembalian Display */}
              <div
                className={`p-2.5 rounded-lg border text-xs flex justify-between items-center transition ${
                  isCashInsufficient
                    ? 'bg-rose-950/40 border-rose-900/60 text-rose-300'
                    : 'bg-emerald-950/40 border-emerald-900/60 text-emerald-300'
                }`}
              >
                <span className="font-medium">
                  {isCashInsufficient ? 'Uang Kurang' : 'Kembalian'}
                </span>
                <span className="font-extrabold text-sm">
                  {isCashInsufficient
                    ? `- ${formatRupiah(cartTotal - cashAmount)}`
                    : formatRupiah(kembalian)}
                </span>
              </div>
            </div>
          )}

          {/* Confirm & Process Payment Button */}
          <button
            onClick={handleCheckoutSubmit}
            disabled={cart.length === 0 || isCashInsufficient}
            type="button"
            className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all duration-200 ${
              cart.length === 0 || isCashInsufficient
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/60'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-950/60 active:scale-[0.99] cursor-pointer'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>Bayar &amp; Cetak Struk</span>
          </button>
        </div>
      </div>
    </div>
  );
};
