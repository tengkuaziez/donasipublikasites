/*
 * qris.js — ubah QRIS statis menjadi QRIS dinamis (dengan nominal), 100% di browser.
 *
 * Yang dilakukan:
 *  1. Mengubah tag 01 dari "11" (statis) menjadi "12" (dinamis)
 *  2. Menyisipkan tag 54 (nominal)
 *  3. Menghitung ulang CRC16 (tag 63)
 * Data merchant (NMID, nama toko, kode DANA) TIDAK diubah, jadi dana tetap
 * masuk ke akun DANA Bisnis pemilik QRIS.
 */
(function (root) {
  "use strict";

  // CRC16/CCITT-FALSE (poly 0x1021, init 0xFFFF) — standar EMV QR
  function crc16(str) {
    var crc = 0xffff;
    for (var i = 0; i < str.length; i++) {
      crc ^= str.charCodeAt(i) << 8;
      for (var j = 0; j < 8; j++) {
        crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, "0");
  }

  // Pecah string QRIS jadi daftar tag [{id, value}] tingkat atas
  function parse(str) {
    var out = [];
    var pos = 0;
    while (pos < str.length) {
      if (pos + 4 > str.length) throw new Error("Format QRIS rusak (tag terpotong).");
      var id = str.substr(pos, 2);
      var len = parseInt(str.substr(pos + 2, 2), 10);
      if (isNaN(len)) throw new Error("Format QRIS rusak (panjang tag tidak valid).");
      var value = str.substr(pos + 4, len);
      if (value.length !== len) throw new Error("Format QRIS rusak (isi tag kurang).");
      out.push({ id: id, value: value });
      pos += 4 + len;
    }
    return out;
  }

  function tlv(id, value) {
    return id + String(value.length).padStart(2, "0") + value;
  }

  // Cek CRC sebuah string QRIS lengkap
  function isValid(str) {
    if (str.length < 8 || str.substr(str.length - 8, 4) !== "6304") return false;
    return crc16(str.slice(0, -4)) === str.slice(-4).toUpperCase();
  }

  // Ambil info merchant (untuk ditampilkan ke donatur)
  function info(str) {
    var tags = parse(str);
    var get = function (id) {
      var t = tags.filter(function (x) { return x.id === id; })[0];
      return t ? t.value : "";
    };
    return {
      mode: get("01") === "11" ? "statis" : get("01") === "12" ? "dinamis" : "?",
      merchant: get("59"),
      city: get("60"),
      amount: get("54"),
    };
  }

  // Fungsi utama: QRIS statis + nominal (rupiah bulat) => QRIS dinamis
  function toDynamic(staticStr, amount) {
    staticStr = String(staticStr || "").trim();
    if (!isValid(staticStr)) {
      throw new Error("String QRIS statis tidak valid (CRC tidak cocok). Cek config.js.");
    }
    amount = Math.round(Number(amount));
    if (!isFinite(amount) || amount < 1) throw new Error("Nominal tidak valid.");

    var tags = parse(staticStr).filter(function (t) {
      return t.id !== "54" && t.id !== "63"; // buang nominal lama & CRC lama
    });

    var out = [];
    var inserted = false;
    tags.forEach(function (t) {
      // sisipkan nominal sebelum tag 55/56/57/58 (urutan standar EMV: ...53, 54, 55, 58...)
      if (!inserted && parseInt(t.id, 10) > 54) {
        out.push(tlv("54", String(amount)));
        inserted = true;
      }
      var v = t.value;
      if (t.id === "01") v = "12"; // statis -> dinamis
      out.push(tlv(t.id, v));
    });
    if (!inserted) out.push(tlv("54", String(amount)));

    var body = out.join("") + "6304";
    return body + crc16(body);
  }

  var api = { crc16: crc16, parse: parse, isValid: isValid, info: info, toDynamic: toDynamic };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Qris = api;
})(typeof window !== "undefined" ? window : this);
