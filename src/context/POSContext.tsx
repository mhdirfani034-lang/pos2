/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Produk, Transaksi, DetailTransaksi, CartItem, PaymentMethod } from '../types';
import { INITIAL_USERS, INITIAL_PRODUCTS, INITIAL_TRANSACTIONS } from '../data/initialData';
import { generateInvoiceNumber } from '../utils/formatters';

interface POSContextType {
  // Auth state
  currentUser: User | null;
  login: (username: string, password?: string) => { success: boolean; message: string };
  switchUser: (user: User) => void;
  logout: () => void;

  // Users state (Kelola Akun Kasir)
  users: User[];
  addUser: (userData: Omit<User, 'id_user'>) => void;
  updateUser: (id: number, userData: Partial<User>) => void;
  toggleUserStatus: (id: number) => void;
  deleteUser: (id: number) => { success: boolean; message: string };

  // Products state (Kelola Data Produk & Stok)
  products: Produk[];
  addProduct: (productData: Omit<Produk, 'id_produk'>) => void;
  updateProduct: (id: number, productData: Partial<Produk>) => void;
  deleteProduct: (id: number) => { success: boolean; message: string };
  restockProduct: (id: number, addedQty: number) => void;

  // Cart state (Transaksi Penjualan)
  cart: CartItem[];
  addToCart: (produk: Produk, qty?: number) => { success: boolean; message?: string };
  updateCartQty: (productId: number, qty: number) => { success: boolean; message?: string };
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartTotalItems: number;

  // Checkout & Transactions
  transactions: Transaksi[];
  processCheckout: (
    bayar: number,
    metode: PaymentMethod,
    catatan?: string
  ) => { success: boolean; message: string; transaction?: Transaksi };
  
  // Struk / Receipt modal
  activeReceipt: Transaksi | null;
  setActiveReceipt: (trx: Transaksi | null) => void;

