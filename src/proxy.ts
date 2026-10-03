import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Proxy (dulu: middleware): menyegarkan sesi login Supabase (cookie) pada
 * setiap request dan menjaga halaman /admin — hanya yang sudah login yang
 * boleh masuk. Cek peran admin dilakukan lagi di layout dashboard
 * (RLS database tetap benteng terakhir yang paling aman).
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Penting: getUser() memvalidasi token ke server Supabase (aman)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const halamanAdmin = path.startsWith("/admin") && path !== "/admin/login";

  if (!user && halamanAdmin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    // Simpan tujuan awal biar bisa kembali setelah login
    url.searchParams.set("kembali", path);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // Jalankan di semua route kecuali file statis
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
