# Website Donasi Publikasi Artikel Ilmiah (QRIS dinamis + konfirmasi lewat email)

Website statis di GitHub Pages (gratis) dengan backend kecil di Google Apps Script (gratis, jalan di akun Google kamu).

**Alur donasi:**
1. Donatur pilih nominal → muncul QRIS DANA Bisnis kamu dengan nominal terisi.
2. Donatur bayar lewat aplikasi apa pun, lalu isi nama (+ email opsional) di **form yang ada di dalam website** dan klik **Saya sudah bayar**.
3. Kamu menerima **email dengan tombol Konfirmasi / Tolak**. Cek DANA Bisnis, lalu klik Konfirmasi.
4. Progres di website bertambah otomatis. Donatur yang mengisi email menerima email terima kasih.

> Tombol di email **tidak memverifikasi pembayaran sendiri**. Kamu yang mengecek DANA Bisnis dulu, tombolnya hanya mencatat hasil pengecekanmu. Untuk donatur yang kamu percaya, kamu bisa mengaktifkan mode langsung dihitung (lihat bagian 6).

## Isi folder

| File | Fungsi |
|---|---|
| `index.html`, `style.css` | Halaman dan tampilan (responsif, otomatis mode gelap) |
| `config.js` | **Pengaturan:** judul, target, nominal, QRIS, alamat Apps Script |
| `data.json` | Donasi yang kamu catat manual (opsional, digabung dengan yang dari email) |
| `qris.js` | Pengubah QRIS statis jadi dinamis (sudah dites) |
| `app.js` | Logika halaman |
| `vendor/qrcode.js` | Library pembuat gambar QR (MIT) |
| `apps-script/Code.gs` | Backend kecil: **ditempel di Google Apps Script, bukan di GitHub** |

## 1. Terbitkan di GitHub Pages (dari nol)

1. Buat akun di https://github.com kalau belum punya.
2. Klik **+** (kanan atas) → **New repository**. Nama bebas, misalnya `donasi-artikel`. Pilih **Public**. Klik **Create repository**.
3. Klik **uploading an existing file**.
4. Ekstrak zip ini, lalu **drag seluruh isi folder** (termasuk folder `vendor`) ke halaman upload. Pastikan `index.html` ada di paling atas, bukan di dalam subfolder. Folder `apps-script` boleh ikut terupload, tidak masalah.
5. Klik **Commit changes**.
6. Buka **Settings** → **Pages**. Di *Build and deployment*, pilih **Deploy from a branch**, branch **main**, folder **/ (root)**, lalu **Save**.
7. Tunggu 1–3 menit. Alamat websitemu: `https://USERNAME.github.io/donasi-artikel/`.

Pada tahap ini website sudah jalan: QRIS dinamis tampil dan progres dibaca dari `data.json`. Form konfirmasi baru muncul setelah bagian 2 selesai.

## 2. Pasang konfirmasi lewat email (Google Apps Script)

Kerjakan dengan akun Google yang emailnya ingin menerima notifikasi donasi.

1. Buka https://sheets.new (membuat Google Sheet baru). Beri nama, misalnya **Donasi Artikel**.
2. Di menu atas: **Extensions** (Ekstensi) → **Apps Script**. Tab baru terbuka.
3. Hapus semua kode bawaan di editor, lalu **tempel seluruh isi `apps-script/Code.gs`**. Tekan **Ctrl+S** untuk menyimpan.
4. Di dropdown fungsi (di samping tombol Run/Jalankan), pilih **otorisasi**, lalu klik **Run**.
   - Muncul *Authorization required* → **Review permissions** → pilih akunmu.
   - Muncul peringatan *Google hasn't verified this app*: itu normal karena ini script buatanmu sendiri. Klik **Advanced** → **Go to … (unsafe)** → **Allow**. Izin yang diminta cuma membaca/menulis Sheet ini dan mengirim email.
5. Klik **Deploy** → **New deployment** → ikon roda gigi → pilih **Web app**. Isi:
   - **Execute as:** *Me*
   - **Who has access:** *Anyone*
   
   Klik **Deploy**, lalu **salin Web app URL** (berakhiran `/exec`).
6. Tes alamat itu di browser dengan menambah `?action=total` di belakangnya. Harus muncul teks seperti `{"ok":true,"diperbarui":"…","donasi":[]}`.
7. Di GitHub, edit `config.js`, tempel URL tadi di `apiUrl: "..."`, lalu **Commit changes**.
8. Tunggu 1–2 menit, buka websitemu.

> **Kalau kamu mengubah `Code.gs` nanti,** kamu wajib deploy ulang: **Deploy → Manage deployments → ikon pensil → Version: New version → Deploy**. Alamat URL-nya tetap sama.

## 3. Tes sebelum disebar

