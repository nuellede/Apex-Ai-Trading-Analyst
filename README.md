# APEX AI TRADING ANALYST 📈⚡

> **Terminal Analisis Teknikal AI Kuantitatif Multimodal untuk Forex & Gold (XAUUSD)**

Apex AI Trading Analyst adalah aplikasi web analisis teknikal berbasis **Google Gemini Multimodal Vision (`gemini-3.8-flash`)** yang mampu membaca screenshot grafik candlestick (dari TradingView, MT4, MT5, cTrader), mengidentifikasi struktur market secara objektif (BOS, CHoCH, Liquidity Sweeps, Supply/Demand), dan merumuskan rencana trading sistematis untuk **Scalping**, **Intraday**, dan **Swing Trading**.

Aplikasi ini juga berstandar **Progressive Web App (PWA)** sehingga dapat langsung diinstal ke HP Android dan iPhone layaknya aplikasi mandiri.

---

## 🛠️ Tech Stack & Arsitektur

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Motion, Lucide Icons.
- **PWA:** `vite-plugin-pwa` (Workbox caching, Web App Manifest, offline support, install prompts).
- **Backend API:** 
  - **Lokal / Full-Stack Dev:** Express + Node.js (`server.ts`).
  - **Produksi Vercel:** Vercel Serverless Functions (`/api/analyze-chart.ts`, `/api/seasonality`, `/api/instruments.ts`).
- **AI Engine:** `@google/genai` TypeScript SDK (server-side multimodal image vision, zero API key leak).
- **Deployment Platform:** Vercel + GitHub CI Actions.

---

## 📋 Fitur Utama

1. **AI Visual Chart Analyzer:**
   - Deteksi otomatis / validasi 8 instrumen: **XAUUSD (Gold)**, **EUR/USD**, **GBP/USD**, **USD/JPY**, **USD/CHF**, **AUD/USD**, **NZD/USD**, **USD/CAD**.
   - Audit kualitas gambar & skala harga (tidak pernah mengarang angka jika tidak terbaca).
   - Pengenalan struktur pasar (HH, HL, LH, LL, BOS, CHoCH, MSS, Orderblock, FVG, Liquidity Sweeps).
   - Audit indikator visual (EMA 20/50/200, RSI, MACD, Bollinger, VWAP, Volume).
2. **Dual Scenario Entry Engine:**
   - Skenario A (BUY) vs Skenario B (SELL) dengan level Entry Range, Stop Loss struktural, TP1, TP2, TP3, dan rasio Risk-to-Reward.
   - Penentuan *Preferred Setup* (BUY / SELL / WAIT / NO TRADE) berbasis konfluensi teknikal.
3. **Kalkulator Manajemen Risiko:**
   - Perhitungan otomatis Lot Size, nominal risiko kas ($), jarak pips, dan potensi profit.
4. **Modul Seasonality Historis (20+ Tahun):**
   - Data agregat kecenderungan bulanan, profil volatilitas hari (Senin-Jumat), dan dinamika jam sesi global (Tokyo, London, New York).
5. **Dukungan Instalasi PWA (Android & iOS):**
   - Tombol instalasi langsung untuk Android & panduan visual untuk iPhone/iPad Safari.
6. **Riwayat Analisis Lokal:**
   - Penyimpanan riwayat ke `localStorage` browser yang aman tanpa dependensi cloud eksternal.

---

## 🚀 Panduan Instalasi & Pengembangan Lokal

