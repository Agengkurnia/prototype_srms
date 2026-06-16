# Bagian 4: Arsitektur Teknis & Panduan Integrasi

Dokumen ini ditujukan bagi tim pengembang perangkat lunak, arsitek sistem, atau AI agent (Antigravity, Kiro, dll.) yang ingin memahami detail implementasi teknis sistem prototype ini, memperluas fiturnya, atau mengintegrasikannya kembali ke sistem produksi Laravel.

---

## 🛠️ Tech Stack & Dependensi

Prototype ini dibangun menggunakan konsep **Jamstack Modern & Lightweight** untuk memastikan kecepatan muat (rendering speed) maksimal tanpa overhead kompilasi yang rumit:

1.  **Frontend (Antarmuka Pengguna)**:
    *   **Tailwind CSS**: Untuk styling utilitas kelas yang responsif dan modern.
    *   **Flowbite CSS & JS**: Library komponen UI (seperti Modal, Dropdown, Tabs) berbasis Tailwind.
    *   **Alpine.js**: Library Javascript deklaratif yang sangat ringan untuk mengelola state reaktif frontend, animasi, sinkronisasi form, dan pemanggilan API.
    *   **Leaflet.js**: Library peta interaktif berbasis ubin open-source untuk render titik lereng geografis menggunakan ubin OpenStreetMap (OSM).
2.  **Backend (Server Simulasi API)**:
    *   **Node.js & Express.js**: Server HTTP ringan untuk melayani file statis dan menangani REST API Endpoint.
    *   **Multer**: Middleware untuk menangani upload file dokumen dan foto lereng.
3.  **Database (Simulasi Penyimpanan)**:
    *   **JSON Database (`db.json`)**: File tunggal bertindak sebagai database NoSQL terpusat yang menyimpan array koleksi data lereng, riwayat inspeksi, pemeliharaan rutin, perbaikan longsoran, dan kalkulasi biaya mitigasi.

---

## 📂 Struktur Direktori Proyek

Berikut adalah peta struktur folder pada direktori `Prototype SRMS`:

```text
Prototype SRMS/
├── db.json                       # Database lokal (JSON format)
├── package.json                  # Dependensi Node.js & script start
├── server.js                     # File server Express.js & REST API Router
└── public/                       # Folder penyedia file statis (client-side)
    ├── login.html                # Halaman login otentikasi demo
    ├── index.html                # Dashboard ringkasan utama & peta
    ├── inventory.html            # Manajemen inventaris lereng
    ├── detail.html               # Detail lereng, konfigurasi umum & geometri
    ├── geometry.html             # Formulir konfigurasi dimensi lereng
    ├── characteristic.html       # Formulir konfigurasi karakteristik visual lereng
    ├── rating.html               # Formulir penilaian parameter risiko lereng
    ├── record-form.html          # Formulir rekam data longsoran historis
    ├── priority.html             # Dashboard daftar prioritas & peta telemetry
    ├── inspection.html           # Portal jadwal pemeliharaan & riwayat inspeksi
    ├── preservation.html         # Dashboard timeline & road side perbaikan lereng
    ├── preservation-detail.html  # Detail timeline & formulir interaktif perbaikan lereng
    ├── mitigation.html           # Dashboard penawaran anggaran mitigasi lereng
    ├── mitigation-detail.html    # Kalkulator real-time penaksir anggaran mitigasi lereng
    ├── components/               # Folder ikon SVG & aset pendukung
    │   ├── icons/                # Ikon svg modul (inventory, priority, dll)
    │   ├── inventory-bg.webp     # Gambar latar belakang hero header
    │   └── bg2.webp              # Gambar latar belakang filosofi
    └── uploads/                  # Tempat penyimpanan file unggahan dokumen/foto lereng
```

---

## 💾 Struktur Skema Database (`db.json`)

Database JSON terbagi menjadi 5 koleksi utama:

### 1. `slopes` (Inventaris Lereng)
Menyimpan data dasar lereng, koordinat geolokasi, parameter geometri, karakteristik visual, parameter rating risiko, serta tanggal jadwal inspeksi berikutnya.
```json
{
  "id": 1,
  "slope_name": "SP-01A",
  "slug": "sp-01a",
  "location": "Semarang - Solo KM 429+200",
  "latitude": "-7.185244",
  "longtitude": "110.428311",
  "side_of_road": "A",
  "slope_type": "cut-type",
  "geometry": { "soil_slope_height": 12, "feature_height": 17.5 },
  "characteristic": { "slope_protection": "Hydroseeding" },
  "rating": { "A1": 3, "consequence_to_life": "category-2" },
  "ranking": { "IS": 24, "CS": 140, "TS": 3360, "RS": 211.68 },
  "engineer_inspection": "2031-06-16T00:00:00Z",
  "maintenance_inspection": "2027-06-16T00:00:00Z"
}
```

