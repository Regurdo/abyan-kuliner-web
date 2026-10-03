/**
 * Testimoni pembeli. Isi dengan testimoni ASLI dari pembeli (dengan izin mereka).
 * Selama array ini kosong, bagian "Kata Mereka" otomatis disembunyikan.
 *
 * Contoh format:
 * { nama: "Nama Pembeli", info: "Pembeli langganan", teks: "Isi testimoni..." }
 */
export interface Testimoni {
  nama: string;
  info?: string;
  teks: string;
}

export const TESTIMONI: Testimoni[] = [];
