# 📚 Comic Payroll Management System

Aplikasi web siap produksi yang dirancang khusus untuk tim scanlation komik (manga/manhwa/manhua) guna mengelola laporan pekerjaan translator dan editor, perhitungan gaji otomatis, integrasi bot Discord, serta dashboard admin yang komprehensif.

---

## 🌟 Fitur Utama

- **Formulir Laporan Publik (`/laporan`)**: Translator dan editor dapat mengirimkan laporan pengerjaan chapter harian dengan mudah. Dilengkapi fitur **+ Chapter Lain** untuk melaporkan beberapa chapter sekaligus dalam satu waktu.
- **Daftar Logs Kerja (`/logs`)**: Halaman transparan untuk melihat seluruh riwayat laporan pekerjaan beserta statusnya (Approved, Pending Review, Rejected).
- **Rekap & Penggajian (`/rekap`)**: Rincian gaji bulanan dan tahunan, total chapter yang diselesaikan, status pembayaran (Paid/Unpaid), serta distribusi berdasarkan role.
- **Dashboard Admin & Manajemen**:
  - **Analitik Dashboard**: Metrik performa utama, grafik pengeluaran bulanan, dan distribusi role.
  - **Manajemen Work Logs & Verifikasi**: Deteksi otomatis nickname bermasalah (`PENDING_REVIEW`) dengan modal verifikasi interaktif untuk mencocokkan ke karyawan terdaftar atau mendaftarkannya sebagai karyawan baru.
  - **Manajemen Karyawan**: Kelola profil staf (Translator, Editor, Solo), status akun (Active/Inactive), serta total penghasilan.
  - **Tarif Gaji (`Payroll Rates`)**: Pengaturan tarif per chapter yang fleksibel untuk setiap role.
  - **Integrasi Discord**: Konfigurasi Webhook & Bot Token Discord, riwayat log pengiriman simulasi, serta pengujian interaksi *slash command*.

---

## 🛠️ Teknologi yang Digunakan

- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide Icons, Recharts, Motion.
- **Backend**: Node.js, Express, Better-SQLite3 (WAL mode).
- **Bahasa**: TypeScript.

---

## 🚀 Cara Menjalankan (Development)

### Prasyarat
- Node.js 22+
- npm

### Langkah-langkah Instalasi

1. Clone repositori ini:
   ```bash
   git clone https://github.com/secondfgt31-stack/rekap.git
   cd rekap
   ```

3. Install dependensi:
   ```bash
   npm install
   ```

4. Jalankan server development:
   ```bash
   npm run dev
   ```

5. Buka browser dan akses `http://localhost:3000`.

---

## 📦 Build & Produksi

Untuk melakukan build aplikasi untuk produksi:
```bash
npm run build
```

Untuk menjalankan server produksi:
```bash
npm start
```

---

## 📄 Lisensi

Lisensi MIT
