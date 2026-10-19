import type { Metadata } from "next";
import { Inter, Roboto_Slab } from "next/font/google";
import "./globals.css";

const robotoSlab = Roboto_Slab({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  variable: "--font-roboto-slab",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "BBall Admin",
  description: "Suivi des statistiques de matchs du RPB",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${robotoSlab.variable} ${inter.variable}`}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
