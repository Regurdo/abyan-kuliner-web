"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CakeSlice, CheckCircle2, Eye, EyeOff, Heart, Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

/** Halaman login admin (ibu) — email + password Supabase Auth */
export default function HalamanLogin() {
  return (
    <Suspense fallback={<div className="m-auto h-64 w-full max-w-sm animate-pulse rounded-3xl bg-card" />}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const params = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [lihatSandi, setLihatSandi] = useState(false);
  const [proses, setProses] = useState(false);

  async function masuk(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Isi email dan password dulu ya.");
      return;
    }
    setProses(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        toast.error("Email atau password salah. Coba lagi ya.");
        return;
      }
      toast.success("Selamat datang, Ibu!");
      const kembali = params.get("kembali") ?? "/admin";
      router.replace(kembali);
      router.refresh(); // agar layout server langsung tahu sesi baru
    } catch {
      toast.error("Koneksi bermasalah. Coba lagi ya.");
    } finally {
      setProses(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pinksoft via-peach to-mint px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-5 text-center">
          <CakeSlice className="h-16 w-16 text-muted-foreground mx-auto" />
          <h1 className="mt-3 text-2xl font-extrabold">Dashboard Admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Masuk untuk kelola pesanan & toko kue
          </p>
        </div>

        <form
          onSubmit={masuk}
          className="flex flex-col gap-4 rounded-3xl border border-border/70 bg-card p-6 shadow-sm"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="ibu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-2xl"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={lihatSandi ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-2xl pr-11"
              />
              <button
                type="button"
                onClick={() => setLihatSandi((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={lihatSandi ? "Sembunyikan password" : "Lihat password"}
              >
                {lihatSandi ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" disabled={proses} className="h-12 w-full rounded-full text-base font-bold">
            {proses ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Masuk...
              </>
            ) : (
              <>
                <LogIn className="h-5 w-5" /> Masuk
              </>
            )}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Ini halaman khusus pemilik toko.{" "}
          <Link href="/" className="font-semibold text-primary underline-offset-2 hover:underline">
            Kembali ke toko
          </Link>
        </p>
      </div>
    </div>
  );
}
