/**
 * Code.gs — backend kecil untuk website donasi (Google Apps Script, gratis).
 *
 * Alur:
 *  1. Donatur isi nama (+ email opsional) di website lalu klik "Saya sudah bayar".
 *  2. Script mencatat baris di Sheet dengan status MENUNGGU dan mengirim email ke KAMU
 *     (pemilik akun Google ini) berisi tombol KONFIRMASI / TOLAK.
 *  3. Kamu cek DANA Bisnis, lalu klik KONFIRMASI di email.
 *  4. Status jadi OK -> website otomatis menghitungnya. Donatur (kalau isi email)
 *     menerima email terima kasih.
 *
 * Yang dihitung website hanya baris berstatus OK. Email donatur tidak pernah
 * ditampilkan di website.
 */

// ===================== PENGATURAN =====================
var SHEET_NAME = 'Donasi';
var NAMA_PROYEK = 'Donasi Publikasi Artikel Ilmiah';
var NOMINAL_MIN = 1000;
var NOMINAL_MAX = 5000000;
// false = tunggu kamu klik KONFIRMASI di email (disarankan).
// true  = langsung dihitung saat donatur klik "Saya sudah bayar"; email ke kamu
//         tetap dikirim dengan tombol BATALKAN (kalau ternyata uangnya tidak ada).
var AUTO_KONFIRMASI = false;
var ZONA_WAKTU = 'Asia/Jakarta';
// ======================================================

var HEADER = ['id', 'waktu', 'nama', 'email', 'nominal', 'tampil', 'status', 'token'];

// ---------- Pintu masuk ----------
function doGet(e) {
  var p = (e && e.parameter) || {};
  var action = p.action || 'total';

  if (action === 'konfirmasi' || action === 'tolak') {
    try {
      return halaman_(ubahStatus_(p, action === 'konfirmasi' ? 'OK' : 'DITOLAK'));
    } catch (err) {
      return halaman_({ judul: 'Tidak bisa diproses', pesan: String(err.message || err), ok: false });
    }
  }

  try {
    if (action === 'kirim') return json_(kirim_(p));
    return json_(total_());
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  }
}

// ---------- Terima donasi dari website ----------
function kirim_(p) {
  // Kolom jebakan untuk bot: manusia tidak melihat/mengisinya.
  if (p.website) return { ok: true };

  var nominal = Math.round(Number(p.nominal));
  if (!isFinite(nominal) || nominal < NOMINAL_MIN || nominal > NOMINAL_MAX) {
    throw new Error('Nominal tidak valid.');
  }
  var nama = bersih_(p.nama, 60);
  if (!nama) throw new Error('Nama wajib diisi.');
  var email = bersih_(p.email, 120);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Format email tidak valid.');
  var tampil = p.tampil === '1' ? 'YA' : 'TIDAK';

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sh = sheet_();

    // Cegah klik ganda: baris yang sama (nama+nominal) dalam 2 menit terakhir diabaikan.
    var rows = sh.getDataRange().getValues();
    var now = new Date().getTime();
    for (var i = rows.length - 1; i >= 1; i--) {
      var w = rows[i][1] instanceof Date ? rows[i][1].getTime() : Date.parse(String(rows[i][1]).replace(' ', 'T') + '+07:00');
      if (isFinite(w) && now - w > 120000) break;
      if (String(rows[i][2]) === nama && Number(rows[i][4]) === nominal) {
        return { ok: true, duplikat: true };
      }
    }

    var id = Utilities.getUuid().replace(/-/g, '').slice(0, 8);
    var token = Utilities.getUuid().replace(/-/g, '');
    var status = AUTO_KONFIRMASI ? 'OK' : 'MENUNGGU';
    var waktu = Utilities.formatDate(new Date(), ZONA_WAKTU, 'yyyy-MM-dd HH:mm');
    sh.appendRow([id, waktu, nama, email, nominal, tampil, status, token]);
  } finally {
    lock.releaseLock();
  }

  var rec = { id: id, nama: nama, email: email, nominal: nominal, token: token, waktu: waktu };
  kirimEmailPemilik_(rec);
  if (AUTO_KONFIRMASI && email) kirimEmailDonatur_(rec);
  return { ok: true, status: status };
}

// ---------- Data publik untuk website (tanpa email) ----------
function total_() {
  var sh = sheet_();
  var rows = sh.getDataRange().getValues();
  var donasi = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    if (String(r[6]) !== 'OK') continue;
    var tgl = r[1] instanceof Date
      ? Utilities.formatDate(r[1], ZONA_WAKTU, 'yyyy-MM-dd')
      : String(r[1]).slice(0, 10);
    donasi.push({
      tanggal: tgl,
      nama: String(r[5]) === 'YA' ? String(r[2]) : '',
      nominal: Number(r[4])
    });
  }
  return {
    ok: true,
    diperbarui: Utilities.formatDate(new Date(), ZONA_WAKTU, 'yyyy-MM-dd HH:mm'),
    donasi: donasi
  };
}

