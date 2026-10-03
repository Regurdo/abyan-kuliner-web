import { createClient } from "@supabase/supabase-js";

/**
 * Client Supabase dengan kunci INDUK (service_role).
 * **HANYA boleh dipakai di server (API route), tidak pernah di browser.
 * Gunanya: upload bukti transfer pembeli ke bucket privat & tugas khusus.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Kunci SUPABASE_SERVICE_ROLE_KEY belum diisi di .env.local — fitur ini butuh kunci induk."
    );
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