### 2. `inspections` (Riwayat Rating Insinyur)
Merekam jejak audit formal parameter geoteknis yang pernah di-submit untuk lereng tertentu.

### 3. `maintenances` (Riwayat Pemeliharaan Rutin)
Mencatat tindakan pembersihan drainase lereng dan pemeliharaan rumput penahan tanah harian.

### 4. `preservations` (Catatan Longsor & Perbaikan Konstruksi)
Menyimpan data kejadian tanah longsor beserta klasifikasi perbaikan (Type 1, 2, atau 3) dan checklist tujuan/tindakan teknik yang diambil.

### 5. `mitigations` (Kalkulasi Biaya Penstabilan Lereng)
Menyimpan estimasi volume, harga satuan, subtotal, dan grand total biaya pengerjaan penguatan lereng.

---

## 🔌 Dokumentasi REST API Endpoints (`server.js`)

Semua endpoint API mengembalikan data dalam format JSON dan diawali dengan path `/api`.

| Metode HTTP | Endpoint | Deskripsi | Parameter Input (JSON) |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/slopes` | Mendapatkan daftar semua lereng | Query: `search`, `side_of_road`, `page` |
| **GET** | `/api/slopes/:slug` | Mendapatkan detail profil lereng tunggal | `:slug` (nama lereng kecil, misal: `sp-01a`) |
| **POST** | `/api/slopes` | Menambahkan lereng baru ke inventaris | `slope_name`, `location`, `latitude`, `longtitude`, `side_of_road`, `slope_type` |
| **POST** | `/api/slopes/:slug/geometry` | Memperbarui parameter dimensi geometri lereng | Kunci dimensi bervariasi sesuai tipe lereng |
| **POST** | `/api/slopes/:slug/characteristic` | Memperbarui parameter visual karakteristik lereng | `slope_protection`, `surface_drainage_provision`, dll |
| **POST** | `/api/slopes/:slug/rating` | Menyimpan rating parameter (A1 s.d D2) & hitung skor otomatis | Objek rating parameter numerik |
| **GET** | `/api/inspections` | Mendapatkan semua log historis inspeksi geoteknis | Tidak ada |
| **POST** | `/api/slopes/:slug/maintenances` | Mencatat laporan pemeliharaan rutin lereng | `date_of_maintenance`, `weather_condition`, `resume` |
| **GET** | `/api/preservations` | Mendapatkan seluruh riwayat perbaikan longsor | Tidak ada |
| **POST** | `/api/slopes/:slug/preservations` | Menambahkan riwayat perbaikan & klasifikasi perbaikan | `date_of_landslide`, `landslide_type`, `type_of_improvement_works`, `type`, `note` |
| **DELETE** | `/api/preservations/:id` | Menghapus satu log perbaikan berdasarkan ID | `:id` (integer) |
| **GET** | `/api/mitigations` | Mendapatkan daftar rencana proposal biaya mitigasi | Tidak ada |
| **POST** | `/api/slopes/:slug/mitigations` | Menyimpan perhitungan penaksir biaya stabilisasi lereng | `slope_condition`, `mitigation_strategy`, `mitigation_estimate` |
| **DELETE** | `/api/mitigations/:id` | Menghapus proposal estimasi biaya mitigasi | `:id` (integer) |
| **GET** | `/api/dashboard/stats` | Kompilasi statistik ringkasan dashboard | Tidak ada (dihitung dinamis oleh server) |

---

## 📈 Panduan bagi Pengembang Selanjutnya (AI / Human)

Jika Anda ingin mengintegrasikan kembali prototype ini ke dalam sistem produksi utama (Laravel), berikut adalah peta jalan integrasinya:

1.  **Migrasi Route & Controller**:
    *   Salin endpoint routing dari `server.js` ke `routes/api.php` or `routes/web.php` di Laravel.
    *   Buat controller baru: `InspectionController`, `PreservationController`, dan `MitigationController`.
2.  **Pemetaan Database Relasional**:
    *   Buat migration tabel SQL di Laravel yang merepresentasikan struktur data JSON di atas.
    *   Tabel `preservations` harus memiliki relasi `belongsTo` ke tabel `projects` (atau lereng terkait).
3.  **Integrasi Template HTML**:
    *   Ganti file berekstensi `.html` di folder prototype menjadi file `.blade.php` di Laravel.
    *   Ganti fungsi fetch `/api/` menggunakan helper route Laravel `route(...)` agar memanggil backend controller resmi Laravel yang terhubung dengan database MySQL/PostgreSQL produksi.
