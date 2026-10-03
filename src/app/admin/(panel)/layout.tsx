import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { Ban } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import type { ReactNode } from "react";

/**
 * Shell dashboard admin. Server component: memastikan yang masuk benar-benar
 * berperan admin (cek ulang di sini + RLS database sebagai benteng utama).
 */
export default async function AdminPanelLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const { data: profil } = await supabase
    .from("profiles")
    .select("email, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profil?.role !== "admin") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
        <Ban className="h-12 w-12 text-destructive" />
        <h1 className="text-xl font-bold">Akun ini bukan admin</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Akun {profil?.email ?? user.email} terdaftar sebagai pembeli. Hubungi
          pemilik toko bila memang seharusnya punya akses admin.
        </p>
      </div>
    );
  }

  return <AdminShell email={profil?.email ?? user.email ?? ""}>{children}</AdminShell>;
}
