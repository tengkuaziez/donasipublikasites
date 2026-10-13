/* app.js — logika halaman donasi. Tidak perlu diedit untuk penggunaan biasa. */
(function () {
  "use strict";
  var C = window.DONASI_CONFIG;
  var $ = function (id) { return document.getElementById(id); };

  var rupiah = function (n) {
    return "Rp" + Math.round(n).toLocaleString("id-ID");
  };

  var terpilih = 0; // nominal dasar yang dipilih (tanpa kode unik)
  var qrisAktif = "";
  var totalAktif = 0;
  var sedangKirim = false;

  // ---------- Teks statis ----------
  document.title = C.judul;
  $("judul").textContent = C.judul;
  $("subjudul").textContent = C.subjudul;
  $("deskripsi").textContent = C.deskripsi;
  $("footer").textContent = C.footer;
  $("target").textContent = rupiah(C.target);

  // ---------- Progres ----------
  function tampilProgres(donasi, diperbarui) {
    var total = donasi.reduce(function (s, d) { return s + Number(d.nominal || 0); }, 0);
    var persen = Math.min(100, (total / C.target) * 100);
    var sisa = Math.max(0, C.target - total);

    $("terkumpul").textContent = rupiah(total);
    $("persen").textContent = (Math.round(persen * 10) / 10).toString().replace(".", ",") + "%";
    $("sisa").textContent = sisa > 0 ? "Sisa " + rupiah(sisa) : "Target tercapai 🎉";
    $("fill").style.width = persen + "%";
    $("bar").setAttribute("aria-valuenow", String(Math.round(persen)));
    if (diperbarui) $("diperbarui").textContent = "Terakhir diperbarui: " + diperbarui;

    // daftar donatur terbaru (urut tanggal, yang terbaru di atas)
    var urut = donasi
      .map(function (d, i) { return { d: d, i: i }; })
      .sort(function (a, b) {
        var ta = String(a.d.tanggal || ""), tb = String(b.d.tanggal || "");
        return ta < tb ? -1 : ta > tb ? 1 : a.i - b.i;
      })
      .map(function (x) { return x.d; });

    var daftar = $("daftar");
    daftar.innerHTML = "";
    urut.reverse().slice(0, 10).forEach(function (d) {
      var li = document.createElement("li");
      var kiri = document.createElement("span");
      kiri.className = "who";
      kiri.textContent = d.nama && String(d.nama).trim() ? d.nama : "Anonim";
      if (d.tanggal) {
        var w = document.createElement("span");
        w.className = "when";
        w.textContent = d.tanggal;
        kiri.appendChild(w);
      }
      var kanan = document.createElement("span");
      kanan.className = "amt";
      kanan.textContent = rupiah(Number(d.nominal || 0));
      li.appendChild(kiri);
      li.appendChild(kanan);
      daftar.appendChild(li);
    });
    $("daftarCard").hidden = donasi.length === 0;
  }

  function ambilJSON(url) {
    return fetch(url, { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    });
  }

  // Gabungkan: data.json (catatan manual) + Apps Script (donasi terkonfirmasi lewat email)
  function muatData() {
    var t = "t=" + Date.now(); // supaya tidak tersangkut cache
    var manual = ambilJSON(C.fileData + "?" + t).catch(function () { return null; });
    var otomatis = C.apiUrl
      ? ambilJSON(C.apiUrl + "?action=total&" + t).catch(function () { return null; })
      : Promise.resolve(null);

    Promise.all([manual, otomatis]).then(function (hasil) {
      var m = hasil[0], o = hasil[1];
      var donasi = [];
      var diperbarui = "";
      if (m && m.donasi) { donasi = donasi.concat(m.donasi); diperbarui = m.diperbarui || ""; }
      if (o && o.ok && o.donasi) { donasi = donasi.concat(o.donasi); diperbarui = o.diperbarui || diperbarui; }
      tampilProgres(donasi, diperbarui);
      if (!m && !o) $("diperbarui").textContent = "Data donasi belum bisa dimuat.";
      else if (C.apiUrl && !o) $("diperbarui").textContent = (diperbarui ? "Terakhir diperbarui: " + diperbarui + " · " : "") + "donasi terbaru belum bisa dimuat.";
    });
  }

  // ---------- Pilihan nominal ----------
  var chips = $("chips");
  C.nominalPilihan.forEach(function (n) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "chip";
    b.textContent = rupiah(n);
    b.setAttribute("aria-pressed", "false");
    b.addEventListener("click", function () {
      terpilih = n;
      $("bebas").value = "";
      setError("");
      Array.prototype.forEach.call(chips.children, function (c) { c.setAttribute("aria-pressed", "false"); });
      b.setAttribute("aria-pressed", "true");
    });
    chips.appendChild(b);
  });

  $("bebas").addEventListener("input", function (e) {
    var digits = e.target.value.replace(/\D/g, "");
    e.target.value = digits ? Number(digits).toLocaleString("id-ID") : "";
    terpilih = digits ? Number(digits) : 0;
    setError("");
    Array.prototype.forEach.call(chips.children, function (c) { c.setAttribute("aria-pressed", "false"); });
  });

  function setError(msg) {
    var el = $("error");
    el.textContent = msg;
    el.hidden = !msg;
  }

  // ---------- Gambar QR ----------
  function gambarQR(canvas, teks, caption) {
    var qr = qrcode(0, "M");
    qr.addData(teks);
    qr.make();
    var n = qr.getModuleCount();
    var quiet = 4;
    var scale = 8;
    var size = (n + quiet * 2) * scale;
    var capH = caption ? 56 : 0;

    canvas.width = size;
    canvas.height = size + capH;
    var ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#000000";
    for (var r = 0; r < n; r++) {
      for (var c = 0; c < n; c++) {
        if (qr.isDark(r, c)) ctx.fillRect((c + quiet) * scale, (r + quiet) * scale, scale, scale);
      }
    }
    if (caption) {
      ctx.fillStyle = "#000000";
      ctx.font = "bold 22px system-ui, Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(caption, size / 2, size + 34);
    }
  }

  // ---------- Buat QRIS ----------
  $("btnBuat").addEventListener("click", function () {
    setError("");
    if (!terpilih) return setError("Pilih nominal dulu, atau isi nominal bebas.");
    if (terpilih < C.nominalMinimal) return setError("Nominal minimal " + rupiah(C.nominalMinimal) + ".");
    if (terpilih > C.nominalMaksimal) return setError("Nominal maksimal " + rupiah(C.nominalMaksimal) + ".");

    var kode = C.kodeUnikMaks > 0 ? 1 + Math.floor(Math.random() * C.kodeUnikMaks) : 0;
    totalAktif = terpilih + kode;

    try {
      qrisAktif = Qris.toDynamic(C.qrisStatis, totalAktif);
    } catch (err) {
      return setError(err.message);
    }

    gambarQR($("qr"), qrisAktif, "Donasi " + rupiah(totalAktif));
    $("totalBayar").textContent = rupiah(totalAktif);
    $("kodeUnikInfo").textContent = kode
      ? "Termasuk kode unik " + rupiah(kode) + " (ikut tercatat sebagai donasi) agar pembayaranmu mudah dicocokkan."
      : "";
    try { $("namaMerchant").textContent = Qris.info(qrisAktif).merchant || "-"; } catch (e) { /* abaikan */ }

    // Konfirmasi: form di dalam website (apiUrl) atau tautan cadangan
    resetKonfirmasi();
    if (C.apiUrl) {
      $("formKonfirmasi").hidden = false;
      $("btnKonfirmasi").hidden = true;
    } else {
      $("formKonfirmasi").hidden = true;
      var k = $("btnKonfirmasi");
      if (C.linkKonfirmasi) { k.href = C.linkKonfirmasi; k.hidden = false; } else { k.hidden = true; }
    }

    $("hasil").hidden = false;
    $("hasil").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  $("btnTutup").addEventListener("click", function () {
    $("hasil").hidden = true;
    $("donasi").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  $("btnUnduh").addEventListener("click", function () {
    var a = document.createElement("a");
    a.download = "QRIS-donasi-" + totalAktif + ".png";
    a.href = $("qr").toDataURL("image/png");
    document.body.appendChild(a);
    a.click();
    a.remove();
  });

  // ---------- Konfirmasi "Saya sudah bayar" ----------
  function resetKonfirmasi() {
    $("suksesKonfirmasi").hidden = true;
    $("suksesKonfirmasi").textContent = "";
    $("errorKonfirmasi").hidden = true;
    $("btnKirim").disabled = false;
    $("btnKirim").textContent = "Saya sudah bayar";
    sedangKirim = false;
  }

  function setErrorKonfirmasi(msg) {
    var el = $("errorKonfirmasi");
    el.textContent = msg;
    el.hidden = !msg;
  }

  function kirimKonfirmasi(params) {
    var url = C.apiUrl + "?" + params.toString();
    // Percobaan 1: baca jawaban server (bisa tahu kalau ada penolakan, mis. nominal tidak valid)
    return fetch(url, { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .catch(function (err) {
        if (err && err.name === "SyntaxError") throw err;
        // Percobaan 2: jawaban tidak terbaca (sering karena aturan CORS peramban). Permintaan
        // tetap sampai ke server, jadi kirim ulang mode "no-cors" — server menolak duplikat 2 menit.
        return fetch(url, { mode: "no-cors", cache: "no-store" }).then(function () {
          return { ok: true, tidakTerbaca: true };
        });
      });
  }

  $("formKonfirmasi").addEventListener("submit", function (e) {
    e.preventDefault();
    if (sedangKirim) return;
    setErrorKonfirmasi("");

    var nama = $("nama").value.trim();
    var email = $("email").value.trim();
    if (!nama) return setErrorKonfirmasi("Isi nama dulu ya.");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setErrorKonfirmasi("Format email belum benar.");

    var params = new URLSearchParams({
      action: "kirim",
      nama: nama,
      email: email,
      nominal: String(totalAktif),
      tampil: $("tampil").checked ? "1" : "0",
      website: $("website").value,
    });

    sedangKirim = true;
    $("btnKirim").disabled = true;
    $("btnKirim").textContent = "Mengirim…";

    kirimKonfirmasi(params)
      .then(function (res) {
        if (!res || res.ok === false) throw new Error((res && res.error) || "Gagal mengirim.");
        $("formKonfirmasi").hidden = true;
        var s = $("suksesKonfirmasi");
        s.textContent =
          "Terima kasih, " + nama + "! 🙏 Konfirmasi " + rupiah(totalAktif) + " sudah dikirim. " +
          "Progres akan bertambah setelah pembayarannya dicek oleh pengelola" +
          (email ? ", dan kamu akan menerima email terima kasih." : ".");
        s.hidden = false;
        sedangKirim = false;
      })
      .catch(function (err) {
        sedangKirim = false;
        $("btnKirim").disabled = false;
        $("btnKirim").textContent = "Saya sudah bayar";
        setErrorKonfirmasi((err && err.message ? err.message + " " : "") + "Coba lagi sebentar lagi, atau kabari pengelola langsung.");
      });
  });

  muatData();
})();
