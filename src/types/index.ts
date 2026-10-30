/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Data models aligned strictly with UML Class Diagram & ERD specifications:
 * - User (users)
 * - Produk (produk)
 * - Transaksi (transaksi)
 * - DetailTransaksi (detail_transaksi)
 */

export type UserRole = 'admin' | 'kasir';
export type UserStatus = 'aktif' | 'nonaktif';

export interface User {
  id_user: number;
  nama: string;
  username: string;
  password?: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  email?: string;
  telepon?: string;
}

export type ProductCategory = 
  | 'Semua'
  | 'Makanan'
  | 'Minuman'
  | 'Snack'
  | 'Sembako'
  | 'Kebutuhan Rumah'
  | 'Perawatan Pribadi'
  | 'Obat & Kesehatan';

export interface Produk {
  id_produk: number;
  nama_produk: string;
  kategori: string;
  harga: number;
  stok: number;
  barcode?: string;
  satuan?: string;
  deskripsi?: string;
  gambar?: string;
}

export interface DetailTransaksi {
  id_detail: number;
  id_transaksi: number;
  id_produk: number;
  nama_produk: string;
  harga_satuan: number;
  jumlah: number;
  subtotal: number;
  kategori?: string;
}

export type PaymentMethod = 'Tunai' | 'QRIS' | 'Debit/Transfer';

export interface Transaksi {
  id_transaksi: number;
  id_user: number;
  kasir_nama: string;
  kasir_username?: string;
  nomor_invoice: string;
  tanggal: string; // ISO 8601 string
  total: number;
  bayar: number;
  kembalian: number;
  metode_pembayaran: PaymentMethod;
  catatan?: string;
  details: DetailTransaksi[];
}

export interface CartItem {
  produk: Produk;
  jumlah: number;
  subtotal: number;
}
