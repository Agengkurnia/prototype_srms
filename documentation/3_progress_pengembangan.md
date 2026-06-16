# Bagian 3: Riwayat Progress Pengembangan & Data Dummy

Dokumen ini mencatat kronologi pengembangan aplikasi dari tahap awal perbaikan bug sistem produksi hingga penyusunan prototype interaktif mandiri (standalone prototype) beserta penambahan data dummy untuk simulasi.

---

## 📈 Kronologi Progress Pengembangan

### Tahap 1: Analisis & Perbaikan Bug Sistem Produksi (Laravel & SQLite)
*   **Masalah Awal**: Sistem mengalami error fatal saat diakses lokal karena database SQLite tidak memiliki tabel `projects` (`SQLSTATE[HY000]: General error: 1 no such table: projects`).
*   **Tindakan**:
    1.  Menganalisis konfigurasi koneksi `.env` database SQLite.
    2.  Melakukan migrasi skema database Laravel (`php artisan migrate`) dan mengisi data seeding dasar (`php artisan db:seed`) untuk membuat seluruh tabel sistem yang hilang.
    3.  Menguji coba kembali halaman dashboard agar berjalan normal tanpa kendala koneksi database.

### Tahap 2: Ekstraksi Desain & UI/UX Audit
*   **Tindakan**:
    1.  Melakukan penelusuran (scraping) aset dan pola alur kerja dari versi situs produksi yang berjalan di `http://127.0.0.1:8000` dan situs web referensi.
    2.  Melakukan evaluasi UI/UX. Ditemukan beberapa masukan penting: visualisasi diagram risiko yang terlalu sederhana, navigasi antar menu sub-sistem yang kurang terintegrasi, dan kalkulator estimasi penanganan lereng yang belum otomatis.

### Tahap 3: Pembuatan Standalone Prototype (HTML/JS + Mock Server)
*   **Tindakan**:
    1.  Membuat folder workspace baru khusus untuk prototype di `d:\Work\Source\SRMS\Prototype SRMS`.
    2.  Menyalin seluruh file aset ikon svg, gambar latar belakang, dan struktur CSS yang dibutuhkan.
    3.  Membangun antarmuka masuk (`login.html`) serta dashboard ringkasan utama (`index.html`).
    4.  Membangun server backend mock menggunakan Node.js (Express.js) dan menyusun database JSON sederhana (`db.json`) agar prototype dapat melakukan operasi **CRUD (Create, Read, Update, Delete)** secara penuh tanpa bergantung pada framework Laravel yang kompleks.

### Tahap 4: Pengembangan 5 Menu Dashboard Sub-Sistem
*   **Tindakan**:
    1.  Membangun menu **Slope Inventory** (`inventory.html` & `detail.html`) untuk manajemen dasar aset lereng.
    2.  Membangun menu **Slope Priority** (`priority.html`) untuk perangkingan otomatis tingkat kerawanan lereng.
    3.  Membangun menu **Inspection Portal** (`inspection.html`) dengan tab jadwal, riwayat inspeksi geoteknik, dan form input pemeliharaan rutin.
    4.  Membangun menu **Preservation Timeline** (`preservation.html` & `preservation-detail.html`) yang menyajikan catatan longsor dan pekerjaan perbaikan permanen dengan form checklist Type 1/2/3 yang dinamis.
    5.  Membangun menu **Mitigation Calculator** (`mitigation.html` & `mitigation-detail.html`) dengan tabel formulir yang menghitung total estimasi anggaran secara real-time.

---

## 📊 Detail Data Dummy Terinjeksi (30 Lereng & 30 Item per Tabel)

