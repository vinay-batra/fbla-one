import { PublicNav } from "@/components/PublicNav";
import { Footer } from "@/components/Footer";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicNav />
      <main className="page-fadein" style={{ position: "relative", zIndex: 1 }}>
        {children}
      </main>
      <Footer />
    </>
  );
}
