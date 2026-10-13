/*
 * config.js — SATU-SATUNYA file yang perlu kamu edit untuk mengatur tampilan & isi.
 * Edit langsung di GitHub (ikon pensil), lalu klik "Commit changes".
 */
window.DONASI_CONFIG = {
  // ===== Teks halaman =====
  judul: "Bantu Kami Menerbitkan Artikel Ilmiah",
  subjudul: "Donasi sukarela untuk biaya publikasi artikel ilmiah kami yang sudah diterima (accepted).",
  deskripsi:
    "Artikel kami sudah dinyatakan accepted dan tinggal dipublikasikan. " +
    "Biaya publikasi cukup berat jika ditanggung sendiri oleh mahasiswa, " +
    "jadi kami membuka donasi sukarela. Berapa pun nominalnya sangat berarti. " +
    "Terima kasih sudah membantu! 🙏",

  // ===== Target dana (Rupiah) =====
  target: 800000,

  // ===== Pilihan nominal cepat (Rupiah) =====
  nominalPilihan: [10000, 25000, 50000, 100000],
  nominalMinimal: 5000,      // batas minimal untuk nominal bebas
  nominalMaksimal: 5000000,  // batas maksimal untuk nominal bebas

  // ===== Kode unik =====
  // Ditambahkan ke nominal supaya tiap donasi mudah dicocokkan dengan riwayat DANA.
  // Contoh: pilih Rp50.000 -> yang dibayar Rp50.037. Kode unik IKUT dihitung sebagai donasi.
  // Isi 0 untuk mematikan.
  kodeUnikMaks: 99,

  // ===== QRIS statis (hasil scan QRIS DANA Bisnis) =====
  // Ini bukan rahasia: isinya sama dengan QR yang biasa dicetak/ditempel di toko.
  qrisStatis:
    "00020101021126570011ID.DANA.WWW011893600915372104706102097210470610303UMI51440014ID.CO.QRIS.WWW0215ID10243366214600303UMI5204899953033605802ID5911TengQ Store6010Kota Medan61052022463047EEA",

  // ===== Konfirmasi donasi lewat email (Google Apps Script) =====
  // Tempel URL "Web app" hasil deploy Apps Script (lihat README bagian 4).
  // Contoh: "https://script.google.com/macros/s/AKfycb.../exec"
  // Kosongkan ("") kalau belum dipasang: form konfirmasi disembunyikan dan
  // progres hanya dibaca dari data.json (manual).
  apiUrl: "",

  // Dipakai HANYA kalau apiUrl kosong: link WhatsApp/Google Form untuk konfirmasi manual.
  // Contoh WhatsApp: "https://wa.me/62812xxxxxxx?text=Halo,%20saya%20sudah%20donasi"
  linkKonfirmasi: "",

  // ===== Data donasi manual =====
  // Donasi yang kamu catat sendiri (mis. transfer di luar form) dibaca dari data.json
  // dan DIGABUNG dengan donasi terkonfirmasi dari Apps Script.
  fileData: "data.json",

  // ===== Footer =====
  footer: "Penggalangan dana sukarela oleh mahasiswa/alumni. Dana hanya untuk biaya publikasi artikel.",
};