1. Buka websitemu, pilih nominal, klik **Tampilkan QRIS**, isi nama dan emailmu sendiri, lalu klik **Saya sudah bayar** (untuk tes ini tidak perlu benar-benar membayar).
2. Cek emailmu: harus ada email **"Konfirmasi: Rp… dari …"** dengan tombol Konfirmasi dan Tolak. Kalau tidak ada, cek folder Spam.
3. Klik **Konfirmasi**. Muncul halaman "Donasi dikonfirmasi ✓".
4. Refresh websitemu: progres bertambah dan namamu tampil (kalau kotak "Tampilkan nama" dicentang). Kalau emailmu diisi sebagai email donatur, kamu juga menerima email terima kasih.
5. Hapus baris tesnya di Google Sheet (tab **Donasi**), atau klik **Tolak/Batalkan** di email supaya tidak terhitung.

Catatan: pembayaran sungguhan sudah pernah kamu tes dengan ShopeePay. Yang dites di sini adalah alur form dan email.

## 4. Cara kerja sehari-hari

- Setiap donasi masuk, kamu dapat email. Cek nominalnya di DANA Bisnis (kode unik membantu mencocokkan), lalu klik **Konfirmasi**.
- Kalau klik Konfirmasi tidak sengaja, di halaman hasilnya ada tautan **Batalkan konfirmasi**.
- Semua catatan ada di Google Sheet (tab **Donasi**) dengan status `MENUNGGU`, `OK`, atau `DITOLAK`. Kamu boleh mengubah status langsung di sini.
- Donasi yang tidak lewat form (misalnya ada yang transfer langsung): catat di `data.json`, atau tambah baris di Sheet dengan status `OK`. Jangan catat di keduanya supaya tidak terhitung dua kali.

Contoh `data.json` (opsional):

```json
{
  "diperbarui": "2026-10-14",
  "donasi": [
    { "tanggal": "2026-10-13", "nama": "", "nominal": 5032 }
  ]
}
```

Hati-hati koma: baris terakhir tidak pakai koma, dan pakai tanda kutip lurus (`"`).

## 5. Privasi

- Email donatur hanya tersimpan di Google Sheet milikmu dan tidak pernah dikirim ke website.
- Nama hanya tampil di website kalau donatur mencentang "Tampilkan nama saya". Kalau tidak, tampil sebagai "Anonim".
- Tautan Konfirmasi/Tolak punya kode acak per donasi. Orang yang tahu alamat Apps Script tidak bisa mengonfirmasi donasi tanpa kode itu.
- Siapa pun yang mengetahui alamat Apps Script bisa mengirim konfirmasi palsu, tapi itu tidak mengubah progres sebelum kamu klik Konfirmasi. Paling buruk, emailmu kebanjiran notifikasi.

## 6. Pengaturan lain di `Code.gs`

Di bagian atas file (bagian PENGATURAN):

- `AUTO_KONFIRMASI = true` → donasi langsung dihitung saat donatur klik "Saya sudah bayar". Email ke kamu tetap datang dengan tombol **Batalkan** kalau ternyata uangnya tidak ada. Cocok kalau donaturnya hanya orang yang kamu percaya. (Ingat deploy ulang setelah mengubah.)
- `NOMINAL_MIN`, `NOMINAL_MAX`, `NAMA_PROYEK`: batas nominal dan nama yang tampil di email.
- Batas kirim email akun Gmail biasa sekitar 100 per hari, jauh di atas kebutuhan galangan ini.
- Email terima kasih ke donatur dikirim dari alamat Gmail-mu. Kalau belum masuk, minta donatur cek folder Spam.

## 7. Yang perlu kamu tahu

- **Progres tergantung kamu mengklik Konfirmasi.** Ini sengaja: websitenya tidak bisa melihat saldo DANA-mu. Untuk verifikasi otomatis penuh, jalannya lewat API DANA (kalau akunmu diizinkan) atau payment gateway.
- **Siapa pun bisa melihat `config.js`.** Isinya QRIS statis yang memang bukan rahasia, dan alamat Apps Script yang tidak membuka data pribadi. Jangan menaruh password, API key, atau token di repo publik.
- **Izin penggalangan dana.** Penggalangan terbuka ke masyarakat luas diatur Permensos 8/2021 dan UU 9/1961 dan bisa memerlukan izin. Penggalangan tertutup (lingkaran terbatas yang kamu kenal) tidak wajib izin. Aku bukan pengacara, jadi tanyakan ke Dinas Sosial setempat kalau ragu.
- Nama penerima di aplikasi pembayar adalah **TengQ Store** (nama toko di QRIS-mu). Halaman sudah menampilkannya supaya donatur tidak bingung.

## Tes lokal (opsional)

Halaman membaca `data.json`, jadi buka lewat server lokal, bukan klik dua kali:

```bash
python3 -m http.server 8000
# lalu buka http://localhost:8000
```
