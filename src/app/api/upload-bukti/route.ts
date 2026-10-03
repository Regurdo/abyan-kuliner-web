import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isWaValid, normalizeWa } from "@/lib/format";

/**
 * API route upload bukti transfer pembeli.
 *
 * Bucket "payment-proofs" sengaja dibuat PRIVAT supaya foto bukti transfer
 * tidak bisa diakses sembarangan. Maka upload dilakukan lewat sini (server)
 * memakai kunci induk (service role) setelah kepemilikan pesanan dicek:
 * pembeli harus tahu KODE pesanan + nomor WhatsApp yang terdaftar.
 */

export const runtime = "nodejs";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const FORMAT_OK = ["image/jpeg", "image/png", "image/webp"];

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const kode = String(form.get("kode") ?? "").trim().toUpperCase();
    const wa = String(form.get("wa") ?? "");
    const file = form.get("file");

    // ----- Validasi input -----
    if (!kode) {
      return NextResponse.json(
        { ok: false, message: "Kode pesanan wajib diisi." },
        { status: 400 }
      );
    }
    if (!isWaValid(wa)) {
      return NextResponse.json(
        { ok: false, message: "Nomor WhatsApp tidak valid." },
        { status: 400 }
      );
    }
    if (!(file instanceof File)) {
      return NextResponse.json(
        { ok: false, message: "Foto bukti transfer belum dipilih." },
        { status: 400 }
      );
    }
    if (!FORMAT_OK.includes(file.type)) {
      return NextResponse.json(
        { ok: false, message: "Format foto harus JPG, PNG, atau WebP ya." },
        { status: 400 }
      );
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { ok: false, message: "Ukuran foto maksimal 5 MB. Coba kompres dulu ya." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // ----- Cek kepemilikan pesanan: kode + WA harus cocok -----
    const { data: order, error: errOrder } = await admin
      .from("orders")
      .select(
        "id, code, customer_whatsapp, payment_method, payment_status, payment_proof_url"
      )
      .eq("code", kode)
      .maybeSingle();

    if (errOrder || !order) {
      return NextResponse.json(
        { ok: false, message: "Pesanan tidak ditemukan. Periksa kode pesanannya ya." },
        { status: 404 }
      );
    }
    if (order.customer_whatsapp !== normalizeWa(wa)) {
      return NextResponse.json(
        { ok: false, message: "Kode pesanan atau nomor WhatsApp tidak cocok." },
        { status: 403 }
      );
    }
    if (order.payment_method !== "transfer") {
      return NextResponse.json(
        { ok: false, message: "Pesanan ini metodenya COD, tidak perlu bukti transfer." },
        { status: 400 }
      );
    }
    if (order.payment_status === "lunas") {
      return NextResponse.json(
        { ok: false, message: "Pesanan ini sudah lunas. Terima kasih!" },
        { status: 400 }
      );
    }

    // ----- Upload ke bucket privat (path: <id pesanan>/<waktu>.<ext>) -----
    const ext =
      file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${order.id}/${Date.now()}.${ext}`;

    const { error: errUpload } = await admin.storage
      .from("payment-proofs")
      .upload(path, file, { contentType: file.type, upsert: false });

    if (errUpload) {
      console.error("Gagal upload bukti:", errUpload);
      return NextResponse.json(
        { ok: false, message: "Gagal mengirim foto ke server. Coba lagi ya." },
        { status: 500 }
      );
    }

    // Bila pembeli mengganti bukti, hapus file lama biar bucket tetap rapi
    if (order.payment_proof_url) {
      await admin.storage.from("payment-proofs").remove([order.payment_proof_url]);
    }

    // ----- Tandai pesanan: bukti sudah masuk, menunggu verifikasi ibu -----
    const { error: errUpdate } = await admin
      .from("orders")
      .update({ payment_proof_url: path, payment_status: "menunggu_verifikasi" })
      .eq("id", order.id);

    if (errUpdate) {
      console.error("Gagal update status pembayaran:", errUpdate);
      return NextResponse.json(
        { ok: false, message: "Foto terkirim, tapi gagal menandai pesanan. Coba lagi ya." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Bukti transfer berhasil dikirim! Ibu akan segera memeriksa ya.",
    });
  } catch (e) {
    console.error("API upload-bukti error:", e);
    return NextResponse.json(
      { ok: false, message: "Ada masalah di server. Coba beberapa saat lagi ya." },
      { status: 500 }
    );
  }
}
