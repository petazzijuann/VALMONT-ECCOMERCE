import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import CartDrawer from "@/components/public/CartDrawer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <CartDrawer />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  );
}
