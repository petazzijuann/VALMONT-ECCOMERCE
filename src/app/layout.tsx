import type { Metadata } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import "./globals.css";

const bebasNeue = Bebas_Neue({
  weight: "400",
  variable: "--font-bebas",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? "https://valmont.com.ar";

export const metadata: Metadata = {
  title: {
    template: "%s | VALMONT",
    default:  "VALMONT — Indumentaria Urbano-Elegante",
  },
  description:
    "Tienda de indumentaria urbano-elegante argentina. Remeras, pantalones, buzos y accesorios.",
  keywords:    ["valmont", "indumentaria argentina", "ropa urbana", "streetwear", "moda argentina"],
  authors:     [{ name: "VALMONT" }],
  metadataBase: new URL(BASE),
  openGraph: {
    siteName: "VALMONT",
    type:     "website",
    locale:   "es_AR",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: { index: true, follow: true },
  icons:  { icon: "/logo.png" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${bebasNeue.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