### 1. Prasyarat
- **Node.js** v20.x atau lebih baru (`node -v`).
- **npm** v10.x atau package manager setara.
- **Google Gemini API Key** (Dapatkan gratis di [Google AI Studio](https://aistudio.google.com/)).

### 2. Clone atau Unduh Proyek
```bash
git clone https://github.com/USERNAME_ANDA/apex-ai-trading-analyst.git
cd apex-ai-trading-analyst
```

### 3. Pasang Dependensi
```bash
npm install
```

### 4. Konfigurasi Environment Variables
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Buka file `.env` dan masukkan API Key Gemini Anda:
```env
GEMINI_API_KEY="AIzaSyYourActualGeminiApiKeyHere"
GEMINI_MODEL="gemini-3.8-flash"
PORT=3000
NODE_ENV="development"
```

### 5. Jalankan Development Server
```bash
npm run dev
```
Buka browser di `http://localhost:3000`.

### 6. Build Produksi Lokal
```bash
npm run build
```

---

## 🌐 Panduan Deployment: GitHub & Vercel (Langkah Demi Langkah)

### LANGKAH 1 — Buat Repositori di GitHub
1. Masuk ke akun Anda di [GitHub.com](https://github.com/).
2. Klik tombol **New** (Buat Repositori Baru).
3. Beri nama repositori, misalnya: `apex-ai-trading-analyst`.
4. Pilih visibilitas **Public** atau **Private**.
5. **Jangan centang** "Initialize this repository with a README" (karena file proyek kita sudah lengkap).
6. Klik **Create repository**.
7. Salin URL repositori Anda, misalnya: `https://github.com/USERNAME_ANDA/apex-ai-trading-analyst.git`.

### LANGKAH 2 — Push Kode ke GitHub
Buka terminal di direktori proyek ini dan jalankan perintah berikut:

```bash
# Inisialisasi Git
git init

# Tambahkan semua file yang telah disiapkan (kecuali yang ada di .gitignore)
git add .

# Buat commit pertama
git commit -m "feat: initial release of Apex AI Trading Analyst with PWA and Vercel support"

# Ubah branch utama menjadi main
git branch -M main

# Hubungkan ke repositori GitHub Anda (ganti URL di bawah dengan URL repo Anda)
git remote add origin https://github.com/USERNAME_ANDA/apex-ai-trading-analyst.git

# Push kode ke GitHub
git push -u origin main
```

---

### LANGKAH 3 — Impor dan Deploy ke Vercel

1. Buka [Vercel.com](https://vercel.com/) dan masuk menggunakan akun GitHub Anda.
2. Pada Dashboard Vercel, klik tombol **"Add New..."** lalu pilih **"Project"**.
3. Cari repositori `apex-ai-trading-analyst` yang baru saja Anda push, lalu klik **"Import"**.
4. Di halaman konfigurasi proyek Vercel:
   - **Framework Preset:** Pilih `Vite` (Vercel biasanya mendeteksinya otomatis).
   - **Root Directory:** `./` (biarkan default).
   - **Build Command:** `npm run build` (default).
   - **Output Directory:** `dist` (default).
5. **Atur Environment Variables (Sangat Penting):**
   - Perluas bagian **Environment Variables**.
   - Masukkan Key: `GEMINI_API_KEY`
   - Masukkan Value: Tempelkan API Key Gemini Anda dari Google AI Studio.
   - Centang ketiga environment: **Production**, **Preview**, dan **Development**.
   - *(Opsional)* Tambahkan `GEMINI_MODEL` dengan value `gemini-3.8-flash`.
6. Klik tombol **"Deploy"**.
7. Tunggu proses build selesai (~1-2 menit). Vercel akan memberikan domain publik aktif, misalnya:
   `https://apex-ai-trading-analyst.vercel.app`.

---

### LANGKAH 4 — Verifikasi Deployment di Vercel

Setelah deployment selesai:
1. Buka URL produksi yang diberikan Vercel di browser laptop dan smartphone.
2. Coba uji coba 1-klik dengan memuat salah satu **Sample Chart** (misal: *XAUUSD H1* atau *EUR/USD M15*).
3. Klik tombol **"Run Apex Technical Analysis"**.
4. Pastikan hasil analisis 19 seksi muncul secara lengkap dan akurat.
5. Di HP (Chrome atau Safari), coba ketuk tombol **"Instal di HP"** untuk memverifikasi fungsionalitas PWA.

---

## 🔄 Pembaruan di Masa Mendatang (CI/CD Otomatis)

Setiap kali Anda melakukan perbaikan atau penambahan fitur di laptop/komputer Anda:
```bash
git add .
git commit -m "update: perbaikan fitur X"
git push origin main
```
Vercel akan secara otomatis mendeteksi push baru ke branch `main`, menjalankan build, dan memperbarui website produksi Anda secara instan tanpa downtime.

---

## 🔒 Keamanan & Privasi

1. **Zero Client Leakage:** API Key Gemini tidak pernah dikirim ke browser client (tidak ada prefix `VITE_`). Semua panggilan API diproses melalui Vercel Serverless Function di `/api/analyze-chart`.
2. **Data Lokal:** Riwayat analisis grafik disimpan di `localStorage` peramban pengguna, sehingga tidak ada data atau foto pengguna yang disimpan tanpa izin di database publik.
3. **Validasi Input:** Serverless function membatasi ukuran muatan dan memvalidasi format data gambar demi stabilitas server.

---

## ❓ Troubleshooting

| Masalah | Penyebab Umum | Solusi |
|---|---|---|
| Analisis gagal / Error 500 | `GEMINI_API_KEY` belum disetel di Vercel | Buka Settings > Environment Variables di Vercel, pastikan `GEMINI_API_KEY` terisi dan lakukan *Redeploy*. |
| Halaman 404 saat di-refresh | SPA Routing Vercel | File `vercel.json` sudah menyertakan rewrite rules ke `/index.html` untuk mencegah error ini. |
| Tombol PWA tidak muncul di iPhone | Karakteristik browser WebKit iOS | Di iOS, gunakan browser **Safari** lalu ketuk menu **Share > Add to Home Screen** sesuai panduan in-app. |
| Payload too large saat upload | Gambar screenshot berukuran terlalu masif | Aplikasi otomatis mengompresi gambar, namun pastikan screenshot berformat standar PNG/JPEG/WEBP di bawah 15MB. |

---

## ⚖️ Lisensi & Disclaimer

*Disclaimer: Aplikasi ini dirancang sebagai alat bantu analisis kuantitatif dan edukasi teknikal. Keputusan transaksi trading dan manajemen risiko sepenuhnya merupakan tanggung jawab pengguna. Selalu gunakan risiko modal yang terukur.*