  // System reset
  resetToDefaultData: () => void;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

const STORAGE_KEY_USERS = 'tokoku_pos_users_v1';
const STORAGE_KEY_PRODUCTS = 'tokoku_pos_products_v2';
const STORAGE_KEY_TRANSACTIONS = 'tokoku_pos_transactions_v1';
const STORAGE_KEY_CURRENT_USER = 'tokoku_pos_current_user_v1';

export const POSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize Users from localStorage or default
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USERS);
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  // Current logged in user
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
      if (saved) return JSON.parse(saved);
      // default to Admin on first visit for easy inspection
      return INITIAL_USERS[0];
    } catch {
      return INITIAL_USERS[0];
    }
  });

  // Initialize Products from localStorage or default
  const [products, setProducts] = useState<Produk[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PRODUCTS);
      return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  // Initialize Transactions from localStorage or default
  const [transactions, setTransactions] = useState<Transaksi[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
      return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);

  // Active receipt for printing modal
  const [activeReceipt, setActiveReceipt] = useState<Transaksi | null>(null);

  // Sync state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    } catch (e) {
      console.error(e);
    }
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
    } catch (e) {
      console.error(e);
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(transactions));
    } catch (e) {
      console.error(e);
    }
  }, [transactions]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentUser]);

  // Auth methods
  const login = (username: string, password?: string) => {
    const found = users.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase()
    );

    if (!found) {
      return { success: false, message: 'Username tidak ditemukan dalam sistem.' };
    }

    if (password && found.password && found.password !== password) {
      return { success: false, message: 'Kata sandi salah. Silakan coba lagi.' };
    }

    if (found.status === 'nonaktif') {
      return {
        success: false,
        message: 'Akun kasir ini berstatus NONAKTIF. Hubungi Administrator untuk mengaktifkan.',
      };
    }

    setCurrentUser(found);
    return { success: true, message: `Selamat datang kembali, ${found.nama}!` };
  };

  const switchUser = (user: User) => {
    if (user.status === 'nonaktif') {
      alert(`Akun "${user.nama}" sedang Nonaktif. Aktifkan akun terlebih dahulu di menu Kelola Kasir.`);
      return;
    }
    setCurrentUser(user);
    setCart([]); // Clear cart upon cashier switch to prevent checkout mixup
  };

  const logout = () => {
    setCurrentUser(null);
    setCart([]);
  };

  // User management methods
  const addUser = (userData: Omit<User, 'id_user'>) => {
    const nextId = users.length > 0 ? Math.max(...users.map((u) => u.id_user)) + 1 : 1;
    const newUser: User = {
      ...userData,
      id_user: nextId,
    };
    setUsers((prev) => [...prev, newUser]);
  };

  const updateUser = (id: number, userData: Partial<User>) => {
    setUsers((prev) =>
      prev.map((u) => (u.id_user === id ? { ...u, ...userData } : u))
    );
    if (currentUser?.id_user === id) {
      setCurrentUser((prev) => (prev ? { ...prev, ...userData } : null));
    }
  };

  const toggleUserStatus = (id: number) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id_user === id) {
          const nextStatus = u.status === 'aktif' ? 'nonaktif' : 'aktif';
          return { ...u, status: nextStatus };
        }
        return u;
      })
    );
  };

  const deleteUser = (id: number) => {
    if (currentUser?.id_user === id) {
      return { success: false, message: 'Tidak dapat menghapus akun yang sedang aktif digunakan.' };
    }
    const hasTransactions = transactions.some((t) => t.id_user === id);
    if (hasTransactions) {
      // Rather than breaking foreign key integrity, suggest deactivating
      return {
        success: false,
        message: 'Akun ini memiliki riwayat transaksi tersimpan. Disarankan untuk menonaktifkan statusnya agar integritas data transaksi tetap terjaga.',
      };
    }
    setUsers((prev) => prev.filter((u) => u.id_user !== id));
    return { success: true, message: 'Akun pengguna berhasil dihapus.' };
  };

  // Product management methods
  const addProduct = (productData: Omit<Produk, 'id_produk'>) => {
    const nextId = products.length > 0 ? Math.max(...products.map((p) => p.id_produk)) + 1 : 1;
    const newProduct: Produk = {
      ...productData,
      id_produk: nextId,
    };
    setProducts((prev) => [newProduct, ...prev]);
  };

  const updateProduct = (id: number, productData: Partial<Produk>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id_produk === id ? { ...p, ...productData } : p))
    );
    // Also update product details in cart if present
    setCart((prev) =>
      prev.map((item) => {
        if (item.produk.id_produk === id) {
          const updatedProd = { ...item.produk, ...productData };
          return {
            ...item,
            produk: updatedProd,
            subtotal: (productData.harga ?? item.produk.harga) * item.jumlah,
          };
        }
        return item;
      })
    );
  };

  const deleteProduct = (id: number) => {
    setProducts((prev) => prev.filter((p) => p.id_produk !== id));
    setCart((prev) => prev.filter((item) => item.produk.id_produk !== id));
    return { success: true, message: 'Produk berhasil dihapus dari sistem.' };
  };

  const restockProduct = (id: number, addedQty: number) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id_produk === id ? { ...p, stok: Math.max(0, p.stok + addedQty) } : p
      )
    );
  };

  // Cart operations
  const addToCart = (produk: Produk, qty = 1): { success: boolean; message?: string } => {
    // Check available stock
    const currentInCart = cart.find((item) => item.produk.id_produk === produk.id_produk)?.jumlah || 0;
    const requestedTotal = currentInCart + qty;

    if (produk.stok <= 0) {
      return { success: false, message: `Stok produk "${produk.nama_produk}" habis.` };
    }

    if (requestedTotal > produk.stok) {
      return {
        success: false,
        message: `Stok tidak mencukupi. Sisa stok tersedia hanya ${produk.stok} unit.`,
      };
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.produk.id_produk === produk.id_produk);
      if (existing) {
        return prev.map((item) =>
          item.produk.id_produk === produk.id_produk
            ? {
                ...item,
                jumlah: item.jumlah + qty,
                subtotal: (item.jumlah + qty) * item.produk.harga,
              }
            : item
        );
      }
      return [
        ...prev,
        {
          produk,
          jumlah: qty,
          subtotal: qty * produk.harga,
        },
      ];
    });

    return { success: true };
  };

  const updateCartQty = (productId: number, qty: number): { success: boolean; message?: string } => {
    const targetProduct = products.find((p) => p.id_produk === productId);
    if (!targetProduct) return { success: false, message: 'Produk tidak ditemukan.' };

    if (qty <= 0) {
      removeFromCart(productId);
      return { success: true };
    }

    if (qty > targetProduct.stok) {
      return {
        success: false,
        message: `Jumlah melebihi stok yang ada (${targetProduct.stok} unit).`,
      };
    }

    setCart((prev) =>
      prev.map((item) =>
        item.produk.id_produk === productId
          ? {
              ...item,
              jumlah: qty,
              subtotal: qty * item.produk.harga,
            }
          : item
      )
    );
    return { success: true };
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.produk.id_produk !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const cartTotalItems = cart.reduce((sum, item) => sum + item.jumlah, 0);

  // Process Checkout & Transaction (Per UML: simpan transaksi & update stok barang otomatis)
  const processCheckout = (
    bayar: number,
    metode: PaymentMethod,
    catatan = ''
  ): { success: boolean; message: string; transaction?: Transaksi } => {
    if (cart.length === 0) {
      return { success: false, message: 'Keranjang belanja masih kosong.' };
    }

    if (bayar < cartTotal) {
      return {
        success: false,
        message: `Uang yang dibayarkan kurang dari total transaksi. Total: Rp ${cartTotal.toLocaleString(
          'id-ID'
        )}, Dibayar: Rp ${bayar.toLocaleString('id-ID')}`,
      };
    }

    // Double check stock availability before deducting
    for (const item of cart) {
      const prod = products.find((p) => p.id_produk === item.produk.id_produk);
      if (!prod || prod.stok < item.jumlah) {
        return {
          success: false,
          message: `Stok untuk "${item.produk.nama_produk}" tidak mencukupi atau sudah berubah.`,
        };
      }
    }

    const kembalian = bayar - cartTotal;
    const nextTrxId =
      transactions.length > 0 ? Math.max(...transactions.map((t) => t.id_transaksi)) + 1 : 1;
    const invoiceNo = generateInvoiceNumber(nextTrxId);
    const nowIso = new Date().toISOString();

    let detailCounter = 1;
    const details: DetailTransaksi[] = cart.map((item) => ({
      id_detail: Number(`${nextTrxId}${detailCounter++}`),
      id_transaksi: nextTrxId,
      id_produk: item.produk.id_produk,
      nama_produk: item.produk.nama_produk,
      harga_satuan: item.produk.harga,
      jumlah: item.jumlah,
      subtotal: item.subtotal,
      kategori: item.produk.kategori,
    }));

    const newTransaction: Transaksi = {
      id_transaksi: nextTrxId,
      id_user: currentUser?.id_user || 1,
      kasir_nama: currentUser?.nama || 'Kasir',
      kasir_username: currentUser?.username || 'kasir',
      nomor_invoice: invoiceNo,
      tanggal: nowIso,
      total: cartTotal,
      bayar,
      kembalian,
      metode_pembayaran: metode,
      catatan,
      details,
    };

    // 1. Deduct product stocks automatically (UML: "Kelola Stok Barang (otomatis)")
    setProducts((prev) =>
      prev.map((prod) => {
        const boughtItem = cart.find((item) => item.produk.id_produk === prod.id_produk);
        if (boughtItem) {
          return {
            ...prod,
            stok: Math.max(0, prod.stok - boughtItem.jumlah),
          };
        }
        return prod;
      })
    );

    // 2. Save transaction to database/state
    setTransactions((prev) => [newTransaction, ...prev]);

    // 3. Clear cart
    setCart([]);

    // 4. Set active receipt for auto print modal preview
    setActiveReceipt(newTransaction);

    return {
      success: true,
      message: 'Transaksi berhasil disimpan dan stok otomatis diperbarui!',
      transaction: newTransaction,
    };
  };

  const resetToDefaultData = () => {
    if (confirm('Kembalikan semua data ke pengaturan awal (default TokoKu)? Data transaksi baru akan direset.')) {
      setUsers(INITIAL_USERS);
      setProducts(INITIAL_PRODUCTS);
      setTransactions(INITIAL_TRANSACTIONS);
      setCurrentUser(INITIAL_USERS[0]);
      setCart([]);
      setActiveReceipt(null);
      localStorage.removeItem(STORAGE_KEY_USERS);
      localStorage.removeItem(STORAGE_KEY_PRODUCTS);
      localStorage.removeItem(STORAGE_KEY_TRANSACTIONS);
      localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
    }
  };

  return (
    <POSContext.Provider
      value={{
        currentUser,
        login,
        switchUser,
        logout,
        users,
        addUser,
        updateUser,
        toggleUserStatus,
        deleteUser,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        restockProduct,
        cart,
        addToCart,
        updateCartQty,
        removeFromCart,
        clearCart,
        cartTotal,
        cartTotalItems,
        transactions,
        processCheckout,
        activeReceipt,
        setActiveReceipt,
        resetToDefaultData,
      }}
    >
      {children}
    </POSContext.Provider>
  );
};

export const usePOS = () => {
  const context = useContext(POSContext);
  if (!context) {
    throw new Error('usePOS must be used within a POSProvider');
  }
  return context;
};
