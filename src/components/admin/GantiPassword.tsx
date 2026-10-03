"use client";

import { useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

/** Form ganti password akun admin (Supabase Auth updateUser) */
export function GantiPassword() {
  const [sandi, setSandi] = useState("");
  const [sandi2, setSandi2] = useState("");
  const [proses, setProses] = useState(false);

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    if (sandi.length < 8) {
      toast.error("Password minimal 8 karakter ya.");
      return;
    }
    if (sandi !== sandi2) {
      toast.error("Ketik ulang password belum sama.");
      return;
    }
    setProses(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: sandi });
      if (error) {
        toast.error("Gagal ganti password. Coba lagi ya.");
        return;
      }
      toast.success("Password berhasil diganti!");
      setSandi("");
      setSandi2("");
    } catch {
      toast.error("Koneksi bermasalah. Coba lagi ya.");
    } finally {
      setProses(false);
    }
  }

  return (
    <form
      onSubmit={simpan}
      className="flex flex-col gap-3 rounded-3xl border border-border/70 bg-card p-5"
    >
      <h2 className="flex items-center gap-2 text-base font-bold">
        <KeyRound className="h-4.5 w-4.5 text-primary" /> Ganti Password
      </h2>
      <p className="text-xs text-muted-foreground">
        Segera ganti password bawaan supaya akunmu aman.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sandi1">Password baru</Label>
          <Input
            id="sandi1"
            type="password"
            autoComplete="new-password"
            value={sandi}
            onChange={(e) => setSandi(e.target.value)}
            className="h-11 rounded-2xl"
            placeholder="Minimal 8 karakter"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sandi2">Ketik ulang</Label>
          <Input
            id="sandi2"
            type="password"
            autoComplete="new-password"
            value={sandi2}
            onChange={(e) => setSandi2(e.target.value)}
            className="h-11 rounded-2xl"
            placeholder="Sama dengan di atas"
          />
        </div>
      </div>
      <Button type="submit" disabled={proses} className="h-11 rounded-full font-semibold">
        {proses ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan Password"}
      </Button>
    </form>
  );
}
