# Website Donasi Publikasi Artikel Ilmiah (QRIS dinamis + GitHub Pages)

Website statis: gratis, tanpa server, tanpa API key. Nominal donasi disisipkan ke QRIS DANA Bisnis kamu langsung di browser, jadi donatur cukup scan tanpa mengetik nominal. Uang masuk ke akun DANA Bisnis kamu seperti pembayaran QRIS biasa.

> **Penting:** progres donasi **tidak otomatis**. Kamu cek riwayat di DANA Bisnis, lalu catat di `data.json`. Penjelasannya ada di bagian 4.

## Isi folder

| File | Fungsi |
|---|---|
| `index.html` | Kerangka halaman |
| `style.css` | Tampilan (responsif, otomatis mode gelap) |
| `config.js` | **Pengaturan: judul, target, nominal, QRIS.** Ini yang paling sering kamu edit |
| `data.json` | **Daftar donasi yang sudah masuk.** Kamu update manual |
| `qris.js` | Pengubah QRIS statis jadi dinamis (sudah dites) |
| `app.js` | Logika halaman |
| `vendor/qrcode.js` | Library pembuat gambar QR (MIT) |

## 1. Terbitkan di GitHub Pages (dari nol)

1. Buat akun di https://github.com kalau belum punya.
2. Klik **+** (kanan atas) → **New repository**. Nama bebas, misalnya `donasi-artikel`. Pilih **Public**. Klik **Create repository**.
3. Di halaman repository, klik **uploading an existing file**.
4. Ekstrak zip ini, lalu **drag seluruh isi folder** (termasuk folder `vendor`) ke halaman upload. Pastikan `index.html` ada di paling atas (bukan di dalam subfolder).
5. Klik **Commit changes**.
6. Buka **Settings** → **Pages**. Di bagian *Build and deployment*, pilih **Deploy from a branch**, branch **main**, folder **/ (root)**, lalu **Save**.
7. Tunggu 1–3 menit. Alamat websitemu: `https://USERNAME.github.io/donasi-artikel/`.

## 2. Ubah teks dan pengaturan

Buka `config.js` di GitHub → ikon pensil (Edit) → ubah → **Commit changes**. Yang bisa diubah: `judul`, `subjudul`, `deskripsi`, `target`, `nominalPilihan`, `kodeUnikMaks`, `linkKonfirmasi`, `footer`.

`linkKonfirmasi` opsional. Isi dengan link WhatsApp (`https://wa.me/62812xxxxxxxx`) atau Google Form supaya donatur bisa memberi tahu setelah transfer.

## 3. Tes sebelum disebar (jangan dilewati)

1. Buka websitemu, pilih Rp10.000, klik **Tampilkan QRIS**.
2. Scan dengan **DANA**, lalu coba lagi dengan **minimal 2 aplikasi lain** (GoPay/ShopeePay/m-banking). Pastikan nominal terisi otomatis dan nama penerima **TengQ Store**.
3. Bayar sungguhan (kecil saja) dari satu aplikasi lain, lalu cek masuk di riwayat **DANA Bisnis**.

Kalau ada aplikasi yang menolak QR atau nominalnya tidak muncul, kabari aku sebelum disebar.

## 4. Cara memperbarui progres

Setiap kali ada donasi masuk (cek di DANA Bisnis), edit `data.json` di GitHub:

```json
{
  "diperbarui": "2026-10-14",
  "donasi": [
    { "tanggal": "2026-10-14", "nama": "Budi", "nominal": 50037 },
    { "tanggal": "2026-10-14", "nama": "", "nominal": 100082 }
  ]
}
```

- `nominal` = jumlah **persis yang masuk** (termasuk kode unik).
- `nama` boleh dikosongkan, tampil sebagai "Anonim". Tulis nama hanya kalau donaturnya setuju.
- Hati-hati koma: setiap baris donasi diakhiri koma **kecuali yang terakhir**.
- Total, persentase, dan sisa target dihitung otomatis dari daftar ini.

Kode unik (Rp1–99) membantu kamu mencocokkan donatur dengan transaksi di riwayat DANA.

## 5. Yang perlu kamu tahu

- **Tidak ada verifikasi otomatis.** QRIS ubahan ini tidak punya ID transaksi dan DANA tidak mengirim notifikasi ke website. Untuk otomatis penuh, jalannya lewat API DANA (kalau akunmu diizinkan) atau payment gateway.
- **Siapa pun bisa melihat `config.js`.** Isinya QRIS statis yang memang bukan rahasia, sama dengan QR yang ditempel di toko. Jangan pernah menaruh password, API key, atau token di repo publik.
- **Izin penggalangan dana.** Penggalangan terbuka ke masyarakat luas diatur Permensos 8/2021 dan UU 9/1961 dan bisa memerlukan izin. Penggalangan tertutup (teman, angkatan, komunitas terbatas) tidak wajib izin. Sebaiknya sebarkan di lingkaran terbatas, dan tanyakan ke Dinas Sosial setempat kalau ragu.
- **Transparan itu menolong.** Tulis jelas di `deskripsi` untuk apa dana dipakai dan jelaskan sisa dana kalau melebihi target.
- Nama penerima yang muncul di aplikasi pembayar adalah **TengQ Store** (nama toko di QRIS-mu). Page sudah menampilkannya supaya donatur tidak bingung.

## Tes lokal (opsional)

Karena halaman membaca `data.json`, buka lewat server lokal, bukan klik dua kali:

```bash
python3 -m http.server 8000
# lalu buka http://localhost:8000
```
