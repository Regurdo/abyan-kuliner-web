import { StoreProvider } from "@/context/StoreContext";
import { Header } from "@/components/store/Header";
import { Footer } from "@/components/store/Footer";

/**
 * Layout untuk semua halaman pembeli (route group "toko").
 * Dashboard admin nanti punya layout sendiri yang terpisah.
 */
export default function TokoLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <StoreProvider>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6">
          {children}
        </main>
        <Footer />
      </div>
    </StoreProvider>
  );
}
