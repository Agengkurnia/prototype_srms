# Dokumentasi Sistem SRMS (Slope Risk Management System)

Selamat datang di direktori dokumentasi **Slope Risk Management System (SRMS)**. Dokumen ini disusun khusus dalam Bahasa Indonesia untuk membantu pengguna awam, pemilik proyek, maupun tim pengembang (termasuk AI agent seperti Antigravity, Kiro, dll.) agar dapat langsung memahami proyek ini dan melanjutkan pengembangannya dengan cepat.

Dokumentasi ini dibagi menjadi 5 bagian utama yang saling melengkapi:

---

## 📂 Daftar Isi Dokumentasi

### 1. [Deskripsi Proyek (1_deskripsi_proyek.md)](./1_deskripsi_proyek.md)
*   Apa itu SRMS? Latar belakang dan tujuan utama.
*   Siapa pengguna target sistem ini?
*   Masalah utama apa saja yang diselesaikan oleh sistem ini?

### 2. [Panduan & Dokumentasi Menu Dashboard (2_panduan_menu.md)](./2_panduan_menu.md)
*   Penjelasan detail mengenai 6 menu utama di Launchpad:
    1.  **Slope Inventory** (Inventarisasi Lereng)
    2.  **Slope Priority** (Prioritas Penanganan Lereng)
    3.  **Inspection Portal** (Jadwal & Riwayat Inspeksi/Pemeliharaan)
    4.  **Preservation Timeline** (Penanganan Longsoran & Perbaikan Darurat)
    5.  **Mitigation Calculator** (Perhitungan Anggaran Stabilisasi Lereng)
    6.  **Slope Information** (Modul Informasi Publik)
*   Bagaimana logika di balik kalkulasi skor risiko (RS, TS, IS, CS)?

### 3. [Log Progress Pengembangan & Dummy Data (3_progress_pengembangan.md)](./3_progress_pengembangan.md)
*   Riwayat pengerjaan dari awal hingga kondisi prototype saat ini.
*   Informasi data dummy (30 lereng uji coba SP-01A s.d SP-30B).
*   Catatan perubahan dari sistem asli (Laravel) ke bentuk standalone prototype.

### 4. [Arsitektur Teknis & Panduan Integrasi (4_arsitektur_teknis.md)](./4_arsitektur_teknis.md)
*   Teknologi yang digunakan (Tailwind CSS, Alpine.js, Express.js, JSON Database).
*   Struktur folder proyek prototype.
*   Spesifikasi REST API Endpoint untuk pengembang masa depan.
*   Panduan melanjutkan proyek menggunakan AI Coding Assistant.

### 5. [Panduan Konvensi Commit Git (5_panduan_commit_git.md)](./5_panduan_commit_git.md)
*   Format pesan commit standar (Conventional Commits).
*   Jenis commit: `feat`, `fix`, `refactor`, `style`, `docs`, `chore`, dan lainnya.
*   Scope yang disarankan untuk modul SRMS.
*   Contoh commit yang baik dan yang perlu dihindari.

---

## 🚀 Cara Menjalankan Prototype & Mengakses Dokumentasi Ini

### Prasyarat
Pastikan komputer Anda sudah terinstal **Node.js** (versi 16 atau lebih baru).

### Cara Menjalankan Server Standalone:
1.  Buka terminal/command prompt pada direktori proyek `Prototype SRMS`.
2.  Jalankan perintah berikut untuk menginstal dependensi (hanya perlu sekali):
    ```bash
    npm install
    ```
3.  Jalankan server mock database:
    ```bash
    npm start
    ```
4.  Buka browser dan akses alamat:
    *   **Aplikasi**: [http://localhost:3000](http://localhost:3000)
    *   **Akun Login Demo**:
        *   **Email**: `malik@gwadestek.com`
        *   **Password**: `maulana45`

---

> [!NOTE]
> Semua file dokumentasi bertipe Markdown (.md) ini dapat dibuka menggunakan editor teks apa pun (seperti VS Code, Notepad++), atau langsung dibaca di repository GitHub/GitLab karena formatnya yang terstruktur dengan rapi.
