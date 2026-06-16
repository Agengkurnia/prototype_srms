# Bagian 2: Panduan & Dokumentasi Menu Dashboard

Dokumen ini menjelaskan alur penggunaan dan fungsi dari setiap halaman menu yang ada pada prototype **Slope Risk Management System (SRMS)**.

---

## 🖥️ 1. Dashboard Utama (`index.html`)
Halaman ini adalah pusat kendali dan pemantauan cepat bagi level manajemen. 
*   **Peta Interaktif (Leaflet Map)**: Menampilkan titik koordinat semua lereng (SP-01A s.d SP-30B). Pin penunjuk akan berwarna **Merah** (High Risk), **Kuning** (Medium Risk), atau **Hijau** (Low Risk) sesuai skor lereng. Jika salah satu lereng pada daftar diklik, peta akan otomatis memperbesar (zoom in) langsung ke titik koordinat lereng tersebut.
*   **Informasi Risiko Terkini**: Menampilkan nama lereng yang memiliki risiko tertinggi saat ini (SP-05A) sebagai peringatan utama bagi manajemen untuk segera bertindak.
*   **Metrik Kesehatan Lereng**: Grafik batang yang merangkum jumlah lereng berdasarkan tingkat bahaya (High, Medium, Low) serta pembagian tipe lereng yang ada di lapangan.

---

## 📦 2. Slope Inventory (`inventory.html`)
Menu ini digunakan untuk mendata seluruh lereng yang dikelola di sepanjang jalan tol Semarang - Solo.
*   **Daftar Lereng**: Berisi informasi nama lereng (Feature No), lokasi STA, koordinat GPS, arah jalan tol (Side A / Side B), dan tipe fisik lereng.
*   **CRUD (Tambah, Ubah, Hapus Lereng)**:
    *   Pengguna dapat menambahkan lereng baru dengan menekan tombol **"+ Add New Slope Asset"**.
    *   Dapat mengedit konfigurasi geometri dan parameter visual lereng.
*   **Fungsi Detail Lereng (`detail.html`)**: Jika baris lereng diklik, pengguna masuk ke halaman detail yang menampilkan profil lengkap lereng, parameter geometri rinci, riwayat dokumen uji laboratorium, serta laporan kegagalan/longsoran sebelumnya.

---

## 🚨 3. Slope Priority (`priority.html`)
Halaman ini merupakan **Leaderboard Tingkat Kerawanan Lereng**.
*   **Fungsi**: Lereng secara otomatis diurutkan dari skor risiko (RS) yang **terbesar ke terkecil**. Lereng paling atas adalah yang paling kritis dan membutuhkan tindakan perbaikan segera.
*   **Peta Samping (Split Telemetry Map)**: Ketika pengguna memilih salah satu lereng di tabel sebelah kiri, peta di sebelah kanan akan otomatis bergeser dan menampilkan lokasi tepatnya beserta ringkasan skor risikonya.

---

## 📅 4. Inspection Portal (`inspection.html`)
Halaman ini digunakan untuk menjadwalkan pemeriksaan lapangan dan mencatat pemeliharaan jalan tol harian.
*   **Jadwal Inspeksi**: Menampilkan perkiraan tanggal kapan Insinyur Geoteknik harus datang ke lokasi untuk melakukan evaluasi lereng secara menyeluruh, serta tanggal pemeliharaan rutin berikutnya.
*   **Log Pemeliharaan Rutin (CRUD)**:
    *   Pengguna dapat mencatat tindakan pemeliharaan harian (misal: membersihkan lumpur di saluran air lereng, menambal erosi kecil).
    *   Sistem akan meminta input tanggal pengerjaan, cuaca, dan deskripsi kegiatan. Setelah disimpan, sistem secara otomatis menghitung ulang tanggal pemeliharaan terjadwal berikutnya.

---

