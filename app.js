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

    // daftar donatur terbaru
    var daftar = $("daftar");
    daftar.innerHTML = "";
    donasi.slice().reverse().slice(0, 10).forEach(function (d) {
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

  function muatData() {
    // "?t=" supaya tidak tersangkut cache setelah data.json diperbarui
    fetch(C.fileData + "?t=" + Date.now(), { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (j) { tampilProgres(j.donasi || [], j.diperbarui); })
      .catch(function () {
        tampilProgres([], "");
        $("diperbarui").textContent = "Data donasi belum bisa dimuat.";
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

    var k = $("btnKonfirmasi");
    if (C.linkKonfirmasi) { k.href = C.linkKonfirmasi; k.hidden = false; } else { k.hidden = true; }

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

  muatData();
})();
