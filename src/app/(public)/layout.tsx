import AnnouncementBar from "@/components/public/AnnouncementBar";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import CartDrawer from "@/components/public/CartDrawer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="sticky top-0 z-50">
        <AnnouncementBar />
        <Navbar />
      </div>
      <CartDrawer />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  );
}
