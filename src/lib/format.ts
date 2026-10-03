/** Util format: Rupiah, tanggal Indonesia, dan nomor WhatsApp */

/** Rp 25.000 */
export function formatRupiah(n: number): string {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

/** "Sabtu, 10 Oktober 2026" — input: yyyy-mm-dd atau ISO */
export function formatTanggal(input: string | Date): string {
  const d = typeof input === "string" ? new Date(input) : input;
  if (isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

/** "10 Okt 2026, 17.00 WIB" — untuk batas akhir pemesanan */
export function formatTanggalWaktu(input: string | Date): string {
  const d = typeof input === "string" ? new Date(input) : input;
  if (isNaN(d.getTime())) return "-";
  const tanggal = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
  const jam = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  })
    .format(d)
    .replace(":", ".");
  return `${tanggal}, ${jam} WIB`;
}

/**
 * Samakan format nomor WA Indonesia: 0812... / +62812... / 812... -> 62812...
 * (logika sama dengan fungsi normalize_wa di database)
 */
export function normalizeWa(raw: string): string {
  const v = (raw || "").replace(/[^0-9]/g, "");
  if (v.startsWith("62")) return v;
  if (v.startsWith("0")) return "62" + v.slice(1);
  if (v.startsWith("8")) return "62" + v;
  return v;
}

/** Validasi nomor WA Indonesia: 628xxxxxxxxx */
export function isWaValid(raw: string): boolean {
  return /^62[0-9]{8,12}$/.test(normalizeWa(raw));
}

/** Link wa.me dengan pesan otomatis */
export function buatLinkWa(nomor: string, pesan: string): string {
  return `https://wa.me/${normalizeWa(nomor)}?text=${encodeURIComponent(pesan)}`;
}