// ---------- Klik tombol di email ----------
function ubahStatus_(p, statusBaru) {
  var id = String(p.id || '');
  var token = String(p.token || '');
  if (!id || !token) throw new Error('Tautan tidak lengkap.');

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  var rec;
  var sudah = false;
  try {
    var sh = sheet_();
    var rows = sh.getDataRange().getValues();
    var baris = -1;
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === id) { baris = i; break; }
    }
    if (baris < 0) throw new Error('Donasi tidak ditemukan.');
    if (String(rows[baris][7]) !== token) throw new Error('Tautan tidak valid.');

    var r = rows[baris];
    rec = { id: id, nama: String(r[2]), email: String(r[3]), nominal: Number(r[4]) };
    if (String(r[6]) === statusBaru) {
      sudah = true;
    } else {
      sh.getRange(baris + 1, 7).setValue(statusBaru);
    }
  } finally {
    lock.releaseLock();
  }

  var label = statusBaru === 'OK' ? 'dikonfirmasi' : 'ditolak';
  if (sudah) {
    return { ok: true, judul: 'Sudah ' + label, pesan: 'Donasi ' + rupiah_(rec.nominal) + ' dari ' + rec.nama + ' sebelumnya sudah ' + label + '.', balik: balikLink_(rec, statusBaru, p.token) };
  }
  if (statusBaru === 'OK' && rec.email) kirimEmailDonatur_(rec);
  return {
    ok: true,
    judul: 'Donasi ' + label + ' ✓',
    pesan: rupiah_(rec.nominal) + ' dari ' + rec.nama + ' sudah ' + label + '.' +
      (statusBaru === 'OK' ? ' Progres di website akan ikut berubah.' : ''),
    balik: balikLink_(rec, statusBaru, p.token)
  };
}

// Tautan untuk membatalkan tindakan barusan
function balikLink_(rec, statusSekarang, token) {
  var aksi = statusSekarang === 'OK' ? 'tolak' : 'konfirmasi';
  var teks = statusSekarang === 'OK' ? 'Batalkan konfirmasi' : 'Konfirmasi saja';
  return { url: ScriptApp.getService().getUrl() + '?action=' + aksi + '&id=' + rec.id + '&token=' + token, teks: teks };
}

// ---------- Email ----------
function kirimEmailPemilik_(rec) {
  var base = ScriptApp.getService().getUrl();
  var linkOk = base + '?action=konfirmasi&id=' + rec.id + '&token=' + rec.token;
  var linkNo = base + '?action=tolak&id=' + rec.id + '&token=' + rec.token;
  var perluAksi = !AUTO_KONFIRMASI;

  var html =
    '<div style="font-family:Arial,sans-serif;max-width:480px;line-height:1.5">' +
    '<h2 style="margin:0 0 8px">Donasi baru masuk</h2>' +
    '<p style="margin:0 0 4px"><b>' + esc_(rupiah_(rec.nominal)) + '</b> dari <b>' + esc_(rec.nama) + '</b></p>' +
    '<p style="margin:0 0 12px;color:#555">Dikirim ' + esc_(rec.waktu) + (rec.email ? ' · ' + esc_(rec.email) : '') + '</p>' +
    '<p style="margin:0 0 16px">' + (perluAksi
      ? 'Cek dulu di <b>riwayat DANA Bisnis</b>. Kalau nominal ini sudah masuk, klik Konfirmasi.'
      : 'Donasi ini sudah dihitung otomatis. Kalau ternyata tidak ada di DANA Bisnis, klik Batalkan.') + '</p>' +
    (perluAksi
      ? '<a href="' + linkOk + '" style="background:#0f766e;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block;margin-right:8px">Konfirmasi</a>' +
        '<a href="' + linkNo + '" style="background:#fff;color:#b42318;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block;border:1px solid #b42318">Tolak</a>'
      : '<a href="' + linkNo + '" style="background:#fff;color:#b42318;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block;border:1px solid #b42318">Batalkan</a>') +
    '</div>';

  MailApp.sendEmail({
    to: Session.getEffectiveUser().getEmail(),
    subject: '[' + NAMA_PROYEK + '] ' + (perluAksi ? 'Konfirmasi: ' : 'Masuk: ') + rupiah_(rec.nominal) + ' dari ' + rec.nama,
    htmlBody: html,
    name: NAMA_PROYEK
  });
}

function kirimEmailDonatur_(rec) {
  if (!rec.email) return;
  var html =
    '<div style="font-family:Arial,sans-serif;max-width:480px;line-height:1.5">' +
    '<h2 style="margin:0 0 8px">Terima kasih, ' + esc_(rec.nama) + ' 🙏</h2>' +
    '<p>Donasimu sebesar <b>' + esc_(rupiah_(rec.nominal)) + '</b> sudah kami terima dan dicatat.</p>' +
    '<p>Dana ini akan dipakai untuk biaya publikasi artikel ilmiah kami. Sekali lagi, terima kasih banyak atas bantuannya.</p>' +
    '</div>';
  MailApp.sendEmail({
    to: rec.email,
    subject: 'Terima kasih atas donasimu (' + rupiah_(rec.nominal) + ')',
    htmlBody: html,
    name: NAMA_PROYEK
  });
}

// ---------- Utilitas ----------
function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) sh.appendRow(HEADER);
  return sh;
}

function bersih_(v, maks) {
  return String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, maks);
}

function esc_(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function rupiah_(n) {
  return 'Rp' + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function halaman_(h) {
  var html =
    '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>' + esc_(h.judul) + '</title></head>' +
    '<body style="font-family:Arial,sans-serif;max-width:420px;margin:15vh auto;padding:0 20px;text-align:center;line-height:1.5">' +
    '<h2>' + esc_(h.judul) + '</h2><p>' + esc_(h.pesan) + '</p>' +
    (h.balik ? '<p style="margin-top:24px"><a href="' + h.balik.url + '" style="color:#555">' + esc_(h.balik.teks) + '</a></p>' : '') +
    '</body></html>';
  return HtmlService.createHtmlOutput(html).setTitle(h.judul);
}

// Jalankan SEKALI dari editor Apps Script untuk memberi izin (Sheets + Gmail).
function otorisasi() {
  sheet_();
  Logger.log('Sisa kuota email hari ini: ' + MailApp.getRemainingDailyQuota());
}
