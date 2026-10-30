/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  Download,
  Terminal,
  Database,
  FileCode2,
  Layers,
  Sparkles,
  Server,
  FolderTree,
  ExternalLink,
} from 'lucide-react';

interface CodeFile {
  name: string;
  path: string;
  language: string;
  description: string;
  content: string;
}

export const LaravelBackendHub: React.FC = () => {
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const files: CodeFile[] = [
    {
      name: 'ProdukController.php',
      path: 'app/Http/Controllers/Api/ProdukController.php',
      language: 'php',
      description: 'Controller Laravel 11 untuk CRUD produk, upload foto produk ke storage, & filter kategori.',
      content: `<?php

namespace App\\Http\\Controllers\\Api;

use App\\Http\\Controllers\\Controller;
use App\\Models\\Produk;
use Illuminate\\Http\\Request;
use Illuminate\\Support\\Facades\\Storage;
use Illuminate\\Support\\Facades\\Validator;

class ProdukController extends Controller
{
    /**
     * Menampilkan daftar semua produk (dengan filter kategori & pencarian).
     */
    public function index(Request $request)
    {
        $query = Produk::query();

        if ($request->has('kategori') && $request->kategori !== 'Semua') {
            $query->where('kategori', $request->kategori);
        }

        if ($request->has('search')) {
            $keyword = $request->search;
            $query->where(function ($q) use ($keyword) {
                $q->where('nama_produk', 'like', "%{$keyword}%")
                  ->orWhere('barcode', 'like', "%{$keyword}%");
            });
        }

        $produks = $query->orderBy('nama_produk', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => $produks
        ]);
    }

    /**
     * Menyimpan data produk baru dengan upload foto produk.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nama_produk' => 'required|string|max:100',
            'kategori'    => 'required|string|max:50',
            'harga'       => 'required|numeric|min:0',
            'stok'        => 'required|integer|min:0',
            'barcode'     => 'nullable|string|max:50|unique:produk,barcode',
            'satuan'      => 'nullable|string|max:20',
            'deskripsi'   => 'nullable|string',
            'foto'        => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048', // 2MB max
            'gambar'      => 'nullable|string', // URL opsional
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors()
            ], 422);
        }

        $data = $validator->validated();

        // Handle upload foto dari file picker jika ada
        if ($request->hasFile('foto')) {
            $path = $request->file('foto')->store('produk_images', 'public');
            $data['gambar'] = url('storage/' . $path);
        }

        $produk = Produk::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil ditambahkan!',
            'data'    => $produk
        ], 201);
    }

    /**
     * Update data produk beserta pergantian foto produk.
     */
    public function update(Request $request, $id)
    {
        $produk = Produk::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'nama_produk' => 'required|string|max:100',
            'kategori'    => 'required|string|max:50',
            'harga'       => 'required|numeric|min:0',
            'stok'        => 'required|integer|min:0',
            'barcode'     => 'nullable|string|max:50|unique:produk,barcode,' . $id . ',id_produk',
            'satuan'      => 'nullable|string|max:20',
            'deskripsi'   => 'nullable|string',
            'foto'        => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            'gambar'      => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors()
            ], 422);
        }

        $data = $validator->validated();

        // Ganti foto lama jika upload foto baru
        if ($request->hasFile('foto')) {
            if ($produk->gambar && str_contains($produk->gambar, 'storage/produk_images/')) {
                $oldPath = str_replace(url('storage/'), '', $produk->gambar);
                Storage::disk('public')->delete($oldPath);
            }
            $path = $request->file('foto')->store('produk_images', 'public');
            $data['gambar'] = url('storage/' . $path);
        }

        $produk->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil diperbarui!',
            'data'    => $produk
        ]);
    }

    /**
     * Menghapus produk dari database beserta file fotonya.
     */
    public function destroy($id)
    {
        $produk = Produk::findOrFail($id);

        if ($produk->gambar && str_contains($produk->gambar, 'storage/produk_images/')) {
            $oldPath = str_replace(url('storage/'), '', $produk->gambar);
            Storage::disk('public')->delete($oldPath);
        }

        $produk->delete();

        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil dihapus!'
        ]);
    }
}
`,
    },
    {
      name: 'TransaksiController.php',
      path: 'app/Http/Controllers/Api/TransaksiController.php',
      language: 'php',
      description: 'Menangani checkout transaksi, kalkulasi, pemotongan stok otomatis via DB::transaction, & cetak struk.',
      content: `<?php

namespace App\\Http\\Controllers\\Api;

use App\\Http\\Controllers\\Controller;
use App\\Models\\Transaksi;
use App\\Models\\DetailTransaksi;
use App\\Models\\Produk;
use Illuminate\\Http\\Request;
use Illuminate\\Support\\Facades\\DB;
use Illuminate\\Support\\Facades\\Validator;

class TransaksiController extends Controller
{
    /**
     * Menyimpan transaksi penjualan dan memotong stok barang secara otomatis.
     */
    public function checkout(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id_user'           => 'required|exists:users,id_user',
            'total'             => 'required|numeric|min:0',
            'bayar'             => 'required|numeric|min:0',
            'metode_pembayaran' => 'required|string|in:Tunai,QRIS,Debit/Transfer',
            'catatan'           => 'nullable|string',
            'items'             => 'required|array|min:1',
            'items.*.id_produk' => 'required|exists:produk,id_produk',
            'items.*.jumlah'    => 'required|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors()
            ], 422);
        }

        if ($request->bayar < $request->total) {
            return response()->json([
                'success' => false,
                'message' => 'Uang yang dibayarkan kurang dari total belanja!'
            ], 400);
        }

        // DB Transaction untuk menjamin integritas transaksi dan pengurangan stok
        return DB::transaction(function () use ($request) {
            // 1. Validasi ketersediaan stok semua item
            foreach ($request->items as $item) {
                $produk = Produk::lockForUpdate()->find($item['id_produk']);
                if ($produk->stok < $item['jumlah']) {
                    return response()->json([
                        'success' => false,
                        'message' => "Stok produk {$produk->nama_produk} tidak mencukupi (Tersedia: {$produk->stok})."
                    ], 400);
                }
            }

            // 2. Buat nomor invoice unik (TRX-YYYYMMDD-XXXX)
            $countToday = Transaksi::whereDate('tanggal', today())->count() + 1;
            $invoiceNumber = 'TRX-' . date('Ymd') . '-' . str_pad($countToday, 4, '0', STR_PAD_LEFT);

            // 3. Simpan data transaksi utama
            $transaksi = Transaksi::create([
                'id_user'           => $request->id_user,
                'nomor_invoice'     => $invoiceNumber,
                'tanggal'           => now(),
                'total'             => $request->total,
                'bayar'             => $request->bayar,
                'kembalian'         => $request->bayar - $request->total,
                'metode_pembayaran' => $request->metode_pembayaran,
                'catatan'           => $request->catatan,
            ]);

            // 4. Simpan detail transaksi & potong stok otomatis
            foreach ($request->items as $item) {
                $produk = Produk::find($item['id_produk']);
                $subtotal = $produk->harga * $item['jumlah'];

                DetailTransaksi::create([
                    'id_transaksi' => $transaksi->id_transaksi,
                    'id_produk'    => $produk->id_produk,
                    'nama_produk'  => $produk->nama_produk,
                    'harga_satuan' => $produk->harga,
                    'jumlah'       => $item['jumlah'],
                    'subtotal'     => $subtotal,
                ]);

                // Kurangi stok otomatis per ERD
                $produk->decrement('stok', $item['jumlah']);
            }

            // Load relasi kasir dan detail
            $transaksi->load(['details', 'user']);

            return response()->json([
                'success' => true,
                'message' => 'Transaksi berhasil diproses & stok berhasil dipotong otomatis!',
                'data'    => $transaksi
            ], 201);
        });
    }

    /**
     * Riwayat transaksi dengan filter kasir sendiri (untuk Kasir) atau semua (untuk Admin).
     */
    public function history(Request $request)
    {
        $user = $request->user(); // dari auth Sanctum
        $query = Transaksi::with(['details', 'user'])->orderBy('tanggal', 'desc');

        // Jika kasir, hanya lihat transaksi miliknya sendiri
        if ($user && $user->role === 'kasir') {
            $query->where('id_user', $user->id_user);
        }

        $transaksi = $query->paginate(15);

        return response()->json([
            'success' => true,
            'data'    => $transaksi
        ]);
    }
}
`,
    },
    {
      name: 'Produk.php (Model Eloquent)',
      path: 'app/Models/Produk.php',
      language: 'php',
      description: 'Model Eloquent Produk lengkap dengan mutator gambar dan relasi detail transaksi.',
      content: `<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Factories\\HasFactory;
use Illuminate\\Database\\Eloquent\\Model;

class Produk extends Model
{
    use HasFactory;

    protected $table = 'produk';
    protected $primaryKey = 'id_produk';

    protected $fillable = [
        'nama_produk',
        'kategori',
        'harga',
        'stok',
        'barcode',
        'satuan',
        'deskripsi',
        'gambar', // Path foto produk
    ];

    protected $casts = [
        'harga' => 'decimal:2',
        'stok'  => 'integer',
    ];

    /**
     * Relasi ke DetailTransaksi (1:M)
     */
    public function detailTransaksi()
    {
        return $this->hasMany(DetailTransaksi::class, 'id_produk', 'id_produk');
    }
}
`,
    },
    {
      name: 'Transaksi.php (Model Eloquent)',
      path: 'app/Models/Transaksi.php',
      language: 'php',
      description: 'Model Eloquent Transaksi berelasi dengan User (Kasir/Admin) dan DetailTransaksi.',
      content: `<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Factories\\HasFactory;
use Illuminate\\Database\\Eloquent\\Model;

class Transaksi extends Model
{
    use HasFactory;

    protected $table = 'transaksi';
    protected $primaryKey = 'id_transaksi';

    protected $fillable = [
        'id_user',
        'nomor_invoice',
        'tanggal',
        'total',
        'bayar',
        'kembalian',
        'metode_pembayaran',
        'catatan',
    ];

    protected $casts = [
        'tanggal'   => 'datetime',
        'total'     => 'decimal:2',
        'bayar'     => 'decimal:2',
        'kembalian' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'id_user', 'id_user');
    }

    public function details()
    {
        return $this->hasMany(DetailTransaksi::class, 'id_transaksi', 'id_transaksi');
    }
}
`,
    },
    {
      name: '2026_10_27_000001_create_pos_tables.php',
      path: 'database/migrations/2026_10_27_000001_create_pos_tables.php',
      language: 'php',
      description: 'Migrasi database MySQL/PostgreSQL untuk users, produk, transaksi, & detail_transaksi.',
      content: `<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Tabel users
        Schema::create('users', function (Blueprint $table) {
            $table->id('id_user');
            $table->string('nama', 100);
            $table->string('username', 50)->unique();
            $table->string('password');
            $table->enum('role', ['admin', 'kasir'])->default('kasir');
            $table->enum('status', ['aktif', 'nonaktif'])->default('aktif');
            $table->string('email')->nullable();
            $table->string('telepon')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        // 2. Tabel produk (dengan kolom foto produk 'gambar')
        Schema::create('produk', function (Blueprint $table) {
            $table->id('id_produk');
            $table->string('nama_produk', 100);
            $table->string('kategori', 50);
            $table->decimal('harga', 12, 2);
            $table->integer('stok')->default(0);
            $table->string('barcode', 50)->nullable()->unique();
            $table->string('satuan', 20)->default('Pcs');
            $table->text('deskripsi')->nullable();
            $table->string('gambar')->nullable(); // Foto produk
            $table->timestamps();
        });

        // 3. Tabel transaksi
        Schema::create('transaksi', function (Blueprint $table) {
            $table->id('id_transaksi');
            $table->foreignId('id_user')->constrained('users', 'id_user')->onDelete('restrict');
            $table->string('nomor_invoice', 50)->unique();
            $table->dateTime('tanggal');
            $table->decimal('total', 12, 2);
            $table->decimal('bayar', 12, 2);
            $table->decimal('kembalian', 12, 2);
            $table->string('metode_pembayaran', 30)->default('Tunai');
            $table->string('catatan')->nullable();
            $table->timestamps();
        });

        // 4. Tabel detail_transaksi
        Schema::create('detail_transaksi', function (Blueprint $table) {
            $table->id('id_detail');
            $table->foreignId('id_transaksi')->constrained('transaksi', 'id_transaksi')->onDelete('cascade');
            $table->foreignId('id_produk')->constrained('produk', 'id_produk')->onDelete('restrict');
            $table->string('nama_produk', 100);
            $table->decimal('harga_satuan', 12, 2);
            $table->integer('jumlah');
            $table->decimal('subtotal', 12, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('detail_transaksi');
        Schema::dropIfExists('transaksi');
        Schema::dropIfExists('produk');
        Schema::dropIfExists('users');
    }
};
`,
    },
    {
      name: 'api.php (Routes Laravel)',
      path: 'routes/api.php',
      language: 'php',
      description: 'Route API RESTful untuk POS kasir, produk, upload gambar, auth login, & laporan.',
      content: `<?php

use Illuminate\\Support\\Facades\\Route;
use App\\Http\\Controllers\\Api\\AuthController;
use App\\Http\\Controllers\\Api\\ProdukController;
use App\\Http\\Controllers\\Api\\TransaksiController;
use App\\Http\\Controllers\\Api\\LaporanController;
use App\\Http\\Controllers\\Api\\UserController;

// Public: Login & Autentikasi
Route::post('/login', [AuthController::class, 'login']);

// Protected: Membutuhkan Token Sanctum
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Produk & Katalog (Akses Kasir & Admin)
    Route::get('/produk', [ProdukController::class, 'index']);
    Route::get('/produk/{id}', [ProdukController::class, 'show']);

    // Transaksi Kasir
    Route::post('/checkout', [TransaksiController::class, 'checkout']);
    Route::get('/riwayat-transaksi', [TransaksiController::class, 'history']);

    // Admin Only Routes
    Route::middleware('role:admin')->group(function () {
        // Kelola Produk & Upload Foto
        Route::post('/produk', [ProdukController::class, 'store']);
        Route::post('/produk/{id}', [ProdukController::class, 'update']);
        Route::delete('/produk/{id}', [ProdukController::class, 'destroy']);
        Route::post('/produk/{id}/restock', [ProdukController::class, 'restock']);

        // Kelola Akun Kasir
        Route::apiResource('/users', UserController::class);
        Route::patch('/users/{id}/toggle-status', [UserController::class, 'toggleStatus']);

        // Laporan Penjualan & Omzet
        Route::get('/laporan/ringkasan', [LaporanController::class, 'summary']);
        Route::get('/laporan/top-produk', [LaporanController::class, 'topProducts']);
        Route::get('/laporan/export-csv', [LaporanController::class, 'exportCsv']);
    });
});
`,
    },
  ];

  const currentFile = files[activeFileIndex];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadAll = () => {
    // Generate text file containing all Laravel files
    const allCode = files
      .map(
        (f) =>
          `// ========================================================\n// FILE: ${f.path}\n// DESKRIPSI: ${f.description}\n// ========================================================\n\n${f.content}\n\n`
      )
      .join('\n');

    const blob = new Blob([allCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Laravel_11_POS_TokoKu_Backend_Files.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-400 font-bold text-xs border border-rose-500/30 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5" /> Laravel 11 Framework
            </span>
            <span className="text-xs text-slate-400 font-mono">REST API &amp; Eloquent ORM</span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1.5">
            Arsitektur Backend Laravel 11 &amp; Generator Kode
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            File backend Laravel resmi siap pakai untuk sistem POS TokoKu: Controller, Model Eloquent, Upload Foto Produk, Migrasi Database, dan Route API.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleDownloadAll}
            type="button"
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-rose-950 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Semua File Laravel</span>
          </button>
        </div>
      </div>

      {/* Terminal Command Quickstart */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5 font-mono">
            <Terminal className="w-4 h-4 text-emerald-400" /> Perintah Setup Laravel Storage (Foto Produk):
          </span>
          <span className="text-[11px] text-slate-500">Jalankan di root folder Laravel Anda</span>
        </div>
        <div className="p-3 bg-slate-950 rounded-xl font-mono text-xs text-emerald-400 border border-slate-800/80 overflow-x-auto select-all">
          php artisan storage:link && php artisan migrate --seed
        </div>
        <p className="text-[11px] text-slate-400">
          Perintah <code className="text-rose-400 font-mono">storage:link</code> memastikan foto produk yang diupload oleh kasir/admin di folder <code className="text-slate-300 font-mono">storage/app/public/produk_images</code> dapat diakses langsung oleh browser via URL <code className="text-slate-300 font-mono">/storage/produk_images/...</code>.
        </p>
      </div>

      {/* Code Viewer Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left: Files List */}
        <div className="space-y-1.5 bg-slate-900/80 border border-slate-800 rounded-2xl p-3">
          <div className="px-2 py-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <FolderTree className="w-3.5 h-3.5 text-rose-400" />
            <span>Daftar File Laravel</span>
          </div>

          {files.map((file, idx) => {
            const isActive = activeFileIndex === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveFileIndex(idx)}
                className={`w-full text-left p-2.5 rounded-xl text-xs transition ${
                  isActive
                    ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileCode2 className={`w-4 h-4 shrink-0 ${isActive ? 'text-rose-400' : 'text-slate-500'}`} />
                  <span className="truncate">{file.name}</span>
                </div>
                <div className="text-[10px] text-slate-500 truncate mt-1 pl-6">
                  {file.path}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right: Code Viewer */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
          {/* File Header */}
          <div className="px-5 py-3 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
            <div>
              <div className="font-mono text-xs font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                {currentFile.path}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {currentFile.description}
              </p>
            </div>

            <button
              onClick={handleCopy}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Kode</span>
                </>
              )}
            </button>
          </div>

          {/* Code block */}
          <div className="p-4 bg-slate-950 flex-1 overflow-x-auto max-h-[540px]">
            <pre className="font-mono text-xs text-slate-300 leading-relaxed">
              <code>{currentFile.content}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
