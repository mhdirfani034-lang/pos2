/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import { usePOS } from '../../context/POSContext';
import { Produk } from '../../types';
import { formatRupiah, formatAngka } from '../../utils/formatters';
import { INITIAL_CATEGORIES } from '../../data/initialData';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Search,
  AlertTriangle,
  CheckCircle2,
  X,
  RefreshCw,
  Archive,
  Barcode,
  Image as ImageIcon,
  Upload,
  Link as LinkIcon,
  Eye,
} from 'lucide-react';

export const ProductManagement: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, restockProduct } = usePOS();

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Produk | null>(null);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [restockTarget, setRestockTarget] = useState<Produk | null>(null);
  const [restockAmount, setRestockAmount] = useState<number>(10);

  // Form inputs
  const [namaProduk, setNamaProduk] = useState('');
  const [kategori, setKategori] = useState('Makanan');
  const [harga, setHarga] = useState<number>(0);
  const [stok, setStok] = useState<number>(0);
  const [barcode, setBarcode] = useState('');
  const [satuan, setSatuan] = useState('Pcs');
  const [deskripsi, setDeskripsi] = useState('');
  const [gambar, setGambar] = useState(''); // Product photo (data URL or web URL)
  const [formError, setFormError] = useState<string | null>(null);

  // Photo mode tabs: 'file' | 'url'
  const [photoMode, setPhotoMode] = useState<'file' | 'url'>('file');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sample curated images for quick selection
  const samplePhotos = [
    { label: 'Mie Instan', url: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400&auto=format&fit=crop&q=80' },
    { label: 'Air Mineral', url: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=400&auto=format&fit=crop&q=80' },
    { label: 'Kopi / Teh', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop&q=80' },
    { label: 'Snack / Roti', url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&auto=format&fit=crop&q=80' },
    { label: 'Beras / Sembako', url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&auto=format&fit=crop&q=80' },
    { label: 'Sabun / Shampo', url: 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=400&auto=format&fit=crop&q=80' },
  ];

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'Semua' || p.kategori === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        q === '' ||
        p.nama_produk.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.includes(q)) ||
        p.kategori.toLowerCase().includes(q);

      let matchStock = true;
      if (stockFilter === 'low') matchStock = p.stok > 0 && p.stok <= 10;
      if (stockFilter === 'out') matchStock = p.stok <= 0;

      return matchCat && matchSearch && matchStock;
    });
  }, [products, selectedCategory, searchQuery, stockFilter]);

  // Stock summary counts
  const totalStockItems = products.reduce((sum, p) => sum + p.stok, 0);
  const lowStockCount = products.filter((p) => p.stok > 0 && p.stok <= 10).length;
  const outOfStockCount = products.filter((p) => p.stok <= 0).length;

  const openAddModal = () => {
    setEditingProduct(null);
    setNamaProduk('');
    setKategori('Makanan');
    setHarga(5000);
    setStok(20);
    setBarcode(`899${Math.floor(100000000 + Math.random() * 900000000)}`);
    setSatuan('Pcs');
    setDeskripsi('');
    setGambar('');
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (p: Produk) => {
    setEditingProduct(p);
    setNamaProduk(p.nama_produk);
    setKategori(p.kategori);
    setHarga(p.harga);
    setStok(p.stok);
    setBarcode(p.barcode || '');
    setSatuan(p.satuan || 'Pcs');
    setDeskripsi(p.deskripsi || '');
    setGambar(p.gambar || '');
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // Handle local file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFormError('Harap pilih file gambar (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFormError('Ukuran file maksimal 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setGambar(reader.result);
        setFormError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaProduk.trim()) {
      setFormError('Nama produk wajib diisi.');
      return;
    }
    if (harga <= 0) {
      setFormError('Harga harus lebih dari 0.');
      return;
    }
    if (stok < 0) {
      setFormError('Stok tidak boleh bernilai negatif.');
      return;
    }

    if (editingProduct) {
      updateProduct(editingProduct.id_produk, {
        nama_produk: namaProduk.trim(),
        kategori,
        harga,
        stok,
        barcode: barcode.trim(),
        satuan,
        deskripsi: deskripsi.trim(),
        gambar: gambar.trim() || undefined,
      });
    } else {
      addProduct({
        nama_produk: namaProduk.trim(),
        kategori,
        harga,
        stok,
        barcode: barcode.trim(),
        satuan,
        deskripsi: deskripsi.trim(),
        gambar: gambar.trim() || undefined,
      });
    }

    setIsFormModalOpen(false);
  };

  const handleDelete = (p: Produk) => {
    if (confirm(`Apakah Anda yakin ingin menghapus produk "${p.nama_produk}"?`)) {
      const res = deleteProduct(p.id_produk);
      if (!res.success) {
        alert(res.message);
      }
    }
  };

  const openRestock = (p: Produk) => {
    setRestockTarget(p);
    setRestockAmount(20);
    setIsRestockModalOpen(true);
  };

  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (restockTarget && restockAmount > 0) {
      restockProduct(restockTarget.id_produk, restockAmount);
      setIsRestockModalOpen(false);
      setRestockTarget(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-emerald-400" />
            Kelola Data Produk &amp; Foto
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Tambah produk, upload foto produk dari perangkat, atur harga, dan pantau stok inventaris
          </p>
        </div>

        <button
          onClick={openAddModal}
          type="button"
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-950 transition self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Produk &amp; Foto Baru</span>
        </button>
      </div>

      {/* KPI Cards for Stock Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4">
          <div className="text-slate-400 text-xs font-medium">Total Jenis Produk</div>
          <div className="text-2xl font-extrabold text-white mt-1">{products.length}</div>
          <span className="text-[11px] text-slate-500">Katalog aktif</span>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4">
          <div className="text-slate-400 text-xs font-medium">Total Unit Stok</div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">
            {formatAngka(totalStockItems)}
          </div>
          <span className="text-[11px] text-slate-500">Semua gudang/rak</span>
        </div>

        <div
          onClick={() => setStockFilter(stockFilter === 'low' ? 'all' : 'low')}
          className={`cursor-pointer border rounded-xl p-4 transition ${
            stockFilter === 'low'
              ? 'bg-amber-950/40 border-amber-500/80'
              : 'bg-slate-800/80 border-slate-700/80 hover:border-amber-500/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-amber-400 text-xs font-medium">Stok Menipis (&le; 10)</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-300 mt-1">{lowStockCount}</div>
          <span className="text-[11px] text-amber-400/80">Klik untuk filter</span>
        </div>

        <div
          onClick={() => setStockFilter(stockFilter === 'out' ? 'all' : 'out')}
          className={`cursor-pointer border rounded-xl p-4 transition ${
            stockFilter === 'out'
              ? 'bg-rose-950/40 border-rose-500/80'
              : 'bg-slate-800/80 border-slate-700/80 hover:border-rose-500/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-rose-400 text-xs font-medium">Stok Habis (0)</span>
            <Archive className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-extrabold text-rose-400 mt-1">{outOfStockCount}</div>
          <span className="text-[11px] text-rose-400/80">Klik untuk filter</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama barang atau nomor barcode..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {INITIAL_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                Kategori: {c}
              </option>
            ))}
          </select>

          {stockFilter !== 'all' && (
            <button
              onClick={() => setStockFilter('all')}
              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs rounded-lg flex items-center gap-1 transition"
            >
              <X className="w-3.5 h-3.5" />
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Products Data Table with Photo Column */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-700">
              <tr>
                <th className="py-3.5 px-4 font-semibold w-16">Foto</th>
                <th className="py-3.5 px-4 font-semibold">ID &amp; Barcode</th>
                <th className="py-3.5 px-4 font-semibold">Nama Produk</th>
                <th className="py-3.5 px-4 font-semibold">Kategori</th>
                <th className="py-3.5 px-4 font-semibold">Harga Jual</th>
                <th className="py-3.5 px-4 font-semibold">Status Stok</th>
                <th className="py-3.5 px-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Tidak ada produk yang cocok dengan pencarian / filter ini.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isOutOfStock = p.stok <= 0;
                  const isLowStock = p.stok > 0 && p.stok <= 10;

                  return (
                    <tr
                      key={p.id_produk}
                      className="hover:bg-slate-700/30 transition-colors"
                    >
                      {/* Photo Thumbnail */}
                      <td className="py-3 px-4">
                        <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                          {p.gambar ? (
                            <img
                              src={p.gambar}
                              alt={p.nama_produk}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-slate-600" />
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-mono text-slate-400">#{p.id_produk}</div>
                        {p.barcode && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                            <Barcode className="w-3 h-3 text-slate-400" />
                            {p.barcode}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white text-sm">
                          {p.nama_produk}
                        </div>
                        {p.deskripsi && (
                          <div className="text-[11px] text-slate-400 truncate max-w-xs">
                            {p.deskripsi}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-300 text-[10px] font-medium">
                          {p.kategori}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-emerald-400 text-sm">
                        {formatRupiah(p.harga)}
                      </td>

                      <td className="py-3.5 px-4">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 text-[11px] font-bold">
                            <Archive className="w-3 h-3" /> Habis (0)
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 text-[11px] font-bold">
                            <AlertTriangle className="w-3 h-3" /> Menipis ({p.stok})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-semibold">
                            <CheckCircle2 className="w-3 h-3" /> Tersedia ({p.stok})
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openRestock(p)}
                            type="button"
                            className="p-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 text-emerald-400 border border-emerald-800/60 transition cursor-pointer"
                            title="Restock Barang"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEditModal(p)}
                            type="button"
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
                            title="Edit Produk & Foto"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            type="button"
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-800 transition cursor-pointer"
                            title="Hapus Produk"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form: Tambah / Edit Produk dengan Upload Foto */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-6">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/40">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-400" />
                {editingProduct ? 'Edit Data Produk & Foto' : 'Tambah Produk & Foto Baru'}
              </h3>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Photo Upload Section */}
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-emerald-400" />
                    Foto Produk
                  </label>
                  <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setPhotoMode('file')}
                      className={`px-2 py-1 text-[11px] rounded font-medium transition ${
                        photoMode === 'file'
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoMode('url')}
                      className={`px-2 py-1 text-[11px] rounded font-medium transition ${
                        photoMode === 'url'
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Input URL
                    </button>
                  </div>
                </div>

                {/* Photo Preview & Upload Controls */}
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl bg-slate-900 border border-slate-700 overflow-hidden flex items-center justify-center shrink-0 relative group">
                    {gambar ? (
                      <>
                        <img
                          src={gambar}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setGambar('')}
                          className="absolute inset-0 bg-black/60 text-rose-400 opacity-0 group-hover:opacity-100 flex items-center justify-center transition"
                          title="Hapus foto"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </>
                    ) : (
                      <ImageIcon className="w-8 h-8 text-slate-600" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    {photoMode === 'file' ? (
                      <div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="product-file-picker"
                        />
                        <label
                          htmlFor="product-file-picker"
                          className="flex items-center justify-center gap-2 w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 border border-dashed border-slate-700 hover:border-emerald-500 rounded-xl text-xs text-slate-300 hover:text-white cursor-pointer transition"
                        >
                          <Upload className="w-4 h-4 text-emerald-400" />
                          <span>Pilih Foto dari Komputer / HP</span>
                        </label>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Format: PNG, JPG, WebP. Maks 5MB.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <div className="relative">
                          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                          <input
                            type="url"
                            value={gambar}
                            onChange={(e) => setGambar(e.target.value)}
                            placeholder="https://images.unsplash.com/..."
                            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                    )}

                    {/* Quick Preset Photo Picker */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
                      <span className="text-[10px] text-slate-500 whitespace-nowrap">Contoh:</span>
                      {samplePhotos.map((s, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setGambar(s.url)}
                          className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-[10px] border border-slate-800 whitespace-nowrap"
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Nama Produk <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={namaProduk}
                  onChange={(e) => setNamaProduk(e.target.value)}
                  placeholder="Contoh: Aqua 600ml / Indomie Goreng"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Kategori <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={kategori}
                    onChange={(e) => setKategori(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {INITIAL_CATEGORIES.filter((c) => c !== 'Semua').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Satuan
                  </label>
                  <input
                    type="text"
                    value={satuan}
                    onChange={(e) => setSatuan(e.target.value)}
                    placeholder="Pcs, Botol, Kg, dll."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Harga Jual (Rp) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="100"
                    required
                    value={harga}
                    onChange={(e) => setHarga(Number(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm font-bold text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Jumlah Stok Awal <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={stok}
                    onChange={(e) => setStok(Number(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Nomor Barcode / SKU
                </label>
                <div className="relative">
                  <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="899..."
                    className="w-full pl-9 pr-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Deskripsi Singkat (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  placeholder="Keterangan tambahan produk..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-bold shadow-lg transition"
                >
                  {editingProduct ? 'Simpan Perubahan' : 'Tambahkan Produk & Foto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Restock Cepat */}
      {isRestockModalOpen && restockTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-800/40">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-emerald-400" />
                Tambah Stok Barang
              </h3>
              <button
                onClick={() => setIsRestockModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRestockSubmit} className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden shrink-0">
                  {restockTarget.gambar ? (
                    <img
                      src={restockTarget.gambar}
                      alt={restockTarget.nama_produk}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="w-6 h-6 text-slate-600 m-3" />
                  )}
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Produk:</span>
                  <p className="font-semibold text-white text-xs truncate max-w-[200px]">
                    {restockTarget.nama_produk}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Stok saat ini: <span className="text-emerald-400 font-bold">{restockTarget.stok}</span> unit
                  </p>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Jumlah Tambahan Stok
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={restockAmount}
                  onChange={(e) => setRestockAmount(Number(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-base font-bold text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex gap-2">
                {[10, 25, 50, 100].map((qty) => (
                  <button
                    key={qty}
                    type="button"
                    onClick={() => setRestockAmount(qty)}
                    className="flex-1 py-1 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-medium border border-slate-700 transition"
                  >
                    +{qty}
                  </button>
                ))}
              </div>

              <div className="p-3 bg-emerald-950/40 border border-emerald-900/60 rounded-xl text-xs text-emerald-300">
                Stok setelah restock:{' '}
                <span className="font-bold">{restockTarget.stok + restockAmount}</span> unit
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRestockModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-bold transition"
                >
                  Simpan Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
