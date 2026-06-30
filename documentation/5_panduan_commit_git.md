# Bagian 5: Panduan Konvensi Commit Git (Conventional Commits)

Dokumen ini menjelaskan standar penulisan pesan commit yang digunakan di proyek **SRMS**. Konvensi ini mengikuti praktik umum **Conventional Commits** agar riwayat git mudah dibaca, changelog otomatis dapat dibuat, dan tim (termasuk AI agent) memahami jenis perubahan tanpa membuka diff.

---

## 📝 Format Dasar

```
<type>(<scope>): <deskripsi singkat>

[body opsional — penjelasan lebih detail]

[footer opsional — breaking change, issue reference, dll.]
```

| Bagian | Wajib? | Keterangan |
| :--- | :--- | :--- |
| **type** | Ya | Jenis perubahan (feat, fix, refactor, dll.) |
| **scope** | Tidak | Area kode yang terdampak, misal: `inventory`, `api`, `auth` |
| **deskripsi** | Ya | Ringkas, imperatif, huruf kecil, tanpa titik di akhir |

**Contoh:**
```
feat(inventory): tambah form input lereng baru
fix(api): perbaiki error 404 saat hapus preservation
docs: perbarui panduan menu dashboard
```

---

## 🏷️ Jenis Commit (Type)

### Perubahan yang Mempengaruhi Pengguna

| Type | Kapan Digunakan | Contoh |
| :--- | :--- | :--- |
| **feat** | Fitur baru atau peningkatan fungsional yang terlihat pengguna | `feat(mitigation): hitung estimasi biaya otomatis` |
| **fix** | Perbaikan bug atau error | `fix(login): sesuaikan redirect setelah autentikasi` |
| **perf** | Peningkatan performa tanpa mengubah perilaku | `perf(dashboard): kurangi request API saat load peta` |

### Perubahan Kode Tanpa Fitur/Bug Baru

| Type | Kapan Digunakan | Contoh |
| :--- | :--- | :--- |
| **refactor** | Restrukturisasi kode tanpa mengubah perilaku luar | `refactor(api): pisahkan handler CRUD slopes` |
| **style** | Formatting, spasi, titik koma — **bukan** perubahan CSS/UI | `style: rapikan indentasi di server.js` |
| **test** | Menambah atau memperbaiki tes | `test(api): tambah unit test endpoint slopes` |

### Dokumentasi & Infrastruktur

| Type | Kapan Digunakan | Contoh |
| :--- | :--- | :--- |
| **docs** | Hanya perubahan dokumentasi (.md, komentar, README) | `docs: tambah panduan konvensi commit git` |
| **build** | Sistem build, dependensi, tooling | `build: update express ke versi terbaru` |
| **ci** | Konfigurasi CI/CD (GitHub Actions, pipeline) | `ci: tambah workflow lint pada pull request` |
| **chore** | Tugas rutin yang tidak masuk kategori di atas | `chore: hapus file sementara hasil debug` |

### Lainnya

| Type | Kapan Digunakan | Contoh |
| :--- | :--- | :--- |
| **revert** | Membatalkan commit sebelumnya | `revert: batalkan feat(inventory) form lereng baru` |

---

## 🎯 Scope yang Disarankan untuk Proyek SRMS

Gunakan scope singkat sesuai modul atau area kode:

| Scope | Area |
| :--- | :--- |
| `inventory` | Slope Inventory (`inventory.html`, `detail.html`) |
| `priority` | Slope Priority (`priority.html`) |
| `inspection` | Inspection Portal (`inspection.html`) |
| `preservation` | Preservation Timeline |
| `mitigation` | Mitigation Calculator |
| `dashboard` | Halaman utama & peta (`index.html`) |
| `auth` | Login & sesi pengguna |
| `api` | Endpoint Express.js & `db.json` |
| `ui` | Tampilan, layout, komponen visual (CSS/HTML) |
| `docs` | Folder `documentation/` |

Scope boleh dihilangkan jika perubahan bersifat global atau sulit dikategorikan.

---

## ✅ Contoh Commit yang Baik

```
feat(preservation): tambah checklist Type 3 pada form perbaikan
fix(api): validasi ID lereng sebelum operasi DELETE
refactor(mitigation): ekstrak logika kalkulasi biaya ke fungsi terpisah
docs(progress): catat tahap injeksi 30 data dummy
style(ui): seragamkan padding tombol di seluruh halaman
chore: update package-lock.json setelah npm install
```

---

## ❌ Contoh Commit yang Kurang Baik

| Pesan | Masalah |
| :--- | :--- |
| `update` | Tidak jelas apa yang diubah |
| `fix bug` | Tidak spesifik bug apa dan di mana |
| `feat: Perbaikan halaman inventory` | "Perbaikan" seharusnya `fix`, bukan `feat` |
| `FEAT(INVENTORY): TAMBAH FORM` | Gunakan huruf kecil |
| `feat(inventory): tambah form.` | Hindari titik di akhir deskripsi |

---

## 🔀 Breaking Change

Jika perubahan **merusak kompatibilitas** dengan versi sebelumnya (misalnya mengubah struktur API), tambahkan penanda di footer:

```
feat(api)!: ubah format response endpoint /api/slopes

BREAKING CHANGE: field `riskScore` diganti menjadi `rs` di seluruh response JSON.
```

Tanda `!` setelah scope juga dapat digunakan: `feat(api)!: ...`

---

## 📌 Referensi Issue / Task

Jika terhubung ke tiket atau issue tracker:

```
fix(inspection): perbaiki tab jadwal kosong saat data belum ada

Closes #42
```

---

## 💡 Tips Singkat

1. **Satu commit, satu tujuan** — jangan mencampur `feat` dan `fix` dalam satu commit.
2. **Gunakan imperatif** — "tambah", "perbaiki", "hapus" (bukan "menambahkan", "diperbaiki").
3. **Body untuk konteks** — jika perlu penjelasan panjang, tulis di baris setelah baris kosong.
4. **Jangan commit file sensitif** — `.env`, kredensial, atau data pribadi.

---

> Dokumen ini menjadi acuan standar commit untuk seluruh kontributor proyek SRMS, baik manusia maupun AI coding assistant.