## 🛡️ 5. Preservation Timeline (`preservation.html` & `preservation-detail.html`)
Menu ini didedikasikan untuk merekam catatan bencana longsoran dan pengerjaan konstruksi perbaikan permanen lereng.
*   **Timeline Sejarah Perbaikan**: Menampilkan kronologi perbaikan lereng dari tahun ke tahun.
*   **Input Data Longsor & Perbaikan (CRUD)**:
    *   Ketika mencatat perbaikan baru, pengguna dapat memilih klasifikasi pekerjaan:
        *   **Type 1 (Repair works to landslides)**: Fokus pada perbaikan permukaan lereng (misalnya memasang jaring kawat pencegah batu jatuh/netting, atau proteksi hydroseeding).
        *   **Type 2 (Preventive maintenance works)**: Fokus pada perbaikan sistem drainase (misalnya pembuatan saluran pembuangan air tanah horizontal untuk mengurangi kejenuhan air tanah).
        *   **Type 3 (Upgrading works)**: Fokus pada kekuatan struktur lereng (misalnya pemasangan paku tanah/soil nailing, konstruksi dinding penahan tanah beton/gabion).
    *   Formulir pengisian akan menyesuaikan pilihan tersebut secara interaktif, menampilkan checklist tujuan (objectives) dan tindakan (measures) yang sesuai.

---

## 🧮 6. Mitigation Calculator (`mitigation.html` & `mitigation-detail.html`)
Halaman ini adalah **Estimator Biaya Konstruksi Stabilisasi Lereng**.
*   **Fungsi**: Jika seorang insinyur sipil ingin memperbaiki lereng yang rawan longsor (misalnya SP-05A), mereka dapat memasukkan kebutuhan volume volume pekerjaan stabilisasi pada tabel estimator.
*   **Auto-Calculator**:
    *   Sistem menyediakan 9 item pekerjaan standar (seperti pembersihan drainase, shotcrete beton, penanaman vegetasi hydroseeding, pemotongan lereng/resloping, regrading tanah, soil nailing, dll.).
    *   Pengguna cukup menginput **Volume** dan **Harga Satuan (Unit Price)** pada kolom input.
    *   Alpine.js secara dinamis langsung mengalikan input tersebut menjadi Subtotal per baris, dan menjumlahkan semuanya menjadi **Grand Total Estimasi Anggaran (dalam Rupiah)** secara real-time tanpa perlu memuat ulang halaman browser (zero reload).
*   **CRUD**: Hasil perhitungan estimasi dapat disimpan sebagai proposal resmi ke database atau dihapus untuk kalkulasi ulang.

---

## 🧠 Penjelasan Rumus & Logika Prioritas Risiko (IS, CS, TS, RS)

Untuk menentukan tingkat bahaya lereng, sistem SRMS menggunakan standardisasi Geoteknik berikut:

1.  **IS (Instability Score / Skor Ketidakstabilan)**:
    *   Mengukur seberapa besar potensi lereng tersebut untuk longsor secara fisik.
    *   Dihitung dari evaluasi insinyur sipil terhadap parameter kerentanan (A1 s.d A5, B1 s.d B2) seperti keretakan lereng, rembesan air tanah, jenis batuan, dan pelapukan.
2.  **CS (Consequence Score / Skor Konsekuensi)**:
    *   Mengukur seberapa parah kerugian yang terjadi jika lereng tersebut benar-benar longsor.
    *   Dihitung dari dampak terhadap fasilitas tol (C1 s.d C2) dan lalu lintas kendaraan (D1 s.d D2), seperti penutupan jalan tol, kerusakan jembatan terdekat, atau ancaman terhadap pemukiman warga sekitar.
3.  **TS (Total Score)**:
    *   Merupakan perkalian mentah dari kerentanan fisik dan dampaknya:
        $$\text{TS} = \text{IS} \times \text{CS}$$
4.  **RS (Risk Score / Skor Risiko Akhir)**:
    *   Skor akhir yang menentukan klasifikasi prioritas lereng di sistem SRMS.
    *   Dihitung berdasarkan normalisasi pembobotan nilai TS.
    *   **Kategori Bahaya**:
        *   **High Risk (RS $\ge$ 1,000)**: Sangat Kritis. Memerlukan tindakan mitigasi struktural segera (seperti pemasangan soil nailing).
        *   **Medium Risk (RS 100 - 999)**: Waspada. Membutuhkan pemeliharaan berkala intensif dan pembersihan drainase.
        *   **Low Risk (RS $<$ 100)**: Aman. Cukup pemantauan visual rutin.