Untuk mempermudah peninjauan aplikasi secara komprehensif, database `db.json` kini telah diinjeksi dengan **30 data dummy lengkap** untuk masing-masing koleksi/tabel:
*   **30 Aset Lereng (Slopes)** (SP-01A s.d SP-30B) dengan lokasi STA terdistribusi rapi dari KM 426 s.d KM 459, lengkap dengan koordinat GPS realistik di sepanjang jalan tol Semarang - Solo.
*   **30 Laporan Kejadian Longsor Darurat (Records)**.
*   **30 Riwayat Inspeksi Audit Formal (Inspections)** oleh Insinyur Geoteknik.
*   **30 Log Pemeliharaan Rutin Harian (Maintenances)** seperti pembersihan u-ditch dan pemotongan rumput.
*   **30 Kronologi Pengerjaan Perbaikan Permanen (Preservations)** Type 1, 2, dan 3.
*   **30 Rencana Proposal & Perhitungan Estimasi Biaya Mitigasi Lereng (Mitigations)**.

Berikut adalah tabel sampel 10 lereng pertama dari 30 data lereng terdaftar di `db.json`:

| Feature No | Lokasi STA | Tipe Lereng | Koordinat (Lat, Lng) | Skor Risiko (RS) | Kategori Bahaya |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SP-01A** | KM 426+150 | Cut Slope | -7.160000, 110.410000 | **1,207.50** | **High Risk (Kritis)** |
| **SP-02B** | KM 427+300 | Rock Slope | -7.166207, 110.414483 | **1,380.00** | **High Risk (Kritis)** |
| **SP-03A** | KM 428+450 | Fill Slope | -7.172414, 110.418966 | **1,552.50** | **High Risk (Kritis)** |
| **SP-04B** | KM 429+600 | Retaining Wall | -7.178621, 110.423448 | **1,265.00** | **High Risk (Kritis)** |
| **SP-05A** | KM 430+750 | Combine Slope | -7.184828, 110.427931 | **1,207.50** | **High Risk (Kritis)** |
| **SP-06B** | KM 431+900 | Cut Slope | -7.191034, 110.432414 | 1,028.16 | High Risk (Kritis) |
| **SP-07A** | KM 433+050 | Rock Slope | -7.197241, 110.436897 | 648.60 | Medium Risk |
| **SP-08B** | KM 434+200 | Fill Slope | -7.203448, 110.441379 | 434.70 | Medium Risk |
| **SP-09A** | KM 435+350 | Retaining Wall | -7.209655, 110.445862 | 262.20 | Medium Risk |
| **SP-10B** | KM 436+500 | Combine Slope | -7.215862, 110.450345 | 120.75 | Medium Risk |

---

## 🛠️ Bagaimana CRUD Bekerja pada Prototype

Aplikasi ini menggunakan perpaduan **Frontend Reaktif** dan **Backend Sederhana** untuk memfasilitasi simulasi CRUD tanpa SQL database tradisional:

1.  **Operasi CREATE (Menambah Data)**:
    *   Pengguna mengisi formulir (misal: mencatat pemeliharaan baru pada lereng SP-01A).
    *   Javascript mengirimkan data input melalui metode HTTP `POST` ke Express API (`/api/slopes/sp-01a/maintenances`).
    *   Server membaca file `db.json`, memvalidasi data, menambahkan entri baru ke dalam array, menghitung ulang tanggal terjadwal berikutnya pada objek lereng terkait, lalu menulis kembali file `db.json`.
2.  **Operasi READ (Membaca Data)**:
    *   Saat halaman dimuat, Alpine.js mengirimkan permintaan HTTP `GET` ke endpoint API (seperti `/api/slopes` atau `/api/inspections`).
    *   Server mengembalikan data dalam format JSON. Alpine.js menangkap respons tersebut secara dinamis dan merendernya ke layar pengguna dengan bantuan animasi transisi CSS yang mulus.
3.  **Operasi UPDATE (Mengubah Data)**:
    *   Saat mengedit profil lereng atau memperbarui geometri di halaman `geometry.html`, data baru dikirim menggunakan metode HTTP `PUT` atau `POST`. Server memperbarui data lereng tersebut di dalam database JSON.
4.  **Operasi DELETE (Menghapus Data)**:
    *   Pada halaman detail mitigasi atau perbaikan lereng, tombol hapus memicu pengiriman permintaan HTTP `DELETE` ke `/api/preservations/:id`.
    *   Server menghapus entri dengan ID tersebut dari database `db.json` dan memperbarui antarmuka pengguna.
